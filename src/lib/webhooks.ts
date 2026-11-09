import { env } from 'cloudflare:workers';
import { booking as rules, brand, DEFAULT_LOCALE } from './brand';
import { isoWithOffset, type Booking } from './booking';
import { ensureTables } from './db';
import { t } from './i18n';
import { readSettings, type Webhook } from './settings';

export const EVENTS = [
  'prenotazione.creata', 'prenotazione.confermata', 'prenotazione.spostata', 'prenotazione.annullata',
  'prenotazione.presente', 'prenotazione.assente', 'promemoria.inviato', 'lead.creato',
] as const;
export type EventName = (typeof EVENTS)[number] | 'prova';

/** Attese tra un tentativo e l'altro: 1 min, 5 min, 30 min, 2 ore, 6 ore, 24 ore. Poi si rinuncia. */
const BACKOFF_MIN = [1, 5, 30, 120, 360, 1440];

/**
 * Dati inviati ai webhook. Nomi piatti e prevedibili, così GHL, Make o Zapier li
 * mappano senza trasformazioni: contatto separato in nome e cognome, data con fuso.
 */
export function bookingPayload(event: EventName, b: Booking, origin: string) {
  const [first, ...rest] = b.name.trim().split(/\s+/);
  const answers: Record<string, string> = {};
  const answersText: string[] = [];
  for (const [id, value] of Object.entries(b.answers)) {
    const q = rules.questions.find((x) => x.id === id);
    const opt = q?.options.find((o) => o.value === value);
    answers[id] = value;
    answersText.push(`${q ? t(q.label, DEFAULT_LOCALE) : id}: ${opt ? t(opt.label, DEFAULT_LOCALE) : value}`);
  }
  return {
    event,
    sent_at: new Date().toISOString(),
    site: brand.identity.name,
    booking: {
      id: b.id, ref: b.ref, status: b.status, date: b.date, time: b.time,
      start: isoWithOffset(b.date, b.time), duration_minutes: rules.visitMinutes,
      location_id: b.locationId, location: b.locationLabel,
      product_id: b.productId, product: b.productName,
      locale: b.locale, note: b.note, created_at: new Date(b.createdAt).toISOString(),
      admin_url: `${origin}/admin/prenotazioni`,
    },
    contact: { first_name: first ?? '', last_name: rest.join(' '), name: b.name, email: b.email, phone: b.phone, city: b.city },
    answers,
    answers_text: answersText.join('\n'),
    source: b.source,
  };
}

const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (x) => x.toString(16).padStart(2, '0')).join('');

/**
 * Firma HMAC-SHA256 di "timestamp.corpo", nell'intestazione X-Kamon-Signature: t=...,v1=...
 * Chi riceve ricalcola la firma con il segreto e scarta le richieste vecchie di oltre 5 minuti.
 */
export async function sign(secret: string, body: string, ts: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return `t=${ts},v1=${hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${ts}.${body}`)))}`;
}

type Delivery = { id: string; endpoint_id: string; endpoint_name: string; event: string; payload: string; status: string; attempts: number };

async function attempt(d: Delivery, hook: Webhook | undefined) {
  const now = Date.now();
  if (!hook || !hook.active) {
    await env.DB.prepare(`UPDATE webhook_deliveries SET status = 'fallito', last_error = ?, updated_at = ?, next_at = NULL WHERE id = ?`)
      .bind('Webhook tolto o spento', now, d.id).run();
    return;
  }
  const ts = Math.floor(now / 1000);
  let code = 0;
  let error = '';
  try {
    const res = await Promise.race([
      fetch(hook.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'Kamon-Showcase-Kit',
          'x-kamon-event': d.event,
          'x-kamon-delivery': d.id,
          'x-kamon-signature': await sign(hook.secret, d.payload, ts),
        },
        body: d.payload,
      }),
      new Promise<never>((_, r) => setTimeout(() => r(new Error('nessuna risposta in 10 secondi')), 10_000)),
    ]);
    code = res.status;
    if (!res.ok) error = (await res.text().catch(() => '')).slice(0, 300) || `risposta ${res.status}`;
  } catch (err) {
    error = (err as Error).message.slice(0, 300);
  }
  const attempts = d.attempts + 1;
  if (!error) {
    await env.DB.prepare(`UPDATE webhook_deliveries SET status = 'inviato', attempts = ?, last_code = ?, last_error = NULL, next_at = NULL, updated_at = ? WHERE id = ?`)
      .bind(attempts, code, now, d.id).run();
    return;
  }
  const wait = BACKOFF_MIN[attempts - 1];
  await env.DB.prepare(`UPDATE webhook_deliveries SET status = ?, attempts = ?, last_code = ?, last_error = ?, next_at = ?, updated_at = ? WHERE id = ?`)
    .bind(wait === undefined ? 'fallito' : 'in_coda', attempts, code || null, error, wait === undefined ? null : now + wait * 60_000, now, d.id).run();
}

/** Mette in coda l'evento per ogni webhook iscritto e prova subito a consegnarlo. */
export async function dispatch(event: EventName, payload: unknown, only?: string) {
  const { webhooks } = await readSettings();
  const targets = webhooks.filter((w) => (only ? w.id === only : w.active && w.events.includes(event)));
  if (!targets.length) return;
  await ensureTables();
  const body = JSON.stringify(payload);
  const now = Date.now();
  const deliveries: Delivery[] = targets.map((w) => ({ id: crypto.randomUUID(), endpoint_id: w.id, endpoint_name: w.name, event, payload: body, status: 'in_coda', attempts: 0 }));
  await env.DB.batch(deliveries.map((d) => env.DB.prepare(
    `INSERT INTO webhook_deliveries (id, endpoint_id, endpoint_name, event, payload, status, attempts, next_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'in_coda', 0, ?, ?, ?)`,
  ).bind(d.id, d.endpoint_id, d.endpoint_name, d.event, d.payload, now, now, now)));
  await Promise.allSettled(deliveries.map((d) => attempt(d, targets.find((w) => w.id === d.endpoint_id))));
}

/** Ripete le consegne arrivate al loro turno. Lo chiama l'attività programmata. */
export async function retryDue() {
  await ensureTables();
  const { results } = await env.DB.prepare(`SELECT * FROM webhook_deliveries WHERE status = 'in_coda' AND next_at <= ? ORDER BY next_at LIMIT 50`)
    .bind(Date.now()).all<Delivery>();
  if (!results.length) return 0;
  const { webhooks } = await readSettings();
  await Promise.allSettled(results.map((d) => attempt(d, webhooks.find((w) => w.id === d.endpoint_id))));
  return results.length;
}

/** Riprova subito una consegna dal pannello. */
export async function retryNow(id: string) {
  const d = await env.DB.prepare('SELECT * FROM webhook_deliveries WHERE id = ?').bind(id).first<Delivery>();
  if (!d) return false;
  const { webhooks } = await readSettings();
  await attempt({ ...d, attempts: d.status === 'fallito' ? 0 : d.attempts }, webhooks.find((w) => w.id === d.endpoint_id));
  return true;
}

export async function recentDeliveries(limit = 40) {
  await ensureTables();
  const { results } = await env.DB.prepare(
    'SELECT id, endpoint_name, event, status, attempts, last_code, last_error, next_at, created_at, updated_at FROM webhook_deliveries ORDER BY created_at DESC LIMIT ?',
  ).bind(limit).all<{ id: string; endpoint_name: string; event: string; status: string; attempts: number; last_code: number | null; last_error: string | null; next_at: number | null; created_at: number; updated_at: number }>();
  return results;
}
