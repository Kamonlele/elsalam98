/**
 * Lavoro da finire dopo aver risposto (email, webhook): chi prenota non aspetta
 * i servizi esterni. Senza contesto Cloudflare (alcuni casi in locale) si attende e basta.
 */
export function later(locals: App.Locals, job: Promise<unknown>) {
  const ctx = (locals as { cfContext?: { waitUntil(p: Promise<unknown>): void } }).cfContext;
  const safe = job.catch((err) => console.error('[dopo la risposta]', err));
  if (ctx?.waitUntil) { ctx.waitUntil(safe); return Promise.resolve(); }
  return safe;
}
