import { describe, expect, it } from 'vitest';
import { checkChains, normalizePath, parseBulk, planSlugChange } from '../src/lib/redirect-rules';
import { publicUrl } from '../src/lib/routes';

describe('normalizePath', () => {
  it('prende il percorso di un URL completo, senza query e frammento', () => {
    expect(normalizePath('https://www.vecchio.it/chi-siamo?x=1#a')).toBe('/chi-siamo/');
  });
  it('lascia stare i file con estensione', () => {
    expect(normalizePath('/foto.jpg')).toBe('/foto.jpg');
  });
  it('aggiunge la barra finale ai percorsi senza estensione', () => {
    expect(normalizePath('/prodotti/sedia')).toBe('/prodotti/sedia/');
    expect(normalizePath('/prodotti/sedia/')).toBe('/prodotti/sedia/');
  });
  it('rifiuta vuoto e percorsi che non iniziano con /', () => {
    expect(normalizePath('chi-siamo')).toBeNull();
    expect(normalizePath('')).toBeNull();
    expect(normalizePath('   ')).toBeNull();
    expect(normalizePath('?x=1')).toBeNull();
  });
  it('rifiuta backslash e caratteri di controllo (redirect aperto verso altri siti)', () => {
    expect(normalizePath('/\\evil.com')).toBeNull();
    expect(normalizePath('/\\\\evil.com')).toBeNull();
    expect(normalizePath('https://x.it/\\evil.com')).toBeNull();
    expect(normalizePath('/a\tb')).toBeNull();
    expect(normalizePath('/a\nb')).toBeNull();
    expect(normalizePath('//evil.com')).toBeNull();
  });
  it('un backslash codificato resta un pezzo di percorso, mai un inizio // o /\\', () => {
    const r = normalizePath('/%5Cevil.com');
    expect(r).toBe('/%5Cevil.com');
    expect(r!.startsWith('//') || r!.startsWith('/\\')).toBe(false);
  });
  it('un URL con solo il dominio diventa la radice', () => {
    expect(normalizePath('https://vecchio.it')).toBe('/');
  });
});

describe('parseBulk', () => {
  it('legge una regola per riga, con spazi o tab, saltando righe vuote e commenti', () => {
    const r = parseBulk('# migrazione\n\n/vecchia /chi-siamo/\nhttps://x.it/a.html\t/b/\n');
    expect(r).toEqual({ ok: true, rules: [{ from: '/vecchia/', to: '/chi-siamo/' }, { from: '/a.html', to: '/b/' }], lines: [3, 4] });
  });
  it('segnala la riga con una sola parola', () => {
    const r = parseBulk('/a/ /b/\n/solo/\n');
    expect(r).toMatchObject({ ok: false, line: 2 });
  });
  it('segnala la riga con un indirizzo non valido', () => {
    expect(parseBulk('/a/ /b/\n/c/ senza-barra')).toMatchObject({ ok: false, line: 2 });
  });
  it('segnala la riga con origine uguale alla destinazione', () => {
    expect(parseBulk('/a/ /a')).toMatchObject({ ok: false, line: 1 });
  });
});

describe('planSlugChange', () => {
  it('crea il redirect dal vecchio al nuovo indirizzo', () => {
    expect(planSlugChange('/a/', '/b/', [])).toEqual({ upsert: [{ from: '/a/', to: '/b/' }], remove: [] });
  });
  it('accorcia le catene', () => {
    const plan = planSlugChange('/b/', '/c/', [{ from: '/a/', to: '/b/' }]);
    expect(plan.upsert).toEqual(expect.arrayContaining([{ from: '/a/', to: '/c/' }, { from: '/b/', to: '/c/' }]));
    expect(plan.upsert).toHaveLength(2);
    expect(plan.remove).toEqual([]);
  });
  it('tornando indietro toglie il redirect che farebbe un giro', () => {
    const plan = planSlugChange('/c/', '/a/', [{ from: '/a/', to: '/c/' }, { from: '/b/', to: '/c/' }]);
    expect(plan.remove).toContain('/a/');
    expect(plan.upsert).toEqual(expect.arrayContaining([{ from: '/b/', to: '/a/' }, { from: '/c/', to: '/a/' }]));
    expect(plan.upsert.some((r) => r.from === '/a/')).toBe(false);
  });
  it('una pagina che diventa la home porta il suo vecchio indirizzo su "/"', () => {
    const page = { slug: { it: 'chi-siamo' } };
    const plan = planSlugChange(publicUrl('pages', page, 'it'), publicUrl('pages', { ...page, home: true }, 'it'), [{ from: '/vecchia/', to: '/chi-siamo/' }]);
    expect(plan.upsert).toEqual([{ from: '/vecchia/', to: '/' }, { from: '/chi-siamo/', to: '/' }]);
  });
  it('non fa nulla se l\'indirizzo non cambia', () => {
    expect(planSlugChange('/a/', '/a/', [{ from: '/x/', to: '/a/' }])).toEqual({ upsert: [], remove: [] });
  });
});

describe('checkChains', () => {
  it('va bene una regola che porta a una pagina vera', () => {
    expect(checkChains([{ from: '/a/', to: '/b/' }], [{ from: '/c/', to: '/d/' }])).toBeNull();
  });
  it('rifiuta A verso B quando esiste già B verso A', () => {
    const r = checkChains([{ from: '/a/', to: '/b/' }], [{ from: '/b/', to: '/a/' }]);
    expect(r?.index).toBe(0);
    expect(r?.error).toContain('in tondo');
  });
  it('rifiuta una destinazione che rimanda già altrove, e indica dove puntare', () => {
    const r = checkChains([{ from: '/a/', to: '/b/' }], [{ from: '/b/', to: '/c/' }]);
    expect(r?.error).toContain('/c/');
  });
  it('controlla anche le righe dello stesso elenco, indicando quale', () => {
    const r = checkChains([{ from: '/x/', to: '/y/' }, { from: '/a/', to: '/b/' }, { from: '/b/', to: '/a/' }], []);
    expect(r?.index).toBe(1);
  });
  it('una regola riscritta non conta più con la destinazione vecchia', () => {
    expect(checkChains([{ from: '/b/', to: '/c/' }], [{ from: '/b/', to: '/a/' }, { from: '/a/', to: '/c/' }])).toBeNull();
  });
});
