
import React, { useState, useEffect } from 'react';
import { UnitType, GameStats, SpawnFormation, Unit, Team, Faction } from '../types';
import { BrainCircuit, Swords, MousePointer2, Users, User, ChevronUp, Zap, Shield, Skull, HeartPulse, RotateCw, Trash2, Play, Pause, Copy, Book, Bomb, Pickaxe, Crown, Flag, Wind, Hammer, Axe, Target, Sparkles, UserCheck, Ghost, Club, Move, EyeOff, Eye, UserMinus, Mountain, Hexagon } from 'lucide-react';
import { LOCALIZATION } from '../constants';
import Encyclopedia from './Encyclopedia';

interface UIOverlayProps {
  selectedType: UnitType;
  spawnFormation: SpawnFormation;
  formationRotation: number;
  activeTeam: Team;
  selectedFaction: Faction;
  isPaused: boolean;
  timeScale: number;
  stats: GameStats;
  selectedUnit: Unit | null;
  analysis: string;
  isAnalyzing: boolean;
  onSelectType: (type: UnitType) => void;
  onSelectFormation: (fmt: SpawnFormation) => void;
  onSelectTeam: (team: Team) => void;
  onSelectFaction: (faction: Faction) => void;
  onTogglePause: () => void;
  onToggleSpeed: () => void;
  onSpawnMirror: () => void;
  onClear: () => void;
  onAnalyze: () => void;
  onRotate: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  selectedType,
  spawnFormation,
  formationRotation,
  activeTeam,
  selectedFaction,
  isPaused,
  timeScale,
  stats,
  selectedUnit,
  analysis,
  isAnalyzing,
  onSelectType,
  onSelectFormation,
  onSelectTeam,
  onSelectFaction,
  onTogglePause,
  onToggleSpeed,
  onSpawnMirror,
  onClear,
  onAnalyze,
  onRotate
}) => {
  
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [visible, setVisible] = useState(true);

  // Global toggle listener with RUS support
  useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
          if (e.key.toLowerCase() === 'h' || e.key.toLowerCase() === 'р') setVisible(prev => !prev);
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Dynamic Button List based on Faction
  const getUnitButtons = () => {
      if (selectedFaction === Faction.HUMAN) {
          return [
              { type: UnitType.KNIGHT, icon: <Shield size={16}/>, hotkey: '1' },
              { type: UnitType.ARCHER, icon: <Swords size={16}/>, hotkey: '2' },
              { type: UnitType.SPEARMAN, icon: <Pickaxe size={16}/>, hotkey: '3' },
              { type: UnitType.IRON_GOLEM, icon: <Hexagon size={16}/>, hotkey: '4' },
              { type: UnitType.WIZARD, icon: <Zap size={16}/>, hotkey: '5' },
              { type: UnitType.CLERIC, icon: <HeartPulse size={16}/>, hotkey: '6' },
              { type: UnitType.ASSASSIN, icon: <UserMinus size={16}/>, hotkey: '7' },
              { type: UnitType.PALADIN, icon: <Crown size={16}/>, hotkey: '8' },
          ];
      } else if (selectedFaction === Faction.ORC) {
          return [
              { type: UnitType.ORC_GRUNT, icon: <Axe size={16}/>, hotkey: '1' },
              { type: UnitType.ORC_HEADHUNTER, icon: <Target size={16}/>, hotkey: '2' },
              { type: UnitType.ORC_WARG, icon: <Move size={16}/>, hotkey: '3' },
              { type: UnitType.ORC_OGRE, icon: <Club size={16}/>, hotkey: '4' },
              { type: UnitType.ORC_SHAMAN, icon: <Sparkles size={16}/>, hotkey: '5' },
              { type: UnitType.ORC_SPIRIT_WALKER, icon: <Ghost size={16}/>, hotkey: '6' },
              { type: UnitType.ORC_SAPPER, icon: <Bomb size={16}/>, hotkey: '7' },
              { type: UnitType.ORC_WARCHIEF, icon: <Crown size={16}/>, hotkey: '8' },
          ];
      } else {
           return [
              { type: UnitType.GIANT, icon: <Mountain size={16}/>, hotkey: '1' },
              { type: UnitType.NECROMANCER, icon: <Skull size={16}/>, hotkey: '2' },
              { type: UnitType.SKELETON, icon: <Skull size={16} className="text-gray-500"/>, hotkey: '3' },
          ];
      }
  };

  const unitButtons = getUnitButtons().sort((a,b) => parseInt(a.hotkey) - parseInt(b.hotkey));

  const formationButtons = [
    { type: SpawnFormation.SINGLE, label: 'Один', icon: <User size={16}/> },
    { type: SpawnFormation.LINE, label: 'Линия', icon: <Users size={16}/> },
    { type: SpawnFormation.WEDGE, label: 'Клин', icon: <ChevronUp size={16}/> },
  ];

  const getAbilityIcon = (iconName: string) => {
      switch(iconName) {
          case 'swords': return <Swords size={14} />;
          case 'flag': return <Flag size={14} />;
          case 'wind': return <Wind size={14} />;
          case 'hammer': return <Hammer size={14} />;
          case 'zap': return <Zap size={14} />;
          case 'ghost': return <Ghost size={14} />;
          case 'eye-off': return <EyeOff size={14} />;
          case 'skull': return <Skull size={14} />;
          default: return <Zap size={14} />;
      }
  };
  
  const getActiveStatus = (u: Unit) => {
      const statuses = [];
      const fmt = (val: number) => (val / 60).toFixed(1) + 's'; 

      if (u.isInvisible) statuses.push({ text: 'Невидимость', color: 'text-purple-400' });
      
      if (u.banishedTimer && u.banishedTimer > 0) {
          statuses.push({ text: `Астрал: ${fmt(u.banishedTimer)}`, color: 'text-cyan-400' });
      }
      
      if (u.banishImmunityTimer && u.banishImmunityTimer > 0) {
          statuses.push({ text: `Иммун.: ${fmt(u.banishImmunityTimer)}`, color: 'text-gray-400' });
      }

      if (u.stunTimer && u.stunTimer > 0) {
          statuses.push({ text: `Оглушение: ${fmt(u.stunTimer)}`, color: 'text-yellow-400' });
      }
      
      if (u.buffRallyTimer && u.buffRallyTimer > 0) {
          statuses.push({ text: `Воодушевление: ${fmt(u.buffRallyTimer)}`, color: 'text-yellow-300' });
      }
      
      if (u.buffBloodlustTimer && u.buffBloodlustTimer > 0) {
          statuses.push({ text: `Жажда: ${fmt(u.buffBloodlustTimer)}`, color: 'text-red-400' });
      }
      
      return statuses;
  };

  if (!visible) {
      return (
          <div className="absolute top-4 left-4 pointer-events-auto">
               <button onClick={() => setVisible(true)} className="bg-black/50 text-white p-2 rounded-lg hover:bg-black/70">
                   <Eye size={20} />
               </button>
          </div>
      );
  }

  return (
    <>
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="flex gap-4">
            <div className="bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                <Swords className="text-yellow-500" /> React Battle Sim
              </h1>
              <div className="text-sm text-gray-300 space-y-1">
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span> 
                    Красные: {stats.redCount}
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span> 
                    Синие: {stats.blueCount}
                 </div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 flex items-center gap-2 h-fit">
                <button onClick={onTogglePause} className="p-2 hover:bg-white/10 rounded-lg text-white" title="Старт/Пауза (Space)">
                    {isPaused ? <Play size={20} fill="currentColor"/> : <Pause size={20} fill="currentColor"/>}
                </button>
                <button onClick={onToggleSpeed} className="p-2 hover:bg-white/10 rounded-lg text-white font-mono text-xs w-10 text-center" title="Скорость">
                    {timeScale}x
                </button>
                <button onClick={() => setVisible(false)} className="p-2 hover:bg-white/10 rounded-lg text-white" title="Скрыть UI (H/Р)">
                    <EyeOff size={20} />
                </button>
            </div>
            
            <button 
                onClick={() => setShowEncyclopedia(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl border border-white/10 shadow-lg transition-all active:scale-95 h-fit"
                title="Энциклопедия"
            >
                <Book size={20} />
            </button>
        </div>

        <div className="flex flex-col gap-2 items-end">
            {selectedUnit && (
              <div className="bg-neutral-800/90 backdrop-blur border border-white/20 p-4 rounded-xl shadow-xl w-72 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                  <h3 className="font-bold text-lg text-white">{LOCALIZATION[selectedUnit.type]}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${selectedUnit.team === 'RED' ? 'bg-red-500' : 'bg-blue-500'}`}>
                    {selectedUnit.team === 'RED' ? 'Красный' : 'Синий'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between items-baseline">
                    <span>HP:</span>
                    <div className="flex flex-col items-end">
                        <span className="font-mono text-white">{Math.ceil(selectedUnit.hp)} / {selectedUnit.maxHp}</span>
                        {selectedUnit.buffBonusHp !== undefined && selectedUnit.buffBonusHp > 0 && (
                             <span className="font-mono text-yellow-400 text-xs">+{Math.ceil(selectedUnit.buffBonusHp)} (Buff)</span>
                        )}
                    </div>
                  </div>
                   <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mb-1">
                      <div 
                        className="bg-green-500 h-full transition-all duration-300" 
                        style={{width: `${(selectedUnit.hp/selectedUnit.maxHp)*100}%`}}
                      />
                   </div>
                   {selectedUnit.buffBonusHp !== undefined && selectedUnit.buffBonusHp > 0 && (
                       <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-yellow-500 h-full transition-all duration-300" 
                            style={{width: `${Math.min(100, (selectedUnit.buffBonusHp/50)*100)}%`}}
                          />
                       </div>
                   )}
                   
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                        <span className="text-gray-500 text-xs block">УРОН</span>
                        <span className="text-white">{Math.abs(selectedUnit.damage)}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 text-xs block">БРОНЯ</span>
                        <span className={`${(selectedUnit.buffArmor || 0) > 0 ? 'text-green-400 font-bold' : 'text-white'}`}>
                            {((selectedUnit.armor + (selectedUnit.buffArmor || 0)) * 100).toFixed(0)}%
                        </span>
                    </div>
                  </div>

                  {/* Status Effects */}
                  <div className="flex flex-wrap gap-1 mt-2">
                      {getActiveStatus(selectedUnit).map((status, i) => (
                          <span key={i} className={`text-[10px] uppercase font-bold px-1.5 py-0.5 bg-black/40 rounded border border-white/10 ${status.color}`}>
                              {status.text}
                          </span>
                      ))}
                  </div>
                  
                  {/* Abilities Display */}
                  {selectedUnit.abilities && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                          <span className="text-xs font-bold text-yellow-500 uppercase mb-2 block">Способности</span>
                          <div className="grid grid-cols-4 gap-2">
                              {selectedUnit.abilities.map(ab => {
                                  const onCd = ab.cooldown > 0;
                                  const pct = onCd ? (ab.cooldown / ab.maxCooldown) * 100 : 0;
                                  return (
                                      <div key={ab.id} className="relative aspect-square bg-black/50 rounded flex items-center justify-center border border-white/10" title={ab.name}>
                                          {getAbilityIcon(ab.icon)}
                                          {onCd && (
                                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded overflow-hidden">
                                                  <div className="absolute bottom-0 left-0 right-0 bg-white/20" style={{height: `${pct}%`}}/>
                                                  <span className="text-[10px] font-bold z-10">{Math.ceil(ab.cooldown/60)}</span>
                                              </div>
                                          )}
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  )}

                  <div className="pt-2 text-xs text-center text-gray-500">
                    <kbd className="bg-gray-700 px-1 rounded">DEL</kbd> для удаления <br/>
                    <kbd className="bg-gray-700 px-1 rounded">ESC</kbd> снять выбор
                  </div>
                </div>
              </div>
            )}

            <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10 text-xs text-gray-400">
                <p className="flex items-center gap-2"><MousePointer2 size={12}/> ЛКМ: Спавн | Земля: Сброс</p>
                <p>[1-8]: Юниты | [R/К]: Вращать | [Q/Й]: Фракция</p>
            </div>
            <button 
                onClick={onClear}
                className="bg-red-600/80 hover:bg-red-500 text-white px-4 py-1 rounded text-sm transition-colors pointer-events-auto flex items-center gap-2"
            >
                <Trash2 size={14}/> Очистить
            </button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex flex-col-reverse md:flex-row justify-between items-end pointer-events-none gap-4">
        
        <div className="flex flex-col gap-3 pb-8 pl-4 pointer-events-auto max-w-[70vw]"> 
            {/* Team & Faction Toggles */}
            <div className="flex gap-4">
                <div className="flex gap-2 bg-black/60 p-1 rounded-lg w-fit">
                    <button onClick={() => onSelectTeam(Team.RED)} className={`px-4 py-1 rounded transition-colors font-bold ${activeTeam === Team.RED ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>КРАСНЫЕ</button>
                    <button onClick={() => onSelectTeam(Team.BLUE)} className={`px-4 py-1 rounded transition-colors font-bold ${activeTeam === Team.BLUE ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>СИНИЕ</button>
                </div>
                <div className="flex gap-2 bg-black/60 p-1 rounded-lg w-fit">
                    <button onClick={() => onSelectFaction(Faction.HUMAN)} className={`px-3 py-1 rounded transition-colors flex items-center gap-2 ${selectedFaction === Faction.HUMAN ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                        <UserCheck size={14}/> Люди
                    </button>
                    <button onClick={() => onSelectFaction(Faction.ORC)} className={`px-3 py-1 rounded transition-colors flex items-center gap-2 ${selectedFaction === Faction.ORC ? 'bg-green-700 text-white' : 'text-gray-400 hover:text-white'}`}>
                        <Ghost size={14}/> Орки
                    </button>
                    <button onClick={() => onSelectFaction(Faction.NEUTRAL)} className={`px-3 py-1 rounded transition-colors flex items-center gap-2 ${selectedFaction === Faction.NEUTRAL ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                        <Mountain size={14}/> Нейтралы
                    </button>
                </div>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              <div className="flex gap-1 bg-black/60 p-1 rounded-lg w-fit">
                  {formationButtons.map((btn) => (
                      <button key={btn.type} onClick={() => onSelectFormation(btn.type)} className={`p-2 rounded flex items-center gap-2 text-sm transition-all ${spawnFormation === btn.type ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/10'}`} title={btn.label}>
                          {btn.icon}
                          <span className="hidden md:inline">{btn.label}</span>
                      </button>
                  ))}
              </div>
              
              {spawnFormation !== SpawnFormation.SINGLE && (
                <button onClick={onRotate} className="bg-black/60 hover:bg-black/80 text-white p-3 rounded-lg border border-white/10 flex items-center gap-2 transition-all active:scale-95" title="Вращать (R/К)">
                  <RotateCw size={18} className={`transition-transform duration-300`} style={{transform: `rotate(${formationRotation}deg)`}}/>
                  <span className="text-sm font-mono">{formationRotation}°</span>
                </button>
              )}

              <button onClick={onSpawnMirror} className="bg-purple-600/80 hover:bg-purple-500 text-white p-3 rounded-lg border border-white/10 flex items-center gap-2 transition-all active:scale-95" title="Отзеркалить спавн за врага (M/Ь)">
                  <Copy size={18} />
              </button>
            </div>

            {/* Unit Bar */}
            <div className="flex gap-2 overflow-x-auto pb-6 pt-4 w-fit scrollbar-hide px-2" style={{scrollbarWidth: 'none'}}>
              {unitButtons.map((btn) => (
                <button
                  key={btn.type}
                  onClick={() => onSelectType(btn.type)}
                  className={`px-3 py-4 rounded-xl border-2 font-bold transition-all flex flex-col items-center gap-2 min-w-[90px] ${
                    selectedType === btn.type
                      ? 'bg-gray-100 text-black border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)] z-10'
                      : 'bg-black/70 text-gray-400 border-gray-700 hover:bg-black/90 hover:border-gray-500 hover:scale-105'
                  }`}
                >
                  {btn.icon}
                  <span className="text-[10px] font-bold">{LOCALIZATION[btn.type]}</span>
                  <span className="text-[10px] opacity-50">[{btn.hotkey}]</span>
                </button>
              ))}
            </div>
        </div>

        <div className="flex flex-col items-end max-w-md w-full gap-2 hidden md:flex pb-8 pr-4 pointer-events-auto">
          {analysis && (
             <div className="bg-gradient-to-r from-indigo-900/95 to-purple-900/95 p-4 rounded-xl border border-indigo-400/30 text-indigo-100 text-sm shadow-lg animate-in fade-in slide-in-from-bottom-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1 block">Тактический Анализ</span>
                {analysis}
             </div>
          )}
          <button onClick={onAnalyze} disabled={isAnalyzing || stats.totalUnits === 0} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-5 py-3 rounded-lg font-semibold shadow-lg transition-all">
            <BrainCircuit size={20} />
            {isAnalyzing ? "Анализирую..." : "Анализ Битвы"}
          </button>
        </div>

      </div>
    </div>

    <Encyclopedia isOpen={showEncyclopedia} onClose={() => setShowEncyclopedia(false)} />
    </>
  );
};

export default UIOverlay;
