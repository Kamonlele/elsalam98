import type { APIRoute } from 'astro';
import { LOCALES, brand, features } from '../lib/brand';
import { localNow } from '../lib/booking';
import { url, type T } from '../lib/i18n';
import { postsPageUrl, publicUrl, visiblePosts, type Kind } from '../lib/routes';
import { buildSitemap } from '../lib/seo';
import { list } from '../lib/store';

export const GET: APIRoute = async () => {
  const origin = brand.identity.siteUrl.replace(/\/$/, '');
  const kinds: Kind[] = ['pages', 'categories', 'products', 'projects'];
  const lists = await Promise.all(kinds.map((k) => list(k)));
  const posts = features.blog ? visiblePosts(await list('posts'), localNow().date) : [];
  // Senza lastmod: la lista pubblica non porta la data di modifica, e una data inventata peggiora il segnale.
  // Gli articoli sì: la salvano a ogni modifica. L'elenco no: cambia anche quando esce un articolo programmato.
  const entries = new Map<string, number | undefined>();
  for (const l of LOCALES) {
    entries.set(url(l), undefined);
    kinds.forEach((k, i) => lists[i].forEach((item) => entries.set(publicUrl(k, item as { slug: T; home?: boolean }, l), undefined)));
    if (features.blog) {
      entries.set(postsPageUrl(l, 1), undefined);
      for (const p of posts) entries.set(publicUrl('posts', p, l), p.updatedAt);
    }
  }
  return new Response(buildSitemap([...entries].map(([p, lastmod]) => ({ loc: origin + p, lastmod }))), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
