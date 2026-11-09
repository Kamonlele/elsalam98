import type { APIRoute } from 'astro';
import { importSeed } from '../../../lib/store';

export const POST: APIRoute = async ({ locals }) => {
  await importSeed(locals.user!.id);
  return Response.json({ ok: true });
};
