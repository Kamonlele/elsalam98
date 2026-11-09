import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Keyframe, SceneModel } from './scene-types';

/**
 * Scena prodotto.
 * Desktop: la scena resta ferma e lo scroll fa avanzare le tappe (testo e inquadratura).
 * Telefono: niente scroll agganciato; il prodotto resta in alto e la tappa che arriva
 * a metà schermo decide l'inquadratura.
 * Movimento ridotto: tutto in colonna, nessuna animazione.
 */
export function initScene(root: HTMLElement) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) document.documentElement.classList.add('rm');
  const narrow = matchMedia('(max-width: 860px)');
  const stages = Array.from(root.querySelectorAll<HTMLElement>('.stage'));
  const marks = Array.from(root.querySelectorAll<HTMLElement>('.progress span'));
  const LAST = Math.max(stages.length - 1, 1);

  let target = 0;
  let p = 0;
  let lastMark = -1;
  let visible = true;
  let paint: (p: number, time: number) => void = () => {};
  let onResize: () => void = () => {};

  if (!reduce) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      trigger: root, start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => { if (!narrow.matches) target = self.progress * LAST; },
    });
  }

  const stageIO = new IntersectionObserver((entries) => {
    if (!narrow.matches) return;
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const i = Number((e.target as HTMLElement).dataset.i);
      target = i;
      stages.forEach((el, k) => el.classList.toggle('on', k === i));
    }
  }, { rootMargin: '-55% 0px -30% 0px' });
  stages.forEach((el) => stageIO.observe(el));

  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(root);

  function updateText() {
    stages.forEach((el, i) => {
      const d = p - i;
      const o = Math.max(0, Math.min(1, 1 - Math.abs(d) * 2.2));
      el.style.opacity = String(o);
      el.style.transform = `translateY(calc(-50% + ${(-d * 40).toFixed(1)}px))`;
      el.classList.toggle('live', o > 0.5);
    });
    const m = Math.round(p);
    if (m !== lastMark) {
      marks.forEach((s, i) => s.classList.toggle('on', i === m));
      lastMark = m;
    }
  }

  function onMode() {
    if (narrow.matches || reduce) {
      stages.forEach((el, k) => {
        el.style.opacity = '';
        el.style.transform = '';
        el.classList.add('live');
        el.classList.toggle('on', k === Math.round(target));
      });
    }
    onResize();
    ScrollTrigger.refresh();
  }
  narrow.addEventListener('change', onMode);

  function frame(now: number) {
    requestAnimationFrame(frame);
    if (!visible) return;
    if (!reduce) {
      p += (target - p) * 0.085;
      if (Math.abs(target - p) < 0.0005) p = target;
      if (!narrow.matches) updateText();
    }
    paint(p, now * 0.001);
  }

  const mode = root.dataset.mode;
  if (mode === 'photo') {
    const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('.photo-frame img'));
    paint = (pp) => {
      imgs.forEach((im, i) => {
        const d = pp - i;
        const o = Math.max(0, Math.min(1, 1 - Math.abs(d) * 1.4));
        // La foto entra appena più piccola e si assesta: mai oltre la sua misura, quindi mai tagliata.
        const sc = 0.96 + 0.04 * Math.max(0, Math.min(1, 1 - Math.abs(d)));
        im.style.opacity = String(o);
        im.style.transform = `scale(${sc.toFixed(4)})`;
      });
    };
    onMode();
    requestAnimationFrame(frame);
  } else {
    const canvas = root.querySelector<HTMLCanvasElement>('#scene-canvas');
    if (!canvas) return;
    setup3d(canvas, root.dataset.model ?? '', reduce).then((s) => {
      if (!s) return;
      paint = (pp, time) => s.render((pp / LAST) * (s.frames - 1), reduce ? 0 : time);
      onResize = s.resize;
      onMode();
      requestAnimationFrame(frame);
    });
    onMode();
  }
}

async function setup3d(canvas: HTMLCanvasElement, modelRef: string, reduce: boolean) {
  const THREE = await import('three');
  let renderer: InstanceType<typeof THREE.WebGLRenderer>;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    canvas.hidden = true;
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
  const hemi = new THREE.HemisphereLight(0xe4f2ff, 0x2b3a30, 0.8);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  let model: SceneModel;
  if (modelRef === 'demo:piscina') {
    const { piscinaDemo } = await import('./models/piscina-demo');
    model = piscinaDemo(THREE);
  } else {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const gltf = await new GLTFLoader().loadAsync(modelRef);
    gltf.scene.traverse((o) => {
      const m = o as InstanceType<typeof THREE.Mesh>;
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
    });
    model = { object: gltf.scene };
  }
  scene.add(model.object);

  // Dimensioni del prodotto: servono per ombre, terreno e inquadrature automatiche.
  const box = new THREE.Box3().setFromObject(model.object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const R = Math.max(size.x, size.y, size.z);
  sun.position.set(center.x + R, center.y + R * 1.6, center.z + R * 0.8);
  sun.target.position.copy(center);
  scene.add(sun.target);
  Object.assign(sun.shadow.camera, { left: -R * 1.5, right: R * 1.5, top: R * 1.5, bottom: -R * 1.5, near: 0.1, far: R * 6 });

  // Terreno che sfuma nel colore della pagina.
  const fade = document.createElement('canvas');
  fade.width = fade.height = 256;
  const fg = fade.getContext('2d')!;
  const rg = fg.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, '#fff'); rg.addColorStop(0.55, '#fff'); rg.addColorStop(1, '#000');
  fg.fillStyle = rg; fg.fillRect(0, 0, 256, 256);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x7b8582, roughness: 1, transparent: true, alphaMap: new THREE.CanvasTexture(fade) });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(R * 3.6, 64), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(center.x, box.min.y - 0.081, center.z);
  ground.receiveShadow = true;
  scene.add(ground);

  const K: Keyframe[] = model.keyframes ?? autoKeyframes(center, size);

  const cA = new THREE.Color(), cB = new THREE.Color(), tgt = new THREE.Vector3();
  const ease = (x: number) => x * x * (3 - 2 * x);
  function apply(k: number) {
    const i = Math.min(Math.floor(k), K.length - 2);
    const t = ease(Math.min(Math.max(k - i, 0), 1));
    const a = K[i], b = K[i + 1] ?? K[i];
    const mix = (x: number, y: number) => x + (y - x) * t;
    camera.position.set(mix(a.pos[0], b.pos[0]), mix(a.pos[1], b.pos[1]), mix(a.pos[2], b.pos[2]));
    tgt.set(mix(a.tgt[0], b.tgt[0]), mix(a.tgt[1], b.tgt[1]), mix(a.tgt[2], b.tgt[2]));
    camera.lookAt(tgt);
    camera.fov = mix(a.fov, b.fov);
    camera.updateProjectionMatrix();
    groundMat.color.copy(cA.set(a.ground).lerp(cB.set(b.ground), t));
    sun.color.copy(cA.set(a.sun).lerp(cB.set(b.sun), t));
    sun.intensity = mix(a.sunI, b.sunI) * Math.PI;
    hemi.intensity = mix(a.hemiI, b.hemiI) * Math.PI;
  }

  // Su desktop il prodotto sta a destra del testo, su telefono è centrato.
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (w > 860) camera.setViewOffset(w, h, -w * 0.17, 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  return {
    frames: K.length,
    resize,
    render(k: number, time: number) {
      if (time && model.animate && !reduce) model.animate(time);
      apply(k);
      renderer.render(scene, camera);
    },
  };
}

/** Inquadrature generiche per un modello caricato: tre quarti, dettaglio, dall'alto, lato opposto, campo largo. */
function autoKeyframes(c: { x: number; y: number; z: number }, s: { x: number; y: number; z: number }): Keyframe[] {
  const R = Math.max(s.x, s.y, s.z);
  const base = { ground: 0x7b8582, sun: 0xfff4e0, sunI: 1.6, hemiI: 0.8 };
  return [
    { ...base, pos: [c.x + R * 1.3, c.y + R * 0.9, c.z + R * 1.5], tgt: [c.x, c.y, c.z], fov: 32 },
    { ...base, pos: [c.x + R * 0.2, c.y + s.y * 0.1, c.z + R * 0.75], tgt: [c.x - s.x * 0.2, c.y, c.z + s.z * 0.5], fov: 30 },
    { ...base, pos: [c.x, c.y + R * 1.4, c.z + R * 0.25], tgt: [c.x, c.y, c.z], fov: 34, sun: 0xffffff, sunI: 1.8 },
    { ...base, pos: [c.x - R * 0.8, c.y + s.y * 0.6, c.z + R * 0.5], tgt: [c.x - s.x * 0.4, c.y + s.y * 0.4, c.z + s.z * 0.3], fov: 30 },
    { ...base, pos: [c.x + R * 2, c.y + R * 1.2, c.z + R * 2.2], tgt: [c.x, c.y, c.z], fov: 32, ground: 0x51704a, sun: 0xffc58a, sunI: 1.35 },
  ];
}
