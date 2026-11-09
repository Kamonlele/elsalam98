/** Misure intermedie delle foto; la piena (al massimo 2400 px) si aggiunge in `variantsOf`. */
export const WIDTHS = [640, 1280] as const;

/** Lato lungo massimo della foto piena, lo stesso che usa il browser dell'area riservata. */
export const FULL_WIDTH = 2400;

const FULL = /^\/media\/img\/([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})\/full\.(webp|jpg)$/;

/**
 * Per una foto salvata in più misure dà `srcset` e miniatura sfocata; per le foto
 * vecchie (`/media/foto/...`) e per gli indirizzi esterni `null`: restano com'erano.
 */
export function variantsOf(src: string): { srcset: string; blur: string } | null {
  const m = FULL.exec(src);
  if (!m) return null;
  const base = `/media/img/${m[1]}`;
  const ext = m[2];
  const srcset = [...WIDTHS.map((w) => `${base}/${w}.${ext} ${w}w`), `${base}/full.${ext} ${FULL_WIDTH}w`].join(', ');
  return { srcset, blur: `${base}/blur.${ext}` };
}

/**
 * Stile della miniatura sfocata: solo `background-image` e compagni, mai la scorciatoia `background`,
 * così il colore di fondo dato dal CSS del sito resta. Quando la foto arriva, BLUR_ONLOAD toglie solo l'immagine.
 */
export const blurStyle = (blur: string, fit: 'cover' | 'contain' = 'contain') =>
  `background-image:url(${blur});background-position:center;background-size:${fit};background-repeat:no-repeat`;
export const BLUR_ONLOAD = "this.style.backgroundImage='none'";
