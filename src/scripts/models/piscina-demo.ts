import type * as THREE_NS from 'three';
import type { Keyframe, SceneModel } from '../scene-types';

type Three = typeof THREE_NS;

/**
 * Modello dimostrativo del kit: una piscina fuoriterra in doghe di legno, costruita
 * in codice. Serve a mostrare la scena finché il cliente non ha il suo file .glb.
 */
export function piscinaDemo(THREE: Three): SceneModel {
  const group = new THREE.Group();

  function rand(seed: number) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  // Venatura disegnata su canvas, così la pagina non scarica texture.
  function woodTexture(seed: number) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 64;
    const g = c.getContext('2d')!;
    const r = rand(seed * 977 + 13);
    const base = 150 + Math.floor(r() * 30);
    g.fillStyle = `rgb(${base + 40}, ${base - 10}, ${base - 62})`;
    g.fillRect(0, 0, 1024, 64);
    for (let i = 0; i < 38; i++) {
      const y = r() * 64, amp = 1 + r() * 4, freq = 0.004 + r() * 0.01, ph = r() * 6;
      g.strokeStyle = `rgba(${70 + r() * 30}, ${40 + r() * 20}, 20, ${0.08 + r() * 0.22})`;
      g.lineWidth = 0.6 + r() * 1.6;
      g.beginPath();
      for (let x = 0; x <= 1024; x += 16) g.lineTo(x, y + Math.sin(x * freq + ph) * amp);
      g.stroke();
    }
    for (let k = 0; k < 2; k++) {
      const kx = r() * 1024, ky = 12 + r() * 40;
      const grd = g.createRadialGradient(kx, ky, 0, kx, ky, 9);
      grd.addColorStop(0, 'rgba(70,38,18,0.75)'); grd.addColorStop(1, 'rgba(70,38,18,0)');
      g.fillStyle = grd; g.beginPath(); g.ellipse(kx, ky, 12, 6, 0, 0, Math.PI * 2); g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  const woodMats = [1, 2, 3, 4, 5].map((s) => new THREE.MeshStandardMaterial({ map: woodTexture(s), roughness: 0.82 }));
  const postMat = new THREE.MeshStandardMaterial({ map: woodTexture(9), roughness: 0.85, color: 0xc9b39c });

  const L = 6.0, W = 3.5, T = 0.07, BH = 0.145, GAP = 0.008, N = 8;
  const H = N * (BH + GAP);
  let mi = 0;
  function board(w: number, h: number, d: number, x: number, y: number, z: number, mat?: THREE_NS.Material) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat ?? woodMats[mi++ % woodMats.length]);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    group.add(m);
  }
  for (let i = 0; i < N; i++) {
    const y = i * (BH + GAP) + BH / 2;
    board(L, BH, T, 0, y, W / 2); board(L, BH, T, 0, y, -W / 2);
    board(T, BH, W, L / 2, y, 0); board(T, BH, W, -L / 2, y, 0);
  }
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) board(0.16, H + 0.01, 0.16, sx * L / 2, (H + 0.01) / 2, sz * W / 2, postMat);
  board(L + 0.5, 0.05, 0.3, 0, H + 0.025, W / 2 + 0.05);
  board(L + 0.5, 0.05, 0.3, 0, H + 0.025, -W / 2 - 0.05);
  board(0.3, 0.05, W + 0.1, L / 2 + 0.05, H + 0.025, 0);
  board(0.3, 0.05, W + 0.1, -L / 2 - 0.05, H + 0.025, 0);
  for (let k = 1; k <= 3; k++) {
    const h = k * (H / 3);
    board(0.9, h, 0.34, 1.7, h / 2, W / 2 + T / 2 + 0.17 + 0.34 * (3 - k));
  }
  const liner = new THREE.Mesh(new THREE.BoxGeometry(L - T, H - 0.04, W - T),
    new THREE.MeshStandardMaterial({ color: 0x2a8fae, roughness: 0.6, side: THREE.BackSide }));
  liner.position.y = (H - 0.04) / 2; liner.receiveShadow = true; group.add(liner);

  const waterGeo = new THREE.PlaneGeometry(L - T - 0.01, W - T - 0.01, 48, 28);
  waterGeo.rotateX(-Math.PI / 2);
  const base = Float32Array.from(waterGeo.attributes.position.array);
  const water = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({ color: 0x58c6d6, roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.86 }));
  water.position.y = H - 0.1; water.receiveShadow = true; group.add(water);

  const slab = new THREE.Mesh(new THREE.BoxGeometry(L + 1.4, 0.08, W + 2.4), new THREE.MeshStandardMaterial({ color: 0xb9beba, roughness: 0.95 }));
  slab.position.set(0, -0.04, 0.4); slab.receiveShadow = true; group.add(slab);

  const pos = waterGeo.attributes.position;
  function animate(time: number) {
    for (let v = 0; v < pos.count; v++) {
      const x = base[v * 3], z = base[v * 3 + 2];
      pos.array[v * 3 + 1] = Math.sin(x * 2.1 + time * 1.4) * 0.012 + Math.cos(z * 2.7 + time * 1.1) * 0.01;
    }
    pos.needsUpdate = true;
    waterGeo.computeVertexNormals();
  }

  // Forma, legno, acqua, bordo, giardino al tramonto.
  const keyframes: Keyframe[] = [
    { pos: [8.2, 5.6, 9.4], tgt: [0, 0.45, 0.2], fov: 32, ground: 0x7b8582, sun: 0xfff4e0, sunI: 1.6, hemiI: 0.8 },
    { pos: [0.9, 0.85, 4.6], tgt: [-1.1, 0.62, 1.75], fov: 30, ground: 0x7b8582, sun: 0xfff4e0, sunI: 1.7, hemiI: 0.8 },
    { pos: [0.4, 7.4, 1.6], tgt: [0.1, 0.9, 0], fov: 34, ground: 0x7b8582, sun: 0xffffff, sunI: 1.8, hemiI: 0.9 },
    { pos: [-4.6, 1.75, 3.0], tgt: [-2.4, 1.25, 1.4], fov: 30, ground: 0x6f7d6a, sun: 0xffe7c4, sunI: 1.6, hemiI: 0.8 },
    { pos: [11.5, 7.2, 12.5], tgt: [-0.3, 0.3, 0.3], fov: 32, ground: 0x51704a, sun: 0xffc58a, sunI: 1.35, hemiI: 0.7 },
  ];

  return { object: group, keyframes, animate };
}
