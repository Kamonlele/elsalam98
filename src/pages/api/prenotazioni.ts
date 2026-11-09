import type { APIRoute } from 'astro';
import { booking as rules, isLocaleCode } from '../../lib/brand';
import { createBooking, hashIp } from '../../lib/booking';
import { emitBooking } from '../../lib/events';
import { later } from '../../lib/later';
import { icsFor } from '../../lib/mail';
import { readSettings } from '../../lib/settings';
import { sameOrigin } from '../../lib/auth';
import { cleanSource, isRobot, verifyTurnstile } from '../../lib/antispam';

type Body = {
  sede?: string; data?: string; ora?: string; prodotto?: string; nome?: string; email?: string; tel?: string; comune?: string;
  risposte?: Record<string, string>; privacy?: boolean; lingua?: string; fonte?: Record<string, string>;
  /** Campo nascosto: le persone non lo vedono, i programmi automatici lo compilano. */
  sito?: string;
  /** Millisecondi passati sulla pagina prima di inviare. */
  ms?: number;
  turnstile?: string;
};

const err = (code: string, status = 400) => Response.json({ error: code }, { status });

/**
 * Nuova prenotazione dal sito. Gli errori tornano come codici: il testo lo sceglie
 * il modulo, nella lingua di chi prenota.
 */
export const POST: APIRoute = async ({ request, locals, clientAddress, url }) => {
  if (!sameOrigin(request)) return err('origin', 403);
  const b = (await request.json().catch(() => null)) as Body | null;
  if (!b) return err('invalid');
  // Robot: si risponde "ok" senza salvare nulla, così non capisce di essere stato scoperto.
  if (isRobot(b)) return Response.json({ ok: true, ref: '' });

  const name = (b.nome ?? '').trim().replace(/\s+/g, ' ').slice(0, 120);
  const email = (b.email ?? '').trim().toLowerCase().slice(0, 200);
  const phone = (b.tel ?? '').trim().slice(0, 40);
  if (name.length < 3) return err('name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('email');
  if (phone.replace(/\D/g, '').length < 8) return err('phone');
  if (!b.privacy) return err('consent');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.data ?? '') || !/^\d{2}:\d{2}$/.test(b.ora ?? '')) return err('slot-gone', 409);
  const city = rules.askCity ? (b.comune ?? '').trim().slice(0, 80) : '';
  if (rules.askCity && city.length < 2) return err('city');

  const answers: Record<string, string> = {};
  for (const q of rules.questions) {
    const v = b.risposte?.[q.id];
    if (v && q.options.some((o) => o.value === v)) answers[q.id] = v;
    else if (q.required) return err(`question:${q.id}`);
  }

  const s = await readSettings();
  if (rules.turnstileSiteKey && s.turnstileSecret) {
    if (!(await verifyTurnstile(s.turnstileSecret, b.turnstile ?? '', clientAddress))) return err('robot', 403);
  }

  const source = cleanSource(b.fonte);

  const res = await createBooking({
    locationId: b.sede ?? '', productId: b.prodotto || undefined, date: b.data!, time: b.ora!,
    name, email, phone, city, answers, source,
    locale: isLocaleCode(b.lingua ?? '') ? (b.lingua as never) : 'it',
    ipHash: await hashIp(clientAddress || request.headers.get('cf-connecting-ip') || 'sconosciuto'),
  });
  if (!res.ok) return err(res.error, res.status);
  await later(locals, emitBooking('prenotazione.creata', res.booking, url.origin));
  return Response.json({ ok: true, ref: res.booking.ref, status: res.booking.status, ics: await icsFor(res.booking, url.host) });
};
