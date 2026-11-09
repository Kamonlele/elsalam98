import type { APIRoute } from 'astro';
import { brand } from '../../../../lib/brand';
import { dispatch } from '../../../../lib/webhooks';

/** Manda un evento "prova" a un solo webhook, per controllare che chi riceve funzioni. */
export const POST: APIRoute = async ({ request, url }) => {
  const { id } = ((await request.json().catch(() => null)) ?? {}) as { id?: string };
  if (!id) return Response.json({ error: 'Manca il webhook.' }, { status: 400 });
  await dispatch('prova', {
    event: 'prova', sent_at: new Date().toISOString(), site: brand.identity.name,
    message: 'Prova dal pannello. Se la vedi, il collegamento funziona.', admin_url: `${url.origin}/admin/impostazioni`,
  }, id);
  return Response.json({ ok: true });
};
