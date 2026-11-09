/**
 * I pulsanti e i collegamenti dei blocchi si scrivono una volta sola, con l'indirizzo
 * nella lingua principale ("/cronologia/" o "/documenti/#erika"). Qui diventano
 * l'indirizzo della stessa pagina nella lingua che si sta guardando.
 * Logica pura: niente `cloudflare:workers`.
 */
import { DEFAULT_LOCALE, type Locale } from './brand';
import type { Block } from './content';
import { publicUrl, type Kind } from './routes';

type Linkable = { slug: Record<string, string | undefined>; home?: boolean };
type SiteLike = { pages: Linkable[]; categories: Linkable[]; products: Linkable[]; projects: Linkable[] };

export function linkMap(site: SiteLike, locale: Locale): Map<string, string> {
  const map = new Map<string, string>();
  if (locale === DEFAULT_LOCALE) return map;
  const kinds: [Kind, Linkable[]][] = [['pages', site.pages], ['categories', site.categories], ['products', site.products], ['projects', site.projects]];
  for (const [kind, items] of kinds) {
    for (const item of items) {
      // Ogni contenuto ha la forma che si aspetta publicUrl: qui serve solo lo slug.
      map.set(publicUrl(kind, item as never, DEFAULT_LOCALE), publicUrl(kind, item as never, locale));
    }
  }
  return map;
}

export function localizeHref(href: string, map: Map<string, string>): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const cut = href.search(/[?#]/);
  const path = cut === -1 ? href : href.slice(0, cut);
  const rest = cut === -1 ? '' : href.slice(cut);
  const withSlash = path.endsWith('/') ? path : path + '/';
  const found = map.get(withSlash);
  return found ? found + rest : href;
}

export function localizeLinks(blocks: Block[], locale: Locale, site: SiteLike): Block[] {
  const map = linkMap(site, locale);
  if (map.size === 0) return blocks;
  const fix = <C extends { href: string } | undefined>(c: C): C => (c ? { ...c, href: localizeHref(c.href, map) } : c);
  return blocks.map((b) => {
    if ((b.kind === 'hero' || b.kind === 'textPhoto' || b.kind === 'cta') && b.cta) return { ...b, cta: fix(b.cta) } as Block;
    if (b.kind === 'timeline') return { ...b, items: b.items.map((i) => ({ ...i, link: fix(i.link) })) };
    return b;
  });
}
