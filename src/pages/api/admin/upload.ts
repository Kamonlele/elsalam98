import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const KINDS = {
  model: { types: new Set(['model/gltf-binary', 'application/octet-stream', '']), max: 40_000_000, dir: 'modelli', label: 'un file .glb fino a 40 MB' },
} as const;

/** Le foto arrivano già ridimensionate dal browser: una per misura, tutte nello stesso formato. */
const PHOTO_PARTS = ['full', '1280', '640', 'blur'] as const;
const PHOTO_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const PHOTO_MAX = 12_000_000;

const VIDEO: Record<string, string> = { 'video/mp4': 'mp4', 'video/webm': 'webm' };
const VIDEO_MAX = 90_000_000;

/**
 * Il video arriva come corpo nudo della richiesta (non in un modulo) e va dritto
 * nello spazio file: leggere 90 MB di modulo in memoria supererebbe il limite dei Workers.
 */
async function putVideo(request: Request): Promise<Response> {
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const size = Number(request.headers.get('content-length') ?? '');
  const ext = Object.hasOwn(VIDEO, type) ? VIDEO[type] : undefined;
  if (!ext || !request.body || !(size > 0) || size > VIDEO_MAX) {
    return Response.json({ error: 'Usa un video MP4 o WEBM fino a 90 MB.' }, { status: 400 });
  }
  if (!env.MEDIA) return Response.json({ error: 'Spazio file non configurato (MEDIA in wrangler.jsonc).' }, { status: 500 });
  const key = `video/${crypto.randomUUID()}.${ext}`;
  let name = request.headers.get('x-file-name') ?? '';
  try { name = decodeURIComponent(name); } catch { /* nome illeggibile: si tiene com'è */ }
  name = name.slice(0, 200);
  try {
    await env.MEDIA.put(key, request.body, { httpMetadata: { contentType: type }, customMetadata: { name } });
  } catch {
    return Response.json({ error: 'Il video non è arrivato per intero. Controlla la connessione e riprova.' }, { status: 502 });
  }
  return Response.json({ url: `/media/${key}` });
}

/** Salva le quattro misure di una foto sotto lo stesso nome e risponde con l'indirizzo della piena. */
async function putPhoto(form: FormData): Promise<Response> {
  const files = PHOTO_PARTS.map((part) => form.get(part));
  const first = files[0];
  const ext = first instanceof File && Object.hasOwn(PHOTO_TYPES, first.type) ? PHOTO_TYPES[first.type] : undefined;
  const ok = ext && files.every((f) => f instanceof File && f.type === (first as File).type && f.size > 0 && f.size <= PHOTO_MAX);
  if (!ok) return Response.json({ error: 'Foto non valida: servono le quattro misure in WEBP o JPG, fino a 12 MB ciascuna.' }, { status: 400 });
  if (!env.MEDIA) return Response.json({ error: 'Spazio file non configurato (MEDIA in wrangler.jsonc).' }, { status: 500 });
  const id = crypto.randomUUID();
  const name = (first as File).name.slice(0, 200);
  try {
    await Promise.all(PHOTO_PARTS.map((part, i) => {
      const f = files[i] as File;
      return env.MEDIA.put(`img/${id}/${part}.${ext}`, f.stream(), { httpMetadata: { contentType: f.type }, customMetadata: { name } });
    }));
  } catch {
    return Response.json({ error: 'Il file non si è salvato. Riprova fra poco.' }, { status: 502 });
  }
  return Response.json({ url: `/media/img/${id}/full.${ext}` });
}

/** Carica una foto (in più misure), un modello 3D o un video nello spazio file del sito (R2). */
export const POST: APIRoute = async ({ request, url }) => {
  if (url.searchParams.get('kind') === 'video') return putVideo(request);
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (form?.get('kind') !== 'model') return form ? putPhoto(form) : Response.json({ error: 'Nessun file ricevuto.' }, { status: 400 });
  const rule = KINDS.model;
  if (!(file instanceof File)) return Response.json({ error: 'Nessun file ricevuto.' }, { status: 400 });
  if (!/\.glb$/i.test(file.name) || file.size > rule.max) {
    return Response.json({ error: `Usa ${rule.label}.` }, { status: 400 });
  }
  if (!env.MEDIA) return Response.json({ error: 'Spazio file non configurato (MEDIA in wrangler.jsonc).' }, { status: 500 });
  const key = `${rule.dir}/${crypto.randomUUID()}.glb`;
  try {
    await env.MEDIA.put(key, file.stream(), {
      httpMetadata: { contentType: 'model/gltf-binary' },
      customMetadata: { name: file.name.slice(0, 200) },
    });
  } catch {
    return Response.json({ error: 'Il file non si è salvato. Riprova fra poco.' }, { status: 502 });
  }
  return Response.json({ url: `/media/${key}` });
};
