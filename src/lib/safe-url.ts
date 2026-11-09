/**
 * Indirizzi ammessi negli attributi delle pagine (link, pulsanti, foto). Logica pura.
 * Il browser toglie tabulazioni e a capo e legge "\" come "/": "/\evil.com" o "/<TAB>/evil.com"
 * diventano "//evil.com", cioè un altro sito. Per questo i caratteri di controllo e "\" si rifiutano prima di tutto.
 */
const UNSAFE_CHARS = /[\\\u0000-\u001f\u007f]/;
const HREF = /^(https?:\/\/|mailto:|tel:|\/(?![/\\]))/i;
const MEDIA = /^\/media\/(?!.*\.\.)[A-Za-z0-9/_.-]+$/;

export const hasUnsafeChars = (v: string) => UNSAFE_CHARS.test(v);

/** Web, posta, telefono, o un percorso del sito che inizia con una sola "/". */
export const isSafeHref = (v: string) => !UNSAFE_CHARS.test(v) && HREF.test(v);

/** Solo file serviti dalla rotta /media del sito. */
export const isSafeMediaSrc = (v: string) => !UNSAFE_CHARS.test(v) && MEDIA.test(v);
