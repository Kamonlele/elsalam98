import type { APIRoute } from 'astro';
import { brand, DEFAULT_LOCALE, features } from '../../lib/brand';
import { localNow } from '../../lib/booking';
import { blogSegment, visiblePosts } from '../../lib/routes';
import { postRss } from '../../lib/seo';
import { list } from '../../lib/store';

/** Feed RSS su /<segmento del blog>/rss.xml. Ogni altro "/qualcosa/rss.xml" non esiste. */
export const GET: APIRoute = async ({ params }) => {
  if (!features.blog || params.blog !== blogSegment(DEFAULT_LOCALE)) return new Response('Non trovato', { status: 404 });
  const origin = brand.identity.siteUrl.replace(/\/$/, '');
  const posts = visiblePosts(await list('posts'), localNow().date);
  return new Response(postRss(origin, posts), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
