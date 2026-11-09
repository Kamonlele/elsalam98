import { describe, expect, it } from 'vitest';
import { menu, resolve, type Site } from '../src/lib/routes';
import type { Category, Page, Product, Project } from '../src/lib/content';

const base = { status: 'published' as const, sort: 0 };
const page = (id: string, slug: string, extra: Partial<Page> = {}): Page =>
  ({ ...base, id, slug: { it: slug, en: slug + '-en' }, title: { it: id }, home: false, inMenu: false, blocks: [], ...extra });
const category = (id: string, slug: string): Category =>
  ({ ...base, id, slug: { it: slug, en: slug + '-en' }, name: { it: id, en: id + ' en' }, intro: { it: '' }, blocks: [] });
const product = (id: string, slug: string) =>
  ({ ...base, id, slug: { it: slug, en: slug + '-en' }, name: { it: id } }) as unknown as Product;
const project = (id: string, slug: string) =>
  ({ ...base, id, slug: { it: slug, en: slug + '-en' }, title: { it: id }, intro: { it: '' }, photos: [] }) as unknown as Project;

const home = page('home', 'home', { home: true });
const site: Site = {
  pages: [home, page('chi', 'chi-siamo', { inMenu: true }), page('privacy', 'privacy')],
  categories: [category('interrate', 'piscine-interrate'), category('fuori', 'fuori-terra')],
  products: [product('p', 'x')],
  projects: [project('r', 'y')],
};

describe('resolve', () => {
  it('"/" mostra la pagina home se c\'è', () => {
    expect(resolve([], 'it', site)).toEqual({ kind: 'home', page: home });
  });
  it('"/" senza pagina home non ha page', () => {
    expect(resolve([], 'it', { ...site, pages: [] })).toEqual({ kind: 'home' });
  });
  it('un pezzo: categoria o pagina', () => {
    expect(resolve(['piscine-interrate'], 'it', site)).toEqual({ kind: 'category', category: site.categories[0] });
    expect(resolve(['chi-siamo'], 'it', site)).toEqual({ kind: 'page', page: site.pages[1] });
  });
  it('prodotto e realizzazione con il pezzo fisso della lingua', () => {
    expect(resolve(['prodotti', 'x'], 'it', site)).toEqual({ kind: 'product', product: site.products[0] });
    expect(resolve(['realizzazioni', 'y'], 'it', site)).toEqual({ kind: 'project', project: site.projects[0] });
    expect(resolve(['products', 'x-en'], 'en', site).kind).toBe('product');
    expect(resolve(['projects', 'y-en'], 'en', site).kind).toBe('project');
    expect(resolve(['chi-siamo-en'], 'en', site).kind).toBe('page');
  });
  it('tutto il resto è missing', () => {
    expect(resolve(['prodotti'], 'it', site).kind).toBe('missing');
    expect(resolve(['a', 'b', 'c'], 'it', site).kind).toBe('missing');
    expect(resolve(['non-esiste'], 'it', site).kind).toBe('missing');
    expect(resolve(['prodotti', 'non-esiste'], 'it', site).kind).toBe('missing');
    expect(resolve(['products', 'x'], 'it', site).kind).toBe('missing');
  });
  it('la home vive solo su "/"', () => {
    expect(resolve(['home'], 'it', site).kind).toBe('missing');
  });
});

describe('menu', () => {
  it('prima le categorie, poi le pagine nel menu, con gli indirizzi della lingua', () => {
    expect(menu(site, 'it')).toEqual([
      { label: 'interrate', href: '/piscine-interrate/' },
      { label: 'fuori', href: '/fuori-terra/' },
      { label: 'chi', href: '/chi-siamo/' },
    ]);
    expect(menu(site, 'en')[0]).toEqual({ label: 'interrate en', href: '/en/piscine-interrate-en/' });
  });
  it('la pagina home non compare nel menu anche se inMenu', () => {
    const s = { ...site, pages: [{ ...home, inMenu: true }] };
    expect(menu(s, 'it')).toHaveLength(2);
  });
});
