
import { Unit, Projectile, Team, UnitType, GameStats, Faction, UnitSize, AttackType, UnitState } from '../types';
import { COLORS, DEATH_FRAMES, LOCALIZATION, UNIT_CONFIG } from '../constants';
import { systemStatus } from './status';
import { systemAbilities } from './abilities';
import { systemCombatFSM, spawnProjectile, performAttack } from './combat';
import { systemPhysics } from './physics';
import { takeDamage } from './utils';

// --- MAIN LOOP ---

const updateProjectiles = (projectiles: Projectile[], units: Unit[], width: number, height: number, df: number) => {
    for (let i = 0; i < projectiles.length; i++) {
        const p = projectiles[i];
        if (!p.active) continue;

        if (p.sourceType === UnitType.PALADIN || p.color === 'SHOUT') {
            p.life -= 1 * df;
            if (p.life <= 0) p.active = false;
            continue;
        }

        p.x += p.vx * df;
        p.y += p.vy * df;
        p.life -= 1 * df;

        let hit = false;
        for (const u of units) {
             if (u.isDead) continue;
             if (u.banishedTimer && u.banishedTimer > 0) { 
                 const isMagic = p.sourceType === UnitType.WIZARD || p.sourceType === UnitType.ORC_SHAMAN || p.sourceType === UnitType.NECROMANCER || p.sourceType === UnitType.CLERIC;
                 if (!isMagic) continue; 
             }
             if (u.id === p.ownerId || (p.ignoredIds && p.ignoredIds.includes(u.id))) continue;
             if (u.isInvisible && u.team !== p.team) continue;
             if (u.team === p.team) continue;

             const dist = Math.hypot(p.x - u.x, p.y - u.y);
             if (dist < u.radius + 3) {
                 const config = UNIT_CONFIG[p.sourceType];
                 takeDamage(u, p.damage, config.attackType);
                 hit = true;
                 
                 // Chain Lightning
                 if (p.sourceType === UnitType.ORC_SHAMAN && (p.chainCount || 0) < 2) {
                     const bounce = units.find(t => t.team !== p.team && !t.isDead && t.id !== u.id && Math.hypot(t.x - u.x, t.y - u.y) < 150);
                     if (bounce) {
                        spawnProjectile(
                            projectiles, u.x, u.y, 0, 0, 5, p.damage * 0.7,
                            p.color, p.ownerId, p.sourceType, p.team,
                            (p.chainCount||0)+1, [u.id, ...(p.ignoredIds||[])]
                        );
                        const bounceAtkType = UNIT_CONFIG[UnitType.ORC_SHAMAN].attackType;
                        takeDamage(bounce, p.damage * 0.7, bounceAtkType);
                     }
                 }
                 break;
             }
        }
        if (hit || p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
            p.active = false;
        }
    }
};

export const updateGameState = (
  units: Unit[],
  projectiles: Projectile[],
  width: number,
  height: number,
  deltaFactor: number
): { units: Unit[]; projectiles: Projectile[] } => {
  
  const nextUnits = [...units];
  const nextProjectiles = projectiles; 
  const df = deltaFactor; 

  updateProjectiles(nextProjectiles, nextUnits, width, height, df);

  for (let i = nextUnits.length - 1; i >= 0; i--) {
      const u = nextUnits[i];
      systemStatus(u, df);
      
      // Sapper Death Explosion Check (Killed by enemy)
      if (u.type === UnitType.ORC_SAPPER && u.isDead && u.hp > -999) {
          // Trigger explosion even if dead
          performAttack(u, nextUnits, nextProjectiles); 
          u.hp = -1000; // Prevent infinite explosion loop
      }

      if (u.isDead && (!u.deathTimer || u.deathTimer <= 0)) {
          nextUnits.splice(i, 1);
          continue;
      }
      if (u.isDead) continue; 

      systemAbilities(u, nextUnits, nextProjectiles, df);
      systemCombatFSM(u, nextUnits, nextProjectiles, df);
  }
  
  systemPhysics(nextUnits, width, height, df);

  return { units: nextUnits, projectiles: nextProjectiles };
};

// --- DRAWING ---

const drawHand = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, outline: string) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = outline; ctx.lineWidth=1; ctx.stroke();
    ctx.restore();
};

export const drawWeapon = (ctx: CanvasRenderingContext2D, u: Unit) => {
    let { type, attackAnim: anim, team, useLeftHand } = u;
    
    // Skeleton visual override
    let visualType = type;
    if (type === UnitType.SKELETON && u.visualType) {
        visualType = u.visualType;
    }

    const outline = u.team === Team.RED ? COLORS.RED : COLORS.BLUE;
    let skinColor = u.faction === Faction.ORC ? COLORS.ORC_SKIN : '#e6be8a';
    if (u.faction === Faction.NEUTRAL) skinColor = COLORS.GIANT_SKIN; // Default grey for neutrals
    
    // Override Hand Color logic
    let handColor = skinColor;
    
    if (u.type === UnitType.ORC_WARCHIEF) handColor = COLORS.ORC_SKIN;
    else if (u.type === UnitType.SKELETON) handColor = COLORS.SKELETON_BONE; // Skeleton hands always bone white
    else if (u.type === UnitType.IRON_GOLEM) handColor = COLORS.IRON_GOLEM;
    else if (u.type === UnitType.NECROMANCER) handColor = COLORS.NECROMANCER; // Necromancer hands purple
    else if (u.type === UnitType.GIANT) handColor = COLORS.GIANT_SKIN;


    let sideOffset = u.radius * 0.4;
    
    if (visualType === UnitType.ARCHER || visualType === UnitType.GIANT || visualType === UnitType.ORC_SAPPER || visualType === UnitType.ORC_WARG || visualType === UnitType.IRON_GOLEM) {
        sideOffset = 0;
    }
    
    ctx.save();
    ctx.translate(0, sideOffset); 

    if (visualType === UnitType.KNIGHT) {
        const swingAngle = (1 - anim) * Math.PI/2; 
        ctx.rotate(swingAngle - Math.PI/4); 
        ctx.translate(u.radius + 2, 0); 
        ctx.fillStyle = '#bdc3c7'; 
        ctx.fillRect(0, -2, 20, 4);
        ctx.beginPath(); ctx.moveTo(20, -2); ctx.lineTo(26, 0); ctx.lineTo(20, 2); ctx.fill();
        ctx.fillStyle = '#7f8c8d'; ctx.fillRect(-4, -5, 4, 10);
        drawHand(ctx, 0, 0, handColor, outline); 
    } 
    else if (visualType === UnitType.ORC_GRUNT) {
        const swingAngle = (1 - anim) * Math.PI / 1.2;
        ctx.rotate(swingAngle - Math.PI / 2.5);
        ctx.translate(u.radius + 2, 0);
        ctx.fillStyle = '#8d6e63'; ctx.fillRect(0, -3, 30, 6);
        drawHand(ctx, 5, 0, handColor, outline); 
        ctx.translate(22, 0); ctx.rotate(Math.PI / 2); ctx.scale(0.5, 0.5);
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-34, -20); ctx.quadraticCurveTo(-44, -16, -44, -4); ctx.quadraticCurveTo(-44, 8, -34, 20); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill();
        ctx.save(); ctx.scale(-1, 1);
        ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-34, -20); ctx.quadraticCurveTo(-44, -16, -44, -4); ctx.quadraticCurveTo(-44, 8, -34, 20); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    else if (visualType === UnitType.ORC_WARCHIEF) {
        const swingAngle = (1 - anim) * Math.PI / 1.0;
        ctx.rotate(swingAngle - Math.PI / 2);
        ctx.translate(u.radius - 2, 0); 
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(0, -4, 45, 8); 
        drawHand(ctx, 5, 0, handColor, outline); 
        drawHand(ctx, 15, 0, handColor, outline);
        ctx.translate(35, 0);
        ctx.rotate(Math.PI / 2); 
        ctx.scale(0.6, 0.6); 
        ctx.fillStyle = '#f1c40f'; 
        ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(0, -45); ctx.lineTo(5, -5); ctx.fill();
        ctx.fillStyle = '#424242'; 
        ctx.strokeStyle = '#bdbdbd'; 
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(-20, -30); ctx.lineTo(-35, -20); ctx.quadraticCurveTo(-40, 0, -35, 20); ctx.lineTo(-20, 30); ctx.lineTo(0, 5); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(20, -30); ctx.lineTo(35, -20); ctx.quadraticCurveTo(40, 0, 35, 20); ctx.lineTo(20, 30); ctx.lineTo(0, 5); ctx.fill(); ctx.stroke();
    }
    else if (visualType === UnitType.SPEARMAN) {
        const thrust = anim * 15;
        ctx.translate(u.radius + thrust, 4);
        ctx.fillStyle = '#8e44ad'; ctx.fillRect(-10, -1, 40, 2);
        ctx.fillStyle = '#bdc3c7'; ctx.beginPath(); ctx.moveTo(30, -3); ctx.lineTo(38, 0); ctx.lineTo(30, 3); ctx.fill();
        drawHand(ctx, -5, 0, handColor, outline);
        drawHand(ctx, 15, 0, handColor, outline);
    }
    else if (visualType === UnitType.ASSASSIN) {
        const thrust = anim * 15;
        ctx.translate(u.radius + thrust, 4);
        ctx.fillStyle = '#34495e'; 
        ctx.fillRect(-2, -1, 6, 4); 
        ctx.fillStyle = '#ecf0f1'; 
        ctx.beginPath(); ctx.moveTo(4, -1); ctx.lineTo(22, 0); ctx.lineTo(4, 2); ctx.fill();
        drawHand(ctx, 0, 1, handColor, outline);
    }
    else if (visualType === UnitType.ORC_HEADHUNTER) {
        const thrust = anim * 15;
        ctx.translate(u.radius + thrust, 4);
        ctx.fillStyle = '#5d4037'; ctx.fillRect(-8, -1, 30, 2); 
        ctx.fillStyle = '#95a5a6'; ctx.beginPath(); ctx.moveTo(22, -3); ctx.lineTo(28, 0); ctx.lineTo(22, 3); ctx.fill();
        drawHand(ctx, 0, 0, handColor, outline);
    }
    else if (visualType === UnitType.GIANT || visualType === UnitType.IRON_GOLEM) {
        const dist = 28;
        const leftThrust = (useLeftHand ? anim : 0) * 18;
        const rightThrust = (!useLeftHand ? anim : 0) * 18;
        
        // Correct Giant Skeleton hand color logic
        const color = type === UnitType.GIANT ? COLORS.GIANT_SKIN : 
                      (type === UnitType.SKELETON ? COLORS.SKELETON_BONE : COLORS.IRON_GOLEM);

        const outline = u.team === Team.RED ? COLORS.RED : COLORS.BLUE;
        ctx.save(); ctx.translate(dist + leftThrust, -12); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = outline; ctx.lineWidth=2; ctx.stroke(); ctx.restore();
        ctx.save(); ctx.translate(dist + rightThrust, 12); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = outline; ctx.lineWidth=2; ctx.stroke(); ctx.restore();
    }
    else if (visualType === UnitType.ORC_OGRE) {
        const dist = 32;
        const rightThrust = anim * 15; 
        const color = COLORS.ORC_SKIN;
        const outline = u.team === Team.RED ? COLORS.RED : COLORS.BLUE;
        ctx.translate(dist + rightThrust, 10); 
        ctx.save();
        const swing = anim * Math.PI;
        ctx.rotate(Math.PI/4 - swing); 
        ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(40, -12); ctx.quadraticCurveTo(50, 0, 40, 12); ctx.lineTo(0, 5); ctx.fill();
        ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(35, -10); ctx.lineTo(40, -18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(42, 0); ctx.lineTo(48, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(35, 10); ctx.lineTo(40, 18); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = outline; ctx.lineWidth=2; ctx.stroke();
    }
    else if (visualType === UnitType.ARCHER) {
        ctx.translate(u.radius + 2, 0);
        ctx.strokeStyle = '#d35400'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-5, 0, 10, -Math.PI/2, Math.PI/2); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5, -10); ctx.lineTo(-5 - (anim * 5), 0); ctx.lineTo(-5, 10); ctx.stroke();
    }
    else if (visualType === UnitType.WIZARD || visualType === UnitType.NECROMANCER) {
        ctx.rotate(-Math.PI/4 + anim * 0.5); ctx.translate(u.radius + 2, 0);
        ctx.fillStyle = visualType === UnitType.WIZARD ? '#8e44ad' : '#2c3e50'; 
        ctx.fillRect(0, -2, 25, 4);
        ctx.fillStyle = visualType === UnitType.WIZARD ? `rgba(155, 89, 182, ${0.5 + anim * 0.5})` : `rgba(0, 255, 0, ${0.5 + anim * 0.5})`; 
        ctx.beginPath(); ctx.arc(25, 0, 6, 0, Math.PI*2); ctx.fill();
        drawHand(ctx, 5, 0, handColor, outline);
    }
    else if (visualType === UnitType.ORC_SHAMAN) {
         ctx.rotate(-Math.PI/4 + anim * 0.3); ctx.translate(u.radius + 2, 0);
         ctx.fillStyle = '#5d4037'; ctx.fillRect(0, -2, 28, 4);
         ctx.fillStyle = '#3498db'; ctx.beginPath(); ctx.arc(28, 0, 6, 0, Math.PI*2); ctx.fill();
        drawHand(ctx, 5, 0, handColor, outline);
    }
    else if (visualType === UnitType.CLERIC || visualType === UnitType.ORC_SPIRIT_WALKER) {
        if (visualType === UnitType.ORC_SPIRIT_WALKER) {
             ctx.translate(u.radius + 2, 0);
             const isCasting = anim > 0;
             const idleOffset = isCasting ? 0 : Math.sin(Date.now() / 200) * 2;
             ctx.fillStyle = `rgba(200, 255, 200, ${isCasting ? 0.9 : 0.4})`;
             if (isCasting) { ctx.shadowBlur = 15; ctx.shadowColor = '#00ff00'; }
             ctx.beginPath(); ctx.arc(0, -10 + idleOffset, 5, 0, Math.PI*2); ctx.fill();
             ctx.strokeStyle = outline; ctx.lineWidth = 1; ctx.stroke();
             ctx.beginPath(); ctx.arc(0, 10 - idleOffset, 5, 0, Math.PI*2); ctx.fill();
             ctx.strokeStyle = outline; ctx.lineWidth = 1; ctx.stroke();
             ctx.shadowBlur = 0;
        } else {
            ctx.rotate(-Math.PI/4 - anim * 0.2); ctx.translate(u.radius + 2, 0);
            ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(24,0); ctx.stroke();
            ctx.strokeStyle = '#f39c12'; ctx.beginPath(); ctx.moveTo(20, -5); ctx.lineTo(20, 5); ctx.stroke();
            drawHand(ctx, 5, 0, handColor, outline);
        }
    }
    else if (visualType === UnitType.ORC_SAPPER) {
        ctx.translate(u.radius + 2, 0); 
        ctx.fillStyle = '#111'; 
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
        const isFacingLeft = Math.abs(u.rotation) > Math.PI / 2;
        const fuseY = isFacingLeft ? 10 : -10;
        ctx.fillStyle = '#f1c40f'; ctx.fillRect(0, fuseY, 2, 2); 
        if (Math.random() > 0.3) {
             const sparkX = (Math.random() - 0.5) * 4;
             const sparkY = fuseY + (isFacingLeft ? 2 : -2) + (Math.random() - 0.5) * 4;
             ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#e74c3c';
             ctx.fillRect(sparkX, sparkY, 2, 2);
        }
    }
    else if (visualType === UnitType.PALADIN) {
        const swingAngle = (1 - anim) * Math.PI; 
        ctx.rotate(swingAngle - Math.PI/2); 
        ctx.translate(u.radius - 2, 0); 
        ctx.fillStyle = '#5d4037'; ctx.fillRect(0, -3, 30, 6); 
        ctx.translate(30, 0);
        ctx.rotate(Math.PI/2); 
        ctx.fillStyle = '#95a5a6'; ctx.fillRect(-15, -10, 30, 20);
        ctx.fillStyle = '#f1c40f'; ctx.fillRect(-15, -12, 30, 2); ctx.fillRect(-15, 10, 30, 2); 
        if (anim > 0.8) { ctx.shadowBlur = 15; ctx.shadowColor = '#f1c40f'; }
        ctx.rotate(-Math.PI/2);
        ctx.translate(-30, 0); 
        drawHand(ctx, 5, 0, handColor, outline); 
        drawHand(ctx, 15, 0, handColor, outline);
    }
    ctx.restore();
};

export const drawUnitBody = (ctx: CanvasRenderingContext2D, u: Unit) => {
    if (u.banishedTimer && u.banishedTimer > 0) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLORS.ASTRAL_GLOW;
        ctx.globalAlpha = 0.5;
    }
    if (u.isInvisible) {
        ctx.globalAlpha = 0.3; 
    }
    
    // Determine Visual Type for Shape/Positioning
    let visualType = u.type;
    if (u.type === UnitType.SKELETON && u.visualType) {
        visualType = u.visualType;
    }

    // Body Color Logic
    if (u.type === UnitType.ORC_SPIRIT_WALKER) ctx.fillStyle = 'rgba(200, 255, 200, 0.8)';
    else if (u.type === UnitType.ORC_WARG) ctx.fillStyle = '#4a4a4a'; 
    else if (u.type === UnitType.ORC_SAPPER) ctx.fillStyle = '#689f38'; 
    else if (u.type === UnitType.ORC_WARCHIEF) ctx.fillStyle = COLORS.ORC_SKIN; 
    else if (u.type === UnitType.PALADIN) ctx.fillStyle = '#e6be8a'; 
    else if (u.type === UnitType.ASSASSIN) ctx.fillStyle = '#2c3e50'; 
    else if (u.type === UnitType.GIANT) ctx.fillStyle = COLORS.GIANT_SKIN; 
    else if (u.type === UnitType.IRON_GOLEM) ctx.fillStyle = COLORS.IRON_GOLEM; 
    else if (u.type === UnitType.NECROMANCER) ctx.fillStyle = COLORS.NECROMANCER; 
    else if (u.type === UnitType.SKELETON) ctx.fillStyle = COLORS.SKELETON_BONE; 
    else ctx.fillStyle = u.faction === Faction.ORC ? COLORS.ORC_SKIN : '#e6be8a'; 

    ctx.beginPath();
    if (visualType === UnitType.ORC_WARG) {
        // Wide body (Reverted to original elliptical shape)
        ctx.ellipse(0, 0, u.radius, u.radius * 0.6, 0, 0, Math.PI * 2);
    }
    else ctx.arc(0, 0, u.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = u.color; 
    ctx.lineWidth = 4; 
    if (u.banishedTimer && u.banishedTimer > 0) ctx.strokeStyle = COLORS.ASTRAL_GLOW;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.save();
    
    // Position eyes based on visual type
    if (visualType === UnitType.ORC_WARG) ctx.translate(u.radius * 0.6, 0); 
    else ctx.translate(u.radius * 0.4, 0);
    
    const time = Date.now();
    const idNum = parseInt(u.id.substr(0, 4), 36);
    const blinkPhase = (time + idNum * 100) % 3000; 
    // Iron Golem AND Skeletons do not blink
    const isBlinking = u.type !== UnitType.IRON_GOLEM && u.type !== UnitType.SKELETON && blinkPhase < 150; 

    // EYES
    if (!isBlinking) {
        // Skeleton Eyes (Black hollows)
        if (u.type === UnitType.SKELETON) {
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(0, -u.radius * 0.3, u.radius * 0.25, 0, Math.PI * 2);
            ctx.arc(0, u.radius * 0.3, u.radius * 0.25, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Normal Eyes
            ctx.fillStyle = u.type === UnitType.IRON_GOLEM ? '#00ffff' : 'white';
            ctx.beginPath();
            ctx.arc(0, -u.radius * 0.3, u.radius * 0.2, 0, Math.PI * 2);
            ctx.arc(0, u.radius * 0.3, u.radius * 0.2, 0, Math.PI * 2);
            ctx.fill();

            if (u.type !== UnitType.IRON_GOLEM) {
                if (u.faction === Faction.ORC || u.type === UnitType.ORC_WARG) ctx.fillStyle = 'red'; 
                else if (u.type === UnitType.NECROMANCER) ctx.fillStyle = 'purple';
                else ctx.fillStyle = 'black'; 
                
                const pupilOffset = u.radius * 0.1;
                ctx.beginPath();
                ctx.arc(u.radius * 0.05 + pupilOffset, -u.radius * 0.3, u.radius * 0.1, 0, Math.PI * 2);
                ctx.arc(u.radius * 0.05 + pupilOffset, u.radius * 0.3, u.radius * 0.1, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    } else {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-2, -u.radius * 0.3); ctx.lineTo(2, -u.radius * 0.3);
        ctx.moveTo(-2, u.radius * 0.3); ctx.lineTo(2, u.radius * 0.3);
        ctx.stroke();
    }
    ctx.restore();
};

export const drawUnit = (ctx: CanvasRenderingContext2D, u: Unit) => {
    ctx.save();
    ctx.translate(u.x, u.y);
    if (u.type === UnitType.ORC_WARG && u.attackAnim > 0) {
        const lunge = Math.sin(u.attackAnim * Math.PI) * 15;
        ctx.translate(Math.cos(u.rotation) * lunge, Math.sin(u.rotation) * lunge);
    }
    ctx.rotate(u.rotation);
    drawUnitBody(ctx, u);
    drawWeapon(ctx, u);
    ctx.restore();
};

export const drawGame = (
    ctx: CanvasRenderingContext2D,
    units: Unit[],
    projectiles: Projectile[],
    width: number,
    height: number,
    selectedUnitId: string | null,
    ghosts: {x: number, y: number, type: UnitType, team: Team}[]
) => {
    // Clear Canvas
    ctx.fillStyle = COLORS.BG;
    ctx.fillRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const cellSize = 50;
    for (let x = 0; x <= width; x += cellSize) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for (let y = 0; y <= height; y += cellSize) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.stroke();

    // Sort units for simple z-ordering by Y
    const sortedUnits = [...units].sort((a, b) => a.y - b.y);

    // Draw Units
    sortedUnits.forEach(u => {
        if (u.isDead) {
             // Draw Corpse
             ctx.save();
             ctx.translate(u.x, u.y);
             ctx.rotate(u.rotation);
             ctx.globalAlpha = (u.deathTimer || 0) / DEATH_FRAMES;
             drawUnitBody(ctx, u);
             ctx.restore();
        } else {
             if (u.buffRallyTimer && u.buffRallyTimer > 0) { 
                 ctx.save(); ctx.beginPath(); ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 2; ctx.arc(u.x, u.y, u.radius + 5, 0, Math.PI*2); ctx.stroke(); ctx.restore();
             }
             if (u.buffBloodlustTimer && u.buffBloodlustTimer > 0) {
                 ctx.save(); 
                 ctx.translate(u.x, u.y);
                 const scale = 1.2 + Math.sin(Date.now() / 100) * 0.1;
                 ctx.scale(scale, scale);
                 ctx.strokeStyle = '#ff4500'; 
                 ctx.lineWidth = 2;
                 ctx.setLineDash([5, 5]); 
                 ctx.beginPath(); ctx.arc(0, 0, u.radius, 0, Math.PI*2); ctx.stroke();
                 ctx.restore();
             }
             
             drawUnit(ctx, u);

             // HP Bar
             if (u.hp < u.maxHp || (u.buffBonusHp && u.buffBonusHp > 0)) {
                 const barW = 30;
                 const barH = 4;
                 const hpPct = Math.max(0, u.hp / u.maxHp);
                 
                 ctx.fillStyle = 'red';
                 ctx.fillRect(u.x - barW/2, u.y - u.radius - 8, barW, barH);
                 ctx.fillStyle = COLORS.HP_BAR;
                 ctx.fillRect(u.x - barW/2, u.y - u.radius - 8, barW * hpPct, barH);
                 
                 if (u.buffBonusHp && u.buffBonusHp > 0) {
                     const bonusPct = Math.min(1, u.buffBonusHp / 50);
                     ctx.fillStyle = COLORS.BONUS_HP_BAR;
                     ctx.fillRect(u.x - barW/2, u.y - u.radius - 12, barW * bonusPct, 2);
                 }
             }

             // Status Icons
             let statusOffset = 0;
             if (u.stunTimer && u.stunTimer > 0) {
                 ctx.font = '14px sans-serif';
                 ctx.fillText('💫', u.x - 7, u.y - u.radius - 15 - statusOffset);
                 statusOffset += 15;
             }
             if (u.buffHealAnim && u.buffHealAnim > 0) {
                 ctx.font = '24px monospace';
                 ctx.fillStyle = '#2ecc71';
                 ctx.fillText('+', u.x - 7, u.y - u.radius - 15 - (30 - u.buffHealAnim));
             }
             if (u.buffRallyTimer && u.buffRallyTimer > 0) {
                 ctx.fillStyle = 'yellow';
                 ctx.font = '10px sans-serif';
                 ctx.fillText('🚩', u.x + 10, u.y - u.radius);
             }
        }
    });

    // Draw Projectiles
    projectiles.forEach(p => {
        if (!p.active) return;
        
        if (p.sourceType === UnitType.PALADIN) {
            ctx.save(); 
            ctx.translate(p.x, p.y);
            const lifeRatio = p.life / 40;
            ctx.globalAlpha = lifeRatio;
            
            // 1. Ground Ring
            ctx.scale(1, 0.5); 
            ctx.beginPath(); 
            ctx.arc(0, 0, 40 * (2 - lifeRatio), 0, Math.PI * 2);
            ctx.lineWidth = 4; 
            ctx.strokeStyle = '#fff7cc'; 
            ctx.stroke();
            ctx.scale(1, 2); 

            ctx.globalCompositeOperation = 'lighter';

            // 2. Main Lightning
            ctx.beginPath();
            ctx.moveTo(0, 0); 
            let ly = 0;
            let lx = 0;
            while(ly > -400) {
                ly -= Math.random() * 40; 
                lx += (Math.random() - 0.5) * 20; 
                ctx.lineTo(lx, ly);
            }
            ctx.lineWidth = 3; 
            ctx.strokeStyle = '#fff'; 
            ctx.stroke();
            
            // 3. Secondary Lightning
            ctx.beginPath(); 
            ctx.moveTo(0, 0);
            ly = 0; lx = 0;
            while(ly > -400) { 
                ly -= Math.random() * 50; 
                lx += (Math.random() - 0.5) * 40; 
                ctx.lineTo(lx, ly); 
            }
            ctx.lineWidth = 1; 
            ctx.strokeStyle = '#ffd700'; 
            ctx.stroke();

            ctx.restore();
            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = 'source-over';
        } 
        else if (p.sourceType === UnitType.ORC_WARCHIEF && p.color !== 'SHOUT') {
            // SHOCKWAVE ANIMATION
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.atan2(p.vy, p.vx));
            ctx.beginPath();
            // Draw an arc facing forward
            ctx.arc(0, 0, 25, -Math.PI/3, Math.PI/3);
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 4 + Math.sin(Date.now()/50)*2;
            ctx.shadowBlur = 10; ctx.shadowColor = '#c0392b';
            ctx.stroke();
            // Inner shockwave
            ctx.beginPath();
            ctx.arc(-10, 0, 15, -Math.PI/3, Math.PI/3);
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }
        else if (p.color === 'SHOUT') {
            ctx.save(); ctx.translate(p.x, p.y);
            ctx.globalAlpha = p.life / 20;
            ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(0, 0, (20 - p.life) * 15, 0, Math.PI*2); ctx.stroke();
            ctx.restore();
        } else if (p.sourceType === UnitType.ORC_SHAMAN) { 
            ctx.strokeStyle = '#3498db'; ctx.lineWidth = 2; ctx.beginPath();
            ctx.moveTo(p.x, p.y); 
            ctx.lineTo(p.x + (Math.random()-0.5)*30, p.y + (Math.random()-0.5)*30);
            ctx.stroke();
        } else if (p.sourceType === UnitType.ARCHER || p.sourceType === UnitType.ORC_HEADHUNTER) {
            ctx.save(); 
            ctx.translate(p.x, p.y); 
            const angle = Math.atan2(p.vy, p.vx);
            ctx.rotate(angle);
            
            // Shaft
            ctx.strokeStyle = p.sourceType === UnitType.ORC_HEADHUNTER ? '#5d4037' : '#8d6e63';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
            
            // Head
            ctx.fillStyle = '#bdc3c7';
            ctx.beginPath(); ctx.moveTo(10, -3); ctx.lineTo(18, 0); ctx.lineTo(10, 3); ctx.fill();
            
            // Fletching
            ctx.strokeStyle = '#ecf0f1'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-15, -3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-15, 3); ctx.stroke();
            
            ctx.restore();
        } else if (p.sourceType === UnitType.NECROMANCER || p.sourceType === UnitType.CLERIC) {
             ctx.save();
             ctx.translate(p.x, p.y);
             ctx.fillStyle = p.sourceType === UnitType.NECROMANCER ? '#0f0' : '#fff';
             ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
             if (p.sourceType === UnitType.NECROMANCER) {
                ctx.shadowBlur = 5; ctx.shadowColor = '#0f0';
             }
             ctx.restore();
        } else {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    });

    // Draw Ghosts
    ghosts.forEach(g => {
        // Quick Mock Unit for drawing
        const faction = [UnitType.ORC_GRUNT, UnitType.ORC_HEADHUNTER, UnitType.ORC_SHAMAN, UnitType.ORC_OGRE, UnitType.ORC_WARG, UnitType.ORC_SPIRIT_WALKER, UnitType.ORC_SAPPER, UnitType.ORC_WARCHIEF].includes(g.type) ? Faction.ORC : 
                        [UnitType.GIANT, UnitType.NECROMANCER, UnitType.SKELETON].includes(g.type) ? Faction.NEUTRAL : Faction.HUMAN;

        const mock: Unit = {
            id: 'ghost', x: g.x, y: g.y, type: g.type, team: g.team,
            faction: faction,
            state: UnitState.IDLE,
            hp: 100, maxHp: 100, radius: UNIT_CONFIG[g.type].radius,
            color: g.team === Team.RED ? COLORS.RED : COLORS.BLUE,
            speed: 0, range: 0, cooldown: 0, maxCooldown: 0, damage: 0, armor: 0,
            size: UNIT_CONFIG[g.type].size, mass: 10, knockbackPower: 0, 
            attackType: AttackType.STANDARD, windup: 0, recovery: 0,
            kbVx: 0, kbVy: 0, moveVx: 0, moveVy: 0, attackAnim: 0, rotation: g.team === Team.RED ? 0 : Math.PI,
            useLeftHand: false, tags: [],
            // Default skeleton ghost to Knight for visuals if not specified
            visualType: g.type === UnitType.SKELETON ? UnitType.KNIGHT : undefined
        };
        
        ctx.save();
        ctx.globalAlpha = 0.4;
        drawUnit(ctx, mock);
        // Formation line/dots
        ctx.strokeStyle = 'white';
        ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.arc(g.x, g.y, mock.radius, 0, Math.PI*2); ctx.stroke();
        ctx.restore();
    });

    // Selection Indicator
    if (selectedUnitId) {
        const u = units.find(u => u.id === selectedUnitId);
        if (u) {
            ctx.strokeStyle = COLORS.SELECTION_RING;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 3]);
            ctx.beginPath(); ctx.arc(u.x, u.y, u.radius + 6, 0, Math.PI*2); ctx.stroke();
            ctx.setLineDash([]);
            
            // Range
            ctx.fillStyle = COLORS.RANGE_INDICATOR;
            ctx.beginPath(); ctx.arc(u.x, u.y, u.range || u.radius + 20, 0, Math.PI*2); ctx.fill();
            
            // Target Line
            if (u.targetId) {
                const t = units.find(x => x.id === u.targetId);
                if (t && !t.isDead) {
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(u.x, u.y); ctx.lineTo(t.x, t.y); ctx.stroke();
                }
            }
        }
    }
};

export const calculateStats = (units: Unit[]): GameStats => {
    let redCount = 0;
    let blueCount = 0;
    let redKnights = 0;
    let redArchers = 0;
    let blueKnights = 0;
    let blueArchers = 0;
    const redSummary: Record<string, number> = {};
    const blueSummary: Record<string, number> = {};

    units.forEach(u => {
        if (u.isDead) return;
        const name = LOCALIZATION[u.type];
        if (u.team === Team.RED) {
            redCount++;
            if (u.type === UnitType.KNIGHT) redKnights++;
            if (u.type === UnitType.ARCHER) redArchers++;
            redSummary[name] = (redSummary[name] || 0) + 1;
        } else {
            blueCount++;
            if (u.type === UnitType.KNIGHT) blueKnights++;
            if (u.type === UnitType.ARCHER) blueArchers++;
            blueSummary[name] = (blueSummary[name] || 0) + 1;
        }
    });

    let summary = "КРАСНЫЕ:\n";
    Object.entries(redSummary).forEach(([name, count]) => {
        summary += `- ${name}: ${count}\n`;
    });
    if (redCount === 0) summary += "(Нет войск)\n";

    summary += "\nСИНИЕ:\n";
    Object.entries(blueSummary).forEach(([name, count]) => {
        summary += `- ${name}: ${count}\n`;
    });
    if (blueCount === 0) summary += "(Нет войск)\n";

    return {
        redCount,
        blueCount,
        totalUnits: redCount + blueCount,
        redKnights,
        redArchers,
        blueKnights,
        blueArchers,
        detailedUnitSummary: summary
    };
};
