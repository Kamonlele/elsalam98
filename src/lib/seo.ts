/** SEO generata: sitemap, robots, dati strutturati. Logica pura, niente `cloudflare:workers`. */
import { blog, booking, brand, DEFAULT_LOCALE, type Locale } from './brand';
import type { Block, Location, Photo, Post, Product, Seo } from './content';
import { t } from './i18n';
import { plainText, type RichDoc } from './richtext';
import { blogSegment, postsPageUrl, publicUrl } from './routes';
import { weekIntervals } from './text';

// L'XML non ammette questi caratteri nemmeno escapati: un testo incollato da Word li porta dentro e rompe il feed.
const esc = (s: string) => s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export function buildSitemap(entries: { loc: string; lastmod?: number }[]): string {
  const rows = entries.map((e) =>
    `  <url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${new Date(e.lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

export function robotsTxt(origin: string): string {
  return `User-agent: *\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`;
}

/** JSON per uno script `ld+json`: "<" escapato, così un testo con </script> non chiude il tag. */
export const ldJson = (o: object) => JSON.stringify(o).replace(/</g, '\\u003c');

/** Indirizzo assoluto; gli indirizzi esterni restano come sono. */
export const absolute = (src: string, origin: string) => (/^https?:\/\//.test(src) ? src : origin + src);

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function openingSpec(l: Location) {
  // Giorni con la stessa fascia si uniscono; una pausa pranzo resta due fasce.
  const byRange = new Map<string, { opens: string; closes: string; days: string[] }>();
  for (const w of weekIntervals(l.slots, booking.visitMinutes)) {
    // schema.org non ammette "24:00".
    const closes = w.closes === '24:00' ? '23:59' : w.closes;
    const key = `${w.opens}-${closes}`;
    const row = byRange.get(key) ?? { opens: w.opens, closes, days: [] };
    row.days.push(DAYS[w.day]);
    byRange.set(key, row);
  }
  return [...byRange.values()]
    .sort((a, b) => a.opens.localeCompare(b.opens))
    .map((r) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: r.days, opens: r.opens, closes: r.closes }));
}

export function localBusinessLd(locations: Location[], origin: string): object[] {
  return locations.filter((l) => l.kind === 'showroom').map((l) => {
    const spec = openingSpec(l);
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: t(l.name, brand.locales.default as Locale) || brand.identity.name,
      url: origin + '/',
      ...(brand.contact.phone ? { telephone: brand.contact.phone } : {}),
      ...(brand.contact.email ? { email: brand.contact.email } : {}),
      ...(l.address || l.city ? {
        address: {
          '@type': 'PostalAddress',
          ...(l.address ? { streetAddress: l.address } : {}),
          ...(l.city ? { addressLocality: l.city } : {}),
        },
      } : {}),
      ...(spec.length ? { openingHoursSpecification: spec } : {}),
    };
  });
}

export function productLd(p: Product, locale: Locale, origin: string): object {
  const image = p.seo?.image || p.cover;
  const description = t(p.seo?.description, locale) || t(p.intro, locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: t(p.name, locale),
    ...(description ? { description } : {}),
    ...(image ? { image: absolute(image, origin) } : {}),
    url: origin + publicUrl('products', p, locale),
    brand: { '@type': 'Brand', name: brand.identity.name },
  };
}

/** Taglia a una parola intera, con i puntini; il testo corto resta com'è. */
export function clip(text: string, max: number): string {
  return text.length > max ? text.slice(0, max).replace(/\s+\S*$/, '') + '…' : text;
}

/** Lunghezze oltre le quali Google accorcia titolo e descrizione nel risultato. */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

/** Riassunto di un articolo: quello scritto, altrimenti l'inizio del testo. */
export function postSummary(p: Post, locale: Locale, max = 300): string {
  const own = t(p.excerpt, locale).trim();
  if (own) return own;
  return clip(plainText(p.body), max);
}

/** Descrizione di ripiego per una pagina fatta di blocchi: il primo testo che trova. */
export function blocksSummary(blocks: Block[], locale: Locale, max = DESCRIPTION_MAX): string {
  for (const b of blocks) {
    if ((b.kind === 'hero' || b.kind === 'text' || b.kind === 'textPhoto') && b.text) {
      const text = t(b.text, locale).replace(/\s+/g, ' ').trim();
      if (text) return clip(text, max);
    }
  }
  return '';
}

/** Feed RSS 2.0 degli articoli già visibili, nella lingua principale: al massimo i 20 più recenti. */
export function postRss(origin: string, posts: Post[]): string {
  const l = DEFAULT_LOCALE;
  const self = `${origin}/${blogSegment(l)}/rss.xml`;
  const items = posts.slice(0, 20).map((p) => {
    const link = origin + publicUrl('posts', p, l);
    return [
      '    <item>',
      `      <title>${esc(t(p.title, l))}</title>`,
      `      <link>${esc(link)}</link>`,
      `      <guid isPermaLink="true">${esc(link)}</guid>`,
      `      <pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate>`,
      `      <description>${esc(postSummary(p, l))}</description>`,
      '    </item>',
    ].join('\n');
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${t(blog.title, l)} | ${brand.identity.name}`)}</title>
    <link>${esc(origin + postsPageUrl(l, 1))}</link>
    <description>${esc(t(brand.identity.tagline, l))}</description>
    <language>${l}</language>
    <atom:link href="${esc(self)}" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`;
}

type Node = { type?: string; attrs?: { src?: string; alt?: string }; content?: Node[] };

/** Le foto dentro il testo di un articolo, in ordine. */
function bodyImages(doc: RichDoc | undefined): { src: string; alt: string }[] {
  const out: { src: string; alt: string }[] = [];
  const walk = (n: Node) => {
    if (n.type === 'image' && n.attrs?.src) out.push({ src: n.attrs.src, alt: (n.attrs.alt ?? '').trim() });
    n.content?.forEach(walk);
  };
  if (doc) walk(doc as unknown as Node);
  return out;
}

export function postLd(p: Post, locale: Locale, origin: string): object {
  const image = p.seo?.image || p.cover || bodyImages(p.body)[0]?.src;
  // Una modifica "prima" della pubblicazione (articolo con data nel futuro) non ha senso per Google.
  const modified = p.updatedAt ? new Date(p.updatedAt).toISOString() : '';
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: t(p.title, locale),
    datePublished: p.date,
    dateModified: modified && modified.slice(0, 10) >= p.date ? modified : p.date,
    ...(p.author ? { author: { '@type': 'Person', name: p.author } } : {}),
    ...(image ? { image: absolute(image, origin) } : {}),
    mainEntityOfPage: origin + publicUrl('posts', p, locale),
    publisher: { '@type': 'Organization', name: brand.identity.name },
  };
}

/** Percorso della pagina; `url` è l'indirizzo del sito (con la barra iniziale). */
export function breadcrumbLd(items: { name: string; url: string }[], origin: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absolute(it.url, origin) })),
  };
}

/**
 * Avvisi per chi scrive: mai bloccanti. Il testo si legge come il sito, con ricaduta sulla lingua principale.
 * Le foto senza testo alternativo sono quelle nel testo dell'articolo e, nelle gallerie, quelle senza didascalia.
 */
export function seoWarnings(
  item: { seo?: Seo; blocks?: Block[]; body?: RichDoc; photos?: Photo[] },
  locale: Locale = DEFAULT_LOCALE,
): string[] {
  const out: string[] = [];
  const title = t(item.seo?.title, locale).trim();
  const description = t(item.seo?.description, locale).trim();
  if (!description) out.push('Manca la descrizione per Google: il sito userà l\'inizio del testo, ma scriverla tu di solito rende meglio.');
  if (title.length > TITLE_MAX) out.push(`Il titolo per Google è lungo ${title.length} caratteri: oltre ${TITLE_MAX} viene tagliato.`);
  if (description.length > DESCRIPTION_MAX) out.push(`La descrizione per Google è lunga ${description.length} caratteri: oltre ${DESCRIPTION_MAX} viene tagliata.`);
  const galleries = (item.blocks ?? []).flatMap((b) => (b.kind === 'gallery' || b.kind === 'slider' ? b.photos : []));
  const noAlt = bodyImages(item.body).filter((i) => !i.alt).length
    + [...(item.photos ?? []), ...galleries].filter((ph) => !t(ph.caption, locale).trim()).length;
  if (noAlt) out.push(noAlt === 1 ? '1 foto non ha il testo alternativo: serve a chi non la vede e a Google.' : `${noAlt} foto non hanno il testo alternativo: serve a chi non le vede e a Google.`);
  return out;
}
