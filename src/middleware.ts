import { defineMiddleware } from 'astro:middleware';
import { COOKIE_NAME, countAdmins, sameOrigin, userForToken } from './lib/auth';
import { adminArea, canOpen, normalisePath } from './lib/roles';

// Pagine e chiamate dell'area riservata raggiungibili senza essere entrati.
const OPEN = new Set(['/admin/accedi', '/admin/primo-accesso', '/api/admin/session', '/api/admin/setup']);

export const onRequest = defineMiddleware(async (ctx, next) => {
  // Riconoscimento su forma normalizzata: //ADMIN/ o /%61dmin/ sono comunque l'area riservata.
  const area = adminArea(ctx.url.pathname);
  if (!area) return next();
  const isAdminApi = area === 'api';
  const path = normalisePath(ctx.url.pathname) ?? '';

  if (isAdminApi && !sameOrigin(ctx.request)) {
    return Response.json({ error: 'Richiesta non valida.' }, { status: 403 });
  }

  const user = await userForToken(ctx.cookies.get(COOKIE_NAME)?.value);
  if (user) ctx.locals.user = user;

  if (!user && !OPEN.has(path)) {
    if (isAdminApi) return Response.json({ error: 'Accesso scaduto: entra di nuovo.' }, { status: 401 });
    // Senza nessun utente si va al primo accesso, altrimenti al login.
    const first = (await countAdmins().catch(() => 1)) === 0;
    return ctx.redirect(first ? '/admin/primo-accesso' : `/admin/accedi?da=${encodeURIComponent(ctx.url.pathname)}`);
  }

  if (user && !OPEN.has(path) && !canOpen(user.role, ctx.url.pathname, ctx.request.method)) {
    if (isAdminApi) return Response.json({ error: 'Non hai i permessi per questa operazione.' }, { status: 403 });
    return ctx.redirect('/admin');
  }

  const res = await next();
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
});
