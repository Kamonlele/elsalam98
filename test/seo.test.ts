import { describe, expect, it } from 'vitest';
import { breadcrumbLd, buildSitemap, ldJson, localBusinessLd, postLd, productLd, robotsTxt, seoWarnings } from '../src/lib/seo';
import { brand } from '../src/lib/brand';
import type { Location, Post, Product } from '../src/lib/content';
import type { RichDoc } from '../src/lib/richtext';

const origin = 'https://www.esempio.it';

describe('buildSitemap', () => {
  it('ha un <url> per voce e protegge la &', () => {
    const xml = buildSitemap([{ loc: origin + '/' }, { loc: origin + '/a?x=1&y=2' }]);
    expect(xml.match(/<url>/g)).toHaveLength(2);
    expect(xml).toContain('<loc>https://www.esempio.it/a?x=1&amp;y=2</loc>');
    expect(xml).not.toContain('<lastmod>');
  });
  it('scrive lastmod come YYYY-MM-DD', () => {
    const xml = buildSitemap([{ loc: origin + '/', lastmod: Date.UTC(2026, 9, 5, 15) }]);
    expect(xml).toContain('<lastmod>2026-10-05</lastmod>');
  });
  it('toglie i caratteri di controllo che l\'XML non ammette', () => {
    const xml = buildSitemap([{ loc: origin + '/a\u0001b\u000bc\u001fd\te' }]);
    expect(xml).toContain('<loc>https://www.esempio.it/abcd\te</loc>');
  });
});

describe('robotsTxt', () => {
  it('chiude area riservata e API e indica la sitemap', () => {
    const r = robotsTxt(origin);
    expect(r).toContain('Disallow: /admin');
    expect(r).toContain('Disallow: /api/');
    expect(r).toContain(`Sitemap: ${origin}/sitemap.xml`);
  });
});

const day = ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00'];
const loc = (id: string, kind: Location['kind']): Location => ({
  id, kind, name: { it: 'Sede ' + id }, city: 'Verona', address: 'Via Roma 1', slots: { 1: day, 2: day },
});

describe('localBusinessLd', () => {
  const ld = localBusinessLd([loc('a', 'showroom'), loc('b', 'video')], origin) as any[];
  it('un oggetto per showroom, le sedi video escluse', () => {
    expect(ld).toHaveLength(1);
    expect(ld[0]['@type']).toBe('LocalBusiness');
    expect(ld[0].name).toBe('Sede a');
  });
  it('indirizzo e telefono', () => {
    expect(ld[0].address).toMatchObject({ '@type': 'PostalAddress', streetAddress: 'Via Roma 1', addressLocality: 'Verona' });
    expect(ld[0].telephone).toBe(brand.contact.phone);
  });
  it('telefono ed email solo se scritti in brand.json', () => {
    const { phone, email } = brand.contact;
    try {
      brand.contact.phone = '';
      brand.contact.email = '';
      const [b] = localBusinessLd([loc('a', 'showroom')], origin) as any[];
      expect(b).not.toHaveProperty('telephone');
      expect(b).not.toHaveProperty('email');
    } finally {
      brand.contact.phone = phone;
      brand.contact.email = email;
    }
  });
  it('la pausa pranzo dà due fasce', () => {
    const spec = ld[0].openingHoursSpecification as any[];
    expect(spec.map((s) => [s.opens, s.closes])).toEqual([['09:00', '13:00'], ['15:00', '19:00']]);
    expect(spec[0].dayOfWeek).toEqual(['Monday', 'Tuesday']);
  });
});

describe('productLd', () => {
  const p = {
    id: 'p', status: 'published', sort: 0, slug: { it: 'forno', en: 'oven' }, name: { it: 'Forno', en: 'Oven' },
    intro: { it: 'Un forno' }, scene: { mode: 'photo' }, stages: [], cover: '/media/img/x/full.webp', gallery: [],
  } as unknown as Product;
  it('nome, immagine assoluta e url nella lingua', () => {
    const ld = productLd(p, 'it', origin) as any;
    expect(ld).toMatchObject({ '@type': 'Product', name: 'Forno', image: origin + '/media/img/x/full.webp' });
    expect(ld.url).toBe(origin + '/prodotti/forno/');
    expect((productLd(p, 'en', origin) as any).url).toBe(origin + '/en/products/oven/');
  });
});

describe('ldJson', () => {
  it('escapa < e resta JSON valido', () => {
    const out = ldJson({ name: 'a </script><b>' });
    expect(out).not.toContain('<');
    expect(JSON.parse(out).name).toBe('a </script><b>');
  });
});

const doc = (...content: RichDoc['content']): RichDoc => ({ type: 'doc', content });
const para = (text: string) => ({ type: 'paragraph' as const, content: [{ type: 'text' as const, text }] });
const post = (over: Partial<Post> = {}): Post => ({
  id: 'a', status: 'published', sort: 0, slug: { it: 'primo', en: 'first' }, title: { it: 'Primo articolo', en: 'First post' },
  date: '2026-10-01', author: 'Anna Rossi', excerpt: {}, body: doc(para('Testo')), ...over,
});

describe('postLd', () => {
  it('BlogPosting con date, autore, immagine assoluta ed editore', () => {
    const ld = postLd(post({ cover: '/media/img/c/full.webp', updatedAt: Date.UTC(2026, 9, 5, 15) }), 'it', origin) as any;
    expect(ld).toMatchObject({
      '@context': 'https://schema.org', '@type': 'BlogPosting', headline: 'Primo articolo',
      datePublished: '2026-10-01', author: { '@type': 'Person', name: 'Anna Rossi' },
      image: origin + '/media/img/c/full.webp', mainEntityOfPage: origin + '/news/primo/',
      publisher: { '@type': 'Organization', name: brand.identity.name },
    });
    expect(ld.dateModified.startsWith('2026-10-05')).toBe(true);
  });
  it('senza updatedAt dateModified è datePublished', () => {
    const ld = postLd(post(), 'it', origin) as any;
    expect(ld.dateModified).toBe(ld.datePublished);
  });
  it('un updatedAt precedente alla data di pubblicazione non va indietro', () => {
    const ld = postLd(post({ date: '2026-12-01', updatedAt: Date.UTC(2026, 9, 5) }), 'it', origin) as any;
    expect(ld.dateModified).toBe('2026-12-01');
  });
  it('senza cover usa la prima foto del testo; senza autore niente author', () => {
    const body = doc(para('x'), { type: 'image', attrs: { src: '/media/img/b/full.webp', alt: 'b' } });
    const ld = postLd(post({ body, author: '' }), 'it', origin) as any;
    expect(ld.image).toBe(origin + '/media/img/b/full.webp');
    expect(ld.author).toBeUndefined();
  });
});

describe('breadcrumbLd', () => {
  it('position da 1 e indirizzi assoluti', () => {
    const ld = breadcrumbLd([{ name: 'Home', url: '/' }, { name: 'News', url: '/news/' }, { name: 'Primo', url: '/news/primo/' }], origin) as any;
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement.map((e: any) => [e.position, e.name, e.item])).toEqual([
      [1, 'Home', origin + '/'], [2, 'News', origin + '/news/'], [3, 'Primo', origin + '/news/primo/'],
    ]);
    expect(ld.itemListElement[0]['@type']).toBe('ListItem');
  });
});

describe('seoWarnings', () => {
  const ok = { seo: { title: { it: 'Un titolo breve' }, description: { it: 'Una descrizione corta.' } }, body: doc(para('x'), { type: 'image', attrs: { src: '/media/a.webp', alt: 'Una foto' } }) };
  it('nessun avviso per un contenuto completo', () => expect(seoWarnings(ok)).toEqual([]));
  it('descrizione mancante', () => {
    const w = seoWarnings({ ...ok, seo: { title: ok.seo.title } });
    expect(w).toHaveLength(1);
    expect(w[0]).toMatch(/descrizione/i);
  });
  it('titolo oltre 60 e descrizione oltre 155', () => {
    const w = seoWarnings({ seo: { title: { it: 'a'.repeat(61) }, description: { it: 'b'.repeat(156) } } });
    expect(w).toHaveLength(2);
    expect(seoWarnings({ seo: { title: { it: 'a'.repeat(60) }, description: { it: 'b'.repeat(155) } } })).toEqual([]);
  });
  it('foto del testo senza testo alternativo', () => {
    const body = doc({ type: 'image', attrs: { src: '/media/a.webp' } }, { type: 'image', attrs: { src: '/media/b.webp', alt: '  ' } });
    const w = seoWarnings({ ...ok, body });
    expect(w).toHaveLength(1);
    expect(w[0]).toMatch(/2 foto/);
  });
  it('foto di una galleria senza didascalia', () => {
    const w = seoWarnings({ ...ok, photos: [{ src: '/a', caption: {}, width: 1, height: 1 }] });
    expect(w).toHaveLength(1);
  });
  it('conta nella lingua indicata, con ricaduta sulla principale come il sito', () => {
    expect(seoWarnings(ok, 'en')).toEqual([]);
    expect(seoWarnings({ seo: { ...ok.seo, title: { it: 'breve', en: 'a'.repeat(61) } } }, 'en')).toHaveLength(1);
  });
});
