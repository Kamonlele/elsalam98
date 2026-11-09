/** Aiuti per mostrare i testi del cliente. Logica pura: la usano i blocchi e i test. */
import type { Location } from './content';

/** I testi del cliente diventano paragrafi: una riga vuota ne apre uno nuovo. Mai HTML. */
export function paragraphs(text: string): string[] {
  return text.split(/\n[ \t]*\n/).map((p) => p.trim()).filter(Boolean);
}

const toMin = (hm: string) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
const toHm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
// Settimana dal lunedì: è l'ordine in cui la leggono le persone, non quello di Date.
const WEEK = [1, 2, 3, 4, 5, 6, 0] as const;

/**
 * Fasce di un giorno: si spezza dove il salto fra due orari supera il passo abituale
 * (la differenza più frequente; con un solo orario, la durata della visita).
 * Ogni fascia finisce all'ultimo orario più la durata della visita.
 */
function dayRanges(times: number[], visitMinutes: number): [number, number][] {
  const gaps = times.slice(1).map((t, i) => t - times[i]);
  const count = new Map<number, number>();
  for (const g of gaps) count.set(g, (count.get(g) ?? 0) + 1);
  // A parità di frequenza vince il passo più corto.
  const step = gaps.length
    ? [...count].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]
    : visitMinutes;
  const parts: [number, number][] = [[times[0], times[0]]];
  for (const t of times.slice(1)) {
    const cur = parts[parts.length - 1];
    if (t - cur[1] > step) parts.push([t, t]);
    else cur[1] = t;
  }
  return parts.map(([a, b]) => [a, Math.min(b + visitMinutes, 24 * 60)]);
}

const dayTimes = (slots: Location['slots'], d: number) =>
  [...new Set((slots[d as 0] ?? []).filter((s) => /^\d{2}:\d{2}$/.test(s)).map(toMin))].sort((a, b) => a - b);

/** Fasce di apertura per giorno (0 domenica ... 6 sabato), in "HH:MM"; i giorni senza orari non compaiono. */
export function weekIntervals(slots: Location['slots'], visitMinutes: number): { day: number; opens: string; closes: string }[] {
  return WEEK.flatMap((d) => {
    const times = dayTimes(slots, d);
    return times.length ? dayRanges(times, visitMinutes).map(([a, b]) => ({ day: d, opens: toHm(a), closes: toHm(b) })) : [];
  });
}

const dayHours = (times: number[], visitMinutes: number) =>
  dayRanges(times, visitMinutes).map(([a, b]) => `${toHm(a)} - ${toHm(b)}`).join(', ');

/**
 * Orari di apertura ricavati dalle fasce di prenotazione, pause comprese.
 * I giorni consecutivi con gli stessi orari si uniscono.
 */
export function openingHours(slots: Location['slots'], visitMinutes: number, locale: string): { days: string; hours: string }[] {
  const name = (d: number) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + d))).replace(/\.$/, '');
  const rows: { from: number; to: number; hours: string }[] = [];
  WEEK.forEach((d, i) => {
    const times = dayTimes(slots, d);
    if (!times.length) return;
    const hours = dayHours(times, visitMinutes);
    const last = rows[rows.length - 1];
    if (last && last.hours === hours && last.to === i - 1) last.to = i;
    else rows.push({ from: i, to: i, hours });
  });
  return rows.map((r) => ({
    days: r.from === r.to ? name(WEEK[r.from]) : `${name(WEEK[r.from])} - ${name(WEEK[r.to])}`,
    hours: r.hours,
  }));
}

/** Un giorno "YYYY-MM-DD" scritto per esteso nella lingua: "24 ottobre 2026". */
export function formatDay(date: string, locale: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  // Mezzanotte UTC letta in UTC: il giorno non scivola, qualunque sia il fuso del server.
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + 'T00:00:00Z'));
}
