/**
 * Testo ricco degli articoli: il documento JSON dell'editor (forma TipTap/ProseMirror),
 * ripulito con un elenco di nodi ammessi e trasformato in HTML sul server.
 * Logica pura: la usano il salvataggio, le pagine e i test.
 */
import { BLUR_ONLOAD, blurStyle, variantsOf } from './images';
import { isSafeHref, isSafeMediaSrc } from './safe-url';

export type Mark = { type: 'bold' } | { type: 'italic' } | { type: 'link'; attrs: { href: string } };
export type TextNode = { type: 'text'; text: string; marks?: Mark[] };
export type ImageNode = { type: 'image'; attrs: { src: string; alt?: string; title?: string } };
export type ListItem = { type: 'listItem'; content: BlockNode[] };
export type BlockNode =
  | { type: 'paragraph'; content?: TextNode[] }
  | { type: 'heading'; attrs: { level: 2 | 3 }; content?: TextNode[] }
  | { type: 'bulletList'; content: ListItem[] }
  | { type: 'orderedList'; content: ListItem[] }
  | { type: 'blockquote'; content: BlockNode[] }
  | { type: 'horizontalRule' }
  | ImageNode;
export type RichNode = BlockNode | ListItem | TextNode;
export type RichDoc = { type: 'doc'; content: RichNode[] };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const kids = (v: unknown): unknown[] => (isObj(v) && Array.isArray(v.content) ? v.content : []);
const attr = (v: unknown, k: string): unknown => (isObj(v) && isObj(v.attrs) ? v.attrs[k] : undefined);

// Oltre questa profondità è un documento costruito apposta, non scritto da una persona.
const MAX_DEPTH = 12;

function cleanMarks(v: unknown): Mark[] {
  if (!isObj(v) || !Array.isArray(v.marks)) return [];
  const out: Mark[] = [];
  const seen = new Set<string>();
  for (const m of v.marks) {
    if (!isObj(m) || typeof m.type !== 'string' || seen.has(m.type)) continue;
    if (m.type === 'bold' || m.type === 'italic') out.push({ type: m.type });
    else if (m.type === 'link') {
      const href = attr(m, 'href');
      if (typeof href !== 'string' || !isSafeHref(href.trim())) continue;
      out.push({ type: 'link', attrs: { href: href.trim() } });
    } else continue;
    seen.add(m.type);
  }
  return out;
}

function cleanInline(v: unknown): TextNode[] {
  const out: TextNode[] = [];
  for (const n of kids(v)) {
    if (!isObj(n) || n.type !== 'text' || typeof n.text !== 'string' || !n.text) continue;
    const marks = cleanMarks(n);
    out.push(marks.length ? { type: 'text', text: n.text, marks } : { type: 'text', text: n.text });
  }
  return out;
}

function cleanItems(v: unknown, depth: number): ListItem[] {
  const out: ListItem[] = [];
  for (const n of kids(v)) {
    if (!isObj(n) || n.type !== 'listItem') continue;
    const content = cleanBlocks(n, depth + 1);
    out.push({ type: 'listItem', content: content.length ? content : [{ type: 'paragraph' }] });
  }
  return out;
}

function cleanBlock(n: unknown, depth: number): BlockNode | null {
  if (!isObj(n)) return null;
  const withText = <B extends BlockNode>(b: B, content: TextNode[]): B => (content.length ? { ...b, content } : b);
  switch (n.type) {
    case 'paragraph':
      return withText({ type: 'paragraph' }, cleanInline(n));
    case 'heading': {
      // L'h1 è il titolo dell'articolo: nel testo si parte da h2.
      const level = Number(attr(n, 'level')) >= 3 ? 3 : 2;
      return withText({ type: 'heading', attrs: { level } }, cleanInline(n));
    }
    case 'bulletList':
    case 'orderedList': {
      const content = cleanItems(n, depth);
      return content.length ? { type: n.type, content } : null;
    }
    case 'blockquote': {
      const content = cleanBlocks(n, depth + 1);
      return content.length ? { type: 'blockquote', content } : null;
    }
    case 'horizontalRule':
      return { type: 'horizontalRule' };
    case 'image': {
      const src = attr(n, 'src');
      if (typeof src !== 'string' || !isSafeMediaSrc(src)) return null;
      const attrs: ImageNode['attrs'] = { src };
      for (const k of ['alt', 'title'] as const) {
        const v = attr(n, k);
        if (typeof v === 'string' && v.trim()) attrs[k] = v.trim();
      }
      return { type: 'image', attrs };
    }
    default:
      return null;
  }
}

function cleanBlocks(v: unknown, depth: number): BlockNode[] {
  if (depth > MAX_DEPTH) return [];
  return kids(v).map((n) => cleanBlock(n, depth)).filter((b): b is BlockNode => b !== null);
}

/** Tiene solo i nodi, i segni e gli attributi ammessi. Non lancia mai: nel peggiore dei casi un documento vuoto. */
export function cleanDoc(raw: unknown): RichDoc {
  try {
    if (!isObj(raw) || raw.type !== 'doc') return { type: 'doc', content: [] };
    return { type: 'doc', content: cleanBlocks(raw, 0) };
  } catch {
    return { type: 'doc', content: [] };
  }
}

/* ---------- HTML ---------- */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const external = (href: string) => /^https?:\/\//i.test(href);
const SIZES = '(min-width: 760px) 720px, 100vw';

function inline(nodes: TextNode[] | undefined): string {
  return (nodes ?? []).map((n) => {
    let html = esc(n.text);
    const marks = n.marks ?? [];
    if (marks.some((m) => m.type === 'italic')) html = `<em>${html}</em>`;
    if (marks.some((m) => m.type === 'bold')) html = `<strong>${html}</strong>`;
    const link = marks.find((m): m is Extract<Mark, { type: 'link' }> => m.type === 'link');
    // Il link si ricontrolla anche qui: renderDoc può ricevere un documento mai passato da cleanDoc.
    if (link && isSafeHref(link.attrs.href)) {
      const href = link.attrs.href;
      html = `<a href="${esc(href)}"${external(href) ? ' target="_blank" rel="noopener"' : ''}>${html}</a>`;
    }
    return html;
  }).join('');
}

function image(a: ImageNode['attrs']): string {
  if (!isSafeMediaSrc(a.src)) return '';
  const v = variantsOf(a.src);
  // Come Img.astro: la miniatura sfocata resta solo finché la foto non arriva.
  const img = `<img src="${esc(a.src)}"`
    + (v ? ` srcset="${esc(v.srcset)}" sizes="${SIZES}"` : '')
    + ` alt="${esc(a.alt ?? '')}" loading="lazy" decoding="async"`
    + (v ? ` style="${esc(blurStyle(v.blur))}" onload="${BLUR_ONLOAD}"` : '')
    + '>';
  return `<figure>${img}${a.title ? `<figcaption>${esc(a.title)}</figcaption>` : ''}</figure>`;
}

function block(n: RichNode): string {
  switch (n.type) {
    // Una riga vuota nell'editor non deve diventare un buco nella pagina.
    case 'paragraph': return n.content?.length ? `<p>${inline(n.content)}</p>` : '';
    case 'heading': { const h = n.attrs?.level === 3 ? 'h3' : 'h2'; return `<${h}>${inline(n.content)}</${h}>`; }
    case 'bulletList': return `<ul>${n.content.map(block).join('')}</ul>`;
    case 'orderedList': return `<ol>${n.content.map(block).join('')}</ol>`;
    case 'listItem': return `<li>${n.content.map(block).join('')}</li>`;
    case 'blockquote': return `<blockquote>${n.content.map(block).join('')}</blockquote>`;
    case 'horizontalRule': return '<hr>';
    case 'image': return image(n.attrs);
    case 'text': return esc(n.text);
    default: return '';
  }
}

/** HTML dell'articolo. Il testo è sempre escapato; le immagini hanno le misure intermedie se ci sono. */
export function renderDoc(doc: RichDoc): string {
  return (doc?.content ?? []).map(block).join('');
}

/* ---------- testo semplice ---------- */

function words(n: RichNode | RichDoc, out: string[]) {
  if (n.type === 'text') { out.push(n.text); return; }
  if (n.type === 'image') { if (n.attrs.title) out.push(n.attrs.title); return; }
  if ('content' in n && Array.isArray(n.content)) for (const c of n.content as RichNode[]) words(c, out);
  // Uno spazio fra i blocchi, così "fine." e "Inizio" non diventano una parola sola.
  if (n.type !== 'listItem') out.push(' ');
}

export function plainText(doc: RichDoc): string {
  const out: string[] = [];
  words(doc, out);
  return out.join('').replace(/\s+/g, ' ').trim();
}

/** Minuti di lettura a 200 parole al minuto, almeno 1. */
export function readingMinutes(doc: RichDoc): number {
  const n = plainText(doc).split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(n / 200));
}
