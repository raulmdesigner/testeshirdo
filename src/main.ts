import * as THREE from 'three';
import { GameState, TowerType, ActiveEnemy, TowerInstance, MapId, GameDifficulty, PlatformMode } from './types/gameTypes';
import { MAP_CATALOG, DIFFICULTY_SETTINGS } from './maps/MapCatalog';
import { ProceduralTextures } from './engine/ProceduralTextures';
import { FirstPersonPhysics } from './engine/FirstPersonPhysics';
import { SoundFX } from './audio/SoundFX';
import { TowerSystem, TOWER_CONFIGS } from './systems/TowerSystem';
import { EnemyWaveSystem, ENEMY_CONFIGS } from './systems/EnemyWaveSystem';
import { AuthAndHUD } from './ui/AuthAndHUD';

export class GameApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  
  private gameState: GameState;
  private ui: AuthAndHUD;
  private physics: FirstPersonPhysics | null = null;

  private towers: TowerInstance[] = [];
  private enemies: ActiveEnemy[] = [];
  private waveActive: boolean = false;
  private waveSpawnTimer: number = 0;
  private currentWaveEnemies: string[] = [];

  private terrainGroup: THREE.Group = new THREE.Group();
  private previewMesh: THREE.Group | null = null;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.clock = new THREE.Clock();

    this.gameState = {
      scene: 'auth',
      platform: 'desktop',
      selectedMap: 'amber_valley',
      selectedDifficulty: 'medium',
      gold: 500,
      lives: 20,
      wave: 0,
      maxWaves: 20,
      score: 0,
      selectedTowerType: null,
      selectedTowerInstance: null,
      activeSpells: {
        airStrikeCD: 0,
        overclockCD: 0,
        empCD: 0,
        overclockActiveTimer: 0,
        empActiveTimer: 0
      }
    };

    this.ui = new AuthAndHUD(
      (pw) => this.handleLogin(pw),
      (mapId) => { this.gameState.selectedMap = mapId; this.ui.render(this.gameState); },
      (diff) => { this.gameState.selectedDifficulty = diff; this.ui.render(this.gameState); },
      () => this.startGame(),
      (tType) => this.selectTowerType(tType),
      () => this.startNextWave(),
      (spell) => this.castSpell(spell),
      () => this.upgradeTower(),
      () => this.sellTower(),
      () => this.cancelSelection(),
      () => this.physics?.jump(),
      (dx, dy) => this.physics?.rotateCamera(dx, dy),
      (x, y) => this.physics?.setMoveInput(x, y)
    );

    this.ui.render(this.gameState);

    window.addEventListener('resize', () => this.onWindowResize());
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    this.animate();
  }

  private handleLogin(password: string): void {
    SoundFX.init();
    SoundFX.playUI('click');
    if (password === 'mobile') {
      this.gameState.platform = 'mobile';
      this.gameState.scene = 'lobby';
    } else if (password === 'desktop') {
      this.gameState.platform = 'desktop';
      this.gameState.scene = 'lobby';
    } else {
      alert('Senha incorreta! Use "mobile" ou "desktop".');
      return;
    }
    this.ui.render(this.gameState);
  }

  private startGame(): void {
    SoundFX.playUI('click');
    const diffSettings = DIFFICULTY_SETTINGS[this.gameState.selectedDifficulty];
    this.gameState.gold = diffSettings.startGold;
    this.gameState.lives = 20;
    this.gameState.wave = 0;
    this.gameState.maxWaves = this.gameState.selectedDifficulty === 'hard' ? 30 : this.gameState.selectedDifficulty === 'medium' ? 25 : 20;
    this.gameState.score = 0;
    this.gameState.scene = 'game';
    this.towers = [];
    this.enemies = [];
    this.waveActive = false;

    // Setup 3D map environment
    this.buildMapEnvironment();

    this.physics = new FirstPersonPhysics(this.camera);
    this.physics.enablePointerLock();

    this.ui.render(this.gameState);
  }

  private buildMapEnvironment(): void {
    // Clear old terrain
    this.scene.remove(this.terrainGroup);
    this.terrainGroup = new THREE.Group();

    const mapData = MAP_CATALOG[this.gameState.selectedMap];

    // Sky & Fog
    this.scene.background = new THREE.Color(mapData.skyColor);
    this.scene.fog = new THREE.FogExp2(mapData.skyColor, 0.015);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.terrainGroup.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(50, 80, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 250;
    const d = 60;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.terrainGroup.add(dirLight);

    // Ground base
    const groundMat = ProceduralTextures.createMaterial('grass');
    const groundGeom = new THREE.PlaneGeometry(300, 300, 32, 32);
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.terrainGroup.add(ground);

    // Path
    const pathMat = ProceduralTextures.createMaterial('dirt');
    const waypoints = mapData.waypoints;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = new THREE.Vector3(waypoints[i].x, waypoints[i].y, waypoints[i].z);
      const p2 = new THREE.Vector3(waypoints[i + 1].x, waypoints[i + 1].y, waypoints[i + 1].z);
      const dist = p1.distanceTo(p2);
      const pathGeom = new THREE.PlaneGeometry(6, dist);
      const pathMesh = new THREE.Mesh(pathGeom, pathMat);
      pathMesh.rotation.x = -Math.PI / 2;
      pathMesh.position.copy(p1).add(p2).multiplyScalar(0.5);
      pathMesh.position.y = 0.05;
      pathMesh.lookAt(p2.x, 0.05, p2.z);
      pathMesh.receiveShadow = true;
      this.terrainGroup.add(pathMesh);
    }

    // Valid Build Areas (High Ground & Normal Platforms)
    const stoneMat = ProceduralTextures.createMaterial('stone');
    for (const area of mapData.validBuildAreas) {
      const w = area.maxX - area.minX;
      const h = area.maxZ - area.minZ;
      const heightVal = area.isHighGround ? 4 : 0.5;
      const areaGeom = new THREE.BoxGeometry(w, heightVal, h);
      const areaMesh = new THREE.Mesh(areaGeom, stoneMat);
      const cx = (area.minX + area.maxX) / 2;
      const cz = (area.minZ + area.maxZ) / 2;
      areaMesh.position.set(cx, heightVal / 2, cz);
      areaMesh.receiveShadow = true;
      areaMesh.castShadow = true;
      this.terrainGroup.add(areaMesh);
    }

    this.scene.add(this.terrainGroup);
  }

  private selectTowerType(type: TowerType | null): void {
    this.gameState.selectedTowerType = type;
    this.gameState.selectedTowerInstance = null;

    if (this.previewMesh) {
      this.scene.remove(this.previewMesh);
      this.previewMesh = null;
    }

    if (type) {
      this.previewMesh = TowerSystem.createTowerMesh(type, 1);
      this.previewMesh.traverse((child) => {
        if ((child as THREE.Mesh).material) {
          const mat = ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).clone();
          mat.transparent = true;
          mat.opacity = 0.6;
          (child as THREE.Mesh).material = mat;
        }
      });
      this.scene.add(this.previewMesh);
    }

    this.ui.render(this.gameState);
  }

  private cancelSelection(): void {
    this.selectTowerType(null);
    this.gameState.selectedTowerInstance = null;
    this.ui.render(this.gameState);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.gameState.scene !== 'game') return;

    if (e.key === 'q' || e.key === 'Q') {
      this.cancelSelection();
    } else if (e.key === 'e' || e.key === 'E') {
      this.upgradeTower();
    } else if (e.key === 't' || e.key === 'T') {
      this.sellTower();
    } else if (e.key >= '1' && e.key <= '0') {
      // Number keys for tower selection
      const keys: TowerType[] = ['gunner', 'grenadier', 'sniper', 'cryo', 'tesla', 'scanner', 'programmer', 'smuggler', 'thief', 'infernus'];
      const idx = e.key === '0' ? 9 : parseInt(e.key) - 1;
      if (keys[idx]) {
        this.selectTowerType(keys[idx]);
      }
    } else if (e.key === ' ') {
      if (this.gameState.selectedTowerType && this.previewMesh) {
        this.placeTowerAtPreview();
      }
    }
  }

  private placeTowerAtPreview(): void {
    if (!this.gameState.selectedTowerType || !this.previewMesh) return;
    const config = TOWER_CONFIGS[this.gameState.selectedTowerType];
    if (this.gameState.gold < config.cost) {
      SoundFX.playUI('click');
      return;
    }

    const pos = this.previewMesh.position;
    // Check minimum distance from other towers
    for (const t of this.towers) {
      if (Math.hypot(t.x - pos.x, t.z - pos.z) < 2.5) {
        SoundFX.playUI('click');
        return;
      }
    }

    // Deduct gold
    this.gameState.gold -= config.cost;

    const mesh = TowerSystem.createTowerMesh(this.gameState.selectedTowerType, 1);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    const newInstance: TowerInstance = {
      id: 't_' + Math.random().toString(36).substr(2, 9),
      type: this.gameState.selectedTowerType,
      level: 1,
      x: pos.x,
      z: pos.z,
      mesh,
      lastShotTime: 0,
      kills: 0,
      damageDealt: 0
    };

    this.towers.push(newInstance);
    SoundFX.playUpgrade();
    this.cancelSelection();
    this.ui.render(this.gameState);
  }

  private upgradeTower(): void {
    const t = this.gameState.selectedTowerInstance;
    if (!t) return;
    const config = TOWER_CONFIGS[t.type];
    if (t.level >= 3) return;
    const upgradeCost = config.upgradeCosts[t.level - 1];
    if (this.gameState.gold < upgradeCost) {
      SoundFX.playUI('click');
      return;
    }

    this.gameState.gold -= upgradeCost;
    t.level += 1;

    this.scene.remove(t.mesh);
    const newMesh = TowerSystem.createTowerMesh(t.type, t.level);
    newMesh.position.set(t.x, t.mesh.position.y, t.z);
    this.scene.add(newMesh);
    t.mesh = newMesh;

    SoundFX.playUpgrade();
    this.ui.render(this.gameState);
  }

  private sellTower(): void {
    const t = this.gameState.selectedTowerInstance;
    if (!t) return;
    const config = TOWER_CONFIGS[t.type];
    let refund = config.cost * 0.7;
    if (t.level === 2) refund += config.upgradeCosts[0] * 0.7;
    if (t.level === 3) refund += (config.upgradeCosts[0] + config.upgradeCosts[1]) * 0.7;

    this.gameState.gold += Math.floor(refund);
    this.scene.remove(t.mesh);
    this.towers = this.towers.filter(item => item.id !== t.id);
    this.gameState.selectedTowerInstance = null;

    SoundFX.playUI('sell');
    this.ui.render(this.gameState);
  }

  private startNextWave(): void {
    if (this.waveActive) return;
    if (this.gameState.wave >= this.gameState.maxWaves) return;

    this.gameState.wave += 1;
    this.waveActive = true;
    const diffMult = DIFFICULTY_SETTINGS[this.gameState.selectedDifficulty].hpMultiplier;
    this.currentWaveEnemies = EnemyWaveSystem.generateWave(this.gameState.wave, diffMult);
    this.waveSpawnTimer = 0;

    SoundFX.playUI('wave');
    this.ui.render(this.gameState);
  }

  private castSpell(spell: 'airStrike' | 'overclock' | 'emp'): void {
    if (spell === 'airStrike' && this.gameState.activeSpells.airStrikeCD <= 0 && this.gameState.gold >= 800) {
      this.gameState.gold -= 800;
      this.gameState.activeSpells.airStrikeCD = 30;
      SoundFX.playExplosion();
      for (const en of this.enemies) {
        en.currentHp -= 500;
      }
    } else if (spell === 'overclock' && this.gameState.activeSpells.overclockCD <= 0 && this.gameState.gold >= 600) {
      this.gameState.gold -= 600;
      this.gameState.activeSpells.overclockCD = 45;
      this.gameState.activeSpells.overclockActiveTimer = 10;
      SoundFX.playUI('upgrade');
    } else if (spell === 'emp' && this.gameState.activeSpells.empCD <= 0 && this.gameState.gold >= 400) {
      this.gameState.gold -= 400;
      this.gameState.activeSpells.empCD = 40;
      this.gameState.activeSpells.empActiveTimer = 8;
      for (const en of this.enemies) {
        en.revealed = true;
        en.slowTimer = 8;
      }
      SoundFX.playUI('wave');
    }
    this.ui.render(this.gameState);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    if (this.gameState.scene === 'game') {
      const mapData = MAP_CATALOG[this.gameState.selectedMap];
      if (this.physics) {
        this.physics.update(delta, mapData.validBuildAreas);
      }

      if (this.previewMesh) {
        const forward = new THREE.Vector3(0, 0, -5).applyQuaternion(this.camera.quaternion);
        const testX = this.camera.position.x + forward.x;
        const testZ = this.camera.position.z + forward.z;
        let groundH = 0;
        for (const area of mapData.validBuildAreas) {
          if (testX >= area.minX && testX <= area.maxX && testZ >= area.minZ && testZ <= area.maxZ) {
            groundH = area.isHighGround ? 4 : 0;
            break;
          }
        }
        this.previewMesh.position.set(testX, groundH, testZ);
      }

      if (this.gameState.activeSpells.airStrikeCD > 0) this.gameState.activeSpells.airStrikeCD -= delta;
      if (this.gameState.activeSpells.overclockCD > 0) this.gameState.activeSpells.overclockCD -= delta;
      if (this.gameState.activeSpells.empCD > 0) this.gameState.activeSpells.empCD -= delta;
      if (this.gameState.activeSpells.overclockActiveTimer > 0) this.gameState.activeSpells.overclockActiveTimer -= delta;
      if (this.gameState.activeSpells.empActiveTimer > 0) this.gameState.activeSpells.empActiveTimer -= delta;

      if (this.waveActive && this.currentWaveEnemies.length > 0) {
        this.waveSpawnTimer += delta;
        if (this.waveSpawnTimer >= 1.2) {
          this.waveSpawnTimer = 0;
          const eType = this.currentWaveEnemies.shift()!;
          const config = ENEMY_CONFIGS[eType as keyof typeof ENEMY_CONFIGS];
          const diffMult = DIFFICULTY_SETTINGS[this.gameState.selectedDifficulty].hpMultiplier;
          const mesh = EnemyWaveSystem.createEnemyMesh(config);
          const startWp = mapData.waypoints[0];
          mesh.position.set(startWp.x, startWp.y, startWp.z);
          this.scene.add(mesh);

          const newEnemy: ActiveEnemy = {
            id: 'e_' + Math.random().toString(36).substr(2, 9),
            type: config.type,
            config,
            currentHp: config.hp * diffMult,
            maxHp: config.hp * diffMult,
            speed: config.speed,
            armor: config.armor,
            isCloaked: config.isCloaked,
            revealed: false,
            slowTimer: 0,
            stunTimer: 0,
            burnTimer: 0,
            burnDamage: 0,
            pathIndex: 0,
            pathProgress: 0,
            mesh,
            hpBarMesh: null,
            frozen: false
          };

          this.enemies.push(newEnemy);
        }
      } else if (this.waveActive && this.currentWaveEnemies.length === 0 && this.enemies.length === 0) {
        this.waveActive = false;
        this.gameState.gold += 150 + this.gameState.wave * 25;
        SoundFX.playUI('wave');
        if (this.gameState.wave >= this.gameState.maxWaves) {
          this.gameState.scene = 'victory';
        }
        this.ui.render(this.gameState);
      }

      const waypoints = mapData.waypoints;
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const en = this.enemies[i];
        if (en.currentHp <= 0) {
          this.scene.remove(en.mesh);
          this.enemies.splice(i, 1);
          this.gameState.gold += en.config.reward;
          this.gameState.score += en.config.reward * 2;
          this.ui.render(this.gameState);
          continue;
        }

        if (en.pathIndex < waypoints.length - 1) {
          const p1 = waypoints[en.pathIndex];
          const p2 = waypoints[en.pathIndex + 1];
          const targetPos = new THREE.Vector3(p2.x, p2.y, p2.z);
          const currentPos = en.mesh.position;

          const dir = targetPos.clone().sub(currentPos).normalize();
          let currentSpeed = en.speed;
          if (en.slowTimer > 0) {
            currentSpeed *= 0.6;
            en.slowTimer -= delta;
          }
          if (this.gameState.activeSpells.empActiveTimer > 0) {
            currentSpeed *= 0.5;
          }

          currentPos.addScaledVector(dir, currentSpeed * delta);
          en.mesh.lookAt(targetPos);

          if (currentPos.distanceTo(targetPos) < 0.5) {
            en.pathIndex += 1;
          }
        } else {
          this.scene.remove(en.mesh);
          this.enemies.splice(i, 1);
          this.gameState.lives -= 1;
          SoundFX.playUI('click');
          if (this.gameState.lives <= 0) {
            this.gameState.scene = 'gameover';
          }
          this.ui.render(this.gameState);
        }
      }

      const now = this.clock.getElapsedTime();
      for (const t of this.towers) {
        const config = TOWER_CONFIGS[t.type];
        let fireInterval = 1 / config.fireRate;
        if (this.gameState.activeSpells.overclockActiveTimer > 0) {
          fireInterval *= 0.66;
        }

        if (now - t.lastShotTime >= fireInterval) {
          let bestTarget: ActiveEnemy | null = null;
          let minDist = 999;

          for (const en of this.enemies) {
            if (en.isCloaked && !en.revealed && t.level < 3 && t.type !== 'scanner') continue;
            const dist = Math.hypot(t.x - en.mesh.position.x, t.z - en.mesh.position.z);
            if (dist <= config.range && dist < minDist) {
              minDist = dist;
              bestTarget = en;
            }
          }

          if (bestTarget) {
            t.lastShotTime = now;
            SoundFX.playShoot(t.type as any);
            
            let dmg = config.damage * (1 + (t.level - 1) * 0.4);
            if (bestTarget.armor > 0 && t.type !== 'tesla' && t.type !== 'infernus') {
              dmg *= (1 - bestTarget.armor);
            }

            bestTarget.currentHp -= dmg;
            t.damageDealt += dmg;

            if (bestTarget.currentHp <= 0) {
              t.kills += 1;
            }
          }
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  };
}

new GameApp();
