export type PlatformMode = 'desktop' | 'mobile' | 'none';
export type GameDifficulty = 'easy' | 'medium' | 'hard';
export type MapId = 'amber_valley' | 'azure_sanctuary' | 'obsidian_conduit';

export type TowerType = 
  | 'gunner'
  | 'grenadier'
  | 'sniper'
  | 'cryo'
  | 'tesla'
  | 'scanner'
  | 'programmer'
  | 'smuggler'
  | 'thief'
  | 'infernus';

export type TargetPriority = 'first' | 'last' | 'strongest' | 'closest';

export interface TowerConfig {
  id: TowerType;
  name: string;
  cost: number;
  range: number;
  damage: number;
  fireRate: number; // shots per second
  description: string;
  upgradeCosts: [number, number]; // [lvl2, lvl3]
  canDetectCloak: boolean;
}

export interface TowerInstance {
  id: string;
  type: TowerType;
  x: number;
  y: number;
  z: number;
  level: number;
  totalCost: number;
  targetPriority: TargetPriority;
  mesh: any;
  rangeMesh: any;
  lastShotTime: number;
  kills: number;
  damageDealt: number;
  buffedByCommander?: boolean;
  buffedByScanner?: boolean;
}

export type EnemyType = 
  | 'grunt'
  | 'sprinter'
  | 'armored'
  | 'phantom'
  | 'splitter'
  | 'boss';

export interface EnemyConfig {
  type: EnemyType;
  name: string;
  hp: number;
  speed: number;
  reward: number;
  armor: number; // percentage reduction from physical
  isCloaked: boolean;
  isBoss: boolean;
  isSplitter: boolean;
  scale: number;
  color: string;
}

export interface ActiveEnemy {
  id: string;
  type: EnemyType;
  config: EnemyConfig;
  currentHp: number;
  maxHp: number;
  speed: number;
  armor: number;
  isCloaked: boolean;
  revealed: boolean;
  slowTimer: number;
  stunTimer: number;
  burnTimer: number;
  burnDamage: number;
  pathIndex: number;
  pathProgress: number;
  mesh: any;
  hpBarMesh: any;
  frozen: boolean;
}

export interface Waypoint {
  x: number;
  y: number;
  z: number;
}

export interface MapData {
  id: MapId;
  name: string;
  description: string;
  waypoints: Waypoint[];
  validBuildAreas: { minX: number; maxX: number; minZ: number; maxZ: number; isHighGround?: boolean }[];
  skyColor: number;
  groundColor: number;
  pathColor: number;
}

export interface GameState {
  platform: PlatformMode;
  authenticated: boolean;
  scene: 'login' | 'lobby' | 'game' | 'victory' | 'gameover';
  selectedMap: MapId;
  selectedDifficulty: GameDifficulty;
  gold: number;
  lives: number;
  wave: number;
  maxWaves: number;
  score: number;
  selectedTowerType: TowerType | null;
  selectedTowerInstance: TowerInstance | null;
  targetPriority: TargetPriority;
  activeSpells: {
    airStrikeCD: number;
    overclockCD: number;
    empCD: number;
    overclockActiveTimer: number;
    empActiveTimer: number;
  };
  gameSpeed: number;
}
