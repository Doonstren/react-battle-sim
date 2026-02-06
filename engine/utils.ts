
import { Unit, Team, UnitType, AttackType, UnitSize, SpawnFormation, UnitState, UnitTag } from '../types';
import { DEATH_FRAMES, UNIT_CONFIG } from '../constants';
import { performAttack } from './combat';

// --- Math & Formations ---

export const getFormationOffsets = (formation: SpawnFormation, rotationDeg: number = 0): { x: number, y: number }[] => {
  let offsets: { x: number, y: number }[] = [];
  
  switch (formation) {
    case SpawnFormation.LINE:
      offsets = [{ x: 0, y: 0 }, { x: -30, y: 0 }, { x: 30, y: 0 }, { x: -60, y: 0 }, { x: 60, y: 0 }];
      break;
    case SpawnFormation.WEDGE:
      offsets = [{ x: 0, y: 0 }, { x: -25, y: 25 }, { x: 25, y: 25 }, { x: -50, y: 50 }, { x: 50, y: 50 }];
      break;
    default: 
      offsets = [{ x: 0, y: 0 }];
  }

  const rad = (rotationDeg * Math.PI) / 180;
  return offsets.map(p => ({
    x: p.x * Math.cos(rad) - p.y * Math.sin(rad),
    y: p.x * Math.sin(rad) + p.y * Math.cos(rad)
  }));
};

// --- Targeting ---

export const getNearestEnemy = (me: Unit, units: Unit[]): { target: Unit | null; dist: number } => {
  let target: Unit | null = null;
  let minDist = Infinity;
  for (const u of units) {
    if (u.isDead) continue;
    // Banish logic - Magic attacks can hit banished targets, others cannot
    if (u.banishedTimer && u.banishedTimer > 0 && me.attackType !== AttackType.MAGIC) continue;
    // Invisible logic
    if (u.isInvisible && u.team !== me.team) continue;

    if (u.team !== me.team) {
      // NOTE: Clerics target any enemy here so they know who to flee from. 
      // The restriction to only attack UNDEAD is handled in combat.ts logic.

      const d = (u.x - me.x)**2 + (u.y - me.y)**2; 
      if (d < minDist) {
        minDist = d;
        target = u;
      }
    }
  }
  return { target, dist: Math.sqrt(minDist) };
};

export const getNearestAlly = (me: Unit, units: Unit[]): { target: Unit | null; dist: number } => {
  let target: Unit | null = null;
  let minHpPct = 1.0;
  let minDist = Infinity;
  for (const u of units) {
    if (u.isDead || u === me || (u.banishedTimer && u.banishedTimer > 0)) continue;
    
    // Clerics cannot heal Constructs or Undead
    if (me.type === UnitType.CLERIC) {
        if (u.tags.includes(UnitTag.CONSTRUCT) || u.tags.includes(UnitTag.UNDEAD)) continue;
    }

    if (u.team === me.team) {
      const hpPct = u.hp / u.maxHp;
      if (hpPct < minHpPct && hpPct < 1.0) {
          minHpPct = hpPct;
          target = u;
          minDist = Math.hypot(u.x - me.x, u.y - me.y);
      }
    }
  }
  return { target, dist: minDist };
};

export const isLineOfFireBlocked = (shooter: Unit, target: Unit, units: Unit[]): boolean => {
    if (shooter.attackType === AttackType.MAGIC) return false;
    const dx = target.x - shooter.x;
    const dy = target.y - shooter.y;
    const dist = Math.hypot(dx, dy);
    const nx = dx / dist;
    const ny = dy / dist;

    for (const u of units) {
        if (u === shooter || u === target || u.isDead) continue;
        if (u.team !== shooter.team) continue; 
        const APx = u.x - shooter.x;
        const APy = u.y - shooter.y;
        const dot = APx * nx + APy * ny;
        if (dot > 0 && dot < dist) {
            const cx = shooter.x + nx * dot;
            const cy = shooter.y + ny * dot;
            if ((u.x - cx)**2 + (u.y - cy)**2 < (u.radius + 5)**2) return true;
        }
    }
    return false;
};

// --- Damage & Knockback ---

export const takeDamage = (u: Unit, amount: number, damageType: AttackType = AttackType.STANDARD) => {
    let armor = u.armor + (u.buffArmor || 0);
    
    // Armor Penetration Logic
    if (damageType === AttackType.EXPLOSIVE) {
        armor = 0; // Ignore all armor
    } else if (damageType === AttackType.MAGIC) {
        armor *= 0.5; // Ignore 50% armor
    }
    
    // Clamp armor to reasonable bounds (e.g. max 90% reduction)
    armor = Math.min(0.9, Math.max(0, armor));

    const mitigation = 1 - armor;
    const realDamage = amount * mitigation;
    
    if (u.buffBonusHp && u.buffBonusHp > 0) {
        if (u.buffBonusHp >= realDamage) {
            u.buffBonusHp -= realDamage;
        } else {
            const remainder = realDamage - u.buffBonusHp;
            u.buffBonusHp = 0;
            u.hp -= remainder;
        }
    } else {
        u.hp -= realDamage;
    }

    // Flag for retargeting on damage taken
    u.retargetNeeded = true;
    
    // Death Logic
    if (u.hp <= 0 && !u.isDead) {
        u.isDead = true;
        u.deathTimer = DEATH_FRAMES;
        u.state = UnitState.DYING;
        // Sapper logic is handled in combat loop to avoid circular dependencies and ensure proper game state access
    }
};

export const calculateKnockback = (attacker: Unit, target: Unit): number => {
    let multiplier = 0;
    if (attacker.attackType === AttackType.EXPLOSIVE) {
        multiplier = target.size === UnitSize.SMALL ? 3.0 : target.size === UnitSize.MEDIUM ? 2.0 : 0.5;
    } else if (attacker.attackType === AttackType.HEAVY) {
        multiplier = target.size === UnitSize.SMALL ? 2.0 : target.size === UnitSize.MEDIUM ? 1.0 : 0.1;
    }
    return attacker.knockbackPower * multiplier;
};
