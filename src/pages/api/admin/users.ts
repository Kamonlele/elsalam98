import type { APIRoute } from 'astro';
import { changePassword, checkPassword, createAdmin, deleteAdmin, emailTaken, listAdmins, looksLikeEmail, passwordProblem, setRole } from '../../../lib/auth';
import { isRole } from '../../../lib/roles';

// Il middleware lascia arrivare qui solo PATCH a chi non è amministratore; questo è il secondo lucchetto.
const notAdmin = (role: string | undefined) => role !== 'admin' ? Response.json({ error: 'Non hai i permessi per questa operazione.' }, { status: 403 }) : null;

export const GET: APIRoute = async ({ locals }) => notAdmin(locals.user?.role) ?? Response.json({ users: await listAdmins() });

/** Aggiunge una persona che può entrare nell'area riservata. */
export const POST: APIRoute = async ({ request, locals }) => {
  const no = notAdmin(locals.user?.role);
  if (no) return no;
  const body = (await request.json().catch(() => null)) as { email?: string; name?: string; password?: string; role?: string } | null;
  if (!isRole(body?.role)) return Response.json({ error: 'Scegli un ruolo.' }, { status: 400 });
  const email = body?.email?.trim() ?? '';
  if (!looksLikeEmail(email)) return Response.json({ error: "Controlla l'indirizzo email." }, { status: 400 });
  if (await emailTaken(email)) return Response.json({ error: 'Questa email ha già un accesso.' }, { status: 409 });
  const problem = passwordProblem(body?.password ?? '');
  if (problem) return Response.json({ error: problem }, { status: 400 });
  await createAdmin(email, body?.name ?? '', body!.password!, body.role);
  return Response.json({ ok: true });
};

/** Cambia il ruolo di un'altra persona. Il proprio no: si rischierebbe di restare fuori. */
export const PUT: APIRoute = async ({ request, locals }) => {
  const no = notAdmin(locals.user?.role);
  if (no) return no;
  const body = ((await request.json().catch(() => null)) ?? {}) as { id?: unknown; role?: unknown };
  if (typeof body.id !== 'string' || !body.id) return Response.json({ error: 'Manca la persona.' }, { status: 400 });
  if (!isRole(body.role)) return Response.json({ error: 'Scegli un ruolo.' }, { status: 400 });
  if (body.id === locals.user!.id) return Response.json({ error: 'Non puoi cambiare il tuo ruolo.' }, { status: 400 });
  if (!(await setRole(body.id, body.role))) return Response.json({ error: "Deve restare almeno un amministratore." }, { status: 400 });
  return Response.json({ ok: true });
};

/** Toglie un accesso. Non si può togliere il proprio. */
export const DELETE: APIRoute = async ({ request, locals }) => {
  const no = notAdmin(locals.user?.role);
  if (no) return no;
  const { id } = ((await request.json().catch(() => null)) ?? {}) as { id?: string };
  if (!id) return Response.json({ error: 'Manca la persona da togliere.' }, { status: 400 });
  if (id === locals.user!.id) return Response.json({ error: 'Non puoi togliere il tuo accesso.' }, { status: 400 });
  if (!(await deleteAdmin(id))) return Response.json({ error: 'Deve restare almeno un amministratore.' }, { status: 400 });
  return Response.json({ ok: true });
};

/** Cambia la propria password: serve quella attuale, poi si rientra. */
export const PATCH: APIRoute = async ({ request, locals }) => {
  const body = (await request.json().catch(() => null)) as { current?: string; next?: string } | null;
  if (!body?.current || !(await checkPassword(locals.user!.id, body.current))) {
    return Response.json({ error: 'La password attuale non è corretta.' }, { status: 400 });
  }
  const problem = passwordProblem(body.next ?? '');
  if (problem) return Response.json({ error: problem }, { status: 400 });
  await changePassword(locals.user!.id, body.next!);
  return Response.json({ ok: true });
};
