
import { UnitType, UnitConfig, UnitSize, AttackType, UnitTag } from './types';

export const COLORS = {
  RED: '#e74c3c',
  BLUE: '#3498db',
  ORC_SKIN: '#558b2f',
  BG: '#1a1a1a',
  PROJECTILE: '#f1c40f',
  PROJECTILE_MAGIC: '#9b59b6',
  HEAL_BEAM: '#2ecc71',
  HP_BAR: '#2ecc71',
  BONUS_HP_BAR: '#f1c40f',
  ARCHER_STROKE: '#ffffff',
  GRID: '#333333',
  SELECTION_RING: '#ffffff',
  RANGE_INDICATOR: 'rgba(255, 255, 255, 0.1)',
  ASTRAL_GLOW: '#00ffff',
  
  // New Colors
  GIANT_SKIN: '#7f8c8d',
  IRON_GOLEM: '#546e7a', // Blue-grey steel
  NECROMANCER: '#8e44ad',
  SKELETON_BONE: '#ecf0f1'
};

export const DEATH_FRAMES = 45;

export const LOCALIZATION = {
  [UnitType.KNIGHT]: "Рыцарь",
  [UnitType.ARCHER]: "Лучник",
  [UnitType.WIZARD]: "Маг",
  [UnitType.CLERIC]: "Клирик",
  [UnitType.IRON_GOLEM]: "Голем",
  [UnitType.SPEARMAN]: "Копейщик",
  [UnitType.PALADIN]: "Паладин",
  [UnitType.ASSASSIN]: "Убийца",
  
  [UnitType.ORC_GRUNT]: "Бугай",
  [UnitType.ORC_HEADHUNTER]: "Охотник",
  [UnitType.ORC_SHAMAN]: "Шаман",
  [UnitType.ORC_OGRE]: "Огр",
  [UnitType.ORC_WARG]: "Варг",
  [UnitType.ORC_SPIRIT_WALKER]: "Служитель",
  [UnitType.ORC_SAPPER]: "Подрывник",
  [UnitType.ORC_WARCHIEF]: "Вождь",

  [UnitType.GIANT]: "Горный Гигант",
  [UnitType.NECROMANCER]: "Некромант",
  [UnitType.SKELETON]: "Скелет"
};

export const UNIT_DESCRIPTIONS = {
  [UnitType.KNIGHT]: "Элитный воин в латах. Высокая защита позволяет ему выживать там, где другие умирают.",
  [UnitType.ARCHER]: "Скорострельный стрелок. Засыпает врага градом стрел, но бесполезен, если к нему подойти.",
  [UnitType.WIZARD]: "Магистр тайных искусств. Его магия проходит сквозь союзников, сжигая врагов.",
  [UnitType.CLERIC]: "Целитель. Поддерживает жизнь в армии. Лечит живых, может атаковать нежить.",
  [UnitType.IRON_GOLEM]: "Магический конструкт. Иммунитет к магии разума (Астрал) и лечению. Нельзя воскресить.",
  [UnitType.SPEARMAN]: "Мастер древка. Длинное копье позволяет бить из-за спин товарищей.",
  [UnitType.PALADIN]: "Воин Света. Аура защиты и небесная кара делают его центром любой армии. Герой.",
  [UnitType.ASSASSIN]: "Тень. Хрупкий, но наносит колоссальный урон первым ударом из невидимости.",
  
  [UnitType.ORC_GRUNT]: "Свирепый воин Орды. Много здоровья и грубой силы, но никакой защиты.",
  [UnitType.ORC_HEADHUNTER]: "Тролль с копьями. Бьет редко, но метко и больно.",
  [UnitType.ORC_SHAMAN]: "Повелитель стихий. Ускоряет союзников жаждой крови. Не отступает перед врагом.",
  [UnitType.ORC_OGRE]: "Двухголовая гора мышц. Оглушает врагов своими дубинами.",
  [UnitType.ORC_WARG]: "Свирепый волк. Невероятно быстр, идеален для атаки на лучников и магов.",
  [UnitType.ORC_SPIRIT_WALKER]: "Призрачный странник. Изгоняет врагов в Астрал. Не действует на Големов и Героев.",
  [UnitType.ORC_SAPPER]: "Гоблин-камикадзе. Взрывается при смерти, уничтожая все вокруг.",
  [UnitType.ORC_WARCHIEF]: "Вождь Орды. Сильнейший воин в дуэли, казнирующий раненых. Герой.",

  [UnitType.GIANT]: "Древний житель гор. Медленный исполин с каменной кожей, разбрасывает врагов как кукол.",
  [UnitType.NECROMANCER]: "Темный колдун. Поднимает мертвых воинов в виде скелетов.",
  [UnitType.SKELETON]: "Ожившие кости. Копирует поведение прижизненного юнита, но слабее."
};

export const PALADIN_ABILITY_DESCRIPTIONS = {
  cleave: "Широкий взмах мечом.",
  rally: "Аура: +30 Временного ХП и +20% Брони (10с).",
  dash: "Рывок к цели.",
  smite: "Кара небесная: 150 урона."
};

export const WARCHIEF_ABILITY_DESCRIPTIONS = {
  shockwave: "Волна силы: 80 урона по линии.",
  shout: "Боевой клич: +Скорость и Урон всем оркам (8с).",
  leap: "Прыжок в гущу сражения.",
  execute: "Казнь: Смертельный удар (x3) по раненым (<35% HP)."
};

export const SHAMAN_ABILITY_DESCRIPTIONS = {
  chain: "Цепная молния (3 цели).",
  bloodlust: "Жажда крови: +25% Скорости (5с)."
};

export const WALKER_ABILITY_DESCRIPTIONS = {
  banish: "Астрал: Стан + Физ. иммунитет (5с). Уязвим для магии. Не действует на Големов."
};

export const CLERIC_ABILITY_DESCRIPTIONS = {
  heal: "Исцеление живых или урон нежити."
};

export const ASSASSIN_ABILITY_DESCRIPTIONS = {
  stealth: "Невидимость. Первая атака x2.5 урон."
};

export const NECROMANCER_ABILITY_DESCRIPTIONS = {
  raiseDead: "Поднятие мертвых: Превращает труп в скелета."
};

// 60 ticks = 1 second
export const UNIT_CONFIG: Record<UnitType, UnitConfig> = {
  // --- HUMANS ---
  [UnitType.KNIGHT]: {
    hp: 100, radius: 15, speed: 1.5, range: 0, maxCooldown: 60,
    damage: 14, armor: 0.5, size: UnitSize.MEDIUM, attackType: AttackType.STANDARD, knockbackPower: 2,
    windupTime: 15, recoveryTime: 10, tags: [UnitTag.BIOLOGICAL]
  },
  [UnitType.ARCHER]: {
    hp: 50, radius: 10, speed: 1.2, range: 210, maxCooldown: 45,
    damage: 8, armor: 0.1, size: UnitSize.SMALL, attackType: AttackType.RANGED, knockbackPower: 0,
    projectileSpeed: 6, projectileLife: 100, windupTime: 15, recoveryTime: 10, tags: [UnitTag.BIOLOGICAL]
  },
  [UnitType.WIZARD]: {
    hp: 50, radius: 12, speed: 1.0, range: 170, maxCooldown: 110,
    damage: 30, armor: 0.0, size: UnitSize.MEDIUM, attackType: AttackType.MAGIC, knockbackPower: 0,
    projectileSpeed: 3, projectileLife: 120, windupTime: 25, recoveryTime: 15, tags: [UnitTag.BIOLOGICAL],
    canShootWhileMoving: true
  },
  [UnitType.CLERIC]: {
    hp: 40, radius: 12, speed: 1.1, range: 160, maxCooldown: 60, 
    damage: -8, armor: 0, size: UnitSize.MEDIUM, attackType: AttackType.SUPPORT, knockbackPower: 0,
    windupTime: 10, recoveryTime: 10, tags: [UnitTag.BIOLOGICAL, UnitTag.UNRAISABLE]
  },
  [UnitType.IRON_GOLEM]: {
    hp: 150, radius: 18, speed: 0.9, range: 0, maxCooldown: 110,
    damage: 35, armor: 0.8, size: UnitSize.MEDIUM, attackType: AttackType.HEAVY, knockbackPower: 12, 
    windupTime: 40, recoveryTime: 20, tags: [UnitTag.CONSTRUCT, UnitTag.UNRAISABLE]
  },
  [UnitType.SPEARMAN]: {
    hp: 75, radius: 14, speed: 1.4, range: 70, maxCooldown: 45,
    damage: 14, armor: 0.2, size: UnitSize.MEDIUM, attackType: AttackType.STANDARD, knockbackPower: 4,
    windupTime: 12, recoveryTime: 10, tags: [UnitTag.BIOLOGICAL]
  },
  [UnitType.PALADIN]: {
    hp: 550, radius: 20, speed: 1.6, range: 0, maxCooldown: 55,
    damage: 25, armor: 0.7, size: UnitSize.MEDIUM, attackType: AttackType.HEAVY, knockbackPower: 6,
    windupTime: 20, recoveryTime: 15, tags: [UnitTag.HERO, UnitTag.UNRAISABLE, UnitTag.BIOLOGICAL]
  },
  [UnitType.ASSASSIN]: {
    hp: 60, radius: 12, speed: 2.3, range: 0, maxCooldown: 35,
    damage: 22, armor: 0.0, size: UnitSize.MEDIUM, attackType: AttackType.STANDARD, knockbackPower: 1,
    windupTime: 5, recoveryTime: 5, tags: [UnitTag.BIOLOGICAL]
  },

  // --- ORCS ---
  [UnitType.ORC_GRUNT]: {
    hp: 150, radius: 16, speed: 1.4, range: 0, maxCooldown: 70,
    damage: 20, armor: 0.1, size: UnitSize.MEDIUM, attackType: AttackType.STANDARD, knockbackPower: 3,
    windupTime: 20, recoveryTime: 15, tags: [UnitTag.BIOLOGICAL]
  },
  [UnitType.ORC_HEADHUNTER]: {
    hp: 50, radius: 11, speed: 1.3, range: 190, maxCooldown: 90,
    damage: 20, armor: 0.0, size: UnitSize.SMALL, attackType: AttackType.RANGED, knockbackPower: 3,
    projectileSpeed: 7, projectileLife: 60, windupTime: 20, recoveryTime: 20, tags: [UnitTag.BIOLOGICAL]
  },
  [UnitType.ORC_SHAMAN]: {
    hp: 60, radius: 13, speed: 1.0, range: 160, maxCooldown: 100,
    damage: 18, armor: 0.0, size: UnitSize.MEDIUM, attackType: AttackType.MAGIC, knockbackPower: 0,
    projectileSpeed: 4, projectileLife: 80, 
    windupTime: 25, recoveryTime: 20, tags: [UnitTag.BIOLOGICAL]
  },
  [UnitType.ORC_OGRE]: {
    hp: 450, radius: 28, speed: 0.7, range: 0, maxCooldown: 130, 
    damage: 55, armor: 0.1, size: UnitSize.LARGE, attackType: AttackType.HEAVY, knockbackPower: 25,
    windupTime: 45, recoveryTime: 30, tags: [UnitTag.BIOLOGICAL]
  },
  [UnitType.ORC_WARG]: {
    hp: 120, radius: 15, speed: 2.5, range: 0, maxCooldown: 45,
    damage: 14, armor: 0.05, size: UnitSize.MEDIUM, attackType: AttackType.STANDARD, knockbackPower: 5,
    windupTime: 10, recoveryTime: 5, tags: [UnitTag.BIOLOGICAL]
  },
  [UnitType.ORC_SAPPER]: {
    hp: 15, radius: 12, speed: 3.0, range: 0, maxCooldown: 0,
    damage: 100, armor: 0.0, size: UnitSize.SMALL, attackType: AttackType.EXPLOSIVE, knockbackPower: 45, 
    windupTime: 0, recoveryTime: 0, tags: [UnitTag.BIOLOGICAL, UnitTag.UNRAISABLE]
  },
  [UnitType.ORC_SPIRIT_WALKER]: {
    hp: 75, radius: 14, speed: 1.1, range: 180, maxCooldown: 180,
    damage: 0, armor: 0.0, size: UnitSize.MEDIUM, attackType: AttackType.SUPPORT, knockbackPower: 0,
    windupTime: 20, recoveryTime: 20, tags: [UnitTag.BIOLOGICAL, UnitTag.UNRAISABLE]
  },
  [UnitType.ORC_WARCHIEF]: {
    hp: 700, radius: 24, speed: 1.55, range: 0, maxCooldown: 50,
    damage: 40, armor: 0.4, size: UnitSize.MEDIUM, attackType: AttackType.HEAVY, knockbackPower: 14,
    windupTime: 15, recoveryTime: 15, tags: [UnitTag.HERO, UnitTag.UNRAISABLE, UnitTag.BIOLOGICAL]
  },

  // --- NEUTRAL ---
  [UnitType.GIANT]: {
    hp: 400, radius: 25, speed: 0.8, range: 0, maxCooldown: 120,
    damage: 40, armor: 0.2, size: UnitSize.LARGE, attackType: AttackType.HEAVY, knockbackPower: 15, 
    windupTime: 40, recoveryTime: 20, tags: [UnitTag.BIOLOGICAL]
  },
  [UnitType.NECROMANCER]: {
    hp: 70, radius: 12, speed: 1.0, range: 180, maxCooldown: 90,
    damage: 15, armor: 0.0, size: UnitSize.MEDIUM, attackType: AttackType.MAGIC, knockbackPower: 0,
    projectileSpeed: 4, projectileLife: 100, windupTime: 20, recoveryTime: 15, tags: [UnitTag.BIOLOGICAL],
    canShootWhileMoving: true
  },
  [UnitType.SKELETON]: {
    hp: 50, radius: 12, speed: 1.2, range: 0, maxCooldown: 60,
    damage: 10, armor: 0.1, size: UnitSize.MEDIUM, attackType: AttackType.STANDARD, knockbackPower: 1,
    windupTime: 15, recoveryTime: 10, tags: [UnitTag.UNDEAD, UnitTag.UNRAISABLE]
  }
};
