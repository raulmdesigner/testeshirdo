import { MapData, GameDifficulty } from '../types/gameTypes';

export const DIFFICULTY_SETTINGS: Record<GameDifficulty, { hpMultiplier: number; startGold: number; name: string }> = {
  easy: { hpMultiplier: 0.85, startGold: 650, name: 'Fácil' },
  medium: { hpMultiplier: 1.0, startGold: 500, name: 'Médio' },
  hard: { hpMultiplier: 1.35, startGold: 400, name: 'Difícil' }
};

export const MAP_CATALOG: Record<string, MapData> = {
  amber_valley: {
    id: 'amber_valley',
    name: 'Amber Valley',
    description: 'Vale florestal com penhascos altos nas bordas e curvas fechadas no terreno baixo.',
    skyColor: 0x87ceeb,
    groundColor: 0x2e5a27,
    pathColor: 0x6b533a,
    waypoints: [
      { x: -50, y: 2, z: -50 },
      { x: -20, y: 2, z: -50 },
      { x: -20, y: 2, z: -20 },
      { x: 20, y: 2, z: -20 },
      { x: 20, y: 2, z: 20 },
      { x: -20, y: 2, z: 20 },
      { x: -20, y: 2, z: 50 },
      { x: 50, y: 2, z: 50 }
    ],
    validBuildAreas: [
      { minX: -55, maxX: -25, minZ: -45, maxZ: -25, isHighGround: true },
      { minX: 25, maxX: 55, minZ: -45, maxZ: -25, isHighGround: true },
      { minX: -15, maxX: 15, minZ: -40, maxZ: -30 },
      { minX: -40, maxX: -25, minZ: -10, maxZ: 10 },
      { minX: 25, maxX: 40, minZ: -10, maxZ: 10 },
      { minX: -15, maxX: 15, minZ: 30, maxZ: 40 },
      { minX: 25, maxX: 55, minZ: 35, maxZ: 55, isHighGround: true }
    ]
  },
  azure_sanctuary: {
    id: 'azure_sanctuary',
    name: 'Azure Sanctuary',
    description: 'Ruínas místicas com plataformas elevadas centrais e caminho duplo convergente.',
    skyColor: 0x4a6984,
    groundColor: 0x3b4a59,
    pathColor: 0x7c8a99,
    waypoints: [
      { x: 0, y: 2, z: -55 },
      { x: 0, y: 2, z: -25 },
      { x: -25, y: 2, z: 0 },
      { x: 25, y: 2, z: 0 },
      { x: 0, y: 2, z: 25 },
      { x: 0, y: 2, z: 55 }
    ],
    validBuildAreas: [
      { minX: -12, maxX: 12, minZ: -20, maxZ: -10, isHighGround: true },
      { minX: -12, maxX: 12, minZ: 10, maxZ: 20, isHighGround: true },
      { minX: -35, maxX: -20, minZ: -10, maxZ: 10 },
      { minX: 20, maxX: 35, minZ: -10, maxZ: 10 },
      { minX: -20, maxX: -5, minZ: -40, maxZ: -30 },
      { minX: 5, maxX: 20, minZ: 30, maxZ: 40 }
    ]
  },
  obsidian_conduit: {
    id: 'obsidian_conduit',
    name: 'Obsidian Conduit',
    description: 'Complexo vulcânico com passarelas metálicas suspensas e zonas de longa distância.',
    skyColor: 0x2b1b1b,
    groundColor: 0x3d2323,
    pathColor: 0x222222,
    waypoints: [
      { x: -45, y: 2, z: 0 },
      { x: -25, y: 2, z: -35 },
      { x: 0, y: 2, z: -35 },
      { x: 25, y: 2, z: -15 },
      { x: -25, y: 2, z: 15 },
      { x: 0, y: 2, z: 35 },
      { x: 45, y: 2, z: 35 }
    ],
    validBuildAreas: [
      { minX: -30, maxX: -15, minZ: -20, maxZ: -10, isHighGround: true },
      { minX: 10, maxX: 25, minZ: -30, maxZ: -20, isHighGround: true },
      { minX: -15, maxX: 0, minZ: -25, maxZ: -15 },
      { minX: -15, maxX: 0, minZ: 5, maxZ: 15 },
      { minX: 15, maxX: 30, minZ: 15, maxZ: 25, isHighGround: true },
      { minX: 30, maxX: 45, minZ: 10, maxZ: 25 }
    ]
  }
};
