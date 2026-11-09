import type { Object3D } from 'three';

/** Un'inquadratura della scena 3D: posizione della camera, punto guardato e luce. */
export type Keyframe = {
  pos: [number, number, number];
  tgt: [number, number, number];
  fov: number;
  ground: number;
  sun: number;
  sunI: number;
  hemiI: number;
};

export type SceneModel = {
  object: Object3D;
  /** Se manca, le inquadrature si calcolano dalle dimensioni del modello. */
  keyframes?: Keyframe[];
  animate?: (time: number) => void;
};
