/**
 * Indirizzi pubblici di ogni contenuto. Niente `cloudflare:workers` qui: lo usano
 * i test, l'editor nel browser e le pagine.
 */
import { blog, features, type Locale } from './brand';
import { SEGMENTS, t, url, type T } from './i18n';
import type { Category, Page, Post, Product, Project } from './content';

// Tutti i codici, anche delle lingue spente: accenderne una dopo non deve rompere una pagina.
const ALL_LOCALES = Object.keys(SEGMENTS.products) as Locale[];

/** Pezzi di URL alla radice che pagine e categorie non possono prendere. */
export const RESERVED = new Set<string>([
  'admin', 'api', 'media', 'sitemap.xml', 'robots.txt',
  ...Object.values(SEGMENTS).flatMap((s) => Object.values(s)),
  ...ALL_LOCALES,
  ...Object.values(blog.segment).filter((s): s is string => !!s),
]);

export type Kind = 'pages' | 'categories' | 'products' | 'projects' | 'posts';

/** Pezzo di indirizzo dell'elenco articoli nella sua lingua (ricade sulla principale). */
export const blogSegment = (locale: Locale) => t(blog.segment, locale);
export const POSTS_PER_PAGE = 12;
// Sta solo sotto il segmento del blog: non serve riservarlo alla radice.
const PAGE_WORD: Record<Locale, string> = { it: 'pagina', en: 'page', fr: 'page', de: 'seite', es: 'pagina', ar: 'page' };

/** Indirizzo di una pagina dell'elenco articoli: la prima è il segmento stesso. */
export function postsPageUrl(locale: Locale, page: number): string {
  return page <= 1 ? url(locale, blogSegment(locale)) : url(locale, blogSegment(locale), PAGE_WORD[locale], String(page));
}

/** Gli articoli che il pubblico vede oggi (data locale del sito), dal più recente. */
export function visiblePosts(posts: Post[], today: string): Post[] {
  return posts
    .filter((p) => p.status === 'published' && /^\d{4}-\d{2}-\d{2}$/.test(p.date) && p.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date) || a.sort - b.sort);
}

export function publicUrl(kind: Kind, item: { slug: T; home?: boolean }, locale: Locale): string {
  if (kind === 'pages' && item.home) return url(locale);
  const slug = t(item.slug, locale);
  if (kind === 'products') return url(locale, SEGMENTS.products[locale], slug);
  if (kind === 'projects') return url(locale, SEGMENTS.projects[locale], slug);
  if (kind === 'posts') return url(locale, blogSegment(locale), slug);
  return url(locale, slug);
}

export type Site = { pages: Page[]; categories: Category[]; products: Product[]; projects: Project[]; posts?: Post[] };

export type View =
  | { kind: 'home'; page?: Page }
  | { kind: 'page'; page: Page }
  | { kind: 'category'; category: Category }
  | { kind: 'product'; product: Product }
  | { kind: 'project'; project: Project }
  | { kind: 'posts'; page: number }
  | { kind: 'post'; post: Post }
  | { kind: 'missing' };

/**
 * Dal percorso (senza il prefisso della lingua) alla vista da mostrare.
 * `today` è la data locale del sito: senza, nessun articolo è visibile.
 */
export function resolve(parts: string[], locale: Locale, site: Site, opts: { today?: string; blog?: boolean } = {}): View {
  if (parts.length === 0) return { kind: 'home', page: site.pages.find((p) => p.home) };
  const same = (slug: T, part: string) => t(slug, locale) === part;
  if (parts.length === 1) {
    const category = site.categories.find((c) => same(c.slug, parts[0]));
    if (category) return { kind: 'category', category };
    // La home vive solo su "/": il suo slug non è un indirizzo.
    const page = site.pages.find((p) => !p.home && same(p.slug, parts[0]));
    if (page) return { kind: 'page', page };
  }
  if (parts.length === 2 && parts[0] === SEGMENTS.products[locale]) {
    const product = site.products.find((p) => same(p.slug, parts[1]));
    if (product) return { kind: 'product', product };
  }
  if (parts.length === 2 && parts[0] === SEGMENTS.projects[locale]) {
    const project = site.projects.find((p) => same(p.slug, parts[1]));
    if (project) return { kind: 'project', project };
  }
  if ((opts.blog ?? features.blog) && parts[0] === blogSegment(locale)) {
    const posts = opts.today ? visiblePosts(site.posts ?? [], opts.today) : [];
    if (parts.length === 1) return { kind: 'posts', page: 1 };
    if (parts.length === 2) {
      const post = posts.find((p) => same(p.slug, parts[1]));
      if (post) return { kind: 'post', post };
    }
    // La pagina 1 è il segmento stesso: "/pagina/1/" o "/pagina/02/" sarebbero doppioni.
    if (parts.length === 3 && parts[1] === PAGE_WORD[locale] && /^[1-9]\d*$/.test(parts[2])) {
      const page = Number(parts[2]);
      if (page > 1 && page <= Math.ceil(posts.length / POSTS_PER_PAGE)) return { kind: 'posts', page };
    }
  }
  return { kind: 'missing' };
}

/** Voci del menu: prima le categorie, poi le pagine scelte (la home è già il logo). */
export function menu(site: Site, locale: Locale): { label: string; href: string }[] {
  return [
    ...site.categories.map((c) => ({ label: t(c.name, locale), href: publicUrl('categories', c, locale) })),
    ...site.pages.filter((p) => p.inMenu && !p.home).map((p) => ({ label: t(p.title, locale), href: publicUrl('pages', p, locale) })),
  ];
}
