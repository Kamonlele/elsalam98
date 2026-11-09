import { describe, expect, it } from 'vitest';
import { publicUrl, RESERVED, resolve, visiblePosts, POSTS_PER_PAGE, type Site } from '../src/lib/routes';
import type { Post } from '../src/lib/content';
import { postRss } from '../src/lib/seo';

const post = (id: string, date: string, extra: Partial<Post> = {}): Post => ({
  id, status: 'published', sort: 0, slug: { it: id }, title: { it: 'Articolo ' + id }, date, author: 'Redazione',
  excerpt: { it: '' }, body: { type: 'doc', content: [] }, ...extra,
});

const today = '2026-10-24';
const posts = [
  post('vecchio', '2026-01-10'),
  post('oggi', today),
  post('bozza', '2026-05-01', { status: 'draft' }),
  post('domani', '2026-10-25'),
  post('medio', '2026-06-01'),
];
const site: Site = { pages: [], categories: [], products: [], projects: [], posts };

describe('visiblePosts', () => {
  it('esclude bozze e date future, dal più recente', () => {
    expect(visiblePosts(posts, today).map((p) => p.id)).toEqual(['oggi', 'medio', 'vecchio']);
  });
});

describe('indirizzi degli articoli', () => {
  it('publicUrl sta sotto il segmento del blog', () => {
    expect(publicUrl('posts', post('ciao', today), 'it')).toBe('/news/ciao/');
    expect(publicUrl('posts', post('ciao', today), 'en')).toBe('/en/news/ciao/');
  });
  it('il segmento del blog è riservato', () => {
    expect(RESERVED.has('news')).toBe(true);
  });
});

describe('resolve per gli articoli', () => {
  const many: Site = { ...site, posts: Array.from({ length: 13 }, (_, i) => post(`a${i}`, `2026-01-${String(i + 1).padStart(2, '0')}`)) };
  it('/news/ è la pagina 1 dell\'elenco', () => {
    expect(resolve(['news'], 'it', site, { today })).toEqual({ kind: 'posts', page: 1 });
  });
  it('/news/pagina/2/ esiste solo se ci sono abbastanza articoli', () => {
    expect(POSTS_PER_PAGE).toBe(12);
    expect(resolve(['news', 'pagina', '2'], 'it', many, { today })).toEqual({ kind: 'posts', page: 2 });
    expect(resolve(['news', 'pagina', '3'], 'it', many, { today }).kind).toBe('missing');
    expect(resolve(['news', 'pagina', '2'], 'it', site, { today }).kind).toBe('missing');
  });
  it('la pagina 1 vive solo su /news/', () => {
    expect(resolve(['news', 'pagina', '1'], 'it', many, { today }).kind).toBe('missing');
    expect(resolve(['news', 'pagina', '02'], 'it', many, { today }).kind).toBe('missing');
    expect(resolve(['news', 'pagina', 'x'], 'it', many, { today }).kind).toBe('missing');
  });
  it('un articolo visibile si apre, uno futuro o in bozza no', () => {
    expect(resolve(['news', 'oggi'], 'it', site, { today })).toEqual({ kind: 'post', post: posts[1] });
    expect(resolve(['news', 'domani'], 'it', site, { today }).kind).toBe('missing');
    expect(resolve(['news', 'bozza'], 'it', site, { today }).kind).toBe('missing');
  });
  it('senza la data di oggi nessun articolo è visibile', () => {
    expect(resolve(['news', 'oggi'], 'it', site).kind).toBe('missing');
  });
  it('con features.blog spento tutto è missing', () => {
    expect(resolve(['news'], 'it', site, { today, blog: false }).kind).toBe('missing');
    expect(resolve(['news', 'oggi'], 'it', site, { today, blog: false }).kind).toBe('missing');
  });
});

describe('postRss', () => {
  it('RSS 2.0 con gli articoli dati, testi escapati', () => {
    const xml = postRss('https://www.esempio.it', [post('a', '2026-10-01', { title: { it: 'A & <B>' }, excerpt: { it: 'Breve' } })]);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('<title>A &amp; &lt;B&gt;</title>');
    expect(xml).toContain('<link>https://www.esempio.it/news/a/</link>');
    expect(xml).toContain('<pubDate>Thu, 01 Oct 2026 00:00:00 GMT</pubDate>');
    expect(xml).toContain('<description>Breve</description>');
    expect(xml.match(/<item>/g)).toHaveLength(1);
  });
  it('toglie i caratteri di controllo dai testi', () => {
    const xml = postRss('https://www.esempio.it', [post('a', '2026-10-01', { title: { it: 'A\u0000B\u0008C' } })]);
    expect(xml).toContain('<title>ABC</title>');
  });
});
