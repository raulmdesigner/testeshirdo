import * as THREE from 'three';

export class ProceduralTextures {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();

  public static getGrassTexture(): THREE.CanvasTexture {
    const key = 'grass';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#2e5a27';
    ctx.fillRect(0, 0, 256, 256);

    // Voxel / low poly grass noise
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = 2 + Math.random() * 4;
      ctx.fillStyle = Math.random() > 0.5 ? '#3b7532' : '#23471e';
      ctx.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    this.cache.set(key, texture);
    return texture;
  }

  public static getPathTexture(): THREE.CanvasTexture {
    const key = 'path';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#6b533a';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = 1 + Math.random() * 3;
      ctx.fillStyle = Math.random() > 0.5 ? '#826447' : '#54402a';
      ctx.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 40);
    this.cache.set(key, texture);
    return texture;
  }

  public static getStoneTexture(): THREE.CanvasTexture {
    const key = 'stone';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#4a4e59';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const w = 10 + Math.random() * 30;
      const h = 5 + Math.random() * 15;
      ctx.fillStyle = Math.random() > 0.5 ? '#5c616e' : '#393c45';
      ctx.fillRect(x, y, w, h);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 5);
    this.cache.set(key, texture);
    return texture;
  }

  public static getMetalTexture(): THREE.CanvasTexture {
    const key = 'metal';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#2b303c';
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = '#3d4454';
    ctx.lineWidth = 2;
    for (let i = 0; i < 128; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 128);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(128, i);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.cache.set(key, texture);
    return texture;
  }

  public static createMaterial(type: 'grass' | 'path' | 'stone' | 'metal' | 'grid', colorOverride?: number): THREE.MeshStandardMaterial {
    if (type === 'grass') {
      return new THREE.MeshStandardMaterial({
        map: this.getGrassTexture(),
        roughness: 0.8,
        metalness: 0.1,
        color: colorOverride ?? 0xffffff
      });
    } else if (type === 'path') {
      return new THREE.MeshStandardMaterial({
        map: this.getPathTexture(),
        roughness: 0.9,
        metalness: 0.0,
        color: colorOverride ?? 0xffffff
      });
    } else if (type === 'stone') {
      return new THREE.MeshStandardMaterial({
        map: this.getStoneTexture(),
        roughness: 0.6,
        metalness: 0.2,
        color: colorOverride ?? 0xffffff
      });
    } else if (type === 'metal') {
      return new THREE.MeshStandardMaterial({
        map: this.getMetalTexture(),
        roughness: 0.3,
        metalness: 0.8,
        color: colorOverride ?? 0xffffff
      });
    } else {
      return new THREE.MeshStandardMaterial({
        color: colorOverride ?? 0x3388ff,
        roughness: 0.2,
        metalness: 0.5,
        wireframe: true
      });
    }
  }
}
