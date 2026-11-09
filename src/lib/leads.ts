import { env } from 'cloudflare:workers';
import { brand } from './brand';
import { newRef } from './booking';
import { ensureTables } from './db';
import type { LeadAnswer, LeadInput } from './lead-input';

export type Lead = LeadInput & { id: string; ref: string; createdAt: number; status: 'nuova' | 'gestita' };

type Row = {
  id: string; ref: string; created_at: number; form: string; first_name: string; last_name: string; email: string; phone: string;
  city: string | null; answers: string; page: string; source: string; status: Lead['status'];
};
const fromRow = (r: Row): Lead => ({
  id: r.id, ref: r.ref, createdAt: r.created_at, form: r.form, firstName: r.first_name, lastName: r.last_name, email: r.email,
  phone: r.phone, city: r.city, answers: JSON.parse(r.answers || '[]') as LeadAnswer[], page: r.page,
  source: JSON.parse(r.source || '{}'), status: r.status,
});

export async function createLead(input: LeadInput, ipHash: string): Promise<{ ok: true; lead: Lead } | { ok: false; error: 'too-many'; status: 429 }> {
  await ensureTables();
  // Come per le prenotazioni: poche richieste all'ora bastano a una persona vera.
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM leads WHERE ip_hash = ? AND created_at > ?')
    .bind(ipHash, Date.now() - 3_600_000).first<{ n: number }>();
  if ((recent?.n ?? 0) >= 5) return { ok: false, error: 'too-many', status: 429 };

  const lead: Lead = { ...input, id: crypto.randomUUID(), ref: newRef(), createdAt: Date.now(), status: 'nuova' };
  await env.DB.prepare(`INSERT INTO leads
    (id, ref, created_at, form, first_name, last_name, email, phone, city, answers, page, source, ip_hash, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'nuova')`)
    .bind(lead.id, lead.ref, lead.createdAt, lead.form, lead.firstName, lead.lastName, lead.email, lead.phone, lead.city,
      JSON.stringify(lead.answers), lead.page, JSON.stringify(lead.source), ipHash).run();
  return { ok: true, lead };
}

export async function listLeads(limit = 500): Promise<Lead[]> {
  await ensureTables();
  const { results } = await env.DB.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT ?').bind(limit).all<Row>();
  return results.map(fromRow);
}

export async function countNewLeads() {
  await ensureTables();
  const r = await env.DB.prepare(`SELECT COUNT(*) AS n FROM leads WHERE status = 'nuova'`).first<{ n: number }>();
  return r?.n ?? 0;
}

export async function setLeadStatus(id: string, s: Lead['status']) {
  await ensureTables();
  await env.DB.prepare('UPDATE leads SET status = ? WHERE id = ?').bind(s, id).run();
}

/** Stessa forma di `bookingPayload`, con `lead` al posto di `booking`: chi riceve mappa i due eventi allo stesso modo. */
export function leadPayload(lead: Lead, origin: string) {
  return {
    event: 'lead.creato' as const,
    sent_at: new Date().toISOString(),
    site: brand.identity.name,
    lead: {
      id: lead.id, ref: lead.ref, form: lead.form, page: lead.page,
      created_at: new Date(lead.createdAt).toISOString(), admin_url: `${origin}/admin/richieste`,
    },
    contact: {
      first_name: lead.firstName, last_name: lead.lastName, name: `${lead.firstName} ${lead.lastName}`,
      email: lead.email, phone: lead.phone, city: lead.city,
    },
    answers: Object.fromEntries(lead.answers.map((a) => [a.id, a.value])),
    answers_text: lead.answers.map((a) => `${a.label}: ${a.value}`).join('\n'),
    source: lead.source,
  };
}
