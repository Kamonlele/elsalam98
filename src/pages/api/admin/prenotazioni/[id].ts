import type { APIRoute } from 'astro';
import { availability, getBooking, moveBooking, setNote, setStatus, type Status } from '../../../../lib/booking';
import { emitBooking } from '../../../../lib/events';
import { later } from '../../../../lib/later';
import { list } from '../../../../lib/store';

const ACTIONS: Record<string, { status: Status; event: string }> = {
  conferma: { status: 'confermata', event: 'prenotazione.confermata' },
  annulla: { status: 'annullata', event: 'prenotazione.annullata' },
  presente: { status: 'presente', event: 'prenotazione.presente' },
  assente: { status: 'assente', event: 'prenotazione.assente' },
};

/** Orari liberi della sede, per spostare la prenotazione (il suo orario attuale resta libero). */
export const GET: APIRoute = async ({ params }) => {
  const b = await getBooking(params.id ?? '');
  if (!b) return Response.json({ error: 'Prenotazione non trovata.' }, { status: 404 });
  const loc = (await list('locations')).find((l) => l.id === b.locationId);
  if (!loc) return Response.json({ error: 'La sede di questa prenotazione non esiste più.' }, { status: 404 });
  return Response.json({ days: await availability(loc, { id: b.id }) });
};

export const PATCH: APIRoute = async ({ params, request, locals, url }) => {
  const b = await getBooking(params.id ?? '');
  if (!b) return Response.json({ error: 'Prenotazione non trovata.' }, { status: 404 });
  const body = (await request.json().catch(() => null)) as { action?: string; date?: string; time?: string; note?: string; notify?: boolean } | null;
  const notify = body?.notify !== false;

  if (body?.action === 'nota') {
    await setNote(b.id, String(body.note ?? ''));
    return Response.json({ ok: true, booking: await getBooking(b.id) });
  }
  if (body?.action === 'sposta') {
    const r = await moveBooking(b, String(body.date ?? ''), String(body.time ?? ''));
    if (r === 'full') return Response.json({ error: 'Quell\'orario nel frattempo si è riempito. Scegline un altro.' }, { status: 409 });
    if (r === 'gone') return Response.json({ error: 'Quell\'orario non è prenotabile.' }, { status: 409 });
    const moved = (await getBooking(b.id))!;
    await later(locals, emitBooking('prenotazione.spostata', moved, url.origin, { mail: notify }));
    return Response.json({ ok: true, booking: moved });
  }
  const a = ACTIONS[body?.action ?? ''];
  if (!a) return Response.json({ error: 'Azione non valida.' }, { status: 400 });
  if (b.status === a.status) return Response.json({ ok: true, booking: b });
  await setStatus(b.id, a.status);
  const updated = (await getBooking(b.id))!;
  await later(locals, emitBooking(a.event as never, updated, url.origin, { mail: notify }));
  return Response.json({ ok: true, booking: updated });
};
