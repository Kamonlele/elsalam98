/**
 * Nomi dei file che la rotta `/media` accetta e lettura dell'intestazione Range.
 * Logica pura: niente `cloudflare:workers`, così la provano i test.
 */
const UUID = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';
const KEY = new RegExp(
  `^(?:foto/${UUID}\\.(?:jpg|png|webp)|modelli/${UUID}\\.glb|video/${UUID}\\.(?:mp4|webm)|img/${UUID}/(?:full|blur|\\d{2,4})\\.(?:webp|jpg))$`,
);

/** Solo nomi generati dal sito: niente percorsi scelti da chi chiede. */
export function isMediaKey(key: string): boolean {
  return KEY.test(key);
}

/**
 * Un solo intervallo `bytes=a-b`, `bytes=a-` o `bytes=-n`. Fuori dal file, malformato
 * o con più intervalli: `null`, e chi chiama risponde con il file intero o con 416.
 */
export function parseRange(header: string | null, size: number): { offset: number; length: number } | null {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? '');
  if (!m || (!m[1] && !m[2]) || size <= 0) return null;
  if (!m[1]) {
    const n = Math.min(Number(m[2]), size);
    return n > 0 ? { offset: size - n, length: n } : null;
  }
  const start = Number(m[1]);
  const end = m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  if (start >= size || end < start) return null;
  return { offset: start, length: end - start + 1 };
}
