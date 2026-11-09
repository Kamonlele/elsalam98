import raw from '../../brand.json';

export type Locale = 'it' | 'en' | 'fr' | 'de' | 'es' | 'ar';

/** Lingue scritte da destra a sinistra: la pagina prende dir="rtl". */
export const RTL: Locale[] = ['ar'];
export const dirOf = (l: Locale) => (RTL.includes(l) ? 'rtl' : 'ltr');

/** Nome di ogni lingua scritto nella lingua stessa, per il selettore. */
/** Sigla breve per la barra in alto: l'arabo resta nella sua scrittura. */
export const LOCALE_SHORT: Record<Locale, string> = { it: 'IT', en: 'EN', fr: 'FR', de: 'DE', es: 'ES', ar: 'عربي' };

export const LOCALE_NAMES: Record<Locale, string> = { it: 'Italiano', en: 'English', fr: 'Français', de: 'Deutsch', es: 'Español', ar: 'العربية' };

export const brand = raw;
export const DEFAULT_LOCALE = raw.locales.default as Locale;
export const LOCALES = raw.locales.active as Locale[];
export const features = raw.features;

/** Articoli: pezzo di indirizzo e titolo dell'elenco, per lingua. */
export const blog = raw.blog as unknown as { segment: Partial<Record<Locale, string>>; title: Partial<Record<Locale, string>> };

export type BookingQuestion = { id: string; required?: boolean; label: Partial<Record<Locale, string>>; options: { value: string; label: Partial<Record<Locale, string>> }[] };
export const booking = raw.booking as unknown as {
  timezone: string;
  daysAhead: number;
  minNoticeHours: number;
  visitMinutes: number;
  autoConfirm: boolean;
  askCity: boolean;
  questions: BookingQuestion[];
  turnstileSiteKey: string;
};
export const isLocaleCode = (v: string): v is Locale => (LOCALES as string[]).includes(v);
