import { describe, expect, it } from 'vitest';
import { adminArea, canEditItem, canOpen, isEditableText, isRole, keepSlug, mergeTexts, normalisePath, textOnlyCollections } from '../src/lib/roles';
import { SCHEMAS } from '../src/lib/schema';

const fields = (name: keyof typeof SCHEMAS) => SCHEMAS[name].sections.flatMap((s) => s.fields);

describe('canOpen', () => {
  it('segue la tabella dei permessi', () => {
    expect(canOpen('autore', '/admin/impostazioni', 'GET')).toBe(false);
    expect(canOpen('autore', '/api/admin/items/posts/abc', 'PUT')).toBe(true);
    expect(canOpen('redattore', '/api/admin/items/pages/abc', 'DELETE')).toBe(false);
    expect(canOpen('redattore', '/api/admin/order', 'POST')).toBe(false);
    expect(canOpen('autore', '/api/admin/items/pages/abc', 'PUT')).toBe(false);
  });

  it("l'amministratore apre tutto", () => {
    for (const [p, m] of [['/admin/impostazioni', 'GET'], ['/api/admin/users', 'POST'], ['/api/admin/order', 'POST'], ['/qualsiasi', 'DELETE'], ['', 'PATCH']]) {
      expect(canOpen('admin', p, m)).toBe(true);
    }
  });

  it("l'autore lavora solo sugli articoli", () => {
    expect(canOpen('autore', '/admin', 'GET')).toBe(true);
    expect(canOpen('autore', '/admin/articoli', 'GET')).toBe(true);
    expect(canOpen('autore', '/admin/articoli/nuovo', 'GET')).toBe(true);
    expect(canOpen('autore', '/admin/articoli/abc', 'GET')).toBe(true);
    expect(canOpen('autore', '/api/admin/items/posts/abc', 'DELETE')).toBe(true);
    expect(canOpen('autore', '/api/admin/items/posts/abc', 'GET')).toBe(true);
    expect(canOpen('autore', '/api/admin/upload', 'POST')).toBe(true);
    expect(canOpen('autore', '/api/admin/session', 'DELETE')).toBe(true);
    expect(canOpen('autore', '/api/admin/users', 'PATCH')).toBe(true);
    expect(canOpen('autore', '/admin/accessi', 'GET')).toBe(true);
    for (const p of ['/admin/pagine', '/admin/pagine/abc', '/admin/categorie', '/admin/prodotti', '/admin/sedi', '/admin/realizzazioni',
      '/admin/prenotazioni', '/admin/richieste', '/admin/redirect']) {
      expect(canOpen('autore', p, 'GET'), p).toBe(false);
    }
    for (const [p, m] of [['/api/admin/users', 'GET'], ['/api/admin/users', 'POST'], ['/api/admin/users', 'PUT'], ['/api/admin/users', 'DELETE'],
      ['/api/admin/seed', 'POST'], ['/api/admin/order', 'POST'], ['/api/admin/settings', 'PUT'], ['/api/admin/redirect', 'POST'],
      ['/api/admin/programmata', 'POST'], ['/api/admin/webhooks/test', 'POST'], ['/api/admin/prenotazioni/abc', 'PATCH'],
      ['/api/admin/prenotazioni.csv', 'GET'], ['/api/admin/richieste/abc', 'PATCH'], ['/api/admin/items/categories/abc', 'GET'],
      ['/api/admin/items/products/abc', 'PUT'], ['/api/admin/upload', 'GET'], ['/api/admin/items/posts', 'GET'],
      ['/api/admin/items/posts/abc/x', 'PUT'], ['/api/admin/items/posts/abc', 'POST'], ['/admin/articoli/abc', 'POST'],
      ['/admin/articoli/abc/x', 'GET'], ['/api/admin/uploadx', 'POST']]) {
      expect(canOpen('autore', p, m), `${m} ${p}`).toBe(false);
    }
  });

  it('il redattore cambia i testi di pagine e categorie ma non le crea né le toglie', () => {
    expect(canOpen('redattore', '/admin/pagine', 'GET')).toBe(true);
    expect(canOpen('redattore', '/admin/pagine/abc', 'GET')).toBe(true);
    expect(canOpen('redattore', '/admin/categorie/abc', 'GET')).toBe(true);
    expect(canOpen('redattore', '/admin/pagine/nuovo', 'GET')).toBe(false);
    expect(canOpen('redattore', '/admin/categorie/nuovo', 'GET')).toBe(false);
    expect(canOpen('redattore', '/api/admin/items/pages/abc', 'GET')).toBe(true);
    expect(canOpen('redattore', '/api/admin/items/pages/abc', 'PUT')).toBe(true);
    expect(canOpen('redattore', '/api/admin/items/categories/abc', 'PUT')).toBe(true);
    expect(canOpen('redattore', '/api/admin/items/categories/abc', 'DELETE')).toBe(false);
    expect(canOpen('redattore', '/api/admin/items/products/abc', 'PUT')).toBe(false);
    expect(canOpen('redattore', '/api/admin/seed', 'POST')).toBe(false);
    expect(canOpen('redattore', '/admin/prodotti', 'GET')).toBe(false);
    expect(canOpen('redattore', '/api/admin/items/posts/abc', 'DELETE')).toBe(true);
  });

  it('non si aggira con barre, maiuscole o caratteri codificati', () => {
    for (const p of ['/admin/impostazioni/', '/admin//impostazioni', '//admin/impostazioni', '/ADMIN/Impostazioni', '/admin/%69mpostazioni',
      '/admin/articoli/../impostazioni', '/admin/articoli/%2e%2e/impostazioni', '/admin/articoli%2f..%2fimpostazioni', '/admin/articoli\\..\\impostazioni',
      '/admin/%E0%A4%A', '/admin/articoli/%2561', '/admin/./impostazioni', '/admin/articoli/abc%00']) {
      expect(canOpen('autore', p, 'GET'), p).toBe(false);
    }
    for (const p of ['/api/admin/items/pages/abc/', '/api/admin//items/pages/abc', '/api/admin/items/PAGES/abc', '/api/admin/items/pages%2fabc',
      '/api/admin/items/posts/../pages/abc', '/api/admin/items/posts/..%2fpages%2fabc']) {
      expect(canOpen('autore', p, 'PUT'), p).toBe(false);
    }
    expect(canOpen('redattore', '/api/admin/items/pages/abc', 'delete')).toBe(false);
    expect(canOpen('autore', '/admin/articoli/', 'GET')).toBe(true);
    expect(canOpen('autore', '/api/admin/items/posts/abc', 'put')).toBe(true);
  });

  it('un ruolo sconosciuto non apre niente', () => {
    expect(canOpen('ospite' as never, '/admin', 'GET')).toBe(false);
    expect(canOpen(undefined as never, '/admin', 'GET')).toBe(false);
  });
});

describe('normalisePath e adminArea', () => {
  it('normalizza e rifiuta i percorsi ambigui', () => {
    expect(normalisePath('/Admin//Articoli/')).toBe('/admin/articoli');
    expect(normalisePath('/')).toBe('/');
    expect(normalisePath('/admin/%zz')).toBeNull();
    expect(normalisePath('/admin/a/../b')).toBeNull();
  });
  it("riconosce l'area riservata anche scritta in modo strano", () => {
    expect(adminArea('/admin')).toBe('page');
    expect(adminArea('/admin/articoli')).toBe('page');
    expect(adminArea('//ADMIN/impostazioni')).toBe('page');
    expect(adminArea('/%61dmin/impostazioni')).toBe('page');
    expect(adminArea('/api/admin/users')).toBe('api');
    expect(adminArea('/API//admin/users')).toBe('api');
    expect(adminArea('/admin/%zz')).toBe('page');
    expect(adminArea('/api/admin/%zz')).toBe('api');
    expect(adminArea('/%61dmin/%zz')).toBe('page');
    expect(adminArea('/api/%61dmin/%zz')).toBe('api');
    expect(adminArea('/administrator')).toBeNull();
    expect(adminArea('/prodotti/piscina')).toBeNull();
    expect(adminArea('/x%5Cy')).toBeNull();
  });
});

describe('canEditItem', () => {
  it('rispecchia i permessi delle collezioni', () => {
    expect(canEditItem('admin', 'products', 'DELETE')).toBe(true);
    expect(canEditItem('autore', 'posts', 'PUT')).toBe(true);
    expect(canEditItem('autore', 'pages', 'GET')).toBe(false);
    expect(canEditItem('redattore', 'pages', 'PUT')).toBe(true);
    expect(canEditItem('redattore', 'pages', 'DELETE')).toBe(false);
    expect(canEditItem('redattore', 'locations', 'GET')).toBe(false);
  });
  it('pagine e categorie sono a solo testo', () => {
    expect(textOnlyCollections).toEqual(['pages', 'categories']);
  });
  it('isRole', () => {
    expect(isRole('admin')).toBe(true);
    expect(isRole('redattore')).toBe(true);
    expect(isRole('autore')).toBe(true);
    expect(isRole('Admin')).toBe(false);
    expect(isRole('')).toBe(false);
  });
});

describe('mergeTexts', () => {
  const existing = {
    title: { it: 'Chi siamo' },
    slug: { it: 'chi-siamo' },
    home: false,
    inMenu: true,
    blocks: [
      { kind: 'textPhoto', title: { it: 'La storia' }, text: { it: 'Vecchio testo' }, photo: '/media/foto/vecchia', side: 'left', cta: { label: { it: 'Scopri' }, href: '/prodotti/' } },
      { kind: 'gallery', title: { it: 'Foto' }, photos: [{ src: '/media/foto/a', caption: { it: 'A' } }] },
      { kind: 'projects', title: { it: 'Lavori' }, limit: '6' },
    ],
    seo: { title: { it: 'SEO vecchio' }, image: '/media/foto/seo-vecchia' },
  };

  it('prende solo i testi e lascia tutto il resto com\'era', () => {
    const incoming = {
      title: { it: 'Chi siamo davvero', en: 'About us' },
      slug: { it: 'nuovo-indirizzo' },
      home: true,
      inMenu: false,
      status: 'draft',
      blocks: [
        { kind: 'textPhoto', title: { it: 'La nostra storia' }, text: { it: 'Testo nuovo' }, photo: '/media/foto/nuova', side: 'right', cta: { label: { it: 'Vai' }, href: '/' } },
        { kind: 'gallery', title: { it: 'Galleria' }, photos: [{ src: '/media/foto/b', caption: { it: 'B' } }] },
        { kind: 'projects', title: { it: 'I lavori' }, limit: '99' },
        { kind: 'text', title: { it: 'Blocco in più' }, text: { it: 'x' } },
      ],
      seo: { title: { it: 'SEO nuovo' }, description: { it: 'Descrizione' }, image: '/media/foto/seo-nuova' },
    };
    const out = mergeTexts(existing, incoming, fields('pages')) as typeof existing & Record<string, unknown>;
    expect(out.title).toEqual({ it: 'Chi siamo davvero', en: 'About us' });
    expect(out.slug).toEqual({ it: 'chi-siamo' });
    expect(out.home).toBe(false);
    expect(out.inMenu).toBe(true);
    expect(out.status).toBeUndefined();
    expect(out.blocks).toHaveLength(3);
    expect(out.blocks[0]).toMatchObject({ kind: 'textPhoto', title: { it: 'La nostra storia' }, text: { it: 'Testo nuovo' }, photo: '/media/foto/vecchia', side: 'left' });
    // Il testo del pulsante sì, l'indirizzo no.
    expect(out.blocks[0]).toMatchObject({ cta: { label: { it: 'Vai' }, href: '/prodotti/' } });
    expect(out.blocks[2]).toEqual({ kind: 'projects', title: { it: 'I lavori' }, limit: '6' });
    expect(out.blocks[1]).toMatchObject({ kind: 'gallery', title: { it: 'Galleria' }, photos: [{ src: '/media/foto/a', caption: { it: 'A' } }] });
    expect(out.seo).toEqual({ title: { it: 'SEO nuovo' }, description: { it: 'Descrizione' }, image: '/media/foto/seo-vecchia' });
    // L'originale non si tocca.
    expect(existing.title).toEqual({ it: 'Chi siamo' });
  });

  it('un blocco in meno o spostato non cambia la struttura', () => {
    const fewer = mergeTexts(existing, { blocks: [{ kind: 'gallery', title: { it: 'Spostato' } }] }, fields('pages')) as typeof existing;
    expect(fewer.blocks).toHaveLength(3);
    // Il primo blocco ora è di un altro tipo: niente testi scambiati fra blocchi.
    expect(fewer.blocks[0].title).toEqual({ it: 'La storia' });
    expect(fewer.blocks[1].title).toEqual({ it: 'Foto' });
  });

  it('ignora valori di forma sbagliata e chiavi pericolose', () => {
    const bad = JSON.parse('{"title":{"it":"Ok","__proto__":{"x":1},"en":5},"blocks":"no","seo":"no"}');
    const out = mergeTexts(existing, bad, fields('pages')) as Record<string, unknown>;
    expect(out.title).toEqual({ it: 'Ok' });
    expect(({} as Record<string, unknown>).x).toBeUndefined();
    expect((out.blocks as unknown[]).length).toBe(3);
    expect(out.seo).toEqual(existing.seo);
    expect(mergeTexts(existing, null, fields('pages'))).toEqual(existing);
  });

  it('funziona anche sulle categorie (punti di forza dentro i blocchi)', () => {
    const cat = { name: { it: 'Piscine' }, intro: { it: 'Intro' }, slug: { it: 'piscine' }, cover: '/media/foto/c',
      blocks: [{ kind: 'values', title: { it: 'Perché' }, items: [{ title: { it: 'Uno' }, text: { it: 'a' } }] }] };
    const out = mergeTexts(cat, { name: { it: 'Piscine in legno' }, cover: '/media/foto/x',
      blocks: [{ kind: 'values', title: { it: 'Perché noi' }, items: [{ title: { it: 'Primo' }, text: { it: 'b' } }, { title: { it: 'Due' } }] }] }, fields('categories')) as typeof cat;
    expect(out.name).toEqual({ it: 'Piscine in legno' });
    expect(out.cover).toBe('/media/foto/c');
    expect(out.blocks[0]).toEqual({ kind: 'values', title: { it: 'Perché noi' }, items: [{ title: { it: 'Primo' }, text: { it: 'b' } }] });
  });
});

describe('campi strutturali', () => {
  it('indirizzi e quantità non sono testi modificabili, nemmeno senza il flag', () => {
    const all = Object.values(SCHEMAS).flatMap((s) => s.sections.flatMap((x) => x.fields));
    const walk = (fs: typeof all): typeof all => fs.flatMap((f) => [f, ...(f.type === 'group' || f.type === 'list' ? walk(f.fields) : f.type === 'blocks' ? f.kinds.flatMap((k) => walk(k.fields)) : [])]);
    const texts = walk(all).filter((f) => f.type === 'text');
    for (const f of texts.filter((f) => /slug|href|limit/.test(f.key))) expect(isEditableText(f), f.key).toBe(false);
    expect(isEditableText({ type: 'text', key: 'cta.href', label: 'x' })).toBe(false);
    expect(isEditableText({ type: 'text', key: 'slug', label: 'x' })).toBe(false);
    expect(isEditableText({ type: 'text', key: 'cta.label', label: 'x' })).toBe(true);
  });

  it('keepSlug rimette lo slug salvato, anche se vuoto', () => {
    expect(keepSlug({ slug: { it: 'chi-siamo' } }, { title: { it: 'Nuovo' }, slug: { it: 'nuovo' } })).toEqual({ title: { it: 'Nuovo' }, slug: { it: 'chi-siamo' } });
    expect(keepSlug({ slug: {} }, { slug: { it: 'ricavato-dal-titolo' } })).toEqual({ slug: {} });
    expect(keepSlug({ home: true }, { home: true, slug: { it: 'x' } })).toEqual({ home: true, slug: {} });
  });
});
