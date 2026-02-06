
import { Unit } from '../types';

export const calculateSeparation = (u: Unit, units: Unit[]) => {
    let dx = 0, dy = 0;
    let count = 0;
    for (const other of units) {
        if (u === other || other.isDead) continue;
        const distSq = (u.x - other.x)**2 + (u.y - other.y)**2;
        const desiredSeparation = (u.radius + other.radius) * 1.5; 
        
        if (distSq < desiredSeparation**2 && distSq > 0.001) {
            const dist = Math.sqrt(distSq);
            // Vector pointing away from neighbor
            const push = (desiredSeparation - dist) / desiredSeparation; 
            dx += ((u.x - other.x) / dist) * push;
            dy += ((u.y - other.y) / dist) * push;
            count++;
        }
    }
    if (count > 0) {
        const strength = 0.8; // Separation weight
        return { x: dx * strength, y: dy * strength };
    }
    return { x: 0, y: 0 };
};

export const systemPhysics = (units: Unit[], width: number, height: number, df: number) => {
    // 1. Apply Forces
    for (const u of units) {
        if (u.isDead) continue;
        
        // Disable physics movement for Banished units
        if (u.banishedTimer && u.banishedTimer > 0) {
             u.kbVx *= 0.8; u.kbVy *= 0.8;
             continue;
        }
        
        // Steering Velocity
        if (u.moveVx) { u.x += u.moveVx * df; u.moveVx = 0; }
        if (u.moveVy) { u.y += u.moveVy * df; u.moveVy = 0; }

        // Knockback Physics
        u.x += u.kbVx * df;
        u.y += u.kbVy * df;
        u.kbVx *= 0.8; u.kbVy *= 0.8; // Friction

        // Smart Boundaries - Avoid Stuck Units
        // Instead of hard clamping, we cancel velocity into the wall so they can slide
        if (u.x < u.radius) {
            u.x = u.radius;
            if (u.kbVx < 0) u.kbVx = 0;
        }
        if (u.x > width - u.radius) {
            u.x = width - u.radius;
            if (u.kbVx > 0) u.kbVx = 0;
        }
        if (u.y < u.radius) {
            u.y = u.radius;
            if (u.kbVy < 0) u.kbVy = 0;
        }
        if (u.y > height - u.radius) {
            u.y = height - u.radius;
            if (u.kbVy > 0) u.kbVy = 0;
        }
    }

    // 2. Collision Resolution (Hard constraints to prevent overlap)
    const iterations = 2; 
    for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < units.length; i++) {
            const u1 = units[i];
            if (u1.isDead) continue;
            for (let j = i + 1; j < units.length; j++) {
                const u2 = units[j];
                if (u2.isDead) continue;
                
                const dx = u2.x - u1.x;
                const dy = u2.y - u1.y;
                const distSq = dx*dx + dy*dy;
                const minDist = u1.radius + u2.radius;
                
                if (distSq < minDist*minDist && distSq > 0.001) {
                    const dist = Math.sqrt(distSq);
                    const overlap = minDist - dist;
                    const totalMass = u1.mass + u2.mass;
                    const r1 = u2.mass / totalMass;
                    const r2 = u1.mass / totalMass;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    u1.x -= nx * overlap * r1;
                    u1.y -= ny * overlap * r1;
                    u2.x += nx * overlap * r2;
                    u2.y += ny * overlap * r2;
                }
            }
        }
    }
};
