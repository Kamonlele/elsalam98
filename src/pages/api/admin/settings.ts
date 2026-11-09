import type { APIRoute } from 'astro';
import { newSecret, readSettings, settingsForAdmin, writeSettings, type Webhook } from '../../../lib/settings';
import { validConsentIds } from '../../../lib/consent';
import { EVENTS } from '../../../lib/webhooks';

export const GET: APIRoute = async () => Response.json(await settingsForAdmin());

export const PUT: APIRoute = async ({ request }) => {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: 'Richiesta non valida.' }, { status: 400 });
  const str = (k: string) => (typeof body[k] === 'string' ? (body[k] as string) : undefined);

  for (const e of (str('notifyEmails') ?? '').split(/[,;\s]+/).filter(Boolean)) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return Response.json({ error: `"${e}" non è un indirizzo email.` }, { status: 400 });
  }
  const from = str('mailFrom');
  if (from && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) return Response.json({ error: 'Il mittente deve essere un indirizzo email.' }, { status: 400 });

  const bad = validConsentIds({ iubendaSiteId: str('iubendaSiteId'), iubendaPolicyId: str('iubendaPolicyId'), gtmId: str('gtmId') });
  if (bad) return Response.json({ error: bad }, { status: 400 });

  let webhooks: Webhook[] | undefined;
  if (Array.isArray(body.webhooks)) {
    const old = (await readSettings()).webhooks;
    webhooks = [];
    for (const raw of body.webhooks as Partial<Webhook>[]) {
      const url = String(raw.url ?? '').trim();
      if (!url) continue;
      let parsed: URL;
      try { parsed = new URL(url); } catch { return Response.json({ error: `"${url}" non è un indirizzo valido.` }, { status: 400 }); }
      // Solo https, tranne che in prova sul proprio computer.
      if (parsed.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(parsed.hostname)) {
        return Response.json({ error: `Il webhook "${url}" deve iniziare con https://` }, { status: 400 });
      }
      const id = typeof raw.id === 'string' && raw.id ? raw.id : crypto.randomUUID();
      webhooks.push({
        id,
        name: String(raw.name ?? '').trim().slice(0, 60) || parsed.hostname,
        url,
        // Il segreto resta quello di prima: cambiarlo romperebbe la verifica di chi riceve.
        secret: old.find((w) => w.id === id)?.secret ?? newSecret(),
        events: (Array.isArray(raw.events) ? raw.events : []).filter((e): e is string => (EVENTS as readonly string[]).includes(e as string)),
        active: raw.active !== false,
      });
    }
  }
  await writeSettings({
    brevoApiKey: str('brevoApiKey'), mailFrom: from, mailFromName: str('mailFromName'),
    notifyEmails: str('notifyEmails'), turnstileSecret: str('turnstileSecret'),
    iubendaSiteId: str('iubendaSiteId'), iubendaPolicyId: str('iubendaPolicyId'), gtmId: str('gtmId'), webhooks,
  });
  return Response.json(await settingsForAdmin());
};
