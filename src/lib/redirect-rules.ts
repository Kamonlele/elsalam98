/**
 * Regole dei redirect, pure: niente `cloudflare:workers`, le usano i test e le pagine.
 */
import { hasUnsafeChars } from './safe-url';

export type Rule = { from: string; to: string };

/** Porta un indirizzo (anche completo, anche di un altro sito) a un percorso con la barra finale. */
export function normalizePath(p: string): string | null {
  let s = p.trim();
  if (!s) return null;
  // Il browser legge "\" come "/": "/\evil.com" diventerebbe "//evil.com", un redirect verso un altro sito.
  if (hasUnsafeChars(s)) return null;
  if (/^https?:\/\//i.test(s)) {
    try { s = new URL(s).pathname; } catch { return null; }
  }
  s = s.split(/[?#]/)[0];
  if (!s.startsWith('/') || s.startsWith('//') || hasUnsafeChars(s)) return null;
  const last = s.split('/').pop() ?? '';
  // Un file ("/foto.jpg") non vuole la barra; una pagina sì, come le serve il sito.
  if (!s.endsWith('/') && !last.includes('.')) s += '/';
  return s;
}

export type BulkResult = { ok: true; rules: Rule[]; lines: number[] } | { ok: false; line: number; error: string };

/** Una regola per riga: "vecchio nuovo". Righe vuote e che iniziano con # si saltano. */
export function parseBulk(text: string): BulkResult {
  const rules: Rule[] = [];
  const nums: number[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw || raw.startsWith('#')) continue;
    const words = raw.split(/\s+/);
    if (words.length !== 2) return { ok: false, line: i + 1, error: 'Servono due indirizzi: il vecchio e il nuovo, separati da uno spazio.' };
    const from = normalizePath(words[0]);
    const to = normalizePath(words[1]);
    if (!from) return { ok: false, line: i + 1, error: 'Il vecchio indirizzo deve iniziare con /.' };
    if (!to) return { ok: false, line: i + 1, error: 'Il nuovo indirizzo deve iniziare con /.' };
    if (from === to) return { ok: false, line: i + 1, error: 'Il vecchio e il nuovo indirizzo sono uguali.' };
    rules.push({ from, to });
    nums.push(i + 1);
  }
  return { ok: true, rules, lines: nums };
}

/**
 * Cosa cambiare nella tabella quando un indirizzo pubblico passa da `oldUrl` a `newUrl`.
 * Le regole che puntavano al vecchio vanno dritte al nuovo (niente catene); quella che
 * partiva dal nuovo indirizzo si toglie (altrimenti tornare indietro farebbe un giro).
 */
export function planSlugChange(oldUrl: string, newUrl: string, existing: Rule[]): { upsert: Rule[]; remove: string[] } {
  if (oldUrl === newUrl) return { upsert: [], remove: [] };
  const upsert: Rule[] = [];
  const remove: string[] = [];
  for (const r of existing) {
    if (r.from === newUrl) remove.push(r.from);
    else if (r.to === oldUrl) upsert.push({ from: r.from, to: newUrl });
  }
  upsert.push({ from: oldUrl, to: newUrl });
  return { upsert, remove };
}

/**
 * Regole a mano che porterebbero a un altro redirect: A verso B con B verso A gira in tondo,
 * A verso B con B verso C fa fare al browser un passo in più. Conta la tabella come sarà dopo il salvataggio.
 */
export function checkChains(rules: Rule[], existing: Rule[]): { index: number; error: string } | null {
  const next = new Map(existing.map((r) => [r.from, r.to]));
  for (const r of rules) next.set(r.from, r.to);
  for (let i = 0; i < rules.length; i++) {
    const { from, to } = rules[i];
    const after = next.get(to);
    if (after === undefined) continue;
    if (after === from) return { index: i, error: `${from} e ${to} rimanderebbero l'uno all'altro: il browser girerebbe in tondo.` };
    return { index: i, error: `${to} rimanda già a ${after}: fai puntare ${from} direttamente a ${after}.` };
  }
  return null;
}
