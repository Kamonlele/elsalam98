import { env } from 'cloudflare:workers';
import type { Collections } from './content';
import { ensureTables } from './db';
import { seed } from './seed';

export type Name = keyof Collections;
export const COLLECTIONS: Name[] = ['pages', 'categories', 'products', 'projects', 'posts', 'locations'];
export const isCollection = (v: string): v is Name => (COLLECTIONS as string[]).includes(v);

export type Row<N extends Name> = { id: string; status: 'published' | 'draft'; sort: number; updatedAt: number; data: Collections[N] };

/**
 * Elementi pubblicati di una collezione, per il sito pubblico.
 * Finché nel database non c'è nessun contenuto (sito appena creato, o in locale
 * senza database) si vedono gli esempi di seed.ts. Appena il cliente salva qualcosa,
 * gli esempi spariscono per sempre: conta solo quello che c'è nel database.
 */
export async function list<N extends Name>(name: N): Promise<Collections[N][]> {
  try {
    if (!env.DB) throw new Error('nessun database');
    await ensureTables();
    if (await isEmpty()) return seedFor(name);
    const { results } = await env.DB
      .prepare("SELECT data FROM items WHERE collection = ? AND status = 'published' ORDER BY sort, id")
      .bind(name)
      .all<{ data: string }>();
    return results.map((r: { data: string }) => JSON.parse(r.data) as Collections[N]);
  } catch {
    return seedFor(name);
  }
}

function seedFor<N extends Name>(name: N): Collections[N][] {
  return (seed[name] as Collections[N][]).filter((i) => !('status' in i) || i.status === 'published');
}

export async function isEmpty() {
  await ensureTables();
  return !(await env.DB.prepare('SELECT 1 FROM items LIMIT 1').first());
}

/* ---------- area riservata ---------- */

type DbRow = { id: string; status: 'published' | 'draft'; sort: number; updated_at: number; data: string };
const toRow = <N extends Name>(r: DbRow): Row<N> => ({ id: r.id, status: r.status, sort: r.sort, updatedAt: r.updated_at, data: JSON.parse(r.data) });

/** Tutti gli elementi, bozze comprese. */
export async function listAll<N extends Name>(name: N): Promise<Row<N>[]> {
  await ensureTables();
  const { results } = await env.DB
    .prepare('SELECT id, status, sort, updated_at, data FROM items WHERE collection = ? ORDER BY sort, id')
    .bind(name)
    .all<DbRow>();
  return results.map((r: DbRow) => toRow<N>(r));
}

export async function getOne<N extends Name>(name: N, id: string): Promise<Row<N> | null> {
  await ensureTables();
  const r = await env.DB
    .prepare('SELECT id, status, sort, updated_at, data FROM items WHERE collection = ? AND id = ?')
    .bind(name, id)
    .first<DbRow>();
  return r ? toRow<N>(r) : null;
}

export async function save<N extends Name>(name: N, id: string, data: Collections[N], status: 'published' | 'draft', userId: string) {
  await ensureTables();
  const existing = await env.DB.prepare('SELECT sort FROM items WHERE id = ?').bind(id).first<{ sort: number }>();
  let sort = existing?.sort;
  if (sort === undefined) {
    // Un elemento nuovo va in fondo all'elenco.
    const max = await env.DB.prepare('SELECT MAX(sort) AS m FROM items WHERE collection = ?').bind(name).first<{ m: number | null }>();
    sort = (max?.m ?? -1) + 1;
  }
  await env.DB.prepare(`INSERT INTO items (id, collection, status, sort, data, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET status = excluded.status, data = excluded.data, updated_at = excluded.updated_at, updated_by = excluded.updated_by`)
    .bind(id, name, status, sort, JSON.stringify(data), Date.now(), userId)
    .run();
}

export async function remove(name: Name, id: string) {
  await env.DB.prepare('DELETE FROM items WHERE collection = ? AND id = ?').bind(name, id).run();
}

export async function reorder(name: Name, ids: string[]) {
  await env.DB.batch(ids.map((id, i) => env.DB.prepare('UPDATE items SET sort = ? WHERE collection = ? AND id = ?').bind(i, name, id)));
}

/** Copia gli esempi nel database, così il cliente parte da qualcosa di modificabile. */
export async function importSeed(userId: string) {
  for (const name of COLLECTIONS) {
    const items = seed[name] as (Collections[Name] & { id: string; status?: 'published' | 'draft' })[];
    for (const item of items) {
      if (await getOne(name, item.id)) continue;
      await save(name, item.id, item, item.status ?? 'published', userId);
    }
  }
}
