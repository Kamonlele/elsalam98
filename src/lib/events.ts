import { brand } from './brand';
import type { Booking } from './booking';
import { dueReminders, markReminded } from './booking';
import type { Lead } from './leads';
import { leadPayload } from './leads';
import { mailCustomer, mailStaff, mailStaffLead, type CustomerMail } from './mail';
import { bookingPayload, dispatch, retryDue, type EventName } from './webhooks';

/**
 * Un evento di una prenotazione: email a chi serve e consegna ai webhook iscritti.
 * Non blocca mai chi ha fatto l'azione: se l'email o un webhook falliscono,
 * la prenotazione resta valida e il webhook verrà ripetuto.
 */
export async function emitBooking(event: EventName, b: Booking, origin: string, opts: { mail?: boolean } = {}) {
  const host = new URL(origin).host;
  const customer: Partial<Record<EventName, CustomerMail>> = {
    'prenotazione.creata': 'creata',
    'prenotazione.confermata': 'confermata',
    'prenotazione.spostata': 'spostata',
    'prenotazione.annullata': 'annullata',
    'promemoria.inviato': 'promemoria',
  };
  const jobs: Promise<unknown>[] = [dispatch(event, bookingPayload(event, b, origin))];
  if (opts.mail !== false && customer[event]) jobs.push(mailCustomer(customer[event]!, b, host));
  if (event === 'prenotazione.creata') jobs.push(mailStaff(b, origin));
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === 'rejected') console.error('[prenotazioni]', event, r.reason);
}

/** Una richiesta da modulo: webhook `lead.creato` e avviso a chi gestisce le richieste. Errori solo nel log. */
export async function emitLead(lead: Lead, origin: string) {
  const results = await Promise.allSettled([dispatch('lead.creato', leadPayload(lead, origin)), mailStaffLead(lead, origin)]);
  for (const r of results) if (r.status === 'rejected') console.error('[richieste]', r.reason);
}

/**
 * Attività programmata (ogni 15 minuti, vedi wrangler.jsonc):
 * ripete i webhook non consegnati e, dalle 9 in poi, manda i promemoria per domani.
 */
export async function runScheduled(localHour: number) {
  const origin = brand.identity.siteUrl.replace(/\/$/, '');
  const retried = await retryDue();
  let reminded = 0;
  if (localHour >= 9 && localHour < 21) {
    for (const b of await dueReminders()) {
      await markReminded(b.id);
      await emitBooking('promemoria.inviato', b, origin);
      reminded++;
    }
  }
  return { retried, reminded };
}
