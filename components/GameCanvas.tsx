
import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { Unit, Projectile, Team, UnitType, GameStats, SpawnFormation } from '../types';
import { updateGameState, drawGame, calculateStats } from '../engine/index';
import { createUnit } from '../engine/factory';
import { getFormationOffsets } from '../engine/utils';

interface GameCanvasProps {
  selectedType: UnitType;
  spawnFormation: SpawnFormation;
  formationRotation: number;
  activeTeam: Team;
  isPaused: boolean;
  timeScale: number;
  onStatsUpdate: (stats: GameStats) => void;
  onSelectionUpdate: (unit: Unit | null) => void;
  resetTrigger: number;
}

export interface GameCanvasHandle {
  spawnMirrorFormation: () => void;
}

const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(({ 
  selectedType, 
  spawnFormation, 
  formationRotation,
  activeTeam,
  isPaused,
  timeScale,
  onStatsUpdate, 
  onSelectionUpdate,
  resetTrigger 
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const unitsRef = useRef<Unit[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const lastStatsUpdateRef = useRef<number>(0);
  
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [ghosts, setGhosts] = useState<{x: number, y: number, type: UnitType, team: Team}[]>([]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    spawnMirrorFormation: () => {
      const currentX = mousePos.x;
      const currentY = mousePos.y;
      const width = canvasRef.current?.width || window.innerWidth;
      
      const mirrorX = width - currentX;
      const mirrorY = currentY;
      const mirrorTeam = activeTeam === Team.RED ? Team.BLUE : Team.RED;
      const mirrorRotation = (formationRotation + 180) % 360; 

      const offsets = getFormationOffsets(spawnFormation, mirrorRotation);
      
      offsets.forEach(offset => {
        const newUnit = createUnit(mirrorX + offset.x, mirrorY + offset.y, mirrorTeam, selectedType);
        unitsRef.current.push(newUnit);
      });
    }
  }));

  // Calculate Ghosts
  useEffect(() => {
    if (selectedUnitId !== null) {
        setGhosts([]);
        return;
    }

    const offsets = getFormationOffsets(spawnFormation, formationRotation);
    const newGhosts = offsets.map(offset => ({
        x: mousePos.x + offset.x,
        y: mousePos.y + offset.y,
        type: selectedType,
        team: activeTeam
    }));
    setGhosts(newGhosts);

  }, [mousePos, spawnFormation, formationRotation, activeTeam, selectedType, selectedUnitId]);

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    setMousePos(pos);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const { x, y } = getMousePos(e);
    
    // Right Click
    if (e.button === 2) {
        setSelectedUnitId(null);
        onSelectionUpdate(null);
        return;
    }

    // Left Click
    if (e.button === 0) {
        // 1. Check if clicking on a unit
        let clickedUnit = false;
        for (let i = unitsRef.current.length - 1; i >= 0; i--) {
            const u = unitsRef.current[i];
            if (u.isDead) continue;
            
            const dist = Math.hypot(u.x - x, u.y - y);
            if (dist < u.radius + 5) {
                setSelectedUnitId(u.id);
                clickedUnit = true;
                onSelectionUpdate(u);
                break;
            }
        }

        if (clickedUnit) return;

        // 2. If clicking on empty ground
        if (selectedUnitId !== null) {
            // STRICT DESELECT
            setSelectedUnitId(null);
            onSelectionUpdate(null);
            return; // Do NOT spawn
        } 
        
        // 3. SPAWN (Only if nothing was selected)
        const offsets = getFormationOffsets(spawnFormation, formationRotation);
        offsets.forEach(offset => {
            const newUnit = createUnit(x + offset.x, y + offset.y, activeTeam, selectedType);
            unitsRef.current.push(newUnit);
        });
    }
  }, [selectedType, spawnFormation, formationRotation, activeTeam, onSelectionUpdate, selectedUnitId]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); 
  }, []);

  // Keyboard Listeners (ESC/DEL)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
          setSelectedUnitId(null);
          onSelectionUpdate(null);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedUnitId) {
        unitsRef.current = unitsRef.current.filter(u => u.id !== selectedUnitId);
        setSelectedUnitId(null);
        onSelectionUpdate(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUnitId, onSelectionUpdate]);

  // Reset logic
  useEffect(() => {
    if (resetTrigger > 0) {
      unitsRef.current = [];
      projectilesRef.current = [];
      setSelectedUnitId(null);
      onSelectionUpdate(null);
      onStatsUpdate(calculateStats([]));
    }
  }, [resetTrigger, onStatsUpdate, onSelectionUpdate]);

  // Game Loop with Delta Time
  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    const deltaFactor = dt * 60 * timeScale;

    if (canvas && ctx) {
      if (!isPaused) {
          const { units, projectiles } = updateGameState(
            unitsRef.current,
            projectilesRef.current,
            canvas.width,
            canvas.height,
            deltaFactor
          );
          unitsRef.current = units;
          projectilesRef.current = projectiles;
      }

      drawGame(ctx, unitsRef.current, projectilesRef.current, canvas.width, canvas.height, selectedUnitId, selectedUnitId ? [] : ghosts);

      if (time - lastStatsUpdateRef.current > 250) {
        onStatsUpdate(calculateStats(unitsRef.current));
        if (selectedUnitId) {
          const u = unitsRef.current.find(u => u.id === selectedUnitId);
          onSelectionUpdate(u || null);
        }
        lastStatsUpdateRef.current = time;
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [onStatsUpdate, onSelectionUpdate, selectedUnitId, isPaused, timeScale, ghosts]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full cursor-crosshair touch-none focus:outline-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onContextMenu={handleContextMenu}
      tabIndex={0} 
    />
  );
});

export default GameCanvas;
