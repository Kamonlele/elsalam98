import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { isMediaKey, parseRange } from '../../lib/media-keys';

/**
 * Serve foto, modelli e video caricati dall'area riservata. I nomi sono unici, quindi
 * si possono tenere in cache per sempre. I video si leggono a pezzi (Range): il browser
 * li fa partire subito e si può andare avanti e indietro senza scaricarli interi.
 */
export const GET: APIRoute = async ({ params, request }) => {
  const key = params.key ?? '';
  if (!isMediaKey(key) || !env.MEDIA) return new Response('Non trovato', { status: 404 });
  const headers = new Headers({
    'cache-control': 'public, max-age=31536000, immutable',
    'accept-ranges': 'bytes',
    'x-content-type-options': 'nosniff',
  });
  const asked = request.headers.get('range');

  if (asked) {
    const head = await env.MEDIA.head(key);
    if (!head) return new Response('Non trovato', { status: 404 });
    const range = parseRange(asked, head.size);
    if (!range) {
      headers.set('content-range', `bytes */${head.size}`);
      return new Response(null, { status: 416, headers });
    }
    const part = await env.MEDIA.get(key, { range });
    if (!part) return new Response('Non trovato', { status: 404 });
    part.writeHttpMetadata(headers);
    headers.set('etag', part.httpEtag);
    headers.set('content-range', `bytes ${range.offset}-${range.offset + range.length - 1}/${head.size}`);
    headers.set('content-length', String(range.length));
    return new Response(part.body, { status: 206, headers });
  }

  const object = await env.MEDIA.get(key);
  if (!object) return new Response('Non trovato', { status: 404 });
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('content-length', String(object.size));
  return new Response(object.body, { headers });
};
