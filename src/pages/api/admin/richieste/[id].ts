import type { APIRoute } from 'astro';
import { features } from '../../../../lib/brand';
import { setLeadStatus } from '../../../../lib/leads';

export const PATCH: APIRoute = async ({ params, request }) => {
  if (!features.leads) return new Response(null, { status: 404 });
  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  if (body?.status !== 'nuova' && body?.status !== 'gestita') return Response.json({ error: 'Stato non valido.' }, { status: 400 });
  await setLeadStatus(params.id ?? '', body.status);
  return Response.json({ ok: true });
};
