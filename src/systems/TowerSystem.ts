import * as THREE from 'three';
import { TowerConfig, TowerInstance, TowerType, TargetPriority, ActiveEnemy } from '../types/gameTypes';
import { ProceduralTextures } from '../engine/ProceduralTextures';
import { SoundFX } from '../audio/SoundFX';

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  gunner: {
    id: 'gunner',
    name: 'Gunner (Sentinela)',
    cost: 350,
    range: 15,
    damage: 25,
    fireRate: 2.0,
    description: 'Cadência alta em alvo único. Nv.3 ganha visor térmico e canhão duplo.',
    upgradeCosts: [250, 450],
    canDetectCloak: false
  },
  grenadier: {
    id: 'grenadier',
    name: 'Grenadier / Artilharia',
    cost: 500,
    range: 22,
    damage: 90,
    fireRate: 0.6,
    description: 'Disparos parabólicos com dano explosivo em área (splash).',
    upgradeCosts: [350, 600],
    canDetectCloak: false
  },
  sniper: {
    id: 'sniper',
    name: 'Sniper / Longo Alcance',
    cost: 550,
    range: 35,
    damage: 180,
    fireRate: 0.4,
    description: 'Dano crítico e alcance longo. Bônus em lugares altos.',
    upgradeCosts: [400, 700],
    canDetectCloak: false
  },
  cryo: {
    id: 'cryo',
    name: 'Cryo / Gelo',
    cost: 450,
    range: 16,
    damage: 15,
    fireRate: 1.0,
    description: 'Emite pulsos de gelo reduzindo velocidade em 40% e cristalizando camuflagem.',
    upgradeCosts: [300, 500],
    canDetectCloak: false
  },
  tesla: {
    id: 'tesla',
    name: 'Tesla / Bobina Arc',
    cost: 650,
    range: 18,
    damage: 60,
    fireRate: 1.2,
    description: 'Rios de energia que saltam entre até 5 monstros, ignorando armadura.',
    upgradeCosts: [450, 800],
    canDetectCloak: false
  },
  scanner: {
    id: 'scanner',
    name: 'Scanner / Radar',
    cost: 400,
    range: 25,
    damage: 5,
    fireRate: 0.5,
    description: 'Revela monstros invisíveis e concede +20% de alcance às torres vizinhas.',
    upgradeCosts: [250, 450],
    canDetectCloak: true
  },
  programmer: {
    id: 'programmer',
    name: 'Commander / Buff',
    cost: 600,
    range: 18,
    damage: 10,
    fireRate: 1.0,
    description: 'Aumenta velocidade de disparo (+35%) e dano (+20%) das torres na área.',
    upgradeCosts: [400, 750],
    canDetectCloak: false
  },
  smuggler: {
    id: 'smuggler',
    name: 'Smuggler / Gerador',
    cost: 500,
    range: 12,
    damage: 0,
    fireRate: 0.2,
    description: 'Gera ouro passivo durante a onda e bônus no final de cada rodada.',
    upgradeCosts: [350, 600],
    canDetectCloak: false
  },
  thief: {
    id: 'thief',
    name: 'Thief / Bounty Hunter',
    cost: 400,
    range: 12,
    damage: 35,
    fireRate: 1.5,
    description: 'Ataques rápidos que geram ouro extra por acerto e abates.',
    upgradeCosts: [300, 500],
    canDetectCloak: false
  },
  infernus: {
    id: 'infernus',
    name: 'Infernus / Feixe Plasma',
    cost: 1200,
    range: 20,
    damage: 120,
    fireRate: 5.0,
    description: 'Raio laser contínuo cujo dano cresce quanto mais tempo focado no alvo.',
    upgradeCosts: [700, 1200],
    canDetectCloak: false
  }
};

export class TowerSystem {
  public static createTowerMesh(type: TowerType, level: number): THREE.Group {
    const group = new THREE.Group();
    const baseMat = ProceduralTextures.createMaterial('metal');
    const accentMat = ProceduralTextures.createMaterial('stone');

    // Base pedestal
    const pedestalGeom = new THREE.CylinderGeometry(1.2, 1.4, 0.6, 16);
    const pedestal = new THREE.Mesh(pedestalGeom, baseMat);
    pedestal.position.y = 0.3;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    group.add(pedestal);

    let colorTint = 0x3388ff;
    if (type === 'gunner') colorTint = 0x55ff55;
    else if (type === 'grenadier') colorTint = 0xff5533;
    else if (type === 'sniper') colorTint = 0xffff33;
    else if (type === 'cryo') colorTint = 0x33ffff;
    else if (type === 'tesla') colorTint = 0xaa33ff;
    else if (type === 'scanner') colorTint = 0x33ffee;
    else if (type === 'programmer') colorTint = 0x3366ff;
    else if (type === 'smuggler') colorTint = 0xffd700;
    else if (type === 'thief') colorTint = 0xff8800;
    else if (type === 'infernus') colorTint = 0xff2222;

    const coreMat = new THREE.MeshStandardMaterial({ color: colorTint, roughness: 0.2, metalness: 0.8, emissive: colorTint, emissiveIntensity: 0.4 });

    if (type === 'gunner') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.2), coreMat);
      body.position.y = 1.0;
      group.add(body);

      const barrelGeom = new THREE.CylinderGeometry(0.15, 0.15, level === 3 ? 1.8 : 1.4, 8);
      barrelGeom.rotateX(Math.PI / 2);
      const barrel = new THREE.Mesh(barrelGeom, baseMat);
      barrel.position.set(level === 3 ? 0.2 : 0, 1.1, 0.8);
      group.add(barrel);
      if (level === 3) {
        const barrel2 = new THREE.Mesh(barrelGeom, baseMat);
        barrel2.position.set(-0.2, 1.1, 0.8);
        group.add(barrel2);
      }
    } else if (type === 'grenadier') {
      const mortar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 1.2, 12), coreMat);
      mortar.position.y = 1.2;
      mortar.rotation.x = 0.3;
      group.add(mortar);
    } else if (type === 'sniper') {
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.5, 8), coreMat);
      body.position.y = 1.3;
      group.add(body);
      const longBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8), baseMat);
      longBarrel.rotateX(Math.PI / 2);
      longBarrel.position.set(0, 1.6, 1.0);
      group.add(longBarrel);
    } else if (type === 'cryo') {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), coreMat);
      crystal.position.y = 1.3;
      group.add(crystal);
    } else if (type === 'tesla') {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.2, 8, 16), coreMat);
      coil.position.y = 1.2;
      coil.rotateX(Math.PI / 2);
      group.add(coil);
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 1.2, 8), baseMat);
      spire.position.y = 1.6;
      group.add(spire);
    } else if (type === 'scanner') {
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), coreMat);
      dish.position.y = 1.2;
      group.add(dish);
    } else if (type === 'programmer') {
      const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), coreMat);
      orb.position.y = 1.4;
      group.add(orb);
    } else if (type === 'smuggler') {
      const chest = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 0.8), coreMat);
      chest.position.y = 1.1;
      group.add(chest);
    } else if (type === 'thief') {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), coreMat);
      blade.position.y = 1.2;
      group.add(blade);
    } else if (type === 'infernus') {
      const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.5, 12), coreMat);
      emitter.position.y = 1.3;
      group.add(emitter);
    }

    return group;
  }
}
