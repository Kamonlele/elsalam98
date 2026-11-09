import { describe, expect, it, vi } from 'vitest';
import { seed } from '../src/lib/seed';

// Le uniche cose già "nel database" sono gli esempi stessi, come dopo "Copia gli esempi qui".
vi.mock('../src/lib/store', async () => {
  const { seed } = await import('../src/lib/seed');
  return {
    listAll: vi.fn(async (name: keyof typeof seed) =>
      (seed[name] as { id: string; status?: string }[]).map((d) => ({ id: d.id, status: d.status ?? 'published', sort: 0, updatedAt: 0, data: d }))),
  };
});

const { validate } = await import('../src/lib/validate');

type Item = { id: string; status?: 'published' | 'draft' };
// La validazione aggiunge testi vuoti ({}) dove un campo facoltativo manca: non è una differenza.
const strip = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(strip);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, strip(x)])
      .filter(([, x]) => !(x && typeof x === 'object' && !Array.isArray(x) && !Object.keys(x).length)));
  }
  return v;
};
const names = Object.keys(seed) as (keyof typeof seed)[];

describe('esempi di seed.ts', () => {
  for (const name of names) {
    it.each((seed[name] as Item[]).map((i) => [i.id, i] as const))(`${name}: %s passa dai controlli`, async (_id, item) => {
      const r = await validate(name, item.id, structuredClone(item), item.status ?? 'published');
      expect(r.ok, r.ok ? '' : r.error).toBe(true);
    });
  }

  it('i controlli non cambiano blocchi, categorie e testo degli esempi', async () => {
    for (const name of ['pages', 'categories'] as const) {
      for (const item of seed[name]) {
        const r = await validate(name, item.id, structuredClone(item), 'published');
        expect(strip(r.ok && (r.data as typeof item).blocks)).toEqual(strip(item.blocks));
      }
    }
    for (const item of [...seed.products, ...seed.projects]) {
      const r = await validate(item.id.includes('realizzazione') ? 'projects' : 'products', item.id, structuredClone(item), 'published');
      expect(r.ok && (r.data as typeof item).category).toBe(item.category);
    }
    for (const item of seed.posts) {
      const r = await validate('posts', item.id, structuredClone(item), 'published');
      expect(r.ok && (r.data as typeof item).body).toEqual(item.body);
    }
  });

  it('ha esattamente una home e un articolo con data futura', () => {
    expect(seed.pages.filter((p) => p.home)).toHaveLength(1);
    expect(seed.posts.filter((p) => p.date > '2030-01-01')).toHaveLength(1);
  });
});
