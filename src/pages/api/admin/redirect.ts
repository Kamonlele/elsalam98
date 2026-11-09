import type { APIRoute } from 'astro';
import { checkChains, normalizePath, parseBulk, type Rule } from '../../../lib/redirect-rules';
import { listRedirects, removeRedirect, saveRedirects, takenPaths } from '../../../lib/redirects';

export const GET: APIRoute = async () => Response.json({ redirects: await listRedirects() });

/** Aggiunge un redirect (`from` e `to`) o un elenco incollato (`bulk`). */
export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as { from?: string; to?: string; bulk?: string } | null;
  let rules: Rule[];
  let lines: number[] | null = null;
  if (typeof body?.bulk === 'string') {
    const parsed = parseBulk(body.bulk);
    if (!parsed.ok) return Response.json({ error: `Riga ${parsed.line}: ${parsed.error}` }, { status: 400 });
    if (!parsed.rules.length) return Response.json({ error: 'Non ho trovato nessuna riga da aggiungere.' }, { status: 400 });
    rules = parsed.rules;
    lines = parsed.lines;
  } else {
    const from = normalizePath(body?.from ?? '');
    const to = normalizePath(body?.to ?? '');
    if (!from || !to) return Response.json({ error: 'Gli indirizzi devono iniziare con /.' }, { status: 400 });
    if (from === to) return Response.json({ error: 'Il vecchio e il nuovo indirizzo sono uguali.' }, { status: 400 });
    rules = [{ from, to }];
  }
  const taken = await takenPaths();
  const clash = rules.findIndex((r) => taken.has(r.from));
  if (clash >= 0) {
    const where = lines ? `Riga ${lines[clash]}: ` : '';
    return Response.json({ error: `${where}${rules[clash].from} è l'indirizzo di una pagina che esiste già: il redirect non servirebbe a niente.` }, { status: 400 });
  }
  const chain = checkChains(rules, (await listRedirects()).map((r) => ({ from: r.from, to: r.to })));
  if (chain) return Response.json({ error: `${lines ? `Riga ${lines[chain.index]}: ` : ''}${chain.error}` }, { status: 400 });
  await saveRedirects(rules, false);
  return Response.json({ ok: true, added: rules.length });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { from } = ((await request.json().catch(() => null)) ?? {}) as { from?: string };
  if (!from) return Response.json({ error: 'Manca il redirect da togliere.' }, { status: 400 });
  await removeRedirect(from);
  return Response.json({ ok: true });
};
