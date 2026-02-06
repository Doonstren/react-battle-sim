
import React, { useState, useEffect, useRef } from 'react';
import { UnitType, Faction, UnitSize, Team, UnitTag } from '../types';
import { LOCALIZATION, UNIT_CONFIG, UNIT_DESCRIPTIONS, PALADIN_ABILITY_DESCRIPTIONS, SHAMAN_ABILITY_DESCRIPTIONS, WALKER_ABILITY_DESCRIPTIONS, CLERIC_ABILITY_DESCRIPTIONS, WARCHIEF_ABILITY_DESCRIPTIONS, NECROMANCER_ABILITY_DESCRIPTIONS } from '../constants';
import { X, Shield, Swords, Zap, Activity, Target, Maximize2, Move, ArrowLeft, Ghost, UserCheck, Clock, Hammer, Keyboard, HeartPulse, BookOpen, Skull, AlertTriangle, EyeOff, Mountain, Tag } from 'lucide-react';
import { drawUnit } from '../engine/index';
import { createUnit } from '../engine/factory';

interface EncyclopediaProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewState = 'HOME' | 'HUMANS' | 'ORCS' | 'NEUTRALS' | 'MECHANICS';

const Encyclopedia: React.FC<EncyclopediaProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<ViewState>('HOME');
  const [selectedUnit, setSelectedUnit] = useState<UnitType | null>(null);

  if (!isOpen) return null;

  // Ordered by hotkeys 1-8
  const humanUnits = [
      UnitType.KNIGHT,      // 1
      UnitType.ARCHER,      // 2
      UnitType.SPEARMAN,    // 3
      UnitType.IRON_GOLEM,  // 4
      UnitType.WIZARD,      // 5
      UnitType.CLERIC,      // 6
      UnitType.ASSASSIN,    // 7
      UnitType.PALADIN      // 8
  ];

  const orcUnits = [
      UnitType.ORC_GRUNT,       // 1
      UnitType.ORC_HEADHUNTER,  // 2
      UnitType.ORC_WARG,        // 3
      UnitType.ORC_OGRE,        // 4
      UnitType.ORC_SHAMAN,      // 5
      UnitType.ORC_SPIRIT_WALKER, // 6
      UnitType.ORC_SAPPER,      // 7
      UnitType.ORC_WARCHIEF     // 8
  ];
  
  const neutralUnits = [
      UnitType.GIANT,         // 1
      UnitType.NECROMANCER,   // 2
      UnitType.SKELETON,      // 3
  ];
  
  const unitHotkeys: Record<string, string> = {
      [UnitType.KNIGHT]: '1', [UnitType.ARCHER]: '2', [UnitType.SPEARMAN]: '3', [UnitType.IRON_GOLEM]: '4',
      [UnitType.WIZARD]: '5', [UnitType.CLERIC]: '6', [UnitType.ASSASSIN]: '7', [UnitType.PALADIN]: '8',
      [UnitType.ORC_GRUNT]: '1', [UnitType.ORC_HEADHUNTER]: '2', [UnitType.ORC_WARG]: '3', [UnitType.ORC_OGRE]: '4',
      [UnitType.ORC_SHAMAN]: '5', [UnitType.ORC_SPIRIT_WALKER]: '6', [UnitType.ORC_SAPPER]: '7', [UnitType.ORC_WARCHIEF]: '8',
      [UnitType.GIANT]: '1', [UnitType.NECROMANCER]: '2', [UnitType.SKELETON]: '3'
  };

  const getTagLabel = (tag: UnitTag) => {
      switch(tag) {
          case UnitTag.BIOLOGICAL: return { label: 'Живой', color: 'text-green-400 border-green-400' };
          case UnitTag.CONSTRUCT: return { label: 'Конструкт', color: 'text-gray-400 border-gray-400' };
          case UnitTag.UNDEAD: return { label: 'Нежить', color: 'text-purple-400 border-purple-400' };
          case UnitTag.HERO: return { label: 'Герой', color: 'text-yellow-400 border-yellow-400' };
          case UnitTag.UNRAISABLE: return { label: 'Не воскрешаемый', color: 'text-red-400 border-red-400' };
          default: return { label: tag, color: 'text-white border-white' };
      }
  };

  const handleBack = () => {
      if (selectedUnit) setSelectedUnit(null);
      else setView('HOME');
  };

  const UnitPreviewCanvas = ({ type, size = 64 }: { type: UnitType, size?: number }) => {
      const canvasRef = useRef<HTMLCanvasElement>(null);

      useEffect(() => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Clear
          ctx.clearRect(0, 0, size, size);

          // Create dummy unit
          const unit = createUnit(size/2, size/2, Team.BLUE, type);
          unit.rotation = 0; // Face right
          unit.id = "preview"; 
          unit.attackAnim = 0; // Force static
          
          if (type === UnitType.SKELETON) {
              unit.visualType = UnitType.KNIGHT; // Default visual for preview
          }
          
          // Scale down fit
          const scale = 0.6; 
          
          let yOffset = 0;
          if (type === UnitType.ORC_WARCHIEF) {
              yOffset = -15; // Lift him up to fit in frame
          }

          ctx.save();
          ctx.translate(size/2, size/2 + yOffset);
          ctx.scale(scale, scale);
          ctx.translate(-size/2, -size/2);
          
          drawUnit(ctx, unit);
          ctx.restore();
          
      }, [type, size]);

      return <canvas ref={canvasRef} width={size} height={size} />;
  };

  const renderHome = () => (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full place-content-center p-10">
          <button onClick={() => setView('HUMANS')} className="bg-indigo-900/40 hover:bg-indigo-800/60 border-2 border-indigo-500 p-8 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 group">
              <UserCheck size={48} className="text-indigo-400 group-hover:text-white" />
              <h2 className="text-2xl font-bold text-white">Люди</h2>
              <p className="text-indigo-200 text-center text-sm">Сбалансированная армия с сильной защитой и големами.</p>
          </button>
          <button onClick={() => setView('ORCS')} className="bg-green-900/40 hover:bg-green-800/60 border-2 border-green-500 p-8 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 group">
              <Ghost size={48} className="text-green-400 group-hover:text-white" />
              <h2 className="text-2xl font-bold text-white">Орки</h2>
              <p className="text-green-200 text-center text-sm">Свирепые воины с высоким уроном и шаманской магией.</p>
          </button>
          <button onClick={() => setView('NEUTRALS')} className="bg-gray-800/60 hover:bg-gray-700/60 border-2 border-gray-500 p-8 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 group">
              <Mountain size={48} className="text-gray-400 group-hover:text-white" />
              <h2 className="text-2xl font-bold text-white">Нейтралы</h2>
              <p className="text-gray-300 text-center text-sm">Древние гиганты и темные маги, поднимающие мертвых.</p>
          </button>
          <button onClick={() => setView('MECHANICS')} className="bg-neutral-800/60 hover:bg-neutral-700/60 border-2 border-white/20 p-8 rounded-2xl flex flex-col items-center gap-4 transition-all hover:scale-105 group">
              <BookOpen size={48} className="text-gray-400 group-hover:text-white" />
              <h2 className="text-2xl font-bold text-white">Общее</h2>
              <p className="text-gray-300 text-center text-sm">Игровая механика, типы урона и тактические хитрости.</p>
          </button>
      </div>
  );

  const renderMechanics = () => (
      <div className="p-8 max-w-4xl mx-auto space-y-8">
          <div className="border-b border-white/10 pb-4 mb-4">
              <h2 className="text-4xl font-bold text-white mb-2">Игровая Механика</h2>
              <p className="text-gray-400">Всё, что нужно знать для победы на поле боя.</p>
          </div>

          <section className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                  <Swords /> Типы Урона
              </h3>
              <div className="grid gap-4">
                  <div className="bg-black/30 p-4 rounded-lg">
                      <strong className="text-white block mb-1">ФИЗИЧЕСКИЙ (Standard)</strong>
                      <p className="text-gray-400 text-sm">Базовый урон. Полностью снижается броней цели. Например: Рыцарь, Лучник, Варг.</p>
                  </div>
                  <div className="bg-black/30 p-4 rounded-lg">
                      <strong className="text-indigo-300 block mb-1">МАГИЧЕСКИЙ (Magic)</strong>
                      <p className="text-gray-400 text-sm">Пробивает доспехи. <span className="text-indigo-400 font-bold">Игнорирует 50% брони</span> цели. Например: Маг, Шаман, Кара Паладина.</p>
                  </div>
                  <div className="bg-black/30 p-4 rounded-lg">
                      <strong className="text-yellow-500 block mb-1">ВЗРЫВНОЙ (Explosive)</strong>
                      <p className="text-gray-400 text-sm">Разрушительная сила. <span className="text-yellow-500 font-bold">Игнорирует 100% брони</span> цели. Наносит урон по области. Используется Подрывниками.</p>
                  </div>
              </div>
          </section>

          <section className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                  <Shield /> Броня и Защита
              </h3>
              <p className="text-gray-300 mb-4">Броня снижает входящий физический урон в процентном соотношении. Например, 0.5 брони (50%) уменьшит урон в 10 вдвое до 5.</p>
              <ul className="list-disc pl-5 text-gray-400 space-y-2">
                  <li><span className="text-white">Воодушевление (Паладин):</span> Временно повышает броню и дает дополнительное здоровье.</li>
                  <li><span className="text-white">Астрал (Служитель):</span> Цель в Астрале не получает физического урона, но уязвима для магии.</li>
              </ul>
          </section>

          <section className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="text-2xl font-bold text-orange-400 mb-4 flex items-center gap-2">
                  <AlertTriangle /> Отбрасывание и Размер
              </h3>
              <p className="text-gray-300 mb-4">Сила отбрасывания зависит от размера цели. Гигантов и Големов сложнее сдвинуть с места, чем Гоблинов.</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-black/30 p-3 rounded">
                      <div className="text-xs text-gray-500 uppercase">Мелкие</div>
                      <div className="text-white font-bold">Small</div>
                  </div>
                  <div className="bg-black/30 p-3 rounded">
                      <div className="text-xs text-gray-500 uppercase">Средние</div>
                      <div className="text-white font-bold">Medium</div>
                  </div>
                  <div className="bg-black/30 p-3 rounded">
                      <div className="text-xs text-gray-500 uppercase">Крупные</div>
                      <div className="text-white font-bold">Large</div>
                  </div>
              </div>
          </section>
          
           <section className="bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                  <Skull /> Особые Механики
              </h3>
              <ul className="space-y-3">
                  <li className="flex gap-3">
                      <span className="text-purple-400 font-bold whitespace-nowrap">Удар из тени:</span>
                      <span className="text-gray-400">Убийцы наносят x2.5 урона при первой атаке из невидимости.</span>
                  </li>
                  <li className="flex gap-3">
                      <span className="text-red-400 font-bold whitespace-nowrap">Казнь:</span>
                      <span className="text-gray-400">Вождь наносит тройной урон целям, у которых меньше 35% здоровья.</span>
                  </li>
                  <li className="flex gap-3">
                      <span className="text-gray-400 font-bold whitespace-nowrap">Конструкт (Голем/Скелет):</span>
                      <span className="text-gray-400">Иммунитет к ядам, кровотечению и Изгнанию в Астрал.</span>
                  </li>
                  <li className="flex gap-3">
                      <span className="text-green-400 font-bold whitespace-nowrap">Некромантия:</span>
                      <span className="text-gray-400">Поднимает скелетов из трупов. Нельзя поднять Героев, Клириков или других Скелетов.</span>
                  </li>
              </ul>
          </section>
      </div>
  );

  const renderUnitList = (list: UnitType[], title: string, colorClass: string) => (
      <div className="p-6">
          <h2 className={`text-3xl font-bold mb-6 ${colorClass}`}>{title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {list.map(type => (
                  <button key={type} onClick={() => setSelectedUnit(type)} className="bg-neutral-800 p-4 rounded-xl border border-white/5 hover:border-white/20 hover:bg-neutral-700 transition-all flex flex-col items-center text-center group relative overflow-hidden">
                      <div className="mb-2">
                        <UnitPreviewCanvas type={type} size={100} />
                      </div>
                      <span className="font-bold text-lg text-white group-hover:text-blue-300">{LOCALIZATION[type]}</span>
                      <div className="absolute top-2 right-2 text-xs font-mono text-gray-500 border border-gray-600 rounded px-1">
                          {unitHotkeys[type]}
                      </div>
                  </button>
              ))}
          </div>
      </div>
  );

  const renderUnitDetail = () => {
      if (!selectedUnit) return null;
      const config = UNIT_CONFIG[selectedUnit];
      const atkSpeed = config.maxCooldown > 0 ? (60 / config.maxCooldown).toFixed(2) : "N/A";
      const isHealer = selectedUnit === UnitType.CLERIC;

      return (
          <div className="p-8 max-w-4xl mx-auto">
              <div className="flex items-center gap-6 mb-8">
                  <div className="w-32 h-32 bg-neutral-800 rounded-full flex items-center justify-center border-4 border-white/10 shadow-xl overflow-hidden relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                         <UnitPreviewCanvas type={selectedUnit} size={140} />
                      </div>
                  </div>
                  <div>
                      <h2 className="text-5xl font-bold text-white mb-2">{LOCALIZATION[selectedUnit]}</h2>
                      <div className="flex gap-2 mb-2">
                        <span className="bg-white/10 text-white px-3 py-1 rounded text-sm font-mono">{selectedUnit}</span>
                        <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded text-sm font-mono flex items-center gap-2">
                            <Keyboard size={14}/> Key: {unitHotkeys[selectedUnit]}
                        </span>
                      </div>
                      {/* TAGS */}
                      <div className="flex gap-2 flex-wrap">
                          {config.tags.map(tag => {
                              const style = getTagLabel(tag);
                              return (
                                  <span key={tag} className={`text-xs font-bold border px-2 py-0.5 rounded uppercase ${style.color}`}>
                                      {style.label}
                                  </span>
                              );
                          })}
                      </div>
                  </div>
              </div>

              <div className="bg-white/5 p-6 rounded-xl border border-white/10 mb-8">
                  <p className="text-xl text-gray-200 leading-relaxed">{UNIT_DESCRIPTIONS[selectedUnit]}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatRow label="Здоровье" value={config.hp} icon={<Activity size={16} className="text-green-400"/>} />
                <StatRow 
                    label={isHealer ? "Лечение" : "Урон"} 
                    value={Math.abs(config.damage)} 
                    icon={isHealer ? <HeartPulse size={16} className="text-green-400"/> : <Swords size={16} className="text-red-400"/>} 
                />
                <StatRow label="Броня" value={`${(config.armor*100).toFixed(0)}%`} icon={<Shield size={16} className="text-blue-400"/>} />
                <StatRow label="Скорость" value={config.speed} icon={<Move size={16} className="text-cyan-400"/>} />
                <StatRow label="Скор. Атаки" value={atkSpeed} icon={<Clock size={16} className="text-yellow-400"/>} />
                <StatRow label="Дальность" value={config.range} icon={<Target size={16} className="text-purple-400"/>} />
                <StatRow label="Размер" value={config.size} icon={<Maximize2 size={16} className="text-orange-400"/>} />
                <StatRow label="Тип Атаки" value={config.attackType} icon={<Zap size={16} className="text-pink-400"/>} />
              </div>

              {/* Passives */}
              {selectedUnit === UnitType.ORC_OGRE && (
                  <div className="mb-4">
                      <h3 className="text-xl font-bold text-orange-400 mb-4 border-b border-white/10 pb-2">Пассивная способность</h3>
                      <AbilityRow name="Тяжелый удар" desc="Каждая атака оглушает врага на 1 секунду." icon={<Hammer size={16}/>} />
                  </div>
              )}
              
               {selectedUnit === UnitType.ASSASSIN && (
                  <div className="mb-4">
                      <h3 className="text-xl font-bold text-purple-400 mb-4 border-b border-white/10 pb-2">Пассивная способность</h3>
                      <AbilityRow name="Удар из Тени" desc="Первая атака из невидимости наносит x2.5 урона." icon={<EyeOff size={16}/>} />
                  </div>
              )}
              
              {selectedUnit === UnitType.IRON_GOLEM && (
                  <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-400 mb-4 border-b border-white/10 pb-2">Пассивная способность</h3>
                      <AbilityRow name="Конструкт" desc="Иммунитет к ядам, кровотечениям и изгнанию в Астрал." icon={<Shield size={16}/>} />
                  </div>
              )}

              {/* Abilities Sections */}
              {selectedUnit === UnitType.PALADIN && (
                  <div>
                      <h3 className="text-xl font-bold text-yellow-500 mb-4 border-b border-white/10 pb-2">Способности Паладина</h3>
                      <div className="grid gap-4">
                          <AbilityRow name="Рассечение" desc={PALADIN_ABILITY_DESCRIPTIONS.cleave} stats="CD: 5s" />
                          <AbilityRow name="Воодушевление" desc={PALADIN_ABILITY_DESCRIPTIONS.rally} stats="CD: 10s" />
                          <AbilityRow name="Рывок" desc={PALADIN_ABILITY_DESCRIPTIONS.dash} stats="CD: 6.5s" />
                          <AbilityRow name="Кара" desc={PALADIN_ABILITY_DESCRIPTIONS.smite} stats="CD: 15s" />
                      </div>
                  </div>
              )}

              {selectedUnit === UnitType.ORC_WARCHIEF && (
                  <div>
                      <h3 className="text-xl font-bold text-red-500 mb-4 border-b border-white/10 pb-2">Способности Вождя</h3>
                      <div className="grid gap-4">
                          <AbilityRow name="Ударная Волна" desc={WARCHIEF_ABILITY_DESCRIPTIONS.shockwave} stats="CD: 6.5s" />
                          <AbilityRow name="Боевой Клич" desc={WARCHIEF_ABILITY_DESCRIPTIONS.shout} stats="CD: 15s" />
                          <AbilityRow name="Прыжок" desc={WARCHIEF_ABILITY_DESCRIPTIONS.leap} stats="CD: 8s" />
                          <AbilityRow name="Казнь" desc={WARCHIEF_ABILITY_DESCRIPTIONS.execute} stats="CD: 5s" />
                      </div>
                  </div>
              )}
              
              {selectedUnit === UnitType.ORC_SHAMAN && (
                  <div>
                      <h3 className="text-xl font-bold text-blue-400 mb-4 border-b border-white/10 pb-2">Шаманская Магия</h3>
                      <div className="grid gap-4">
                          <AbilityRow name="Цепная Молния (Атака)" desc={SHAMAN_ABILITY_DESCRIPTIONS.chain} stats="Bounces: 2 targets" />
                          <AbilityRow name="Жажда Крови" desc={SHAMAN_ABILITY_DESCRIPTIONS.bloodlust} stats="CD: 10s | Dur: 5s | Spd +25%" />
                      </div>
                  </div>
              )}

              {selectedUnit === UnitType.ORC_SPIRIT_WALKER && (
                  <div>
                      <h3 className="text-xl font-bold text-teal-400 mb-4 border-b border-white/10 pb-2">Духовная Связь</h3>
                      <div className="grid gap-4">
                          <AbilityRow name="Астрал" desc={WALKER_ABILITY_DESCRIPTIONS.banish} stats="CD: 3s | Dur: 2s" />
                      </div>
                  </div>
              )}

              {selectedUnit === UnitType.CLERIC && (
                  <div>
                      <h3 className="text-xl font-bold text-yellow-200 mb-4 border-b border-white/10 pb-2">Свет</h3>
                      <div className="grid gap-4">
                          <AbilityRow name="Исцеление" desc={CLERIC_ABILITY_DESCRIPTIONS.heal} stats="Auto-cast" />
                      </div>
                  </div>
              )}
              
              {selectedUnit === UnitType.NECROMANCER && (
                  <div>
                      <h3 className="text-xl font-bold text-purple-600 mb-4 border-b border-white/10 pb-2">Темная Магия</h3>
                      <div className="grid gap-4">
                          <AbilityRow name="Поднятие Мертвых" desc={NECROMANCER_ABILITY_DESCRIPTIONS.raiseDead} stats="CD: 2s" />
                      </div>
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-white/20 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-neutral-800">
          <div className="flex items-center gap-4">
             {(view !== 'HOME' || selectedUnit) && (
                 <button onClick={handleBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                     <ArrowLeft size={24} className="text-white"/>
                 </button>
             )}
             <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                 <div className="bg-indigo-600 p-2 rounded-lg">📖</div>
                 Энциклопедия
             </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={32} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative">
            {!selectedUnit && view === 'HOME' && renderHome()}
            {!selectedUnit && view === 'HUMANS' && renderUnitList(humanUnits, 'Армия Людей', 'text-indigo-400')}
            {!selectedUnit && view === 'ORCS' && renderUnitList(orcUnits, 'Орда Орков', 'text-green-400')}
            {!selectedUnit && view === 'NEUTRALS' && renderUnitList(neutralUnits, 'Нейтралы', 'text-gray-400')}
            {!selectedUnit && view === 'MECHANICS' && renderMechanics()}
            {selectedUnit && renderUnitDetail()}
        </div>
        
        {/* Footer Hotkeys */}
        <div className="bg-black/40 p-2 border-t border-white/10 text-xs text-gray-500 flex justify-center gap-4">
            <span>[1-8]: Выбор Юнита</span>
            <span>[R/К]: Вращать</span>
            <span>[TAB]: Смена Команды</span>
            <span>[Q/Й]: Смена Фракции</span>
            <span>[H/Р]: Скрыть UI</span>
        </div>
      </div>
    </div>
  );
};

const StatRow = ({label, value, icon}: {label: string, value: string|number, icon: React.ReactNode}) => (
    <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-white/5">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
            {icon} {label}
        </div>
        <span className="font-mono font-bold text-white text-lg">{value}</span>
    </div>
);

const AbilityRow = ({name, desc, stats, icon}: {name: string, desc: string, stats?: string, icon?: React.ReactNode}) => (
    <div className="bg-neutral-800 p-4 rounded-lg border-l-4 border-yellow-500">
        <div className="flex justify-between items-center mb-1">
             <div className="flex items-center gap-2">
                 {icon && <span className="text-yellow-500">{icon}</span>}
                 <strong className="text-white block text-lg">{name}</strong>
             </div>
             {stats && <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded text-yellow-500">{stats}</span>}
        </div>
        <p className="text-gray-400 text-sm">{desc}</p>
    </div>
);

export default Encyclopedia;
