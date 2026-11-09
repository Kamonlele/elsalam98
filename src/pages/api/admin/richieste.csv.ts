import type { APIRoute } from 'astro';
import { features } from '../../../lib/brand';
import { csvCell as cell } from '../../../lib/antispam';
import { listLeads } from '../../../lib/leads';

export const GET: APIRoute = async () => {
  if (!features.leads) return new Response(null, { status: 404 });
  const rows = await listLeads(5000);
  const head = ['Codice', 'Creata il', 'Stato', 'Modulo', 'Nome', 'Cognome', 'Email', 'Telefono', 'Comune', 'Risposte',
    'Pagina', 'Sorgente', 'Mezzo', 'Campagna', 'gclid', 'fbclid', 'Provenienza'];
  const lines = [head.map(cell).join(';')];
  for (const l of rows) {
    lines.push([
      l.ref, new Date(l.createdAt).toISOString(), l.status, l.form, l.firstName, l.lastName, l.email, l.phone, l.city,
      l.answers.map((a) => `${a.label}: ${a.value}`).join(' | '),
      l.page, l.source.utm_source, l.source.utm_medium, l.source.utm_campaign, l.source.gclid, l.source.fbclid, l.source.referrer,
    ].map(cell).join(';'));
  }
  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="richieste-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
};
