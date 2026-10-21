import * as THREE from 'three';
import { PlatformMode } from '../types/gameTypes';

export class FirstPersonPhysics {
  public camera: THREE.PerspectiveCamera;
  public scene: THREE.Scene;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public rotation: { yaw: number; pitch: number };
  
  private isGrounded: boolean = false;
  private moveState = { forward: false, backward: false, left: false, right: false, sprint: false };
  private keys: { [key: string]: boolean } = {};
  private platform: PlatformMode;
  private domElement: HTMLElement;
  
  // Mobile touch movement state
  private touchMove = { x: 0, y: 0 };
  private touchLook = { x: 0, y: 0 };
  private isPointerLocked: boolean = false;

  constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene, platform: PlatformMode, domElement: HTMLElement) {
    this.camera = camera;
    this.scene = scene;
    this.platform = platform;
    this.domElement = domElement;

    this.position = new THREE.Vector3(0, 3, 20);
    this.velocity = new THREE.Vector3();
    this.rotation = { yaw: 0, pitch: 0 };

    if (this.platform === 'desktop') {
      this.initDesktopListeners();
    } else {
      this.initMobileListeners();
    }
  }

  private initDesktopListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space' && this.isGrounded) {
        this.velocity.y = 8;
        this.isGrounded = false;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.domElement.addEventListener('click', () => {
      if (!this.isPointerLocked && document.pointerLockElement !== this.domElement) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;
      const sensitivity = 0.002;
      this.rotation.yaw -= e.movementX * sensitivity;
      this.rotation.pitch -= e.movementY * sensitivity;
      const maxPitch = Math.PI / 2 - 0.05;
      this.rotation.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.rotation.pitch));
    });
  }

  private initMobileListeners(): void {
    // Touch controls are managed via AuthAndHUD virtual joysticks
  }

  public setTouchMove(x: number, y: number): void {
    this.touchMove.x = x;
    this.touchMove.y = y;
  }

  public setTouchLook(dx: number, dy: number): void {
    const sensitivity = 0.005;
    this.rotation.yaw -= dx * sensitivity;
    this.rotation.pitch -= dy * sensitivity;
    const maxPitch = Math.PI / 2 - 0.05;
    this.rotation.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.rotation.pitch));
  }

  public update(delta: number, validBuildAreas: { minX: number; maxX: number; minZ: number; maxZ: number; isHighGround?: boolean }[]): void {
    const speed = (this.keys['ShiftLeft'] || this.keys['ShiftRight']) ? 12 : 7;

    let moveDir = new THREE.Vector3();
    
    if (this.platform === 'desktop') {
      let forward = 0;
      let side = 0;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) forward += 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) forward -= 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) side -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) side += 1;

      const forwardVec = new THREE.Vector3(-Math.sin(this.rotation.yaw), 0, -Math.cos(this.rotation.yaw));
      const sideVec = new THREE.Vector3(Math.cos(this.rotation.yaw), 0, -Math.sin(this.rotation.yaw));

      moveDir.addScaledVector(forwardVec, forward);
      moveDir.addScaledVector(sideVec, side);
    } else {
      // Mobile joystick
      const forwardVec = new THREE.Vector3(-Math.sin(this.rotation.yaw), 0, -Math.cos(this.rotation.yaw));
      const sideVec = new THREE.Vector3(Math.cos(this.rotation.yaw), 0, -Math.sin(this.rotation.yaw));
      moveDir.addScaledVector(forwardVec, this.touchMove.y);
      moveDir.addScaledVector(sideVec, this.touchMove.x);
    }

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    this.velocity.x = moveDir.x * speed;
    this.velocity.z = moveDir.z * speed;

    // Gravity & Vertical
    this.velocity.y -= 25 * delta;
    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;
    this.position.y += this.velocity.y * delta;

    // Ground check & platforms height
    let groundHeight = 2; // base ground height
    for (const area of validBuildAreas) {
      if (area.isHighGround && 
          this.position.x >= area.minX && this.position.x <= area.maxX && 
          this.position.z >= area.minZ && this.position.z <= area.maxZ) {
        groundHeight = 6; // high ground platform height
        break;
      }
    }

    if (this.position.y <= groundHeight) {
      this.position.y = groundHeight;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // Boundary clamp
    this.position.x = Math.max(-60, Math.min(60, this.position.x));
    this.position.z = Math.max(-60, Math.min(60, this.position.z));

    // Update camera matrix & position
    this.camera.position.copy(this.position);

    const euler = new THREE.Euler(this.rotation.pitch, this.rotation.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }
}
