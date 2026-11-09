import { describe, expect, it } from 'vitest';
import { cleanDoc, plainText, readingMinutes, renderDoc, type RichDoc } from '../src/lib/richtext';

const text = (t: string, marks?: unknown[]) => ({ type: 'text', text: t, ...(marks ? { marks } : {}) });
const para = (...content: unknown[]) => ({ type: 'paragraph', content });
const doc = (...content: unknown[]) => ({ type: 'doc', content }) as RichDoc;

describe('cleanDoc', () => {
  const dirty = {
    type: 'doc',
    content: [
      { type: 'script', content: [text('alert(1)')] },
      { type: 'heading', attrs: { level: 1 }, content: [text('Titolo')] },
      para(text('clicca', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }])),
      { type: 'image', attrs: { src: 'https://altro.it/x.jpg', alt: 'x' } },
    ],
  };
  const out = cleanDoc(dirty);

  it('toglie i nodi sconosciuti e le immagini esterne', () => {
    expect(out.content.map((n) => n.type)).toEqual(['heading', 'paragraph']);
    expect(JSON.stringify(out)).not.toContain('script');
    expect(JSON.stringify(out)).not.toContain('altro.it');
  });
  it('il titolo di livello 1 diventa di livello 2', () => {
    expect(out.content[0]).toEqual({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Titolo' }] });
  });
  it('il link pericoloso perde il segno ma tiene il testo', () => {
    expect(out.content[1]).toEqual({ type: 'paragraph', content: [{ type: 'text', text: 'clicca' }] });
  });
  it('tiene i link e le immagini ammessi, con i soli attributi conosciuti', () => {
    const ok = cleanDoc(doc(
      para(text('sito', [{ type: 'link', attrs: { href: 'https://esempio.it', target: '_blank', onclick: 'x' } }, { type: 'bold' }, { type: 'strike' }])),
      { type: 'image', attrs: { src: '/media/img/a/full.webp', alt: 'Foto', title: 'Didascalia', onerror: 'x' } },
    ));
    expect(ok.content[0]).toEqual(para({ type: 'text', text: 'sito', marks: [{ type: 'link', attrs: { href: 'https://esempio.it' } }, { type: 'bold' }] }));
    expect(ok.content[1]).toEqual({ type: 'image', attrs: { src: '/media/img/a/full.webp', alt: 'Foto', title: 'Didascalia' } });
  });
  it('accetta mailto, tel e percorsi del sito, non "//"', () => {
    const hrefs = ['mailto:a@b.it', 'tel:+39000', '/chi-siamo/', '//altro.it', 'data:text/html,x'];
    const d = cleanDoc(doc(...hrefs.map((href) => para(text(href, [{ type: 'link', attrs: { href } }])))));
    expect(d.content.map((p) => (p as { content: { marks?: unknown[] }[] }).content[0].marks?.length ?? 0)).toEqual([1, 1, 1, 0, 0]);
  });
  it('rifiuta i percorsi che il browser porta su un altro sito', () => {
    const hrefs = ['/\\evil.com', '/\t/evil.com', '/\n/evil.com'];
    const d = cleanDoc(doc(...hrefs.map((href) => para(text(href, [{ type: 'link', attrs: { href } }])))));
    expect(d.content.map((p) => (p as { content: { marks?: unknown[] }[] }).content[0].marks?.length ?? 0)).toEqual([0, 0, 0]);
    const html = renderDoc({ type: 'doc', content: hrefs.map((href) => para(text('x', [{ type: 'link', attrs: { href } }]))) } as never);
    expect(html).not.toContain('<a ');
  });
  it('null, testo e forme strane danno un documento vuoto, senza errori', () => {
    expect(cleanDoc(null)).toEqual({ type: 'doc', content: [] });
    expect(cleanDoc('ciao')).toEqual({ type: 'doc', content: [] });
    expect(cleanDoc({ type: 'doc', content: 'x' })).toEqual({ type: 'doc', content: [] });
    expect(cleanDoc({ type: 'doc', content: [null, 3, { type: 'paragraph', content: [{ type: 'text', text: 5 }] }] }))
      .toEqual({ type: 'doc', content: [{ type: 'paragraph' }] });
  });
  it('liste e citazioni tengono solo figli ammessi', () => {
    const d = cleanDoc(doc(
      { type: 'bulletList', content: [{ type: 'listItem', content: [para(text('uno'))] }, para(text('fuori posto'))] },
      { type: 'blockquote', content: [para(text('cit'))] },
      { type: 'horizontalRule', attrs: { x: 1 } },
    ));
    expect(d.content).toEqual([
      { type: 'bulletList', content: [{ type: 'listItem', content: [para({ type: 'text', text: 'uno' })] }] },
      { type: 'blockquote', content: [para({ type: 'text', text: 'cit' })] },
      { type: 'horizontalRule' },
    ]);
  });
});

describe('renderDoc', () => {
  it('escapa sempre il testo', () => {
    expect(renderDoc(doc(para(text('<b>&"'))))).toBe('<p>&lt;b&gt;&amp;&quot;</p>');
  });
  it('link esterno con rel="noopener", link interno senza', () => {
    const html = renderDoc(cleanDoc(doc(para(
      text('fuori', [{ type: 'link', attrs: { href: 'https://esempio.it/?a=1&b=2' } }]),
      text(' e '),
      text('dentro', [{ type: 'link', attrs: { href: '/chi-siamo/' } }, { type: 'bold' }]),
    ))));
    expect(html).toContain('<a href="https://esempio.it/?a=1&amp;b=2" target="_blank" rel="noopener">fuori</a>');
    expect(html).toContain('<a href="/chi-siamo/"><strong>dentro</strong></a>');
  });
  it('immagine con didascalia: figure, figcaption, srcset e lazy', () => {
    const src = '/media/img/0a1b2c3d-0000-4000-8000-0123456789ab/full.webp';
    const html = renderDoc(cleanDoc(doc({ type: 'image', attrs: { src, alt: 'Una "foto"', title: 'Didascalia <1>' } })));
    expect(html).toMatch(/^<figure><img src="[^"]+" srcset="[^"]+640w[^"]*"/);
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('alt="Una &quot;foto&quot;"');
    expect(html).toContain('<figcaption>Didascalia &lt;1&gt;</figcaption></figure>');
  });
  it('la miniatura sfocata tocca solo background-image: il colore di fondo del sito resta', () => {
    const src = '/media/img/0a1b2c3d-0000-4000-8000-0123456789ab/full.webp';
    const html = renderDoc(cleanDoc(doc({ type: 'image', attrs: { src, alt: 'x' } })));
    expect(html).toContain('background-image:url(/media/img/0a1b2c3d-0000-4000-8000-0123456789ab/blur.webp)');
    expect(html).toContain(`onload="this.style.backgroundImage='none'"`);
    expect(html).not.toMatch(/style="background:/);
  });
  it('i paragrafi vuoti (righe vuote dell\'editor) non diventano spazi sul sito', () => {
    expect(renderDoc(cleanDoc(doc(para(text('a')), { type: 'paragraph' }, { type: 'paragraph', content: [] })))).toBe('<p>a</p>');
  });
  it('titoli, liste, citazione e linea', () => {
    const html = renderDoc(cleanDoc(doc(
      { type: 'heading', attrs: { level: 3 }, content: [text('T')] },
      { type: 'orderedList', content: [{ type: 'listItem', content: [para(text('a'))] }] },
      { type: 'blockquote', content: [para(text('q', [{ type: 'italic' }]))] },
      { type: 'horizontalRule' },
    )));
    expect(html).toBe('<h3>T</h3><ol><li><p>a</p></li></ol><blockquote><p><em>q</em></p></blockquote><hr>');
  });
});

describe('plainText e readingMinutes', () => {
  it('450 parole sono 3 minuti, un documento vuoto 1', () => {
    const words = Array.from({ length: 450 }, (_, i) => `parola${i}`).join(' ');
    expect(readingMinutes(doc(para(text(words))))).toBe(3);
    expect(readingMinutes(doc())).toBe(1);
  });
  it('i blocchi non si incollano fra loro', () => {
    expect(plainText(doc(para(text('uno')), para(text('due'))))).toBe('uno due');
  });
});
