import { describe, expect, it } from 'vitest';
import { consentHead, gtmNoscript, validConsentIds } from '../src/lib/consent';

const empty = { iubendaSiteId: '', iubendaPolicyId: '', gtmId: '' };
const full = { iubendaSiteId: '1234567', iubendaPolicyId: '7654321', gtmId: 'GTM-ABC123' };

describe('consentHead', () => {
  it('senza nulla configurato non scrive niente', () => {
    expect(consentHead(empty, 'it')).toBe('');
  });
  it('mette gli script nell ordine: default negato, configurazione, iubenda, GTM', () => {
    const h = consentHead(full, 'it');
    const at = (s: string) => h.indexOf(s);
    const order = [
      "gtag('consent','default'", '_iub.csConfiguration',
      'https://cs.iubenda.com/autoblocking/1234567.js', 'https://cdn.iubenda.com/cs/iubenda_cs.js',
      'googletagmanager.com/gtm.js', 'GTM-ABC123',
    ].map(at);
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    for (const k of ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage']) expect(h).toContain(`'${k}':'denied'`);
    expect(h).toContain('wait_for_update:500');
    expect(h).toContain('siteId:1234567');
    expect(h).toContain('cookiePolicyId:7654321');
    expect(h).toContain('lang:"it"');
    expect(h).toContain('googleConsentMode:true');
    expect(h).toContain('perPurposeConsent:true');
  });
  it('solo GTM: il default negato c è comunque, prima di GTM', () => {
    const h = consentHead({ ...empty, gtmId: 'GTM-ABC123' }, 'en');
    expect(h.indexOf("gtag('consent','default'")).toBeGreaterThanOrEqual(0);
    expect(h.indexOf("gtag('consent','default'")).toBeLessThan(h.indexOf('gtm.js'));
    expect(h).not.toContain('iubenda');
  });
  it('solo iubenda: niente GTM', () => {
    const h = consentHead({ ...empty, iubendaSiteId: '1', iubendaPolicyId: '2' }, 'it');
    expect(h).toContain('iubenda_cs.js');
    expect(h).not.toContain('googletagmanager');
  });
  it('id non validi non entrano mai nell HTML', () => {
    expect(consentHead({ iubendaSiteId: '1;alert(1)', iubendaPolicyId: '2', gtmId: "GTM-X');evil" }, 'it')).toBe('');
  });
  it('la lingua è ripulita', () => {
    expect(consentHead(full, 'it"};alert(1)//')).not.toContain('alert');
  });
});

describe('gtmNoscript', () => {
  it('iframe con l ID', () => {
    expect(gtmNoscript('GTM-ABC123')).toContain('https://www.googletagmanager.com/ns.html?id=GTM-ABC123');
  });
  it('vuoto o non valido: niente', () => {
    expect(gtmNoscript('')).toBe('');
    expect(gtmNoscript('x"><script>')).toBe('');
  });
});

describe('validConsentIds', () => {
  it('GTM', () => {
    expect(validConsentIds({ gtmId: 'GTM-12' })).toMatch(/GTM/);
    expect(validConsentIds({ gtmId: 'GTM-ABC123' })).toBeNull();
    expect(validConsentIds({ gtmId: '' })).toBeNull();
  });
  it('iubenda solo cifre', () => {
    expect(validConsentIds({ iubendaSiteId: 'abc' })).toMatch(/iubenda/i);
    expect(validConsentIds({ iubendaPolicyId: '12a' })).toMatch(/iubenda/i);
    expect(validConsentIds({ iubendaSiteId: '123', iubendaPolicyId: '456' })).toBeNull();
  });
});
