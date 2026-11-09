import { handle } from '@astrojs/cloudflare/handler';
import { localNow } from './lib/booking';
import { runScheduled } from './lib/events';

type Ctx = { waitUntil(p: Promise<unknown>): void; passThroughOnException?(): void };

/**
 * Punto d'ingresso del worker: le pagine passano da Astro, l'attività programmata
 * (promemoria e ripetizioni dei webhook) da qui.
 */
export default {
  async fetch(request: Request, env: unknown, ctx: Ctx) {
    return handle(request, env as never, ctx as never);
  },
  async scheduled(_controller: unknown, _env: unknown, ctx: Ctx) {
    const hour = Number(localNow().time.slice(0, 2));
    ctx.waitUntil(runScheduled(hour).then((r) => console.log('[programmata]', JSON.stringify(r))));
  },
};
