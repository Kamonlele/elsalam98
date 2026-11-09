import { api } from './ui';

export type Uploaded = { url: string; width?: number; height?: number };

/** Lato lungo massimo della foto piena: abbastanza per uno schermo grande, molto meno di una foto da fotocamera. */
const MAX_SIDE = 2400;
/** Misure intermedie (le stesse di `WIDTHS` in lib/images.ts) e lato della miniatura sfocata. */
const SIDES = [1280, 640] as const;
const BLUR_SIDE = 24;

function draw(bmp: ImageBitmap, side: number): HTMLCanvasElement {
  // Mai ingrandita: se la foto è più piccola della misura, resta com'è.
  const scale = Math.min(1, side / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bmp.width * scale));
  canvas.height = Math.max(1, Math.round(bmp.height * scale));
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function encode(canvas: HTMLCanvasElement, webp: boolean): Promise<Blob | null> {
  return new Promise((r) => (webp ? canvas.toBlob(r, 'image/webp', 0.86) : canvas.toBlob(r, 'image/jpeg', 0.88)));
}

/**
 * Le foto si ridimensionano nel browser prima di partire: arrivano leggere e il sito
 * non dipende da servizi esterni. Proporzioni sempre intatte, niente ritagli.
 * Escono la piena, la 1280, la 640 e una miniatura sfocata, tutte nello stesso formato.
 */
async function shrink(file: File): Promise<{ blobs: Blob[]; width: number; height: number; ext: string; base: string }> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const canvases = [MAX_SIDE, ...SIDES, BLUR_SIDE].map((side) => draw(bmp, side));
  bmp.close();
  let blobs = await Promise.all(canvases.map((c) => encode(c, true)));
  // Alcuni browser non sanno scrivere WEBP: si ripiega su JPG per tutte, così il formato è uno solo.
  if (blobs.some((b) => !b || b.type !== 'image/webp')) blobs = await Promise.all(canvases.map((c) => encode(c, false)));
  if (blobs.some((b) => !b)) throw new Error('Non riesco a leggere questa foto. Prova con un JPG.');
  const ext = blobs[0]!.type === 'image/webp' ? 'webp' : 'jpg';
  return { blobs: blobs as Blob[], width: canvases[0].width, height: canvases[0].height, ext, base: file.name.replace(/\.[^.]+$/, '') };
}

export async function uploadImage(file: File): Promise<Uploaded> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Usa foto JPG, PNG o WEBP.');
  const { blobs, width, height, ext, base } = await shrink(file);
  const form = new FormData();
  form.append('kind', 'image');
  // Stessi nomi che si aspetta il server (PHOTO_PARTS in api/admin/upload.ts).
  ['full', '1280', '640', 'blur'].forEach((part, i) => form.append(part, new File([blobs[i]], `${base}.${ext}`, { type: blobs[i].type })));
  const res = await api<{ url: string }>('/api/admin/upload', { method: 'POST', body: form });
  return { url: res.url, width, height };
}

export async function uploadModel(file: File): Promise<Uploaded> {
  if (!/\.glb$/i.test(file.name)) throw new Error('Il modello deve essere un file .glb.');
  const form = new FormData();
  form.append('kind', 'model');
  form.append('file', file);
  return api<{ url: string }>('/api/admin/upload', { method: 'POST', body: form });
}

/** Il video parte così com'è (niente ricompressione nel browser), come corpo della richiesta. */
export async function uploadVideo(file: File): Promise<{ url: string }> {
  if (!/^video\/(mp4|webm)$/.test(file.type)) throw new Error('Usa un video MP4 o WEBM.');
  if (file.size > 90_000_000) throw new Error('Il video supera i 90 MB: accorcialo o comprimilo prima di caricarlo.');
  return api<{ url: string }>('/api/admin/upload?kind=video', {
    method: 'POST',
    body: file,
    headers: { 'content-type': file.type, 'x-file-name': encodeURIComponent(file.name) },
  });
}
