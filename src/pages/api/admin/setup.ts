import type { APIRoute } from 'astro';
import { COOKIE_NAME, cookieOptions, countAdmins, createAdmin, login, looksLikeEmail, passwordProblem } from '../../../lib/auth';

/** Primo accesso: funziona solo finché non esiste nessun utente. */
export const POST: APIRoute = async ({ request, cookies }) => {
  if ((await countAdmins()) > 0) return Response.json({ error: "L'area riservata è già configurata: entra con il tuo account." }, { status: 409 });
  const body = (await request.json().catch(() => null)) as { email?: string; name?: string; password?: string } | null;
  const email = body?.email?.trim() ?? '';
  const password = body?.password ?? '';
  if (!looksLikeEmail(email)) return Response.json({ error: "Controlla l'indirizzo email." }, { status: 400 });
  const problem = passwordProblem(password);
  if (problem) return Response.json({ error: problem }, { status: 400 });
  // Il primo accesso è sempre un amministratore: qualcuno deve poter dare gli altri ruoli.
  await createAdmin(email, body?.name ?? '', password, 'admin');
  const result = await login(email, password);
  if (result.ok) cookies.set(COOKIE_NAME, result.token, cookieOptions(request));
  return Response.json({ ok: true });
};
