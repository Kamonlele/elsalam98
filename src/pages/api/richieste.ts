import type { APIRoute } from 'astro';
import { booking as rules, features } from '../../lib/brand';
import { hashIp } from '../../lib/booking';
import { emitLead } from '../../lib/events';
import { later } from '../../lib/later';
import { createLead } from '../../lib/leads';
import { parseLead } from '../../lib/lead-input';
import { verifyTurnstile } from '../../lib/antispam';
import { readSettings } from '../../lib/settings';
import { sameOrigin } from '../../lib/auth';

const err = (code: string, status = 400) => Response.json({ error: code }, { status });

/** Richiesta da un modulo del sito. Gli errori tornano come codici: il testo lo sceglie il modulo. */
export const POST: APIRoute = async ({ request, locals, clientAddress, url }) => {
  if (!features.leads) return new Response(null, { status: 404 });
  if (!sameOrigin(request)) return err('origin', 403);
  const raw = await request.json().catch(() => null);
  const parsed = parseLead(raw);
  if (!parsed.ok) return err(parsed.error);
  // Robot: si risponde "ok" senza salvare nulla, così non capisce di essere stato scoperto.
  if ('robot' in parsed) return Response.json({ ok: true, ref: '' });

  const s = await readSettings();
  if (rules.turnstileSiteKey && s.turnstileSecret) {
    if (!(await verifyTurnstile(s.turnstileSecret, String((raw as { turnstile?: unknown }).turnstile ?? ''), clientAddress))) return err('robot', 403);
  }

  const res = await createLead(parsed.lead, await hashIp(clientAddress || request.headers.get('cf-connecting-ip') || 'sconosciuto'));
  if (!res.ok) return err(res.error, res.status);
  await later(locals, emitLead(res.lead, url.origin));
  return Response.json({ ok: true, ref: res.lead.ref });
};
