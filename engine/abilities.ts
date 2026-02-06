
import { Unit, Projectile, UnitType, UnitState, AttackType, Team, UnitTag } from '../types';
import { getNearestEnemy, takeDamage } from './utils';
import { spawnProjectile } from './combat';
import { createUnit } from './factory';
import { UNIT_CONFIG } from '../constants';

export const systemAbilities = (u: Unit, units: Unit[], projectiles: Projectile[], df: number) => {
    if (u.state === UnitState.STUNNED || u.state === UnitState.DYING || !u.abilities) return;
    if (u.banishedTimer && u.banishedTimer > 0) return; // Cannot use abilities in Astral

    // --- PALADIN ---
    if (u.type === UnitType.PALADIN) {
        const { target: enemy, dist } = getNearestEnemy(u, units);
        // Cleave
        if (enemy && dist < u.radius + 30 && u.abilities[0].cooldown <= 0) {
            u.abilities[0].cooldown = u.abilities[0].maxCooldown;
            u.attackAnim = 1.0; 
            units.forEach(t => {
                if (t.team !== u.team && !t.isDead && Math.hypot(t.x - u.x, t.y - u.y) < u.radius + 40) {
                    takeDamage(t, u.damage * 1.5, AttackType.HEAVY);
                }
            });
        }
        // Rally
        if (u.abilities[1].cooldown <= 0) {
             let allies = units.filter(t => t.team === u.team && !t.isDead && Math.hypot(t.x - u.x, t.y - u.y) < 200);
             if (allies.length > 1) {
                 u.abilities[1].cooldown = u.abilities[1].maxCooldown;
                 allies.slice(0, 5).forEach(a => { a.buffRallyTimer = 600; a.buffBonusHp = 30; });
             }
        }
        // Dash
        if (enemy && dist > 100 && dist < 190 && u.abilities[2].cooldown <= 0) {
             u.abilities[2].cooldown = u.abilities[2].maxCooldown;
             const ang = Math.atan2(enemy.y - u.y, enemy.x - u.x);
             u.kbVx = Math.cos(ang) * 35; u.kbVy = Math.sin(ang) * 35;
        }
        // Smite
        if (enemy && dist < 200 && u.abilities[3].cooldown <= 0) {
            u.abilities[3].cooldown = u.abilities[3].maxCooldown;
            takeDamage(enemy, 150, AttackType.MAGIC);
            spawnProjectile(projectiles, enemy.x, enemy.y, 0, 0, 40, 0, '#ffd700', u.id, UnitType.PALADIN, u.team);
        }
    }
    // --- WARCHIEF ---
    else if (u.type === UnitType.ORC_WARCHIEF) {
        const { target: enemy, dist } = getNearestEnemy(u, units);
        // Shockwave
        if (enemy && dist < 200 && u.abilities[0].cooldown <= 0) {
            u.abilities[0].cooldown = u.abilities[0].maxCooldown;
            const ang = Math.atan2(enemy.y - u.y, enemy.x - u.x);
            spawnProjectile(projectiles, u.x, u.y, Math.cos(ang)*10, Math.sin(ang)*10, 30, 80, '#e74c3c', u.id, UnitType.ORC_WARCHIEF, u.team);
        }
        // Shout
        if (u.abilities[1].cooldown <= 0) {
             const allies = units.filter(t => t.team === u.team && !t.isDead && Math.hypot(t.x - u.x, t.y - u.y) < 300);
             if (allies.length > 1) {
                 u.abilities[1].cooldown = u.abilities[1].maxCooldown;
                 spawnProjectile(projectiles, u.x, u.y, 0, 0, 20, 0, 'SHOUT', u.id, UnitType.ORC_WARCHIEF, u.team);
                 allies.forEach(a => { a.buffBloodlustTimer = 480; a.buffSpeed = 1.4; });
             }
        }
        // Leap
        if (enemy && dist > 100 && dist < 230 && u.abilities[2].cooldown <= 0) {
            u.abilities[2].cooldown = u.abilities[2].maxCooldown;
            const ang = Math.atan2(enemy.y - u.y, enemy.x - u.x);
            u.kbVx = Math.cos(ang) * 45; u.kbVy = Math.sin(ang) * 45;
        }
        // Execute
        if (enemy && dist < u.radius + 40 && enemy.hp < enemy.maxHp * 0.35 && u.abilities[3].cooldown <= 0) {
            u.abilities[3].cooldown = u.abilities[3].maxCooldown;
            u.attackAnim = 1.0;
            takeDamage(enemy, u.damage * 3, AttackType.HEAVY);
            enemy.kbVx += Math.cos(u.rotation) * 10; enemy.kbVy += Math.sin(u.rotation) * 10;
        }
    }
    // --- SHAMAN ---
    else if (u.type === UnitType.ORC_SHAMAN) {
        if (u.abilities[0].cooldown <= 0) {
             const ally = units.find(t => t.team === u.team && !t.isDead && t !== u && (!t.buffBloodlustTimer || t.buffBloodlustTimer <= 0) && Math.hypot(t.x - u.x, t.y - u.y) < u.range);
             if (ally) {
                 ally.buffBloodlustTimer = 300; ally.buffSpeed = 1.25;
                 u.abilities[0].cooldown = u.abilities[0].maxCooldown;
                 u.attackAnim = 1.0;
             }
        }
    }
    // --- SPIRIT WALKER (Banish) ---
    else if (u.type === UnitType.ORC_SPIRIT_WALKER) {
        if (u.abilities[0].cooldown <= 0) {
             const {target} = getNearestEnemy(u, units);
             if (target && Math.hypot(target.x - u.x, target.y - u.y) < u.range && (!target.banishImmunityTimer || target.banishImmunityTimer <= 0)) {
                 
                 // Immunity Check: Constructs and Heroes cannot be banished.
                 // Skeletons ARE allowed to be banished (they are Undead, not Constructs).
                 if (target.tags.includes(UnitTag.CONSTRUCT) || target.tags.includes(UnitTag.HERO)) return;
                 
                 target.banishedTimer = 180; // 3 seconds
                 u.abilities[0].cooldown = u.abilities[0].maxCooldown;
                 u.attackAnim = 1.0;
             }
        }
    }
    // --- NECROMANCER ---
    else if (u.type === UnitType.NECROMANCER) {
        if (u.abilities[0].cooldown <= 0) {
            // Find valid corpse
            let corpseIndex = -1;
            let minDist = 300; // Casting range

            for (let i = 0; i < units.length; i++) {
                const corpse = units[i];
                if (!corpse.isDead) continue;
                
                // Tag Check: Unraisable units cannot be raised
                if (corpse.tags.includes(UnitTag.UNRAISABLE) || corpse.tags.includes(UnitTag.CONSTRUCT) || corpse.tags.includes(UnitTag.UNDEAD)) continue;

                const d = Math.hypot(corpse.x - u.x, corpse.y - u.y);
                if (d < minDist) {
                    minDist = d;
                    corpseIndex = i;
                }
            }

            if (corpseIndex !== -1) {
                 const corpse = units[corpseIndex];
                 const skeleton = createUnit(corpse.x, corpse.y, u.team, UnitType.SKELETON);
                 skeleton.rotation = u.rotation;
                 
                 // Inherit visuals
                 skeleton.visualType = corpse.type; 
                 // Inherit stats (30% HP, 50% Damage)
                 skeleton.hp = corpse.maxHp * 0.3;
                 skeleton.maxHp = corpse.maxHp * 0.3;
                 skeleton.damage = Math.max(2, Math.floor(Math.abs(corpse.damage) * 0.5));
                 skeleton.radius = corpse.radius;
                 skeleton.size = corpse.size;
                 
                 // Copy Range/AttackType from corpse to simulate behavior
                 const corpseConfig = UNIT_CONFIG[corpse.type];
                 skeleton.range = corpseConfig.range;
                 skeleton.attackType = corpseConfig.attackType;
                 skeleton.speed = corpseConfig.speed * 1.1; // Slightly faster undead
                 
                 // Remove corpse, add skeleton
                 units.splice(corpseIndex, 1);
                 units.push(skeleton);

                 u.abilities[0].cooldown = u.abilities[0].maxCooldown;
                 u.attackAnim = 1.0;
            }
        }
    }
};
