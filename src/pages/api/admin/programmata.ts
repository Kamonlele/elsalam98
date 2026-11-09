import type { APIRoute } from 'astro';
import { localNow } from '../../../lib/booking';
import { runScheduled } from '../../../lib/events';

/** Esegue subito quello che fa l'attività programmata ogni 15 minuti. */
export const POST: APIRoute = async () => Response.json(await runScheduled(Number(localNow().time.slice(0, 2))));
