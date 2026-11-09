import { booking as rules, brand } from './brand';
import type { Booking } from './booking';
import { offsetMinutes } from './booking';

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
// Le righe .ics non devono superare 75 byte: le più lunghe vanno spezzate.
const fold = (line: string) => {
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > 74) { out.push(cur); cur = ' ' + ch; } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n');
};
const utc = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export type IcsInfo = { summary: string; location: string; description: string };

/**
 * Invito per il calendario. Stesso UID per tutta la vita della prenotazione e
 * SEQUENCE che cresce: così uno spostamento aggiorna l'evento e un annullamento lo toglie.
 */
export function bookingIcs(b: Booking, info: IcsInfo, host: string) {
  const [y, m, d] = b.date.split('-').map(Number);
  const [hh, mm] = b.time.split(':').map(Number);
  const start = Date.UTC(y, m - 1, d, hh, mm) - offsetMinutes(b.date, b.time) * 60000;
  const end = start + rules.visitMinutes * 60000;
  const cancelled = b.status === 'annullata';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${esc(brand.identity.name)}//Prenotazioni//IT`,
    'CALSCALE:GREGORIAN',
    `METHOD:${cancelled ? 'CANCEL' : 'PUBLISH'}`,
    'BEGIN:VEVENT',
    `UID:${b.id}@${host}`,
    `SEQUENCE:${b.seq + (cancelled ? 1 : 0)}`,
    `DTSTAMP:${utc(Date.now())}`,
    `DTSTART:${utc(start)}`,
    `DTEND:${utc(end)}`,
    `SUMMARY:${esc(info.summary)}`,
    info.location ? `LOCATION:${esc(info.location)}` : '',
    `DESCRIPTION:${esc(info.description)}`,
    `STATUS:${cancelled ? 'CANCELLED' : b.status === 'confermata' ? 'CONFIRMED' : 'TENTATIVE'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.map(fold).join('\r\n') + '\r\n';
}
