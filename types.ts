
export enum Team {
  RED = 'RED',
  BLUE = 'BLUE'
}

export enum Faction {
  HUMAN = 'HUMAN',
  ORC = 'ORC',
  NEUTRAL = 'NEUTRAL'
}

export enum UnitSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE'
}

export enum AttackType {
  STANDARD = 'STANDARD', // No knockback
  HEAVY = 'HEAVY',       // Physical Knockback
  RANGED = 'RANGED',
  MAGIC = 'MAGIC',
  EXPLOSIVE = 'EXPLOSIVE', // AoE Knockback
  SUPPORT = 'SUPPORT'    // No damage
}

export enum UnitType {
  // Human
  KNIGHT = 'KNIGHT',
  ARCHER = 'ARCHER',
  WIZARD = 'WIZARD',
  CLERIC = 'CLERIC',
  SPEARMAN = 'SPEARMAN',
  IRON_GOLEM = 'IRON_GOLEM', // Replaces Giant
  PALADIN = 'PALADIN',
  ASSASSIN = 'ASSASSIN',
  
  // Orc
  ORC_GRUNT = 'ORC_GRUNT',
  ORC_HEADHUNTER = 'ORC_HEADHUNTER',
  ORC_SHAMAN = 'ORC_SHAMAN',
  ORC_OGRE = 'ORC_OGRE',
  ORC_WARG = 'ORC_WARG',
  ORC_SAPPER = 'ORC_SAPPER',
  ORC_SPIRIT_WALKER = 'ORC_SPIRIT_WALKER',
  ORC_WARCHIEF = 'ORC_WARCHIEF',

  // Neutral
  GIANT = 'GIANT', // Moved to Neutral
  NECROMANCER = 'NECROMANCER',
  SKELETON = 'SKELETON'
}

export enum UnitTag {
  BIOLOGICAL = 'BIOLOGICAL',
  UNDEAD = 'UNDEAD',
  CONSTRUCT = 'CONSTRUCT',
  HERO = 'HERO',
  UNRAISABLE = 'UNRAISABLE' // Cannot be resurrected as Skeleton
}

export enum SpawnFormation {
  SINGLE = 'SINGLE',
  LINE = 'LINE',
  WEDGE = 'WEDGE'
}

export enum UnitState {
  IDLE = 'IDLE',
  MOVE = 'MOVE',
  ATTACK_WINDUP = 'ATTACK_WINDUP',
  ATTACK_RECOVERY = 'ATTACK_RECOVERY',
  STUNNED = 'STUNNED',
  DYING = 'DYING'
}

export interface UnitConfig {
  hp: number;
  radius: number;
  speed: number;
  range: number;
  maxCooldown: number;
  damage: number;
  armor: number;
  size: UnitSize;
  attackType: AttackType;
  knockbackPower: number; // Base force
  windupTime: number;
  recoveryTime: number;
  projectileSpeed?: number;
  projectileLife?: number;
  tags: UnitTag[];
  canShootWhileMoving?: boolean; // For Mages/Necromancers
}

export interface AbilityState {
  id: string;
  name: string;
  description?: string;
  icon: string;
  cooldown: number;
  maxCooldown: number;
  active: boolean; 
  stats?: string; 
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  team: Team;
}

export interface Unit extends Entity {
  type: UnitType;
  faction: Faction; 
  state: UnitState; // FSM State
  targetId?: string | null; // Persisted target ID for FSM

  hp: number;
  maxHp: number;
  buffBonusHp?: number; // Temporary HP (Paladin Rally)
  
  radius: number;
  color: string;
  speed: number;
  range: number;
  cooldown: number;
  maxCooldown: number;
  damage: number;
  armor: number; 
  size: UnitSize;
  mass: number; // Calculated from size for physics
  knockbackPower: number; 
  attackType: AttackType;
  tags: UnitTag[];

  // Attack Cycle States
  windup: number;
  recovery: number;

  // Visuals
  attackAnim: number; 
  rotation: number;
  visualType?: UnitType; // For Skeletons to look like the unit they were
  
  // Giant/Ogre Specific
  useLeftHand?: boolean; 

  // Hero Specifics
  abilities?: AbilityState[];
  
  // Buffs & Debuffs
  buffSpeed?: number; 
  buffArmor?: number; 
  buffBloodlustTimer?: number; 
  buffHealAnim?: number;
  buffRallyTimer?: number; // Hero Rally Buff
  
  isInvisible?: boolean; // Assassin Stealth
  stunTimer?: number; 
  banishedTimer?: number; // Spirit Walker ability
  banishImmunityTimer?: number; // Prevent perma-banish

  // AI Logic
  retargetTimer?: number;
  retargetNeeded?: boolean;

  // Physics
  kbVx: number;
  kbVy: number;
  moveVx?: number; // Steering velocity X
  moveVy?: number; // Steering velocity Y

  isDead?: boolean;
  deathTimer?: number;
}

export interface Projectile extends Entity {
  active: boolean; // For Object Pooling
  vx: number;
  vy: number;
  life: number;
  damage: number;
  color: string;
  ownerId: string;
  sourceType: UnitType; 
  chainCount?: number; 
  ignoredIds?: string[]; 
}

export interface GameStats {
  redCount: number;
  blueCount: number;
  totalUnits: number;
  // Specific counts for backward compatibility if needed, but we rely on detailedUnitSummary
  redKnights: number;
  redArchers: number;
  blueKnights: number;
  blueArchers: number;
  detailedUnitSummary: string; // New field for AI
}

export interface GlobalSettings {
  isPaused: boolean;
  timeScale: number;
  showHealthBars: boolean;
}
