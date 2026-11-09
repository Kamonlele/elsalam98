/**
 * Editor del testo ricco (solo area riservata). È l'unico file che importa TipTap:
 * form.ts lo carica a richiesta, così nessuna pagina pubblica se lo porta dietro.
 * Le funzioni accese qui sono le stesse che il server tiene (src/lib/richtext.ts):
 * quello che non si può scrivere non si perde al salvataggio.
 */
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { uploadImage } from './upload';
import { toast } from './ui';
import { isSafeHref } from '../../lib/safe-url';

// Un nuovo disegno del modulo crea editor nuovi: quelli rimasti fuori pagina si chiudono.
const live = new Map<Editor, HTMLElement>();
function sweep() {
  for (const [e, host] of live) if (!host.isConnected) { e.destroy(); live.delete(e); }
}

type Tool = { label: string; title: string; run: (e: Editor) => void; active?: (e: Editor) => boolean };

function askLink(e: Editor) {
  const current = (e.getAttributes('link').href as string | undefined) ?? '';
  const answer = prompt('Indirizzo del link (https://..., /pagina-del-sito/, mailto:...). Lascia vuoto per togliere il link.', current);
  if (answer === null) return;
  let href = answer.trim();
  if (!href) { e.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
  if (/^www\./i.test(href)) href = `https://${href}`;
  if (!isSafeHref(href)) { toast("L'indirizzo deve iniziare con https://, /, mailto: o tel:", 'error'); return; }
  // Il cursore va dopo il link: si continua a scrivere senza cancellare la parola appena collegata.
  e.chain().focus().extendMarkRange('link').setLink({ href }).run();
  e.chain().focus().setTextSelection(e.state.selection.to).run();
}

function pickImage(e: Editor, status: HTMLElement) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg,image/png,image/webp';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    status.textContent = 'Caricamento della foto…';
    try {
      const up = await uploadImage(file);
      status.textContent = '';
      const alt = prompt('Descrivi la foto in poche parole (testo alternativo, per chi non la vede e per Google).', '') ?? '';
      const title = prompt('Didascalia sotto la foto (facoltativa).', '') ?? '';
      e.chain().focus().setImage({ src: up.url, alt: alt.trim() || undefined, title: title.trim() || undefined }).run();
    } catch (err) {
      status.textContent = '';
      toast((err as Error).message, 'error');
    }
  });
  input.click();
}

/** Cambia testo alternativo e didascalia della foto selezionata. */
function editImage(e: Editor) {
  const a = e.getAttributes('image') as { alt?: string; title?: string };
  const alt = prompt('Testo alternativo della foto.', a.alt ?? '');
  if (alt === null) return;
  const title = prompt('Didascalia sotto la foto (facoltativa).', a.title ?? '');
  if (title === null) return;
  e.chain().focus().updateAttributes('image', { alt: alt.trim() || null, title: title.trim() || null }).run();
}

const TOOLS: Tool[] = [
  { label: 'T2', title: 'Titolo di sezione', run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), active: (e) => e.isActive('heading', { level: 2 }) },
  { label: 'T3', title: 'Sottotitolo', run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), active: (e) => e.isActive('heading', { level: 3 }) },
  { label: 'G', title: 'Grassetto', run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive('bold') },
  { label: 'C', title: 'Corsivo', run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive('italic') },
  { label: 'Link', title: 'Link', run: askLink, active: (e) => e.isActive('link') },
  { label: '•', title: 'Elenco puntato', run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive('bulletList') },
  { label: '1.', title: 'Elenco numerato', run: (e) => e.chain().focus().toggleOrderedList().run(), active: (e) => e.isActive('orderedList') },
  { label: '“”', title: 'Citazione', run: (e) => e.chain().focus().toggleBlockquote().run(), active: (e) => e.isActive('blockquote') },
  { label: 'Linea', title: 'Linea di separazione', run: (e) => e.chain().focus().setHorizontalRule().run() },
];

/** Monta l'editor in `host`. `onChange` riceve il documento JSON a ogni modifica. */
export function mountRichText(host: HTMLElement, value: unknown, label: string, onChange: (doc: unknown) => void) {
  sweep();
  const bar = document.createElement('div');
  bar.className = 'rt-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Formattazione del testo');
  const area = document.createElement('div');
  const status = document.createElement('span');
  status.className = 'status';
  status.setAttribute('aria-live', 'polite');
  host.replaceChildren(bar, area, status);

  const isDoc = !!value && typeof value === 'object' && (value as { type?: unknown }).type === 'doc';
  const editor = new Editor({
    element: area,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false, codeBlock: false, strike: false, underline: false, hardBreak: false, link: false,
      }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: null, target: null }, isAllowedUri: (url) => isSafeHref(url) }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: isDoc ? (value as object) : '',
    editorProps: { attributes: { class: 'rt-body', role: 'textbox', 'aria-multiline': 'true', 'aria-label': label } },
    onUpdate: ({ editor: e }) => onChange(e.getJSON()),
  });
  live.set(editor, host);

  const buttons = TOOLS.map((tool) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rt-btn';
    b.textContent = tool.label;
    b.title = tool.title;
    b.setAttribute('aria-label', tool.title);
    // mousedown evitato: il clic non toglie la selezione dal testo.
    b.addEventListener('mousedown', (ev) => ev.preventDefault());
    b.addEventListener('click', () => tool.run(editor));
    bar.append(b);
    return { b, tool };
  });
  const photo = document.createElement('button');
  photo.type = 'button';
  photo.className = 'rt-btn';
  photo.textContent = 'Foto';
  photo.title = 'Aggiungi una foto';
  photo.addEventListener('mousedown', (ev) => ev.preventDefault());
  photo.addEventListener('click', () => (editor.isActive('image') ? editImage(editor) : pickImage(editor, status)));
  bar.append(photo);

  const paint = () => {
    for (const { b, tool } of buttons) if (tool.active) b.setAttribute('aria-pressed', String(tool.active(editor)));
    const onImage = editor.isActive('image');
    photo.textContent = onImage ? 'Modifica foto' : 'Foto';
    photo.title = onImage ? 'Testo alternativo e didascalia della foto' : 'Aggiungi una foto';
  };
  editor.on('transaction', paint);
  paint();
  return editor;
}
