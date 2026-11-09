import { describe, expect, it } from 'vitest';
import { localizeHref } from './links';

describe('localizeHref', () => {
  const map = new Map([['/documents/', '/it/documenti/']]);
  it('porta una pagina del sito nella lingua giusta, tenendo l’ancora', () => {
    expect(localizeHref('/documents/#erika', map)).toBe('/it/documenti/#erika');
    expect(localizeHref('/documents', map)).toBe('/it/documenti/');
  });
  it('lascia stare indirizzi esterni e sconosciuti', () => {
    expect(localizeHref('https://example.com/documents/', map)).toBe('https://example.com/documents/');
    expect(localizeHref('/altro/', map)).toBe('/altro/');
    expect(localizeHref('#visita', map)).toBe('#visita');
  });
});
