import type { APIRoute } from 'astro';
import { availability } from '../../lib/booking';
import { list } from '../../lib/store';

/** Giorni e orari liberi di una sede. Si ricalcola a ogni richiesta: niente cache. */
export const GET: APIRoute = async ({ url }) => {
  const loc = (await list('locations')).find((l) => l.id === url.searchParams.get('sede'));
  if (!loc) return Response.json({ error: 'Sede non trovata.' }, { status: 404 });
  return Response.json({ days: await availability(loc) }, { headers: { 'cache-control': 'no-store' } });
};
