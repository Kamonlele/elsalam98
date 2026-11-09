import { env } from 'cloudflare:workers';
import { booking as rules, DEFAULT_LOCALE, type Locale } from './brand';
import type { Location, Product } from './content';
import { ensureTables } from './db';
import { t } from './i18n';
import { list } from './store';

export type Status = 'nuova' | 'confermata' | 'annullata' | 'presente' | 'assente';
/** Le prenotazioni annullate liberano il posto, tutte le altre lo occupano. */
const ACTIVE = "status != 'annullata'";

export type Booking = {
  id: string;
  ref: string;
  createdAt: number;
  updatedAt: number;
  status: Status;
  locationId: string;
  locationLabel: string;
  productId: string | null;
  productName: string | null;
  date: string;
  time: string;
  /** Cresce a ogni spostamento: serve ai calendari per aggiornare l'invito invece di duplicarlo. */
  seq: number;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  answers: Record<string, string>;
  locale: Locale;
  source: Record<string, string>;
  reminderSentAt: number | null;
  note: string | null;
};

type Row = {
  id: string; ref: string; created_at: number; updated_at: number; status: Status; location_id: string; location_label: string;
  product_id: string | null; product_name: string | null; date: string; time: string; seq: number; name: string; email: string;
  phone: string; city: string | null; answers: string; locale: Locale; source: string; reminder_sent_at: number | null; note: string | null;
};
export const fromRow = (r: Row): Booking => ({
  id: r.id, ref: r.ref, createdAt: r.created_at, updatedAt: r.updated_at, status: r.status, locationId: r.location_id,
  locationLabel: r.location_label, productId: r.product_id, productName: r.product_name, date: r.date, time: r.time, seq: r.seq,
  name: r.name, email: r.email, phone: r.phone, city: r.city, answers: JSON.parse(r.answers || '{}'), locale: r.locale,
  source: JSON.parse(r.source || '{}'), reminderSentAt: r.reminder_sent_at, note: r.note,
});

/* ---------- ora e date nel fuso del cliente ---------- */

/**
 * I Workers girano in UTC: data e ora "di adesso" si leggono nel fuso del sito
 * (brand.json → booking.timezone), altrimenti alle 23:30 italiane "oggi" sarebbe già domani.
 */
export function localNow(tz = rules.timezone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

/** Minuti "di calendario" di una data e ora locali: servono solo per confrontare e sommare. */
const stamp = (date: string, time: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) / 60000;
};
export const addDays = (date: string, n: number) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const weekday = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

/** Scarto in minuti tra il fuso del sito e UTC in una certa data: serve per scrivere l'orario nell'invito .ics e nei webhook. */
export function offsetMinutes(date: string, time: string, tz = rules.timezone) {
  const guess = new Date(stamp(date, time) * 60000);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(guess).map((p) => [p.type, p.value]));
  return stamp(`${parts.year}-${parts.month}-${parts.day}`, `${parts.hour}:${parts.minute}`) - stamp(date, time);
}
/** Data e ora locali come istante ISO con fuso, per esempio 2026-10-12T10:00:00+02:00. */
export function isoWithOffset(date: string, time: string) {
  const off = offsetMinutes(date, time);
  const sign = off >= 0 ? '+' : '-';
  const a = Math.abs(off);
  return `${date}T${time}:00${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}

/* ---------- disponibilità ---------- */

export type Day = { date: string; times: { time: string; free: boolean }[] };

/**
 * Giorni e orari prenotabili di una sede, calcolati qui e mai dal browser:
 * orari della sede, giorni di chiusura, preavviso minimo, posti già presi.
 * `keep` lascia libero l'orario di una prenotazione che si sta spostando.
 */
export async function availability(loc: Location, keep?: { id: string }): Promise<Day[]> {
  const now = localNow();
  const earliest = stamp(now.date, now.time) + rules.minNoticeHours * 60;
  const last = addDays(now.date, rules.daysAhead);
  const capacity = loc.capacity && loc.capacity > 0 ? loc.capacity : 1;

  const taken = new Map<string, number>();
  if (env.DB) {
    await ensureTables();
    const { results } = await env.DB.prepare(
      `SELECT date, time, COUNT(*) AS n FROM bookings WHERE location_id = ? AND date BETWEEN ? AND ? AND ${ACTIVE} AND id != ? GROUP BY date, time`,
    ).bind(loc.id, now.date, last, keep?.id ?? '').all<{ date: string; time: string; n: number }>();
    for (const r of results) taken.set(`${r.date} ${r.time}`, r.n);
  }

  const days: Day[] = [];
  for (let date = now.date; date <= last; date = addDays(date, 1)) {
    if (loc.closed?.includes(date)) continue;
    const slots = loc.slots[weekday(date)] ?? [];
    const times = slots
      .filter((time) => stamp(date, time) >= earliest)
      .map((time) => ({ time, free: (taken.get(`${date} ${time}`) ?? 0) < capacity }));
    if (times.length) days.push({ date, times });
  }
  return days;
}

/* ---------- creazione ---------- */

export type NewBooking = {
  locationId: string; productId?: string; date: string; time: string; name: string; email: string; phone: string;
  city?: string; answers: Record<string, string>; locale: Locale; source: Record<string, string>; ipHash: string;
};
type CreateResult = { ok: true; booking: Booking } | { ok: false; error: string; status: number };

// Senza lettere e numeri che si confondono al telefono (0/O, 1/I).
const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const newRef = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => REF_CHARS[b % REF_CHARS.length]).join('');

export async function createBooking(input: NewBooking): Promise<CreateResult> {
  await ensureTables();
  const locations = await list('locations');
  const loc = locations.find((l) => l.id === input.locationId);
  if (!loc) return { ok: false, error: 'missing-location', status: 400 };

  const day = (await availability(loc)).find((d) => d.date === input.date);
  const slot = day?.times.find((s) => s.time === input.time);
  if (!slot) return { ok: false, error: 'slot-gone', status: 409 };
  if (!slot.free) return { ok: false, error: 'slot-full', status: 409 };

  let product: Product | undefined;
  if (input.productId) product = (await list('products')).find((p) => p.id === input.productId);

  // Limite per indirizzo IP: poche richieste all'ora bastano a una persona vera.
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM bookings WHERE ip_hash = ? AND created_at > ?')
    .bind(input.ipHash, Date.now() - 3_600_000).first<{ n: number }>();
  if ((recent?.n ?? 0) >= 5) return { ok: false, error: 'too-many', status: 429 };

  const now = Date.now();
  const id = crypto.randomUUID();
  const status: Status = rules.autoConfirm ? 'confermata' : 'nuova';
  const capacity = loc.capacity && loc.capacity > 0 ? loc.capacity : 1;
  const label = loc.kind === 'video' ? t(loc.name, DEFAULT_LOCALE) : [t(loc.name, DEFAULT_LOCALE), loc.city].filter((x, i, a) => x && a.indexOf(x) === i).join(', ');

  // Inserimento e controllo dei posti in un'unica istruzione: due persone sullo stesso
  // ultimo posto non possono prenotarlo entrambe.
  const res = await env.DB.prepare(`INSERT INTO bookings
    (id, ref, created_at, updated_at, status, location_id, location_label, product_id, product_name, date, time, seq,
     name, email, phone, city, answers, locale, source, ip_hash)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE (SELECT COUNT(*) FROM bookings WHERE location_id = ? AND date = ? AND time = ? AND ${ACTIVE}) < ?`)
    .bind(
      id, newRef(), now, now, status, loc.id, label, product?.id ?? null, product ? t(product.name, DEFAULT_LOCALE) : null,
      input.date, input.time, input.name, input.email, input.phone, input.city || null,
      JSON.stringify(input.answers), input.locale, JSON.stringify(input.source), input.ipHash,
      loc.id, input.date, input.time, capacity,
    ).run() as { meta?: { changes?: number } };
  if (!res.meta?.changes) return { ok: false, error: 'slot-full', status: 409 };

  return { ok: true, booking: (await getBooking(id))! };
}

/* ---------- lettura e modifiche (area riservata) ---------- */

export async function getBooking(id: string): Promise<Booking | null> {
  await ensureTables();
  const r = await env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first<Row>();
  return r ? fromRow(r) : null;
}

export type View = 'prossime' | 'da-confermare' | 'passate' | 'annullate' | 'tutte';
export async function listBookings(view: View): Promise<Booking[]> {
  await ensureTables();
  const today = localNow().date;
  const where: Record<View, string> = {
    prossime: `date >= '${today}' AND status != 'annullata'`,
    'da-confermare': `date >= '${today}' AND status = 'nuova'`,
    passate: `date < '${today}' AND status != 'annullata'`,
    annullate: `status = 'annullata'`,
    tutte: '1 = 1',
  };
  const order = view === 'passate' || view === 'annullate' || view === 'tutte' ? 'date DESC, time DESC' : 'date, time';
  const { results } = await env.DB.prepare(`SELECT * FROM bookings WHERE ${where[view]} ORDER BY ${order} LIMIT 500`).all<Row>();
  return results.map(fromRow);
}

export async function countNew() {
  await ensureTables();
  const r = await env.DB.prepare(`SELECT COUNT(*) AS n FROM bookings WHERE status = 'nuova' AND date >= ?`).bind(localNow().date).first<{ n: number }>();
  return r?.n ?? 0;
}

export async function setStatus(id: string, status: Status) {
  await env.DB.prepare('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?').bind(status, Date.now(), id).run();
}

export async function setNote(id: string, note: string) {
  await env.DB.prepare('UPDATE bookings SET note = ?, updated_at = ? WHERE id = ?').bind(note.slice(0, 2000) || null, Date.now(), id).run();
}

/** Sposta una prenotazione, controllando che il nuovo orario sia libero. Si riparte con il promemoria. */
export async function moveBooking(b: Booking, date: string, time: string): Promise<'ok' | 'full' | 'gone'> {
  const loc = (await list('locations')).find((l) => l.id === b.locationId);
  if (!loc) return 'gone';
  const slot = (await availability(loc, { id: b.id })).find((d) => d.date === date)?.times.find((s) => s.time === time);
  if (!slot) return 'gone';
  if (!slot.free) return 'full';
  await env.DB.prepare('UPDATE bookings SET date = ?, time = ?, seq = seq + 1, reminder_sent_at = NULL, updated_at = ? WHERE id = ?')
    .bind(date, time, Date.now(), b.id).run();
  return 'ok';
}

/** Prenotazioni di domani ancora senza promemoria. */
export async function dueReminders(): Promise<Booking[]> {
  await ensureTables();
  const tomorrow = addDays(localNow().date, 1);
  const { results } = await env.DB.prepare(
    // Chi ha prenotato da poche ore ha appena ricevuto la conferma: niente promemoria doppio.
    `SELECT * FROM bookings WHERE date = ? AND status IN ('nuova', 'confermata') AND reminder_sent_at IS NULL AND created_at < ?`,
  ).bind(tomorrow, Date.now() - 6 * 3_600_000).all<Row>();
  return results.map(fromRow);
}
export async function markReminded(id: string) {
  await env.DB.prepare('UPDATE bookings SET reminder_sent_at = ? WHERE id = ?').bind(Date.now(), id).run();
}

export async function hashIp(ip: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`prenotazioni:${ip}`));
  return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
}
