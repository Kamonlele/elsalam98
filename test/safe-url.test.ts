import { describe, expect, it } from 'vitest';
import { isSafeHref, isSafeMediaSrc } from '../src/lib/safe-url';

// Il browser li legge come "//evil.com", cioè un altro sito.
const OPEN = ['/\\evil.com', '/\t/evil.com', '/\n/evil.com', '//evil.com', '/\r/evil.com', '/\u0000x'];

describe('isSafeHref', () => {
  it('ammette web, posta, telefono e percorsi del sito', () => {
    for (const h of ['https://esempio.it', 'http://esempio.it/a', 'HTTPS://X.IT', 'mailto:a@b.it', 'tel:+39000', '/', '/chi-siamo/', '/a?b=1#c'])
      expect(isSafeHref(h), h).toBe(true);
  });
  it('rifiuta i percorsi che il browser porta su un altro sito', () => {
    for (const h of OPEN) expect(isSafeHref(h), JSON.stringify(h)).toBe(false);
  });
  it('rifiuta schemi pericolosi, vuoto e indirizzi relativi', () => {
    for (const h of ['javascript:alert(1)', 'data:text/html,x', '', 'chi-siamo', 'https://x.it/\tb', ' /a'])
      expect(isSafeHref(h), JSON.stringify(h)).toBe(false);
  });
});

describe('isSafeMediaSrc', () => {
  it('ammette solo file sotto /media/', () => {
    expect(isSafeMediaSrc('/media/img/abc/full.webp')).toBe(true);
    expect(isSafeMediaSrc('/media/foto/x.jpg')).toBe(true);
  });
  it('rifiuta risalite, altri percorsi e caratteri di controllo', () => {
    for (const s of ['/media/../x', '/altro/x.jpg', 'https://x.it/media/a.jpg', '/media/a\tb', '/media/a\\b', ...OPEN])
      expect(isSafeMediaSrc(s), JSON.stringify(s)).toBe(false);
  });
});
