import type { APIRoute } from 'astro';
import { booking as rules, DEFAULT_LOCALE } from '../../../lib/brand';
import { listBookings } from '../../../lib/booking';
import { t } from '../../../lib/i18n';
import { csvCell as cell } from '../../../lib/antispam';

export const GET: APIRoute = async () => {
  const rows = await listBookings('tutte');
  const qs = rules.questions;
  const head = ['Codice', 'Data', 'Ora', 'Stato', 'Sede', 'Prodotto', 'Nome', 'Email', 'Telefono', 'Comune',
    ...qs.map((q) => t(q.label, DEFAULT_LOCALE)), 'Lingua', 'Sorgente', 'Mezzo', 'Campagna', 'gclid', 'fbclid', 'Provenienza', 'Note', 'Creata il'];
  const lines = [head.map(cell).join(';')];
  for (const b of rows) {
    lines.push([
      b.ref, b.date, b.time, b.status, b.locationLabel, b.productName, b.name, b.email, b.phone, b.city,
      ...qs.map((q) => { const o = q.options.find((x) => x.value === b.answers[q.id]); return o ? t(o.label, DEFAULT_LOCALE) : b.answers[q.id]; }),
      b.locale, b.source.utm_source, b.source.utm_medium, b.source.utm_campaign, b.source.gclid, b.source.fbclid, b.source.referrer,
      b.note, new Date(b.createdAt).toISOString(),
    ].map(cell).join(';'));
  }
  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="prenotazioni-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
};
