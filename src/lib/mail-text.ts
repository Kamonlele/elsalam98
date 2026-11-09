import type { Locale } from './brand';

/** Testi delle email al cliente. {nome}, {quando}, {dove}, {codice}, {azienda} si sostituiscono. */
type Texts = {
  subject: Record<'creata' | 'creataConfermata' | 'confermata' | 'spostata' | 'annullata' | 'promemoria', string>;
  lead: Record<'creata' | 'creataConfermata' | 'confermata' | 'spostata' | 'annullata' | 'promemoria', string>;
  hello: string; when: string; where: string; product: string; code: string; video: string;
  calendar: string; changes: string; signature: string; summary: string;
};

export const MAIL: Record<'it' | 'en' | 'fr', Texts> = {
  it: {
    subject: {
      creata: 'Richiesta di visita ricevuta',
      creataConfermata: 'Visita confermata',
      confermata: 'Visita confermata',
      spostata: 'Visita spostata',
      annullata: 'Visita annullata',
      promemoria: 'Ti aspettiamo domani',
    },
    lead: {
      creata: 'abbiamo ricevuto la tua richiesta di visita. Ti scriviamo appena la confermiamo.',
      creataConfermata: 'la tua visita è confermata. Ti aspettiamo.',
      confermata: 'la tua visita è confermata. Ti aspettiamo.',
      spostata: 'abbiamo spostato la tua visita. Ecco il nuovo appuntamento.',
      annullata: 'la tua visita è stata annullata. Se vuoi, puoi prenotarne un\'altra dal sito.',
      promemoria: 'ti ricordiamo l\'appuntamento di domani.',
    },
    hello: 'Ciao {nome},',
    when: 'Quando', where: 'Dove', product: 'Prodotto', code: 'Codice',
    video: 'Videochiamata: riceverai il link prima dell\'appuntamento.',
    calendar: 'In allegato trovi l\'invito da aggiungere al calendario.',
    changes: 'Per spostare o annullare, rispondi a questa email o chiamaci.',
    signature: 'A presto,\n{azienda}',
    summary: 'Visita {azienda}',
  },
  en: {
    subject: {
      creata: 'Visit request received',
      creataConfermata: 'Visit confirmed',
      confermata: 'Visit confirmed',
      spostata: 'Visit rescheduled',
      annullata: 'Visit cancelled',
      promemoria: 'See you tomorrow',
    },
    lead: {
      creata: 'we received your visit request. We will write again as soon as we confirm it.',
      creataConfermata: 'your visit is confirmed. We look forward to seeing you.',
      confermata: 'your visit is confirmed. We look forward to seeing you.',
      spostata: 'we moved your visit. Here is the new appointment.',
      annullata: 'your visit has been cancelled. You can book another one on our website.',
      promemoria: 'a quick reminder of your appointment tomorrow.',
    },
    hello: 'Hello {nome},',
    when: 'When', where: 'Where', product: 'Product', code: 'Reference',
    video: 'Video call: you will receive the link before the appointment.',
    calendar: 'The attached invite adds the visit to your calendar.',
    changes: 'To move or cancel, reply to this email or call us.',
    signature: 'Best regards,\n{azienda}',
    summary: 'Visit to {azienda}',
  },
  fr: {
    subject: {
      creata: 'Demande de visite reçue',
      creataConfermata: 'Visite confirmée',
      confermata: 'Visite confirmée',
      spostata: 'Visite déplacée',
      annullata: 'Visite annulée',
      promemoria: 'À demain',
    },
    lead: {
      creata: 'nous avons bien reçu votre demande de visite. Nous vous écrivons dès qu\'elle est confirmée.',
      creataConfermata: 'votre visite est confirmée. Nous vous attendons.',
      confermata: 'votre visite est confirmée. Nous vous attendons.',
      spostata: 'nous avons déplacé votre visite. Voici le nouveau rendez-vous.',
      annullata: 'votre visite a été annulée. Vous pouvez en réserver une autre sur notre site.',
      promemoria: 'nous vous rappelons votre rendez-vous de demain.',
    },
    hello: 'Bonjour {nome},',
    when: 'Quand', where: 'Où', product: 'Produit', code: 'Référence',
    video: 'Appel vidéo : vous recevrez le lien avant le rendez-vous.',
    calendar: 'L\'invitation jointe ajoute la visite à votre agenda.',
    changes: 'Pour déplacer ou annuler, répondez à cet e-mail ou appelez-nous.',
    signature: 'À bientôt,\n{azienda}',
    summary: 'Visite {azienda}',
  },
};

export const mailText = (l: Locale) => MAIL[(l in MAIL ? l : 'it') as keyof typeof MAIL];
