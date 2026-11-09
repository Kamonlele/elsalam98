import type { APIRoute } from 'astro';
import { isCollection, reorder } from '../../../lib/store';

/** Nuovo ordine di una collezione: l'elenco degli id dal primo all'ultimo. */
export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as { collection?: string; ids?: unknown } | null;
  if (!isCollection(body?.collection ?? '') || !Array.isArray(body?.ids)) return Response.json({ error: 'Richiesta non valida.' }, { status: 400 });
  const ids = (body!.ids as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, 500);
  await reorder(body!.collection as never, ids);
  return Response.json({ ok: true });
};
