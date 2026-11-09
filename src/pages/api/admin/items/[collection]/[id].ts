import type { APIRoute } from 'astro';
import { getOne, isCollection, remove, save } from '../../../../../lib/store';
import { validate } from '../../../../../lib/validate';
import { LOCALES } from '../../../../../lib/brand';
import { applySlugChange } from '../../../../../lib/redirects';
import { publicUrl, type Kind } from '../../../../../lib/routes';
import { canEditItem, keepSlug, mergeTexts, textOnlyCollections, type Role } from '../../../../../lib/roles';
import { SCHEMAS } from '../../../../../lib/schema';

const WITH_URL: string[] = ['pages', 'categories', 'products', 'projects', 'posts'];

const badId = (id: string | undefined) => !id || !/^[a-z0-9-]{3,80}$/.test(id);
// Doppione del controllo del middleware: se un giorno la rotta cambia nome, qui resta chiusa.
const denied = (role: Role | undefined, name: string, method: string) =>
  !role || !canEditItem(role, name, method) ? Response.json({ error: 'Non hai i permessi per questa operazione.' }, { status: 403 }) : null;

export const GET: APIRoute = async ({ params, locals }) => {
  if (!isCollection(params.collection ?? '') || badId(params.id)) return Response.json({ error: 'Non trovato.' }, { status: 404 });
  const no = denied(locals.user?.role, params.collection!, 'GET');
  if (no) return no;
  const row = await getOne(params.collection as never, params.id!);
  return row ? Response.json(row) : Response.json({ error: 'Non trovato.' }, { status: 404 });
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const name = params.collection ?? '';
  if (!isCollection(name) || badId(params.id)) return Response.json({ error: 'Non trovato.' }, { status: 404 });
  const role = locals.user?.role;
  const no = denied(role, name, 'PUT');
  if (no) return no;
  const body = (await request.json().catch(() => null)) as { status?: string; data?: unknown } | null;
  let status: 'published' | 'draft' = body?.status === 'draft' ? 'draft' : 'published';
  let data = body?.data;
  const before = WITH_URL.includes(name) || role !== 'admin' ? await getOne(name, params.id!) : null;
  // Il redattore cambia solo i testi di ciò che esiste: foto, indirizzo, blocchi e stato restano quelli salvati.
  const textOnly = role === 'redattore' && textOnlyCollections.includes(name);
  if (textOnly) {
    if (!before) return Response.json({ error: 'Puoi solo cambiare i testi di ciò che esiste già.' }, { status: 403 });
    data = mergeTexts(before.data, data, SCHEMAS[name].sections.flatMap((s) => s.fields));
    status = before.status;
  }
  const result = await validate(name, params.id!, data, status);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  if (textOnly) result.data = keepSlug(before!.data, result.data);
  await save(name, params.id!, result.data as never, status, locals.user!.id);
  // Solo se era online e lo resta: da una bozza non c'è un indirizzo da difendere.
  // La home vive sempre su "/" e non ha un indirizzo vecchio da difendere; una pagina che diventa
  // la home sì: il suo indirizzo di prima porta alla home (publicUrl dà "/" per la home).
  const after = result.data as { slug: never; home?: boolean };
  const prev = before?.data as { slug: never; home?: boolean } | undefined;
  if (prev && before!.status === 'published' && status === 'published' && !prev.home) {
    for (const l of LOCALES) {
      await applySlugChange(publicUrl(name as Kind, prev, l), publicUrl(name as Kind, after, l));
    }
  }
  return Response.json({ ok: true, data: result.data });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const name = params.collection ?? '';
  if (!isCollection(name) || badId(params.id)) return Response.json({ error: 'Non trovato.' }, { status: 404 });
  const no = denied(locals.user?.role, name, 'DELETE');
  if (no) return no;
  await remove(name, params.id!);
  return Response.json({ ok: true });
};
