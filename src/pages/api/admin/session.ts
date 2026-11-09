import type { APIRoute } from 'astro';
import { COOKIE_NAME, cookieOptions, endSession, login } from '../../../lib/auth';

/** Entra. */
export const POST: APIRoute = async ({ request, cookies }) => {
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  if (!body?.email || !body?.password) return Response.json({ error: 'Inserisci email e password.' }, { status: 400 });
  const result = await login(body.email, body.password);
  if (!result.ok) return Response.json({ error: result.error }, { status: 401 });
  cookies.set(COOKIE_NAME, result.token, cookieOptions(request));
  return Response.json({ ok: true });
};

/** Esci. */
export const DELETE: APIRoute = async ({ request, cookies }) => {
  await endSession(cookies.get(COOKIE_NAME)?.value);
  cookies.delete(COOKIE_NAME, { path: '/' });
  void request;
  return Response.json({ ok: true });
};
