import type { APIRoute } from 'astro';
import { retryNow } from '../../../../lib/webhooks';

export const POST: APIRoute = async ({ request }) => {
  const { id } = ((await request.json().catch(() => null)) ?? {}) as { id?: string };
  if (!id || !(await retryNow(id))) return Response.json({ error: 'Invio non trovato.' }, { status: 404 });
  return Response.json({ ok: true });
};
