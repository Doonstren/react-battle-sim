
import React, { useState, useCallback, useEffect, useRef } from 'react';
import GameCanvas, { GameCanvasHandle } from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { UnitType, GameStats, SpawnFormation, Unit, Team, Faction } from './types';
import { analyzeBattle } from './services/geminiService';

const App: React.FC = () => {
  const gameCanvasRef = useRef<GameCanvasHandle>(null);
  
  const [selectedType, setSelectedType] = useState<UnitType>(UnitType.KNIGHT);
  const [spawnFormation, setSpawnFormation] = useState<SpawnFormation>(SpawnFormation.SINGLE);
  const [formationRotation, setFormationRotation] = useState<number>(0);
  const [activeTeam, setActiveTeam] = useState<Team>(Team.RED);
  const [selectedFaction, setSelectedFaction] = useState<Faction>(Faction.HUMAN);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1.0); // Default Speed 1.0
  
  const [stats, setStats] = useState<GameStats>({
    redCount: 0,
    blueCount: 0,
    totalUnits: 0,
    redKnights: 0,
    redArchers: 0,
    blueKnights: 0,
    blueArchers: 0,
    detailedUnitSummary: ''
  });
  const [resetTrigger, setResetTrigger] = useState(0);
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // When faction changes, default to T1 unit of that faction
  const handleFactionSelect = (f: Faction) => {
      setSelectedFaction(f);
      if (f === Faction.HUMAN) setSelectedType(UnitType.KNIGHT);
      else if (f === Faction.ORC) setSelectedType(UnitType.ORC_GRUNT);
      else setSelectedType(UnitType.GIANT);
  };

  const handleRotate = useCallback(() => {
    setFormationRotation(prev => (prev + 45) % 360);
  }, []);

  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // 1 -> 2 -> 0.5 -> 1
  const handleToggleSpeed = useCallback(() => {
    setTimeScale(prev => {
        if (prev === 1) return 2;
        if (prev === 2) return 0.5;
        return 1;
    });
  }, []);

  const handleSpawnMirror = useCallback(() => {
    gameCanvasRef.current?.spawnMirrorFormation();
  }, []);

  const handleToggleTeam = useCallback(() => {
    setActiveTeam(prev => prev === Team.RED ? Team.BLUE : Team.RED);
  }, []);

  // Keyboard shortcuts (Supports EN and RU)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();

      switch(key) {
        // --- UNIT SELECTION ---
        case '1': 
             if (selectedFaction === Faction.HUMAN) setSelectedType(UnitType.KNIGHT);
             else if (selectedFaction === Faction.ORC) setSelectedType(UnitType.ORC_GRUNT);
             else setSelectedType(UnitType.GIANT);
             break;
        case '2': 
             if (selectedFaction === Faction.HUMAN) setSelectedType(UnitType.ARCHER);
             else if (selectedFaction === Faction.ORC) setSelectedType(UnitType.ORC_HEADHUNTER);
             else setSelectedType(UnitType.NECROMANCER);
             break;
        case '3': 
             if (selectedFaction === Faction.HUMAN) setSelectedType(UnitType.SPEARMAN);
             else if (selectedFaction === Faction.ORC) setSelectedType(UnitType.ORC_WARG);
             else setSelectedType(UnitType.SKELETON);
             break;
        case '4': 
             if (selectedFaction === Faction.HUMAN) setSelectedType(UnitType.IRON_GOLEM);
             else if (selectedFaction === Faction.ORC) setSelectedType(UnitType.ORC_OGRE);
             break;
        case '5': 
             if (selectedFaction === Faction.HUMAN) setSelectedType(UnitType.WIZARD);
             else if (selectedFaction === Faction.ORC) setSelectedType(UnitType.ORC_SHAMAN);
             break;
        case '6': 
             if (selectedFaction === Faction.HUMAN) setSelectedType(UnitType.CLERIC);
             else if (selectedFaction === Faction.ORC) setSelectedType(UnitType.ORC_SPIRIT_WALKER);
             break;
        case '7': 
             if (selectedFaction === Faction.HUMAN) setSelectedType(UnitType.ASSASSIN);
             else if (selectedFaction === Faction.ORC) setSelectedType(UnitType.ORC_SAPPER);
             break;
        case '8': 
             if (selectedFaction === Faction.HUMAN) setSelectedType(UnitType.PALADIN); 
             else if (selectedFaction === Faction.ORC) setSelectedType(UnitType.ORC_WARCHIEF); 
             break;
        
        // R / К (Rotate)
        case 'r': case 'к': handleRotate(); break;
        
        // Space (Pause)
        case ' ': handleTogglePause(); break;
        
        // M / Ь (Mirror)
        case 'm': case 'ь': handleSpawnMirror(); break;
        
        // Tab (Team)
        case 'tab': 
            e.preventDefault();
            handleToggleTeam();
            break;
        
        // Q / Й (Faction)
        case 'q': case 'й':
            e.preventDefault();
            let nextFac = Faction.HUMAN;
            if (selectedFaction === Faction.HUMAN) nextFac = Faction.ORC;
            else if (selectedFaction === Faction.ORC) nextFac = Faction.NEUTRAL;
            handleFactionSelect(nextFac);
            break;
        
        // ESC (Deselect)
        case 'escape':
            setSelectedUnit(null);
            break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRotate, handleTogglePause, handleSpawnMirror, handleToggleTeam, selectedFaction, handleFactionSelect]);

  const handleStatsUpdate = useCallback((newStats: GameStats) => {
    setStats(newStats);
  }, []);

  const handleSelectionUpdate = useCallback((unit: Unit | null) => {
    setSelectedUnit(unit ? { ...unit } : null);
  }, []);

  const handleClear = () => {
    setResetTrigger(prev => prev + 1);
    setAnalysis("");
    setSelectedUnit(null);
  };

  const handleAnalyze = async () => {
    if (stats.totalUnits === 0) return;
    setIsAnalyzing(true);
    setAnalysis("Устанавливаю связь с командованием...");
    try {
      const result = await analyzeBattle(stats);
      setAnalysis(result);
    } catch (e) {
      setAnalysis("Ошибка анализа.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-screen h-screen relative bg-neutral-900">
      <GameCanvas 
        ref={gameCanvasRef}
        selectedType={selectedType}
        spawnFormation={spawnFormation}
        formationRotation={formationRotation}
        activeTeam={activeTeam}
        isPaused={isPaused}
        timeScale={timeScale}
        onStatsUpdate={handleStatsUpdate}
        onSelectionUpdate={handleSelectionUpdate}
        resetTrigger={resetTrigger}
      />
      <UIOverlay 
        selectedType={selectedType}
        spawnFormation={spawnFormation}
        formationRotation={formationRotation}
        activeTeam={activeTeam}
        selectedFaction={selectedFaction}
        isPaused={isPaused}
        timeScale={timeScale}
        stats={stats}
        selectedUnit={selectedUnit}
        analysis={analysis}
        isAnalyzing={isAnalyzing}
        onSelectType={setSelectedType}
        onSelectFormation={setSpawnFormation}
        onSelectTeam={setActiveTeam}
        onSelectFaction={handleFactionSelect}
        onTogglePause={handleTogglePause}
        onToggleSpeed={handleToggleSpeed}
        onSpawnMirror={handleSpawnMirror}
        onClear={handleClear}
        onAnalyze={handleAnalyze}
        onRotate={handleRotate}
      />
    </div>
  );
};

export default App;
