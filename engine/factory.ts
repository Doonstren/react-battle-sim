
import { Unit, Team, UnitType, Faction, UnitSize, AbilityState, UnitState } from '../types';
import { COLORS, UNIT_CONFIG } from '../constants';

const createPaladinAbilities = (): AbilityState[] => [
  { id: 'cleave', name: 'Рассечение', description: 'Урон по площади', icon: 'swords', cooldown: 0, maxCooldown: 300, active: false, stats: 'CD: 5s' },
  { id: 'rally', name: 'Воодушевление', description: 'Бафф союзников', icon: 'flag', cooldown: 0, maxCooldown: 600, active: false, stats: 'CD: 10s' },
  { id: 'dash', name: 'Рывок', description: 'Рывок к цели', icon: 'wind', cooldown: 0, maxCooldown: 400, active: false, stats: 'CD: 6.5s' },
  { id: 'smite', name: 'Кара', description: 'Сильный удар', icon: 'hammer', cooldown: 0, maxCooldown: 900, active: false, stats: 'CD: 15s' }, 
];

const createWarchiefAbilities = (): AbilityState[] => [
  { id: 'shockwave', name: 'Волна', description: 'Урон по линии', icon: 'zap', cooldown: 0, maxCooldown: 400, active: false, stats: 'CD: 6.5s' },
  { id: 'shout', name: 'Боевой Клич', description: 'Урон союзников +50%', icon: 'swords', cooldown: 0, maxCooldown: 900, active: false, stats: 'CD: 15s' },
  { id: 'leap', name: 'Прыжок', description: 'Врыв в бой', icon: 'move', cooldown: 0, maxCooldown: 500, active: false, stats: 'CD: 8s' },
  { id: 'execute', name: 'Казнь', description: 'x3 урон по раненым', icon: 'skull', cooldown: 0, maxCooldown: 300, active: false, stats: 'CD: 5s' },
];

const createShamanAbilities = (): AbilityState[] => [
  { id: 'bloodlust', name: 'Жажда Крови', description: 'Бафф скорости', icon: 'zap', cooldown: 0, maxCooldown: 600, active: false, stats: 'CD: 10s' }
];

const createWalkerAbilities = (): AbilityState[] => [
  { id: 'banish', name: 'Астрал', description: 'Изгнание врага', icon: 'ghost', cooldown: 0, maxCooldown: 300, active: false, stats: 'CD: 5s' }
];

const createAssassinAbilities = (): AbilityState[] => [
  { id: 'stealth', name: 'Невидимость', description: 'Уход в тень', icon: 'eye-off', cooldown: 900, maxCooldown: 900, active: false, stats: 'CD: 15s' }
];

const createNecromancerAbilities = (): AbilityState[] => [
  { id: 'raiseDead', name: 'Поднятие мертвых', description: 'Создает скелетов', icon: 'skull', cooldown: 0, maxCooldown: 120, active: false, stats: 'CD: 2s' }
];

export const createUnit = (x: number, y: number, team: Team, type: UnitType): Unit => {
  const config = UNIT_CONFIG[type];
  
  let faction = Faction.HUMAN;
  if ([UnitType.ORC_GRUNT, UnitType.ORC_HEADHUNTER, UnitType.ORC_SHAMAN, UnitType.ORC_OGRE, UnitType.ORC_WARG, UnitType.ORC_SPIRIT_WALKER, UnitType.ORC_SAPPER, UnitType.ORC_WARCHIEF].includes(type)) {
      faction = Faction.ORC;
  } else if ([UnitType.GIANT, UnitType.NECROMANCER, UnitType.SKELETON].includes(type)) {
      faction = Faction.NEUTRAL;
  }
  
  let mass = 10;
  if (config.size === UnitSize.SMALL) mass = 10;
  if (config.size === UnitSize.MEDIUM) mass = 25;
  if (config.size === UnitSize.LARGE) mass = 150;

  const unit: Unit = {
    id: Math.random().toString(36).substr(2, 9),
    x: x, y: y, team, faction, type,
    state: UnitState.IDLE,
    hp: config.hp, maxHp: config.hp, radius: config.radius,
    color: team === Team.RED ? COLORS.RED : COLORS.BLUE,
    speed: config.speed, range: config.range,
    cooldown: 0, maxCooldown: config.maxCooldown,
    damage: config.damage, armor: config.armor || 0,
    size: config.size, mass: mass, 
    knockbackPower: config.knockbackPower || 0,
    attackType: config.attackType,
    windup: 0, recovery: 0,
    kbVx: 0, kbVy: 0,
    moveVx: 0, moveVy: 0,
    attackAnim: 0, rotation: team === Team.RED ? 0 : Math.PI,
    useLeftHand: false,
    buffSpeed: 1, isDead: false, deathTimer: 0,
    buffBonusHp: 0,
    banishImmunityTimer: 0,
    tags: config.tags,
    retargetTimer: Math.random() * 60, // Random start to avoid sync
    retargetNeeded: false
  };

  if (type === UnitType.PALADIN) unit.abilities = createPaladinAbilities();
  if (type === UnitType.ORC_WARCHIEF) unit.abilities = createWarchiefAbilities();
  if (type === UnitType.ORC_SHAMAN) unit.abilities = createShamanAbilities();
  if (type === UnitType.ORC_SPIRIT_WALKER) unit.abilities = createWalkerAbilities();
  if (type === UnitType.NECROMANCER) unit.abilities = createNecromancerAbilities();
  
  if (type === UnitType.ASSASSIN) {
      unit.abilities = createAssassinAbilities();
      unit.isInvisible = true; 
      unit.abilities[0].cooldown = 900; 
  }
  
  // Default Visual for Skeletons spawned via UI
  if (type === UnitType.SKELETON) {
      unit.visualType = UnitType.KNIGHT;
  }

  return unit;
};
