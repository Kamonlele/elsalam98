import { env } from 'cloudflare:workers';
import { LOCALES } from './brand';
import { ensureTables } from './db';
import { normalizePath, planSlugChange, type Rule } from './redirect-rules';
import { publicUrl, type Kind } from './routes';
import { list } from './store';

export type RedirectRow = { from: string; to: string; auto: boolean; hits: number; createdAt: number };

/** Dove mandare un indirizzo che non esiste più. Conta l'uso. Mai un errore: la 404 deve uscire comunque. */
export async function findRedirect(path: string): Promise<string | null> {
  const from = normalizePath(path);
  if (!from) return null;
  try {
    if (!env.DB) return null;
    await ensureTables();
    const row = await env.DB
      .prepare('UPDATE redirects SET hits = hits + 1 WHERE from_path = ? RETURNING to_path')
      .bind(from)
      .first<{ to_path: string }>();
    return row?.to_path ?? null;
  } catch {
    return null;
  }
}

export async function listRedirects(): Promise<RedirectRow[]> {
  await ensureTables();
  const { results } = await env.DB
    .prepare('SELECT from_path, to_path, auto, hits, created_at FROM redirects ORDER BY created_at DESC, from_path')
    .all<{ from_path: string; to_path: string; auto: number; hits: number; created_at: number }>();
  return results.map((r) => ({ from: r.from_path, to: r.to_path, auto: r.auto === 1, hits: r.hits, createdAt: r.created_at }));
}

const upsertSql = `INSERT INTO redirects (from_path, to_path, auto, hits, created_at) VALUES (?, ?, ?, 0, ?)
  ON CONFLICT(from_path) DO UPDATE SET to_path = excluded.to_path, auto = auto AND excluded.auto`;

/** Un redirect fatto a mano resta "a mano" anche se poi il sistema lo ripunta. */
export async function saveRedirects(rules: Rule[], auto: boolean) {
  if (!rules.length) return;
  await ensureTables();
  const now = Date.now();
  await env.DB.batch(rules.map((r) => env.DB.prepare(upsertSql).bind(r.from, r.to, auto ? 1 : 0, now)));
}

export async function removeRedirect(from: string) {
  await ensureTables();
  await env.DB.prepare('DELETE FROM redirects WHERE from_path = ?').bind(from).run();
}

/** Cambio di indirizzo di un contenuto pubblicato: ripunta le regole esistenti e aggiunge la nuova. */
export async function applySlugChange(oldUrl: string, newUrl: string) {
  if (oldUrl === newUrl) return;
  const existing = (await listRedirects()).map((r) => ({ from: r.from, to: r.to }));
  const plan = planSlugChange(oldUrl, newUrl, existing);
  // Tutto in un colpo solo: se si ferma a metà, un secondo salvataggio non rivedrebbe il cambio.
  const now = Date.now();
  await env.DB.batch([
    ...plan.upsert.map((r) => env.DB.prepare(upsertSql).bind(r.from, r.to, 1, now)),
    ...plan.remove.map((from) => env.DB.prepare('DELETE FROM redirects WHERE from_path = ?').bind(from)),
  ]);
}

/** Indirizzi pubblici oggi occupati da un contenuto (in ogni lingua attiva). */
export async function takenPaths(): Promise<Set<string>> {
  const kinds: Kind[] = ['pages', 'categories', 'products', 'projects', 'posts'];
  const taken = new Set<string>();
  for (const kind of kinds) {
    for (const item of await list(kind)) {
      for (const l of LOCALES) taken.add(publicUrl(kind, item as never, l));
    }
  }
  for (const l of LOCALES) taken.add(publicUrl('pages', { slug: { it: '' }, home: true }, l));
  return taken;
}
