
import { Unit, Projectile, UnitType, UnitState, AttackType, Team, UnitTag } from '../types';
import { UNIT_CONFIG, COLORS } from '../constants';
import { getNearestEnemy, getNearestAlly, isLineOfFireBlocked, takeDamage, calculateKnockback } from './utils';
import { calculateSeparation } from './physics';

// --- Projectile Pooling ---
export const spawnProjectile = (
    pool: Projectile[], 
    x: number, y: number, vx: number, vy: number, 
    life: number, damage: number, color: string, 
    ownerId: string, sourceType: UnitType, team: Team,
    chainCount: number = 0, ignoredIds: string[] = []
) => {
    const p = pool.find(item => !item.active);
    if (p) {
        p.active = true;
        p.x = x; p.y = y; p.vx = vx; p.vy = vy;
        p.life = life; p.damage = damage; p.color = color;
        p.ownerId = ownerId; p.sourceType = sourceType; p.team = team;
        p.chainCount = chainCount;
        p.ignoredIds = ignoredIds;
        p.id = Math.random().toString(36).substr(2, 9); 
    } else {
        pool.push({
            active: true,
            id: Math.random().toString(36).substr(2, 9),
            x, y, vx, vy, life, damage, color, ownerId, sourceType, team,
            chainCount, ignoredIds
        });
    }
};

const getUnitBehaviorConfig = (u: Unit) => {
    // Skeletons inherit behavior from their visual type (original unit)
    if (u.type === UnitType.SKELETON && u.visualType) {
        return UNIT_CONFIG[u.visualType];
    }
    return UNIT_CONFIG[u.type];
};

// --- Combat FSM ---
export const systemCombatFSM = (u: Unit, units: Unit[], projectiles: Projectile[], df: number) => {
    
    // Check for Sapper Explosion on Death (triggered by enemy damage)
    // Ensure we don't trigger if already exploded (-1000)
    if (u.type === UnitType.ORC_SAPPER && u.isDead && u.hp > -999) {
         performAttack(u, units, projectiles); // Explode!
         u.hp = -1000; 
         return;
    }

    if (u.state === UnitState.STUNNED || u.state === UnitState.DYING || u.isDead) return;
    if (u.banishedTimer && u.banishedTimer > 0) return; // Frozen in Banish

    // --- SMART RETARGETING LOGIC ---
    if (u.retargetTimer === undefined) u.retargetTimer = 60;
    u.retargetTimer -= df;

    if (u.retargetNeeded || u.retargetTimer <= 0) {
        const wasHit = u.retargetNeeded;
        u.retargetNeeded = false;
        u.retargetTimer = 30 + Math.random() * 30; // Check every 0.5-1s

        // Clerics have special heal priority, so only retarget if they took damage (panic flee)
        if (u.type !== UnitType.CLERIC || wasHit) {
            const { target: nearest, dist: nearestDist } = getNearestEnemy(u, units);
            if (nearest) {
                 const currentTarget = units.find(t => t.id === u.targetId);
                 
                 // If we have no target, or current is dead -> take nearest
                 if (!currentTarget || currentTarget.isDead) {
                     u.targetId = nearest.id;
                     if (u.state === UnitState.IDLE) u.state = UnitState.MOVE;
                 } else {
                     // Check distances
                     const currentDist = Math.hypot(currentTarget.x - u.x, currentTarget.y - u.y);
                     
                     // Switch condition:
                     // 1. New target is significantly closer (75% of current dist) - prevents running past melee to hit ranged
                     // 2. OR We were hit (panic switch to nearest threat)
                     if (wasHit || nearestDist < currentDist * 0.75) {
                         u.targetId = nearest.id;
                     }
                 }
            }
        }
    }
    // --------------------------------

    const config = getUnitBehaviorConfig(u);

    // IDLE STATE
    if (u.state === UnitState.IDLE) {
        if (u.type === UnitType.CLERIC) {
            // Priority: Heal Allies -> Flee Enemies
            const { target: healTarget } = getNearestAlly(u, units);
            if (healTarget && healTarget.hp < healTarget.maxHp) {
                u.targetId = healTarget.id;
                u.state = UnitState.MOVE;
            } else {
                 const { target: threat } = getNearestEnemy(u, units);
                 if (threat && Math.hypot(threat.x - u.x, threat.y - u.y) < 300) {
                     u.targetId = threat.id;
                     u.state = UnitState.MOVE;
                 }
            }
        } else {
            const { target } = getNearestEnemy(u, units);
            if (target) {
                u.targetId = target.id;
                u.state = UnitState.MOVE;
            }
        }
    }

    // MOVE STATE
    if (u.state === UnitState.MOVE) {
        const target = units.find(t => t.id === u.targetId);
        if (!target || target.isDead || (target.banishedTimer && target.banishedTimer > 0 && u.attackType !== AttackType.MAGIC)) {
            u.state = UnitState.IDLE;
            u.moveVx = 0; u.moveVy = 0;
            return;
        }

        const dx = target.x - u.x;
        const dy = target.y - u.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        u.rotation = angle;

        // HEALER
        const isHealingAlly = u.type === UnitType.CLERIC && u.team === target.team;

        if (isHealingAlly) {
            if (dist < u.range) {
                if (u.cooldown <= 0) {
                    u.state = UnitState.ATTACK_WINDUP;
                    u.windup = config.windupTime;
                }
                u.moveVx = 0; u.moveVy = 0;
            } else {
                const speed = u.speed * (u.buffSpeed || 1);
                u.moveVx = Math.cos(angle) * speed;
                u.moveVy = Math.sin(angle) * speed;
            }
        } 
        // RANGED / KITING LOGIC
        else if (
            config.attackType === AttackType.RANGED || 
            config.attackType === AttackType.MAGIC || 
            config.attackType === AttackType.SUPPORT
        ) {
            const canShootWhileMoving = config.canShootWhileMoving;
            const isShaman = u.type === UnitType.ORC_SHAMAN; // Shaman never retreats
            
            // Kiting Distance: 
            // If canShootWhileMoving (Mages), kite at max range (0.9) to never stop moving.
            // If Cleric cannot attack target, flee at sight range (300).
            let kiteDist = u.range * 0.6;
            if (canShootWhileMoving) kiteDist = u.range * 0.9;
            
            if (u.type === UnitType.CLERIC && !target.tags.includes(UnitTag.UNDEAD)) {
                kiteDist = 300; // Run away!
            }

            // PRIORITY 1: If ready to fire and in range, SHOOT.
            // (Clerics only shoot Undead)
            const canShoot = u.type !== UnitType.CLERIC || target.tags.includes(UnitTag.UNDEAD);
            
            if (canShoot && u.cooldown <= 0 && dist <= u.range) {
                 const blocked = config.attackType === AttackType.RANGED && isLineOfFireBlocked(u, target, units);
                 
                 if (blocked) {
                    // Blocked? Strafe
                    const speed = u.speed * (u.buffSpeed || 1);
                    u.moveVx = -Math.sin(angle) * speed; 
                    u.moveVy = Math.cos(angle) * speed; 
                 } else {
                    // Shoot
                    u.state = UnitState.ATTACK_WINDUP;
                    u.windup = config.windupTime;
                    
                    if (!canShootWhileMoving) {
                        u.moveVx = 0; u.moveVy = 0;
                    }
                    // If canShootWhileMoving, do NOT zero velocity here.
                 }
            }
            
            // PRIORITY 2: If too close, FLEE.
            else if (dist < kiteDist && !isShaman) {
                const speed = u.speed * (u.buffSpeed || 1);
                // Flee away from target
                u.moveVx = -Math.cos(angle) * speed;
                u.moveVy = -Math.sin(angle) * speed;
            } 
            // PRIORITY 3: If too far, CHASE (Only if we can shoot)
            else if (canShoot && dist > u.range) {
                const speed = u.speed * (u.buffSpeed || 1);
                u.moveVx = Math.cos(angle) * speed;
                u.moveVy = Math.sin(angle) * speed;
            }
            // SWEET SPOT
            else {
                if (canShootWhileMoving) {
                     // If we are in range and kiting logic didn't trigger, we might be in [0.9 * range, range].
                     // Just keep previous velocity (drift) or slow down?
                     // To strictly avoid stopping, let's just strafe or slow drift.
                     // But simpler: just 0 is fine if they are essentially at max range edge.
                     // However, to fix "stopping", let's make them back up slightly if they are stopped.
                     if (dist < u.range) {
                         const speed = u.speed * (u.buffSpeed || 1) * 0.5;
                         u.moveVx = -Math.cos(angle) * speed;
                         u.moveVy = -Math.sin(angle) * speed;
                     }
                } else if (isShaman) {
                    u.moveVx = 0; u.moveVy = 0; 
                } else {
                    // Archers back up slowly
                     if (dist < u.range * 0.8) {
                        const speed = u.speed * (u.buffSpeed || 1) * 0.5; 
                        u.moveVx = -Math.cos(angle) * speed;
                        u.moveVy = -Math.sin(angle) * speed;
                    } else {
                        u.moveVx = 0; u.moveVy = 0;
                    }
                }
            }
        }
        // MELEE LOGIC
        else {
            const attackRange = u.type === UnitType.SPEARMAN ? u.range : (u.radius + target.radius + 5);
            if (dist <= attackRange) {
                if (u.cooldown <= 0) {
                    u.state = UnitState.ATTACK_WINDUP;
                    u.windup = config.windupTime;
                    u.moveVx = 0; u.moveVy = 0;
                } else {
                    u.moveVx = 0; u.moveVy = 0;
                }
            } else {
                 const speed = u.speed * (u.buffSpeed || 1);
                 u.moveVx = Math.cos(angle) * speed;
                 u.moveVy = Math.sin(angle) * speed;
            }
        }

        if (u.moveVx !== 0 || u.moveVy !== 0) {
            const sep = calculateSeparation(u, units);
            u.moveVx += sep.x;
            u.moveVy += sep.y;
        }
    }

    // ATTACK WINDUP
    if (u.state === UnitState.ATTACK_WINDUP) {
        const canShootWhileMoving = config.canShootWhileMoving;
        
        // If can shoot while moving, allow velocity updates (keep kiting/chasing logic active)
        if (canShootWhileMoving && u.targetId) {
             const target = units.find(t => t.id === u.targetId);
             if (target) {
                const angle = Math.atan2(target.y - u.y, target.x - u.x);
                const dist = Math.hypot(target.x - u.x, target.y - u.y);
                u.rotation = angle;
                
                const speed = u.speed * (u.buffSpeed || 1);
                
                // Mages always try to maintain distance 0.9 * range
                const kiteDist = u.range * 0.9;
                
                if (dist < kiteDist) {
                    u.moveVx = -Math.cos(angle) * speed;
                    u.moveVy = -Math.sin(angle) * speed;
                } else {
                    // Just drift
                    u.moveVx = 0; u.moveVy = 0;
                }

                // Separation
                const sep = calculateSeparation(u, units);
                u.moveVx += sep.x;
                u.moveVy += sep.y;
             }
        }

        u.windup -= 1 * df;
        if (u.windup <= 0) {
            const target = units.find(t => t.id === u.targetId);
            const isAreaAttack = u.type === UnitType.ORC_SAPPER; 
            
            if (!isAreaAttack && (!target || target.isDead)) {
                u.state = UnitState.IDLE;
                return; 
            }

            performAttack(u, units, projectiles);
            u.state = UnitState.ATTACK_RECOVERY;
            u.recovery = config.recoveryTime;
            u.cooldown = u.maxCooldown;
            u.attackAnim = 1.0; 
        }
    }

    // ATTACK RECOVERY
    if (u.state === UnitState.ATTACK_RECOVERY) {
        u.recovery -= 1 * df;
        if (u.recovery <= 0) {
            u.state = UnitState.IDLE;
        }
    }
};

export const performAttack = (u: Unit, units: Unit[], projectiles: Projectile[]) => {
    const config = getUnitBehaviorConfig(u);
    
    // Check real unit type for specific overrides, not behavior config
    if (u.banishedTimer && u.banishedTimer > 0) return;

    // Sapper Explode
    if (u.type === UnitType.ORC_SAPPER) {
        const blastRadius = 120;
        units.forEach(t => {
            if (!t.isDead && t !== u) {
                const d = Math.hypot(t.x - u.x, t.y - u.y);
                if (d < blastRadius) {
                    takeDamage(t, u.damage * (1 - d/blastRadius), AttackType.EXPLOSIVE);
                    const ang = Math.atan2(t.y - u.y, t.x - u.x);
                    const force = 40 * (1 - d/blastRadius);
                    t.kbVx += Math.cos(ang) * force; t.kbVy += Math.sin(ang) * force;
                }
            }
        });
        u.hp = -1000; 
        u.isDead = true; 
        u.state = UnitState.DYING;
        return;
    }

    // Cleric Heal / Attack
    if (u.type === UnitType.CLERIC) {
        const target = units.find(t => t.id === u.targetId);
        if (target && !target.isDead) {
            if (u.team === target.team) {
                // Heal
                target.hp = Math.min(target.maxHp, target.hp - u.damage); // u.damage is negative
                target.buffHealAnim = 30;
            } else if (target.tags.includes(UnitTag.UNDEAD)) {
                // Attack Undead
                takeDamage(target, 20, AttackType.MAGIC); // Flat damage to undead
                spawnProjectile(projectiles, target.x, target.y, 0, 0, 10, 0, '#fff', u.id, u.type, u.team);
            }
            u.rotation = Math.atan2(target.y - u.y, target.x - u.x);
        }
        return;
    }

    // Ranged / Magic
    if (config.attackType === AttackType.RANGED || config.attackType === AttackType.MAGIC) {
        let projColor = '#bdc3c7';
        // Use visual type for projectile color logic if skeleton
        const visualType = u.visualType || u.type;

        if (visualType === UnitType.WIZARD) projColor = COLORS.PROJECTILE_MAGIC;
        if (visualType === UnitType.ORC_HEADHUNTER) projColor = '#8d6e63'; 
        if (visualType === UnitType.ORC_SHAMAN || visualType === UnitType.ORC_WARCHIEF) projColor = '#3498db'; 
        if (visualType === UnitType.NECROMANCER) projColor = '#0f0';

        spawnProjectile(
            projectiles,
            u.x + Math.cos(u.rotation) * (u.radius + 5),
            u.y + Math.sin(u.rotation) * (u.radius + 5),
            Math.cos(u.rotation) * config.projectileSpeed!,
            Math.sin(u.rotation) * config.projectileSpeed!,
            config.projectileLife!, u.damage, projColor, u.id, visualType, u.team
        );
    } 
    // Melee
    else {
        const target = units.find(t => t.id === u.targetId);
        if (target && !target.isDead) {
             const dist = Math.hypot(target.x - u.x, target.y - u.y);
             const reach = u.type === UnitType.SPEARMAN ? u.range + 10 : (u.radius + target.radius + 15);
             if (dist <= reach) {
                 let dmg = u.damage;
                 if (u.type === UnitType.ASSASSIN && u.isInvisible) {
                     dmg *= 2.5; u.isInvisible = false;
                     if (u.abilities) u.abilities[0].cooldown = u.abilities[0].maxCooldown;
                 }
                 takeDamage(target, dmg, config.attackType);
                 
                 const force = calculateKnockback(u, target);
                 if (force > 0) {
                     target.kbVx += Math.cos(u.rotation) * force;
                     target.kbVy += Math.sin(u.rotation) * force;
                 }
                 if (u.type === UnitType.ORC_OGRE) target.stunTimer = 60;
                 if (u.type === UnitType.GIANT) u.useLeftHand = !u.useLeftHand;
             }
        }
    }
};
