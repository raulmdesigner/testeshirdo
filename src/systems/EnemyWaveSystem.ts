import * as THREE from 'three';
import { EnemyConfig, EnemyType, ActiveEnemy, Waypoint } from '../types/gameTypes';
import { ProceduralTextures } from '../engine/ProceduralTextures';
import { SoundFX } from '../audio/SoundFX';

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  grunt: {
    type: 'grunt',
    name: 'Grunt Walker',
    hp: 100,
    speed: 6,
    reward: 25,
    armor: 0,
    isCloaked: false,
    isBoss: false,
    isSplitter: false,
    scale: 1.0,
    color: 0xcc3333
  },
  sprinter: {
    type: 'sprinter',
    name: 'Sprinter',
    hp: 60,
    speed: 10,
    reward: 30,
    armor: 0,
    isCloaked: false,
    isBoss: false,
    isSplitter: false,
    scale: 0.8,
    color: 0x33cc66
  },
  armored: {
    type: 'armored',
    name: 'Armored Juggernaut',
    hp: 300,
    speed: 4,
    reward: 60,
    armor: 0.5,
    isCloaked: false,
    isBoss: false,
    isSplitter: false,
    scale: 1.4,
    color: 0x666688
  },
  phantom: {
    type: 'phantom',
    name: 'Phantom Stalker',
    hp: 120,
    speed: 7,
    reward: 50,
    armor: 0,
    isCloaked: true,
    isBoss: false,
    isSplitter: false,
    scale: 1.0,
    color: 0x8833cc
  },
  splitter: {
    type: 'splitter',
    name: 'Swarm Splitter',
    hp: 180,
    speed: 5,
    reward: 70,
    armor: 0.2,
    isCloaked: false,
    isBoss: false,
    isSplitter: true,
    scale: 1.2,
    color: 0xcc8833
  },
  boss: {
    type: 'boss',
    name: 'Overlord Boss',
    hp: 1500,
    speed: 3.5,
    reward: 300,
    armor: 0.4,
    isCloaked: false,
    isBoss: true,
    isSplitter: false,
    scale: 2.5,
    color: 0xff0000
  }
};

export class EnemyWaveSystem {
  public static createEnemyMesh(config: EnemyConfig): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.4,
      metalness: 0.3,
      transparent: config.isCloaked,
      opacity: config.isCloaked ? 0.25 : 1.0
    });

    if (config.isBoss) {
      const body = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 2), mat);
      body.position.y = 1.25;
      group.add(body);

      const crown = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1, 6), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
      crown.position.y = 2.8;
      group.add(crown);
    } else {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * config.scale, 0.7 * config.scale, 1.6 * config.scale, 8), mat);
      body.position.y = 0.8 * config.scale;
      group.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.4 * config.scale, 8, 8), mat);
      head.position.y = 1.6 * config.scale;
      group.add(head);
    }

    return group;
  }

  public static generateWave(waveNumber: number, difficultyMultiplier: number): EnemyType[] {
    const enemies: EnemyType[] = [];
    const isBossWave = waveNumber % 5 === 0;

    const count = 5 + waveNumber * 3;
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      if (waveNumber >= 4 && r < 0.15) {
        enemies.push('phantom');
      } else if (waveNumber >= 3 && r < 0.35) {
        enemies.push('armored');
      } else if (waveNumber >= 2 && r < 0.55) {
        enemies.push('splitter');
      } else if (r < 0.75) {
        enemies.push('sprinter');
      } else {
        enemies.push('grunt');
      }
    }

    if (isBossWave) {
      enemies.push('boss');
    }

    return enemies;
  }
}