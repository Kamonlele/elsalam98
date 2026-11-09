import { describe, expect, it } from 'vitest';
import { parseLead } from '../src/lib/lead-input';
import { csvCell } from '../src/lib/antispam';
import { leadPayload, type Lead } from '../src/lib/leads';

const valid = {
  modulo: 'configuratore', nome: '  Anna   Maria ', cognome: ' De  Luca ', email: ' Anna@Example.IT ', tel: '+39 333 1234567',
  comune: 'Brescia', risposte: [{ id: 'forma', label: 'Forma', value: 'Rettangolare' }], privacy: true, pagina: '/configuratore',
  fonte: { utm_source: 'google' }, sito: '', ms: 5000,
};
const ok = (raw: unknown) => { const r = parseLead(raw); if (!r.ok || 'robot' in r) throw new Error(JSON.stringify(r)); return r.lead; };
const err = (raw: unknown) => { const r = parseLead(raw); return r.ok ? 'ok' : r.error; };

describe('parseLead', () => {
  it('accetta un modulo valido e ripulisce', () => {
    const l = ok(valid);
    expect(l.firstName).toBe('Anna Maria');
    expect(l.lastName).toBe('De Luca');
    expect(l.email).toBe('anna@example.it');
    expect(l.form).toBe('configuratore');
    expect(l.city).toBe('Brescia');
  });
  it('rifiuta modulo, nome, email, telefono, consenso', () => {
    expect(err({ ...valid, modulo: 'X' })).toBe('form');
    expect(err({ ...valid, modulo: 'a_b' })).toBe('form');
    expect(err({ ...valid, nome: 'M' })).toBe('name');
    expect(err({ ...valid, cognome: 'R' })).toBe('name');
    expect(err({ ...valid, email: 'anna.example.it' })).toBe('email');
    expect(err({ ...valid, tel: '123 456' })).toBe('phone');
    expect(err({ ...valid, privacy: false })).toBe('consent');
    expect(err(null)).toBe('invalid');
  });
  it('riconosce i robot', () => {
    expect(parseLead({ ...valid, sito: 'x' })).toEqual({ ok: true, robot: true });
    expect(parseLead({ ...valid, ms: 1200 })).toEqual({ ok: true, robot: true });
  });
  it('limita e ripulisce le risposte', () => {
    expect(err({ ...valid, risposte: Array.from({ length: 41 }, (_, i) => ({ id: `q${i}`, label: 'L', value: 'v' })) })).toBe('answers');
    const l = ok({ ...valid, risposte: [
      { id: 'ok', label: 'x'.repeat(200), value: 'y'.repeat(900) },
      { id: 'no spazi!', label: 'L', value: 'v' },
      { id: 'vuota', label: 'L', value: '  ' },
    ] });
    expect(l.answers).toHaveLength(1);
    expect(l.answers[0].label).toHaveLength(120);
    expect(l.answers[0].value).toHaveLength(500);
  });
  it('tiene solo le chiavi di provenienza note', () => {
    const l = ok({ ...valid, fonte: { utm_source: 'g', altro: 'x', gclid: 'z'.repeat(400) } });
    expect(Object.keys(l.source).sort()).toEqual(['gclid', 'utm_source']);
    expect(l.source.gclid).toHaveLength(300);
  });
});

describe('csvCell', () => {
  it('neutralizza le formule', () => expect(csvCell('=SOMMA(A1)')).toBe(`"'=SOMMA(A1)"`));
  it('raddoppia le virgolette', () => expect(csvCell('a"b')).toBe('"a""b"'));
  it('lascia stare il testo normale', () => expect(csvCell('ciao')).toBe('ciao'));
});

describe('leadPayload', () => {
  it('ha la forma attesa dai webhook', () => {
    const lead: Lead = { ...ok(valid), id: 'i1', ref: 'ABC234', createdAt: 0, status: 'nuova' };
    const p = leadPayload(lead, 'https://x.it');
    expect(p.event).toBe('lead.creato');
    expect(p.contact.first_name).toBe('Anna Maria');
    expect(p.contact.last_name).toBe('De Luca');
    expect(p.answers).toEqual({ forma: 'Rettangolare' });
    expect(p.answers_text).toBe('Forma: Rettangolare');
    expect(p.lead.admin_url).toBe('https://x.it/admin/richieste');
  });
});
