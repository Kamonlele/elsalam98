import { cleanSource, isRobot } from './antispam';

export type LeadAnswer = { id: string; label: string; value: string };
export type LeadInput = {
  form: string; firstName: string; lastName: string; email: string; phone: string; city: string | null;
  answers: LeadAnswer[]; page: string; source: Record<string, string>;
};
export type LeadError = 'invalid' | 'form' | 'name' | 'email' | 'phone' | 'consent' | 'answers';

const tidy = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '');

/** Controlla e ripulisce il corpo di una richiesta da modulo: il browser può mandare qualsiasi cosa. */
export function parseLead(raw: unknown): { ok: true; lead: LeadInput } | { ok: true; robot: true } | { ok: false; error: LeadError } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'invalid' };
  const b = raw as Record<string, unknown>;
  if (isRobot({ sito: b.sito ? String(b.sito) : undefined, ms: typeof b.ms === 'number' ? b.ms : undefined })) return { ok: true, robot: true };

  const form = typeof b.modulo === 'string' ? b.modulo : '';
  if (!/^[a-z0-9-]{2,40}$/.test(form)) return { ok: false, error: 'form' };
  const firstName = tidy(b.nome, 60);
  const lastName = tidy(b.cognome, 60);
  if (firstName.length < 2 || lastName.length < 2) return { ok: false, error: 'name' };
  const email = tidy(b.email, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'email' };
  const phone = tidy(b.tel, 40);
  if (phone.replace(/\D/g, '').length < 8) return { ok: false, error: 'phone' };
  if (b.privacy !== true) return { ok: false, error: 'consent' };

  const list = Array.isArray(b.risposte) ? b.risposte : [];
  if (list.length > 40) return { ok: false, error: 'answers' };
  const answers: LeadAnswer[] = [];
  for (const a of list) {
    if (!a || typeof a !== 'object') continue;
    const { id, label, value } = a as Record<string, unknown>;
    if (typeof id !== 'string' || !/^[a-z0-9_-]{1,60}$/i.test(id)) continue;
    const v = tidy(value, 500);
    if (!v) continue;
    answers.push({ id, label: tidy(label, 120) || id, value: v });
  }

  const city = tidy(b.comune, 80);
  return {
    ok: true,
    lead: { form, firstName, lastName, email, phone, city: city || null, answers, page: tidy(b.pagina, 300), source: cleanSource(b.fonte) },
  };
}
