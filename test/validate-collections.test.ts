import { beforeEach, describe, expect, it, vi } from 'vitest';

// Il database finto: ogni test decide quali elementi esistono già.
const db: Record<string, { id: string; status: 'published' | 'draft'; sort: number; updatedAt: number; data: Record<string, unknown> }[]> = {};
vi.mock('../src/lib/store', () => ({
  listAll: vi.fn(async (name: string) => db[name] ?? []),
}));

const { validate } = await import('../src/lib/validate');
const { publicUrl, RESERVED } = await import('../src/lib/routes');

const row = (id: string, data: Record<string, unknown>) => ({ id, status: 'published' as const, sort: 0, updatedAt: 0, data: { id, ...data } });
const err = (r: { ok: boolean; error?: string }) => (r.ok ? '' : r.error ?? '');

beforeEach(() => {
  for (const k of Object.keys(db)) delete db[k];
});

describe('indirizzi alla radice', () => {
  it('una categoria non può prendere lo slug di una pagina', async () => {
    db.pages = [row('p1', { title: { it: 'Chi siamo' }, slug: { it: 'chi-siamo' }, home: false, blocks: [] })];
    const r = await validate('categories', 'c1', { name: { it: 'Chi siamo' }, slug: { it: 'chi-siamo' }, intro: {}, blocks: [] }, 'published');
    expect(r.ok).toBe(false);
    expect(err(r)).toContain('Chi siamo');
  });

  it('una pagina non può prendere lo slug di una categoria', async () => {
    db.categories = [row('c1', { name: { it: 'Piscine interrate' }, slug: { it: 'piscine-interrate' }, blocks: [] })];
    const r = await validate('pages', 'p1', { title: { it: 'Piscine interrate' }, blocks: [] }, 'published');
    expect(r.ok).toBe(false);
    expect(err(r)).toContain('Piscine interrate');
  });

  it.each(['prodotti', 'admin', 'realizzazioni', 'en'])('lo slug "%s" è riservato', async (slug) => {
    const r = await validate('pages', 'p1', { title: { it: 'Prova' }, slug: { it: slug }, blocks: [] }, 'published');
    expect(r.ok).toBe(false);
    expect(err(r)).toContain('indirizzo riservato');
  });

  it('RESERVED contiene i pezzi fissi e le lingue', () => {
    for (const s of ['admin', 'api', 'media', 'sitemap.xml', 'robots.txt', 'prodotti', 'products', 'realizzazioni', 'projects', 'it', 'de']) {
      expect(RESERVED.has(s)).toBe(true);
    }
  });
});

describe('pagine', () => {
  it('non ci possono essere due home', async () => {
    db.pages = [row('p1', { title: { it: 'Benvenuti' }, slug: {}, home: true, blocks: [] })];
    const r = await validate('pages', 'p2', { title: { it: 'Altra' }, home: true, blocks: [] }, 'published');
    expect(err(r)).toBe("C'è già una home: Benvenuti");
  });

  it('la home può avere lo slug vuoto', async () => {
    const r = await validate('pages', 'p1', { title: { it: 'Benvenuti' }, slug: {}, home: true, blocks: [] }, 'published');
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.data as { home: boolean }).home).toBe(true);
  });

  it('risalvare la home stessa non è un doppione', async () => {
    db.pages = [row('p1', { title: { it: 'Benvenuti' }, slug: {}, home: true, blocks: [] })];
    const r = await validate('pages', 'p1', { title: { it: 'Benvenuti' }, home: true, blocks: [] }, 'published');
    expect(r.ok).toBe(true);
  });

  it('serve un titolo', async () => {
    const r = await validate('pages', 'p1', { title: {}, blocks: [] }, 'published');
    expect(r.ok).toBe(false);
  });

  it('ricava lo slug dal titolo', async () => {
    const r = await validate('pages', 'p1', { title: { it: 'Chi siamo' }, blocks: [] }, 'draft');
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.data as { slug: Record<string, string>; status: string })).toMatchObject({ slug: { it: 'chi-siamo' }, status: 'draft' });
  });
});

describe('blocchi', () => {
  it('scarta i blocchi di tipo sconosciuto', async () => {
    const r = await validate('pages', 'p1', {
      title: { it: 'Prova' },
      blocks: [{ kind: 'boh', title: { it: 'x' } }, { kind: 'text', text: { it: 'Ciao' } }, null],
    }, 'published');
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.data as { blocks: { kind: string }[] }).blocks.map((b) => b.kind)).toEqual(['text']);
  });

  it('una apertura senza titolo dice il numero del blocco', async () => {
    const r = await validate('pages', 'p1', {
      title: { it: 'Prova' },
      blocks: [{ kind: 'text', text: { it: 'Ciao' } }, { kind: 'hero', title: {} }],
    }, 'published');
    expect(r.ok).toBe(false);
    expect(err(r)).toContain('blocco 2');
  });

  it('rifiuta i link javascript: nei pulsanti', async () => {
    const r = await validate('pages', 'p1', {
      title: { it: 'Prova' },
      blocks: [{ kind: 'cta', title: { it: 'Vieni' }, cta: { label: { it: 'Vai' }, href: 'javascript:alert(1)' } }],
    }, 'published');
    expect(r.ok).toBe(false);
  });

  it('rifiuta pulsanti e foto con indirizzi che il browser porta su un altro sito', async () => {
    for (const href of ['/\\evil.com', '/\t/evil.com', '/\n/evil.com']) {
      const r = await validate('pages', 'p1', {
        title: { it: 'Prova' },
        blocks: [{ kind: 'cta', title: { it: 'Vieni' }, cta: { label: { it: 'Vai' }, href } }],
      }, 'published');
      expect(r.ok, JSON.stringify(href)).toBe(false);
      const h = await validate('pages', 'p1', {
        title: { it: 'Prova' }, cover: href, seo: { image: href },
        blocks: [{ kind: 'hero', title: { it: 'A' }, photo: href, video: href }],
      }, 'published');
      expect(h.ok).toBe(true);
      if (h.ok) {
        const d = h.data as { cover?: string; seo?: { image?: string }; blocks: { photo?: string; video?: string }[] };
        expect(d.cover).toBeUndefined();
        expect(d.seo?.image).toBeUndefined();
        expect(d.blocks[0].photo).toBeUndefined();
        expect(d.blocks[0].video).toBeUndefined();
      }
    }
  });

  it('i pulsanti tengono le forme ammesse', async () => {
    for (const href of ['/chi-siamo/', '#visita', 'https://esempio.it', 'mailto:a@b.it', 'tel:+39000']) {
      const r = await validate('pages', 'p1', {
        title: { it: 'Prova' },
        blocks: [{ kind: 'cta', title: { it: 'Vieni' }, cta: { label: { it: 'Vai' }, href } }],
      }, 'published');
      expect(r.ok, href).toBe(true);
    }
  });

  it('tiene il punto focale solo se ben scritto', async () => {
    const r = await validate('pages', 'p1', {
      title: { it: 'Prova' },
      blocks: [
        { kind: 'hero', title: { it: 'A' }, photo: '/media/foto/x.webp', focus: '30% 70%' },
        { kind: 'hero', title: { it: 'B' }, photo: '/media/foto/x.webp', focus: 'url(evil)' },
      ],
    }, 'published');
    expect(r.ok).toBe(true);
    if (r.ok) {
      const [a, b] = (r.data as { blocks: { focus?: string }[] }).blocks;
      expect(a.focus).toBe('30% 70%');
      expect(b.focus).toBeUndefined();
    }
  });
});

describe('collegamenti', () => {
  it('una realizzazione con una categoria inesistente perde la categoria', async () => {
    const r = await validate('projects', 'r1', { title: { it: 'Villa al mare' }, category: 'non-esiste', intro: {}, photos: [] }, 'published');
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.data as { category?: string }).category).toBeUndefined();
  });

  it('una realizzazione tiene una categoria che esiste', async () => {
    db.categories = [row('c1', { name: { it: 'Interrate' }, slug: { it: 'interrate' }, blocks: [] })];
    const r = await validate('projects', 'r1', { title: { it: 'Villa al mare' }, category: 'c1', intro: {}, photos: [] }, 'published');
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.data as { category?: string }).category).toBe('c1');
  });
});

describe('publicUrl', () => {
  it('categorie e pagine stanno alla radice', () => {
    expect(publicUrl('categories', { slug: { it: 'piscine-interrate' } }, 'it')).toBe('/piscine-interrate/');
    expect(publicUrl('pages', { slug: { it: 'chi-siamo', en: 'about' } }, 'en')).toBe('/en/about/');
  });
  it('prodotti e realizzazioni hanno il loro pezzo fisso', () => {
    expect(publicUrl('projects', { slug: { it: 'villa-al-mare' } }, 'it')).toBe('/realizzazioni/villa-al-mare/');
    expect(publicUrl('products', { slug: { it: 'a', en: 'b' } }, 'en')).toBe('/en/products/b/');
  });
  it('la home sta su /', () => {
    expect(publicUrl('pages', { slug: { it: 'home' }, home: true }, 'it')).toBe('/');
    expect(publicUrl('pages', { slug: {}, home: true }, 'en')).toBe('/en/');
  });
});

describe('articoli', () => {
  const base = { title: { it: 'Primo articolo' }, date: '2026-10-01', author: 'Anna', excerpt: {}, body: { type: 'doc', content: [] } };

  it('ricava lo slug dal titolo e ripulisce il testo', async () => {
    const r = await validate('posts', 'a1', { ...base, body: { type: 'doc', content: [{ type: 'script' }, { type: 'paragraph', content: [{ type: 'text', text: 'ciao' }] }] } }, 'published');
    expect(r.ok).toBe(true);
    const d = (r as { data: Record<string, unknown> }).data;
    expect(d.slug).toEqual({ it: 'primo-articolo', en: 'primo-articolo' });
    expect(d.body).toEqual({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ciao' }] }] });
    expect(typeof d.updatedAt).toBe('number');
  });

  it('lo slug è unico fra gli articoli', async () => {
    db.posts = [row('a0', { title: { it: 'Altro' }, slug: { it: 'primo-articolo' } })];
    const r = await validate('posts', 'a1', base, 'published');
    expect(r.ok).toBe(false);
    expect(err(r)).toContain("dall'articolo");
  });

  it('lo stesso slug di una pagina va bene: stanno sotto il segmento del blog', async () => {
    db.pages = [row('p1', { title: { it: 'Primo articolo' }, slug: { it: 'primo-articolo' }, blocks: [] })];
    expect((await validate('posts', 'a1', base, 'published')).ok).toBe(true);
  });

  it.each(['2026-02-30', '01/10/2026', 'domani'])('la data "%s" non è valida', async (date) => {
    const r = await validate('posts', 'a1', { ...base, date }, 'published');
    expect(r.ok).toBe(false);
    expect(err(r)).toContain('non è una data');
  });

  it('senza data esce oggi', async () => {
    const r = await validate('posts', 'a1', { ...base, date: '' }, 'published');
    expect(r.ok).toBe(true);
    expect((r as { data: { date: string } }).data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('senza titolo non si salva', async () => {
    expect((await validate('posts', 'a1', { ...base, title: {} }, 'published')).ok).toBe(false);
  });
});
