/**
 * Chi può fare cosa nell'area riservata. Logica pura: la usano il middleware
 * (che decide), le API e l'interfaccia (che si limita a mostrare).
 * Tutto ciò che non è permesso qui in modo esplicito è vietato.
 */
import type { Field } from './schema';
import type { Name } from './store';

export type Role = 'admin' | 'redattore' | 'autore';
export const ROLES: Role[] = ['admin', 'redattore', 'autore'];
export const ROLE_LABELS: Record<Role, string> = { admin: 'Amministratore', redattore: 'Redattore', autore: 'Autore' };
export const ROLE_HINTS: Record<Role, string> = {
  admin: 'Tutto il sito, impostazioni e accessi compresi.',
  redattore: 'Articoli, più i testi di pagine e categorie.',
  autore: 'Solo gli articoli.',
};
export const isRole = (v: unknown): v is Role => typeof v === 'string' && (ROLES as string[]).includes(v);

/** Il redattore cambia solo i testi di queste collezioni, non foto né struttura. */
export const textOnlyCollections: Name[] = ['pages', 'categories'];

/**
 * Una sola forma per ogni percorso: decodificato, minuscolo, senza barre doppie o finali.
 * Null se resta ambiguo (codifica rotta, `..`, barre rovesciate, `%` dopo la decodifica):
 * meglio rifiutare che indovinare quale pagina aprirà il router.
 */
export function normalisePath(path: string): string | null {
  let p: string;
  try { p = decodeURIComponent(path); } catch { return null; }
  if (/[%\\\u0000-\u001f\u007f]/.test(p)) return null;
  p = p.replace(/\/{2,}/g, '/').toLowerCase();
  if (p.length > 1) p = p.replace(/\/$/, '');
  if (!p.startsWith('/')) return null;
  if (p.split('/').some((s) => s === '.' || s === '..')) return null;
  return p;
}

/** Se il percorso è dell'area riservata. Nel dubbio (percorso illeggibile) si tratta come tale. */
export function adminArea(path: string): 'page' | 'api' | null {
  // Se la decodifica fallisce si decodificano almeno i pezzi validi: /%61dmin/%zz resta /admin/.
  const p = normalisePath(path) ?? path.replace(/%([0-9a-f]{2})/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16))).replace(/\/{2,}/g, '/').toLowerCase();
  if (/^\/api\/admin(\/|$)/.test(p)) return 'api';
  if (/^\/admin(\/|$)/.test(p)) return 'page';
  return null;
}

const READ = ['GET', 'HEAD'];

export function canEditItem(role: Role, collection: string, method: string): boolean {
  if (role === 'admin') return true;
  const m = method.toUpperCase();
  if (role !== 'autore' && role !== 'redattore') return false;
  if (collection === 'posts') return m === 'GET' || m === 'PUT' || m === 'DELETE';
  if (role === 'redattore' && (textOnlyCollections as string[]).includes(collection)) return m === 'GET' || m === 'PUT';
  return false;
}

export function canOpen(role: Role, path: string, method: string): boolean {
  if (role === 'admin') return true;
  if (role !== 'autore' && role !== 'redattore') return false;
  const p = normalisePath(path);
  if (p === null) return false;
  const m = method.toUpperCase();
  const seg = p.split('/').slice(1);

  if (seg[0] === 'admin') {
    if (!READ.includes(m)) return false;
    if (seg.length === 1) return true;
    // Solo per la propria password: la pagina non mostra gli altri accessi a chi non è amministratore.
    if (seg.length === 2 && seg[1] === 'accessi') return true;
    const sections = role === 'redattore' ? ['articoli', 'pagine', 'categorie'] : ['articoli'];
    if (seg.length > 3 || !sections.includes(seg[1])) return false;
    // Il redattore non crea pagine né categorie.
    if (seg.length === 3 && seg[1] !== 'articoli' && seg[2] === 'nuovo') return false;
    return true;
  }

  if (seg[0] === 'api' && seg[1] === 'admin') {
    const rest = seg.slice(2);
    if (rest.length === 1) {
      if (rest[0] === 'session') return m === 'POST' || m === 'DELETE';
      if (rest[0] === 'upload') return m === 'POST';
      // PATCH è il cambio della propria password; il resto di /users è gestione degli accessi.
      if (rest[0] === 'users') return m === 'PATCH';
      return false;
    }
    if (rest.length === 3 && rest[0] === 'items') return canEditItem(role, rest[1], m);
  }
  return false;
}

/**
 * Il campo che il redattore può cambiare: un testo che non decide la struttura.
 * Lo dice lo schema con `structural`; slug e indirizzi restano chiusi anche se un campo nuovo se lo dimentica.
 */
export const isEditableText = (f: Field) =>
  f.type === 'text' && !f.structural && f.key !== 'slug' && !/(^|\.)(slug|href)$/i.test(f.key);

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const LOCALE_KEY = /^[a-z]{2}(-[a-z]{2})?$/i;

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (isObj(o) ? o[k] : undefined), obj);
}
function setPath(obj: Obj, path: string, value: unknown) {
  const keys = path.split('.');
  let o = obj;
  for (const k of keys.slice(0, -1)) {
    if (!isObj(o[k])) o[k] = {};
    o = o[k] as Obj;
  }
  o[keys[keys.length - 1]] = value;
}

function mergeInto(fields: Field[], target: Obj, src: unknown) {
  if (!isObj(src)) return;
  for (const f of fields) {
    const from = getPath(src, f.key);
    switch (f.type) {
      case 'text': {
        if (!isEditableText(f)) break;
        if (f.localized) {
          if (!isObj(from)) break;
          const loc: Record<string, string> = {};
          for (const [k, v] of Object.entries(from)) if (LOCALE_KEY.test(k) && typeof v === 'string') loc[k] = v;
          setPath(target, f.key, loc);
        } else if (typeof from === 'string') setPath(target, f.key, from);
        break;
      }
      case 'group': {
        if (!isObj(from)) break;
        if (!isObj(getPath(target, f.key))) setPath(target, f.key, {});
        mergeInto(f.fields, getPath(target, f.key) as Obj, from);
        break;
      }
      case 'list': {
        const to = getPath(target, f.key);
        if (!Array.isArray(to) || !Array.isArray(from)) break;
        to.forEach((item, i) => { if (isObj(item)) mergeInto(f.fields, item, from[i]); });
        break;
      }
      case 'blocks': {
        const to = getPath(target, f.key);
        if (!Array.isArray(to) || !Array.isArray(from)) break;
        to.forEach((block, i) => {
          const other = from[i];
          // Abbinati per posizione: se il tipo non torna, i blocchi sono stati spostati e non si tocca niente.
          if (!isObj(block) || !isObj(other) || other.kind !== block.kind) return;
          const kind = f.kinds.find((k) => k.kind === block.kind);
          if (kind) mergeInto(kind.fields, block, other);
        });
        break;
      }
      default: break;
    }
  }
}

/**
 * Per il redattore: parte dall'elemento salvato e ci copia sopra solo i testi
 * di `incoming`. Foto, indirizzo, scelte, numero e ordine dei blocchi restano quelli salvati.
 */
export function mergeTexts(existing: unknown, incoming: unknown, schemaFields: Field[]): unknown {
  const out = structuredClone(existing);
  if (isObj(out)) mergeInto(schemaFields, out, incoming);
  return out;
}

/**
 * Dopo la validazione: l'indirizzo resta quello salvato. Senza questo, uno slug vuoto
 * verrebbe ricavato dal titolo nuovo e il redattore sposterebbe la pagina cambiando il titolo.
 */
export function keepSlug(before: unknown, after: unknown): unknown {
  if (!isObj(after)) return after;
  const slug = isObj(before) && isObj(before.slug) ? structuredClone(before.slug) : {};
  return { ...after, slug };
}
