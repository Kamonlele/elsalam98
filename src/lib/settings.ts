import { env } from 'cloudflare:workers';
import { ensureTables } from './db';

/**
 * Impostazioni riservate: chiavi dell'email, Turnstile, webhook.
 * Stanno in una tabella a parte e non finiscono mai nelle pagine pubbliche.
 */
export type Webhook = { id: string; name: string; url: string; secret: string; events: string[]; active: boolean };
export type Settings = {
  brevoApiKey: string;
  mailFrom: string;
  mailFromName: string;
  /** Chi riceve l'avviso di ogni nuova prenotazione, separati da virgola. */
  notifyEmails: string;
  turnstileSecret: string;
  /** Consenso e statistiche: pubblici, finiscono nelle pagine. */
  iubendaSiteId: string;
  iubendaPolicyId: string;
  gtmId: string;
  webhooks: Webhook[];
};

const TEXT_KEYS = ['brevoApiKey', 'mailFrom', 'mailFromName', 'notifyEmails', 'turnstileSecret', 'iubendaSiteId', 'iubendaPolicyId', 'gtmId'] as const;
/** Chiavi di servizi esterni: nel pannello si vedono solo le ultime cifre. */
const SECRET_KEYS = ['brevoApiKey', 'turnstileSecret'] as const;
const MASK = '••••••••';

export async function readSettings(): Promise<Settings> {
  const s: Settings = { brevoApiKey: '', mailFrom: '', mailFromName: '', notifyEmails: '', turnstileSecret: '', iubendaSiteId: '', iubendaPolicyId: '', gtmId: '', webhooks: [] };
  try {
    await ensureTables();
    const { results } = await env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>();
    for (const r of results) {
      if (r.key === 'webhooks') s.webhooks = JSON.parse(r.value || '[]');
      else if ((TEXT_KEYS as readonly string[]).includes(r.key)) (s as Record<string, unknown>)[r.key] = r.value;
    }
  } catch {
    // Tabella non ancora pronta: si lavora senza email e senza webhook.
  }
  return s;
}

export async function writeSettings(patch: Partial<Record<(typeof TEXT_KEYS)[number], string>> & { webhooks?: Webhook[] }) {
  await ensureTables();
  const now = Date.now();
  const put = (key: string, value: string) => env.DB.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).bind(key, value, now);
  const statements = [];
  for (const key of TEXT_KEYS) {
    const v = patch[key];
    // Un campo lasciato mascherato vuol dire "non toccare".
    if (typeof v === 'string' && !v.startsWith(MASK)) statements.push(put(key, v.trim()));
  }
  if (patch.webhooks) statements.push(put('webhooks', JSON.stringify(patch.webhooks)));
  if (statements.length) await env.DB.batch(statements);
}

/** Per il pannello: le chiavi esterne tornano mascherate. */
export async function settingsForAdmin() {
  const s = await readSettings();
  const out: Record<string, unknown> = { ...s };
  for (const k of SECRET_KEYS) out[k] = s[k] ? `${MASK}${s[k].slice(-4)}` : '';
  return out as Settings;
}

export function newSecret() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join('');
}
