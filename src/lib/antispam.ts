/** Difese comuni ai moduli pubblici. Niente accesso al database: si provano da sole. */

export const SOURCE_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'referrer', 'landing'];

/** Tiene solo le chiavi di provenienza note, con valori corti. */
export function cleanSource(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const k of SOURCE_KEYS) {
    const v = (raw as Record<string, unknown>)[k];
    if (typeof v === 'string' && v) out[k] = v.slice(0, 300);
  }
  return out;
}

/**
 * Robot: il campo nascosto lo compilano solo i programmi, e una persona non invia
 * il modulo in meno di 3 secondi.
 */
export function isRobot(b: { sito?: string; ms?: number }): boolean {
  return Boolean(b.sito) || (typeof b.ms === 'number' && b.ms < 3000);
}

export async function verifyTurnstile(secret: string, token: string, ip: string): Promise<boolean> {
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  form.append('remoteip', ip);
  const check = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
    .then((r) => r.json() as Promise<{ success: boolean }>).catch(() => ({ success: false }));
  return check.success;
}

/**
 * Cella di un CSV. Il punto e virgola è il separatore che Excel in italiano apre senza chiedere nulla.
 * Chi inizia con = + - @ (o tab, a capo) verrebbe eseguito come formula: si antepone un apice.
 */
export function csvCell(v: unknown): string {
  let s = String(v ?? '');
  const formula = /^[=+\-@\t\r\n]/.test(s);
  if (formula) s = `'${s}`;
  return formula || /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
