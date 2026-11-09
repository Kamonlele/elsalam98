import { booking as rules, brand, DEFAULT_LOCALE } from './brand';
import type { Booking } from './booking';
import type { Lead } from './leads';
import { list } from './store';
import { bookingIcs } from './ics';
import { t } from './i18n';
import { mailText } from './mail-text';
import { readSettings } from './settings';

export type MailResult = 'inviata' | 'non configurata' | `errore ${string}`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const toB64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));

async function withTimeout<T>(p: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, r) => setTimeout(() => r(new Error('tempo scaduto')), ms))]);
}

/** Invio tramite l'API di Brevo: sui Workers non esiste SMTP. */
async function send(to: string[], subject: string, html: string, attachment?: { name: string; content: string }, replyTo?: string): Promise<MailResult> {
  const s = await readSettings();
  if (!s.brevoApiKey || !s.mailFrom || !to.length) return 'non configurata';
  try {
    const res = await withTimeout(fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json', 'api-key': s.brevoApiKey },
      body: JSON.stringify({
        sender: { email: s.mailFrom, name: s.mailFromName || brand.identity.name },
        to: to.map((email) => ({ email })),
        replyTo: replyTo ? { email: replyTo } : undefined,
        subject,
        htmlContent: html,
        attachment: attachment ? [{ name: attachment.name, content: toB64(attachment.content) }] : undefined,
      }),
    }));
    if (!res.ok) return `errore ${res.status} ${(await res.text().catch(() => '')).slice(0, 120)}`;
    return 'inviata';
  } catch (err) {
    return `errore ${(err as Error).message}`;
  }
}

export function formatWhen(b: Booking) {
  const [y, m, d] = b.date.split('-').map(Number);
  const day = new Intl.DateTimeFormat(b.locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
  return `${day}, ${b.time}`;
}

async function placeOf(b: Booking) {
  const loc = (await list('locations')).find((l) => l.id === b.locationId);
  return {
    video: loc?.kind === 'video',
    text: loc?.kind === 'video' ? '' : [loc ? t(loc.name, b.locale) : b.locationLabel, loc?.address].filter(Boolean).join(', '),
  };
}

function layout(body: string) {
  return `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#0f1c26;max-width:560px;line-height:1.55">${body}</div>`;
}

export type CustomerMail = 'creata' | 'confermata' | 'spostata' | 'annullata' | 'promemoria';

/** Email al cliente, nella sua lingua, con l'invito per il calendario. */
export async function mailCustomer(kind: CustomerMail, b: Booking, host: string): Promise<MailResult> {
  const tx = mailText(b.locale);
  const key = kind === 'creata' && b.status === 'confermata' ? 'creataConfermata' : kind;
  const place = await placeOf(b);
  const v = { nome: b.name.split(' ')[0], azienda: brand.identity.name, codice: b.ref };
  const rows: [string, string][] = [
    [tx.when, formatWhen(b)],
    [tx.where, place.video ? tx.video : place.text],
    ...(b.productName ? [[tx.product, b.productName] as [string, string]] : []),
    [tx.code, b.ref],
  ];
  const html = layout(`
    <p>${esc(fill(tx.hello, v))}</p>
    <p>${esc(tx.lead[key])}</p>
    <table style="border-collapse:collapse;margin:16px 0">${rows.map(([k, val]) =>
      `<tr><td style="padding:4px 16px 4px 0;color:#4d606f;vertical-align:top">${esc(k)}</td><td style="padding:4px 0;font-weight:600">${esc(val)}</td></tr>`).join('')}</table>
    ${kind !== 'annullata' ? `<p>${esc(tx.calendar)}</p>` : ''}
    <p>${esc(tx.changes)}</p>
    <p>${esc(fill(tx.signature, v)).replace(/\n/g, '<br>')}</p>`);
  const ics = await icsFor(b, host);
  const s = await readSettings();
  return send([b.email], `${tx.subject[key]} | ${brand.identity.name}`, html, { name: 'visita.ics', content: ics }, s.mailFrom || undefined);
}

/** Invito per il calendario nella lingua di chi ha prenotato. */
export async function icsFor(b: Booking, host: string) {
  const tx = mailText(b.locale);
  const place = await placeOf(b);
  return bookingIcs(b, {
    summary: fill(tx.summary, { azienda: brand.identity.name }),
    location: place.video ? '' : place.text,
    description: [b.productName, `${tx.code}: ${b.ref}`, place.video ? tx.video : ''].filter(Boolean).join('\n'),
  }, host);
}

/** Avviso a chi gestisce le visite, sempre in italiano. */
export async function mailStaff(b: Booking, origin: string): Promise<MailResult> {
  const s = await readSettings();
  const to = s.notifyEmails.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean);
  if (!to.length) return 'non configurata';
  const answers = Object.entries(b.answers).map(([id, value]) => {
    const q = rules.questions.find((x) => x.id === id);
    const label = q ? t(q.label, DEFAULT_LOCALE) : id;
    const opt = q?.options.find((o) => o.value === value);
    return [label, opt ? t(opt.label, DEFAULT_LOCALE) : value] as [string, string];
  });
  const src = [b.source.utm_source, b.source.utm_medium, b.source.utm_campaign].filter(Boolean).join(' / ')
    || (b.source.gclid ? 'Google Ads' : b.source.fbclid ? 'Meta' : b.source.referrer || 'diretto');
  const rows: [string, string][] = [
    ['Quando', formatWhen({ ...b, locale: 'it' })],
    ['Dove', b.locationLabel],
    ...(b.productName ? [['Prodotto', b.productName] as [string, string]] : []),
    ['Nome', b.name], ['Telefono', b.phone], ['Email', b.email],
    ...(b.city ? [['Comune', b.city] as [string, string]] : []),
    ...answers,
    ['Provenienza', src],
    ['Lingua', b.locale.toUpperCase()],
    ['Codice', b.ref],
  ];
  const html = layout(`
    <h2 style="margin:0 0 4px;font-size:20px">Nuova prenotazione</h2>
    <p style="margin:0;color:#4d606f">${b.status === 'nuova' ? 'Da confermare nel pannello.' : 'Già confermata in automatico.'}</p>
    <table style="border-collapse:collapse;margin:16px 0">${rows.map(([k, val]) =>
      `<tr><td style="padding:4px 16px 4px 0;color:#4d606f;vertical-align:top">${esc(k)}</td><td style="padding:4px 0;font-weight:600">${esc(val)}</td></tr>`).join('')}</table>
    <p><a href="${esc(origin)}/admin/prenotazioni" style="color:#0b74b0">Apri le prenotazioni</a></p>`);
  return send(to, `Nuova prenotazione: ${b.name}, ${formatWhen({ ...b, locale: 'it' })}`, html, undefined, b.email);
}

/** Avviso a chi gestisce le richieste da modulo, sempre in italiano. */
export async function mailStaffLead(lead: Lead, origin: string): Promise<MailResult> {
  const s = await readSettings();
  const to = s.notifyEmails.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean);
  if (!to.length) return 'non configurata';
  const name = `${lead.firstName} ${lead.lastName}`;
  const src = [lead.source.utm_source, lead.source.utm_medium, lead.source.utm_campaign].filter(Boolean).join(' / ')
    || (lead.source.gclid ? 'Google Ads' : lead.source.fbclid ? 'Meta' : lead.source.referrer || 'diretto');
  const rows: [string, string][] = [
    ['Nome', name], ['Telefono', lead.phone], ['Email', lead.email],
    ...(lead.city ? [['Comune', lead.city] as [string, string]] : []),
    ...lead.answers.map((a) => [a.label, a.value] as [string, string]),
    ...(lead.page ? [['Pagina', lead.page] as [string, string]] : []),
    ['Provenienza', src],
    ['Codice', lead.ref],
  ];
  const html = layout(`
    <h2 style="margin:0 0 4px;font-size:20px">Nuova richiesta</h2>
    <p style="margin:0;color:#4d606f">Modulo: ${esc(lead.form)}</p>
    <table style="border-collapse:collapse;margin:16px 0">${rows.map(([k, val]) =>
      `<tr><td style="padding:4px 16px 4px 0;color:#4d606f;vertical-align:top">${esc(k)}</td><td style="padding:4px 0;font-weight:600">${esc(val)}</td></tr>`).join('')}</table>
    <p><a href="${esc(origin)}/admin/richieste" style="color:#0b74b0">Apri le richieste</a></p>`);
  return send(to, `Nuova richiesta: ${lead.form} da ${name}`, html, undefined, lead.email);
}
