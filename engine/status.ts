
import { Unit, UnitType, UnitState } from '../types';

export const systemStatus = (u: Unit, df: number) => {
    if (u.isDead) {
        if (u.deathTimer && u.deathTimer > 0) u.deathTimer -= 1 * df;
        return;
    }

    // Buffs
    if (u.buffBloodlustTimer && u.buffBloodlustTimer > 0) {
        u.buffBloodlustTimer -= 1 * df;
        if (u.buffBloodlustTimer <= 0) u.buffSpeed = 1.0;
    }
    if (u.buffRallyTimer && u.buffRallyTimer > 0) {
        u.buffRallyTimer -= 1 * df;
        u.buffArmor = 0.2;
    } else {
        u.buffArmor = 0;
        u.buffBonusHp = 0;
    }
    if (u.buffHealAnim && u.buffHealAnim > 0) u.buffHealAnim -= 1 * df;

    // Debuffs
    if (u.banishedTimer && u.banishedTimer > 0) {
        u.banishedTimer -= 1 * df;
        if (u.banishedTimer <= 0) u.banishImmunityTimer = 120; // 2 sec immunity
    }
    if (u.banishImmunityTimer && u.banishImmunityTimer > 0) u.banishImmunityTimer -= 1 * df;

    // Assassin Stealth Cooldown
    if (u.type === UnitType.ASSASSIN && u.abilities) {
        if (!u.isInvisible && u.abilities[0].cooldown > 0) u.abilities[0].cooldown -= 1 * df;
        if (!u.isInvisible && u.abilities[0].cooldown <= 0) {
            u.isInvisible = true;
            u.abilities[0].cooldown = u.abilities[0].maxCooldown;
        }
    }
    
    // ATTACK COOLDOWN
    if (u.cooldown > 0) u.cooldown -= 1 * df;

    // ATTACK ANIMATION DECAY (Fixes visual bugs where animation sticks if state changes quickly)
    if (u.attackAnim > 0) {
        u.attackAnim = Math.max(0, u.attackAnim - 0.1 * df);
    }
    
    // Global Ability Cooldowns (tick down even if not active)
    if (u.abilities) {
        u.abilities.forEach(ab => { if (ab.cooldown > 0) ab.cooldown -= 1 * df; });
    }
    
    // Stun State Logic
    if (u.stunTimer && u.stunTimer > 0) {
        u.stunTimer -= 1 * df;
        u.state = UnitState.STUNNED;
    } else if (u.state === UnitState.STUNNED) {
        u.state = UnitState.IDLE;
    }
};