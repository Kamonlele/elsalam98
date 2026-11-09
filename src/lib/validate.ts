import { DEFAULT_LOCALE, LOCALES, type Locale } from './brand';
import type { Block, Category, Cta, DocItem, Location, Page, Photo, Post, Product, Project, Seo, TimelineItem } from './content';
import { SEGMENTS, t, type T } from './i18n';
import { localNow } from './booking';
import { cleanDoc } from './richtext';
import { RESERVED } from './routes';
import { hasUnsafeChars, isSafeHref } from './safe-url';
import { blockLabel } from './schema';
import { listAll, type Name } from './store';

/** Trasforma un nome in un pezzo di URL: "Fuoriterra in legno" → "fuoriterra-in-legno". */
export function slugify(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
const fail = (error: string) => ({ ok: false as const, error });

/**
 * Controlla e ripulisce un elemento prima di salvarlo. Il browser può mandare
 * qualsiasi cosa: qui si decide cosa finisce nel database.
 */
export async function validate(name: Name, id: string, raw: unknown, status: 'published' | 'draft'): Promise<Result<unknown>> {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Dati mancanti.' };
  switch (name) {
    case 'products': return validateProduct(id, raw as Product, status);
    case 'locations': return validateLocation(id, raw as Location);
    case 'categories': return validateCategory(id, raw as Obj, status);
    case 'projects': return validateProject(id, raw as Obj, status);
    case 'pages': return validatePage(id, raw as Obj, status);
    case 'posts': return validatePost(id, raw as Obj, status);
  }
}

async function validateProduct(id: string, p: Product, status: 'published' | 'draft'): Promise<Result<Product>> {
  if (!t(p.name, DEFAULT_LOCALE).trim()) return { ok: false, error: 'Il prodotto ha bisogno di un nome.' };
  p.id = id;
  p.status = status;
  p.slug = fillSlugs(p.slug, p.name);
  const clash = await slugTaken(['products'], id, p.slug);
  if (clash) return fail(clash);
  p.stages = (p.stages ?? []).filter((s) => t(s.title, DEFAULT_LOCALE).trim() || s.photo);
  if (!p.stages.length) return { ok: false, error: 'Serve almeno una tappa nella scena prodotto.' };
  if (p.scene?.mode === 'photo' && p.stages.some((s) => !s.photo)) {
    return { ok: false, error: 'Nella scena a foto ogni tappa ha bisogno della sua foto.' };
  }
  if (p.scene?.mode === '3d' && !p.scene.model) return { ok: false, error: 'Carica il modello 3D oppure scegli la scena a foto.' };
  p.gallery = (p.gallery ?? []).filter((g) => g.src);
  p.bookable = !!p.bookable;
  p.category = (await categoryIds()).has(p.category ?? '') ? p.category : undefined;
  p.seo = cleanSeo(p.seo);
  return { ok: true, data: p };
}

function validateLocation(id: string, l: Location): Result<Location> {
  if (!t(l.name, DEFAULT_LOCALE).trim()) return { ok: false, error: 'La sede ha bisogno di un nome.' };
  l.id = id;
  l.kind = l.kind === 'video' ? 'video' : 'showroom';
  // Si accetta come lo scrive una persona (9:00, 9.00, 09:00) e si salva sempre come 09:00.
  const normal = (x: string) => {
    const m = /^(\d{1,2})[:.](\d{2})$/.exec(x.trim());
    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
    return `${m[1].padStart(2, '0')}:${m[2]}`;
  };
  const slots: Location['slots'] = {};
  for (const [day, list] of Object.entries(l.slots ?? {})) {
    const raw = (list ?? []).map((x) => x.trim()).filter(Boolean);
    const bad = raw.find((x) => !normal(x));
    if (bad) return { ok: false, error: `"${bad}" non è un orario: scrivilo come 10:30.` };
    const clean = raw.map((x) => normal(x)!);
    if (clean.length) slots[Number(day) as 0] = [...new Set(clean)].sort();
  }
  l.slots = slots;
  const cap = Number.parseInt(String(l.capacity ?? '1'), 10);
  l.capacity = Number.isFinite(cap) && cap >= 1 && cap <= 50 ? cap : 1;
  l.closed = (l.closed ?? []).map((d) => d.trim()).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  return { ok: true, data: l };
}

/* ---------- categorie, realizzazioni, pagine ---------- */

type Obj = Record<string, unknown>;
const CODES = new Set(Object.keys(SEGMENTS.products));

/** Tiene solo le lingue conosciute con un testo vero. */
function cleanT(v: unknown): T {
  const out: T = {};
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) if (CODES.has(k) && typeof x === 'string' && x.trim()) out[k as Locale] = x.trim();
  }
  return out;
}
const has = (v: T) => !!t(v, DEFAULT_LOCALE).trim();
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
// Solo file del sito o indirizzi https: niente "javascript:" o "data:" negli attributi.
const src = (v: unknown) => { const s = str(v); return s && isSafeHref(s) && (s.startsWith('/') || /^https:\/\//i.test(s)) ? s : undefined; };
// I pulsanti possono anche portare a una sezione della stessa pagina ("#visita").
const safeCta = (s: string) => (s.startsWith('#') ? !hasUnsafeChars(s) : isSafeHref(s));
const FOCUS = /^(\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)%$/;

function focus(v: unknown) {
  const m = FOCUS.exec(str(v) ?? '');
  return m && Number(m[1]) <= 100 && Number(m[2]) <= 100 ? `${m[1]}% ${m[2]}%` : undefined;
}
function photos(v: unknown): Photo[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((p) => {
    const s = src((p as Obj | null)?.src);
    if (!s) return [];
    const o = p as Obj;
    return [{ src: s, caption: cleanT(o.caption), width: Number(o.width) || 0, height: Number(o.height) || 0 }];
  });
}
function cleanSeo(v: unknown): Seo | undefined {
  const o = (v && typeof v === 'object' ? v : {}) as Obj;
  const seo: Seo = { title: cleanT(o.title), description: cleanT(o.description), image: src(o.image) };
  if (!has(seo.title!)) delete seo.title;
  if (!has(seo.description!)) delete seo.description;
  if (!seo.image) delete seo.image;
  return Object.keys(seo).length ? seo : undefined;
}

/** Un indirizzo per lingua: quelli scritti si ripuliscono, quelli mancanti si ricavano dal nome in quella lingua. */
function fillSlugs(raw: unknown, from: T): T {
  const out: T = {};
  for (const [l, v] of Object.entries(cleanT(raw))) { const s = slugify(v); if (s) out[l as Locale] = s; }
  for (const l of LOCALES) if (!out[l]) { const s = slugify(t(from, l)); if (s) out[l] = s; }
  return out;
}

const OWNER: Record<Name, string> = { pages: 'dalla pagina', categories: 'dalla categoria', products: 'dal prodotto', projects: 'dalla realizzazione', posts: "dall'articolo", locations: 'dalla sede' };

/** Il primo elemento delle collezioni indicate che usa già uno di questi indirizzi, come frase d'errore. */
async function slugTaken(collections: Name[], id: string, slug: T): Promise<string | null> {
  for (const c of collections) {
    const others = (await listAll(c)).filter((r) => r.id !== id);
    for (const o of others) {
      const d = o.data as unknown as { slug?: T; name?: T; title?: T; home?: boolean };
      // La home vive solo su "/": il suo slug non occupa un indirizzo.
      if (c === 'pages' && d.home) continue;
      for (const l of LOCALES) {
        if (slug[l] && d.slug?.[l] === slug[l]) {
          return `L'indirizzo "${slug[l]}" (${l.toUpperCase()}) è già usato ${OWNER[c]} "${t(d.title ?? d.name, l)}". Cambialo.`;
        }
      }
    }
  }
  return null;
}

/** Pagine e categorie stanno entrambe alla radice del sito: si controllano insieme. */
async function rootSlugClash(id: string, slug: T): Promise<string | null> {
  const reserved = Object.values(slug).find((s) => s && RESERVED.has(s));
  if (reserved) return `"${reserved}" è un indirizzo riservato del sito: scegline un altro.`;
  return slugTaken(['pages', 'categories'], id, slug);
}

async function categoryIds() {
  return new Set((await listAll('categories')).map((r) => r.id));
}

/** Il pulsante facoltativo di un blocco: undefined se vuoto, una frase se è scritto a metà. */
function cleanCta(v: unknown): Cta | undefined | string {
  const o = (v && typeof v === 'object' ? v : {}) as Obj;
  const label = cleanT(o.label);
  const href = str(o.href);
  if (!has(label) && !href) return undefined;
  if (!href) return 'il pulsante ha bisogno di un indirizzo';
  if (!has(label)) return 'il pulsante ha bisogno di un testo';
  if (!safeCta(href)) return "l'indirizzo del pulsante deve iniziare con /, https://, mailto: o tel:";
  return { label, href };
}

const arr = (v: unknown) => (Array.isArray(v) ? v : []).filter((x): x is Obj => !!x && typeof x === 'object');

/** Un blocco ripulito, una frase d'errore, oppure null se il tipo non esiste (si scarta). */
function cleanBlock(b: Obj, cats?: Set<string>): Block | string | null {
  const title = cleanT(b.title);
  const text = cleanT(b.text);
  const cat = (v: unknown) => { const s = str(v); return s && (!cats || cats.has(s)) ? s : undefined; };
  switch (b.kind) {
    case 'hero': {
      if (!has(title)) return 'ha bisogno di un titolo';
      const cta = cleanCta(b.cta);
      if (typeof cta === 'string') return cta;
      return { kind: 'hero', title, text, photo: src(b.photo), focus: focus(b.focus), video: src(b.video), cta };
    }
    case 'text':
      if (!has(text)) return 'ha bisogno di un testo';
      return { kind: 'text', title, text };
    case 'textPhoto': {
      if (!has(text)) return 'ha bisogno di un testo';
      const photo = src(b.photo);
      if (!photo) return 'ha bisogno di una foto';
      const cta = cleanCta(b.cta);
      if (typeof cta === 'string') return cta;
      return { kind: 'textPhoto', title, text, photo, side: b.side === 'right' ? 'right' : 'left', cta };
    }
    case 'gallery':
    case 'slider':
      return { kind: b.kind, title, photos: photos(b.photos) };
    case 'values': {
      const items = (Array.isArray(b.items) ? b.items : [])
        .map((i) => ({ title: cleanT((i as Obj | null)?.title), text: cleanT((i as Obj | null)?.text) }))
        .filter((i) => has(i.title) || has(i.text));
      return { kind: 'values', title, items };
    }
    case 'products':
      return { kind: 'products', title, category: cat(b.category) };
    case 'projects': {
      const n = Number.parseInt(String(b.limit ?? ''), 10);
      return { kind: 'projects', title, category: cat(b.category), limit: n >= 1 && n <= 24 ? n : undefined };
    }
    case 'posts': {
      const n = Number.parseInt(String(b.limit ?? ''), 10);
      return { kind: 'posts', title, limit: n >= 1 && n <= 12 ? n : undefined };
    }
    case 'categories':
    case 'locations':
    case 'booking':
      return { kind: b.kind, title };
    case 'cta': {
      if (!has(title)) return 'ha bisogno di un titolo';
      const cta = cleanCta(b.cta);
      if (cta === undefined) return 'ha bisogno di un pulsante';
      if (typeof cta === 'string') return cta;
      return { kind: 'cta', title, text, cta };
    }
    case 'policy':
      return { kind: 'policy', policy: b.policy === 'cookie' ? 'cookie' : 'privacy' };
    case 'stats': {
      const items = arr(b.items)
        .map((i) => ({ value: cleanT(i.value), label: cleanT(i.label) }))
        .filter((i) => has(i.value) && has(i.label));
      if (!items.length) return 'ha bisogno di almeno un numero con la sua spiegazione';
      const note = cleanT(b.note);
      return { kind: 'stats', title, items, note: has(note) ? note : undefined };
    }
    case 'timeline': {
      const items: TimelineItem[] = [];
      for (const i of arr(b.items)) {
        const date = cleanT(i.date), ttl = cleanT(i.title), txt = cleanT(i.text);
        if (!has(date) && !has(ttl)) continue;
        if (!has(date) || !has(ttl)) return 'ha una tappa senza data o senza titolo';
        const link = cleanCta(i.link);
        if (typeof link === 'string') return link.replace('il pulsante', 'il collegamento');
        items.push({ date, title: ttl, text: has(txt) ? txt : undefined, photo: src(i.photo), link });
      }
      return { kind: 'timeline', title, items };
    }
    case 'documents': {
      const items: DocItem[] = [];
      for (const i of arr(b.items)) {
        const ttl = cleanT(i.title);
        const href = src(i.href);
        if (!has(ttl) && !str(i.href)) continue;
        if (!has(ttl)) return 'ha un documento senza titolo';
        if (!href) return `ha un documento senza un indirizzo valido ("${t(ttl, DEFAULT_LOCALE)}")`;
        const meta = cleanT(i.meta);
        const versions = arr(i.versions)
          .map((v) => ({ label: (str(v.label) ?? '').slice(0, 12), href: src(v.href) }))
          .filter((v): v is { label: string; href: string } => !!v.label && !!v.href);
        items.push({ title: ttl, meta: has(meta) ? meta : undefined, href, versions: versions.length ? versions : undefined });
      }
      return { kind: 'documents', title, text: has(text) ? text : undefined, items };
    }
    default:
      return null;
  }
}

/** I blocchi di una pagina o di una categoria. Se passi le categorie esistenti, i collegamenti a quelle sparite si tolgono. */
export function validateBlocks(blocks: unknown, categories?: Set<string>): Result<Block[]> {
  const out: Block[] = [];
  const list = Array.isArray(blocks) ? blocks : [];
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    if (!b || typeof b !== 'object') continue;
    const r = cleanBlock(b as Obj, categories);
    if (r === null) continue;
    if (typeof r === 'string') return fail(`Il blocco ${i + 1} (${blockLabel(String((b as Obj).kind))}) ${r}.`);
    out.push(r);
  }
  return { ok: true, data: out };
}

const sortOf = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

async function validateCategory(id: string, raw: Obj, status: 'published' | 'draft'): Promise<Result<Category>> {
  const name = cleanT(raw.name);
  if (!has(name)) return fail('La categoria ha bisogno di un nome.');
  const slug = fillSlugs(raw.slug, name);
  if (!slug[DEFAULT_LOCALE]) return fail('Scrivi un indirizzo per la categoria.');
  const clash = await rootSlugClash(id, slug);
  if (clash) return fail(clash);
  const blocks = validateBlocks(raw.blocks, await categoryIds());
  if (!blocks.ok) return blocks;
  return {
    ok: true,
    data: { id, status, sort: sortOf(raw.sort), slug, name, intro: cleanT(raw.intro), cover: src(raw.cover), blocks: blocks.data, seo: cleanSeo(raw.seo) },
  };
}

async function validateProject(id: string, raw: Obj, status: 'published' | 'draft'): Promise<Result<Project>> {
  const title = cleanT(raw.title);
  if (!has(title)) return fail('La realizzazione ha bisogno di un titolo.');
  const slug = fillSlugs(raw.slug, title);
  if (!slug[DEFAULT_LOCALE]) return fail('Scrivi un indirizzo per la realizzazione.');
  const clash = await slugTaken(['projects'], id, slug);
  if (clash) return fail(clash);
  const category = str(raw.category);
  return {
    ok: true,
    data: {
      id, status, sort: sortOf(raw.sort), slug, title,
      place: str(raw.place), year: str(raw.year),
      category: category && (await categoryIds()).has(category) ? category : undefined,
      intro: cleanT(raw.intro), cover: src(raw.cover), photos: photos(raw.photos), seo: cleanSeo(raw.seo),
    },
  };
}

async function validatePage(id: string, raw: Obj, status: 'published' | 'draft'): Promise<Result<Page>> {
  const title = cleanT(raw.title);
  if (!has(title)) return fail('La pagina ha bisogno di un titolo.');
  const home = !!raw.home;
  // La home si apre su "/": lo slug le serve solo se un giorno smette di essere la home.
  const slug = fillSlugs(raw.slug, home ? {} : title);
  if (!home && !slug[DEFAULT_LOCALE]) return fail('Scrivi un indirizzo per la pagina.');
  if (home) {
    const other = (await listAll('pages')).find((r) => r.id !== id && (r.data as unknown as Page).home);
    if (other) return fail(`C'è già una home: ${t((other.data as unknown as Page).title, DEFAULT_LOCALE)}`);
  }
  const clash = await rootSlugClash(id, slug);
  if (clash) return fail(clash);
  const blocks = validateBlocks(raw.blocks, await categoryIds());
  if (!blocks.ok) return blocks;
  return { ok: true, data: { id, status, sort: sortOf(raw.sort), slug, title, home, inMenu: !!raw.inMenu, blocks: blocks.data, seo: cleanSeo(raw.seo) } };
}

/** Una data vera nel formato YYYY-MM-DD (niente 31 febbraio). */
export function isDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

async function validatePost(id: string, raw: Obj, status: 'published' | 'draft'): Promise<Result<Post>> {
  const title = cleanT(raw.title);
  if (!has(title)) return fail("L'articolo ha bisogno di un titolo.");
  const slug = fillSlugs(raw.slug, title);
  if (!slug[DEFAULT_LOCALE]) return fail("Scrivi un indirizzo per l'articolo.");
  const clash = await slugTaken(['posts'], id, slug);
  if (clash) return fail(clash);
  // Senza data esce oggi; una data futura lo tiene nascosto fino a quel giorno.
  const date = str(raw.date) ?? localNow().date;
  if (!isDate(date)) return fail(`"${date}" non è una data: scegli il giorno dal calendario.`);
  return {
    ok: true,
    data: {
      id, status, sort: sortOf(raw.sort), slug, title, date,
      author: (str(raw.author) ?? '').slice(0, 120),
      cover: src(raw.cover),
      excerpt: cleanT(raw.excerpt),
      body: cleanDoc(raw.body),
      seo: cleanSeo(raw.seo),
      updatedAt: Date.now(),
    },
  };
}
