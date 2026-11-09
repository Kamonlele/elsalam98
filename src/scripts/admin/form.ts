import { isEditableText } from '../../lib/roles';
import type { Field } from '../../lib/schema';
import { uploadImage, uploadModel, uploadVideo } from './upload';
import { toast } from './ui';

/**
 * Disegna un modulo a partire dallo schema e lo tiene collegato ai dati.
 * Scrivere in un campo aggiorna i dati senza ridisegnare (il cursore resta dov'è);
 * aggiungere, togliere, spostare o caricare ridisegna tutto il modulo.
 */
export type Ctx = {
  root: Record<string, unknown>;
  locale: string;
  defaultLocale: string;
  localeNames: Record<string, string>;
  /** Elementi delle altre collezioni, per i campi `ref`. */
  refs: Record<string, { id: string; label: string }[]>;
  changed: () => void;
  rerender: () => void;
  /** Redattore: si scrivono solo i testi, il resto si vede ma non si tocca. */
  textOnly?: boolean;
};

type Obj = Record<string, unknown>;
type Loc = Record<string, string>;

let uid = 0;
const nextId = () => `f${++uid}`;

export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Obj)[k] : undefined), obj);
}
function setPath(obj: Obj, path: string, value: unknown) {
  const keys = path.split('.');
  let o = obj;
  for (const k of keys.slice(0, -1)) {
    if (!o[k] || typeof o[k] !== 'object') o[k] = {};
    o = o[k] as Obj;
  }
  o[keys[keys.length - 1]] = value;
}
function ensure<T>(obj: Obj, path: string, make: () => T): T {
  let v = getPath(obj, path) as T | undefined;
  if (v === undefined || v === null || typeof v !== 'object') { v = make(); setPath(obj, path, v); }
  return v;
}

function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> & Record<string, unknown> = {}, ...kids: (Node | string | null | undefined | false)[]) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    else if (k in el && k !== 'list') (el as unknown as Obj)[k] = v;
    else el.setAttribute(k, String(v));
  }
  for (const kid of kids) if (kid) el.append(kid);
  return el;
}

/** Un elemento vuoto per una lista, con la forma giusta per i suoi campi. */
export function blankFor(fields: Field[]): Obj {
  const o: Obj = {};
  for (const f of fields) {
    if (f.type === 'text') setPath(o, f.key, f.localized ? {} : '');
    else if (f.type === 'list' || f.type === 'blocks' || f.type === 'photos' || f.type === 'dates') setPath(o, f.key, []);
    else if (f.type === 'group') setPath(o, f.key, blankFor(f.fields));
  }
  return o;
}

export function renderFields(fields: Field[], target: Obj, ctx: Ctx): HTMLElement {
  const wrap = h('div', { className: 'fields' });
  for (const f of fields) {
    if (f.showIf && getPath(ctx.root, f.showIf.path) !== f.showIf.equals) continue;
    wrap.append(renderField(f, target, ctx));
  }
  return wrap;
}

function labelled(f: Field, control: HTMLElement | null, id?: string, extra?: (Node | null)[]) {
  return h('div', { className: 'field' },
    id ? h('label', { htmlFor: id }, f.label) : h('span', { className: 'lbl' }, f.label),
    f.help ? h('span', { className: 'help' }, f.help) : null,
    control,
    ...(extra ?? []));
}

function renderField(f: Field, target: Obj, ctx: Ctx): HTMLElement {
  const el = renderAny(f, target, ctx);
  // Gruppi, liste e blocchi restano aperti: dentro possono esserci testi.
  if (!ctx.textOnly || isEditableText(f) || f.type === 'group' || f.type === 'list' || f.type === 'blocks') return el;
  return h('fieldset', { className: 'locked', disabled: true, inert: true }, el);
}

function renderAny(f: Field, target: Obj, ctx: Ctx): HTMLElement {
  switch (f.type) {
    case 'text': return textField(f, target, ctx);
    case 'select': {
      const id = nextId();
      const sel = h('select', { id, onchange: () => { setPath(target, f.key, sel.value); ctx.changed(); ctx.rerender(); } },
        ...f.options.map((o) => h('option', { value: o.value }, o.label)));
      sel.value = String(getPath(target, f.key) ?? f.options[0].value);
      if (getPath(target, f.key) === undefined) setPath(target, f.key, sel.value);
      return labelled(f, sel, id);
    }
    case 'checkbox': {
      const id = nextId();
      const box = h('input', { id, type: 'checkbox', checked: !!getPath(target, f.key), onchange: () => { setPath(target, f.key, box.checked); ctx.changed(); } });
      return h('div', { className: 'field' }, h('label', { className: 'check', htmlFor: id }, box, f.label), f.help ? h('span', { className: 'help' }, f.help) : null);
    }
    case 'times': {
      const id = nextId();
      const cur = (getPath(target, f.key) as string[] | undefined) ?? [];
      const input = h('input', {
        id, type: 'text', value: cur.join(', '), placeholder: 'chiuso', inputMode: 'numeric',
        oninput: () => { setPath(target, f.key, input.value.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean)); ctx.changed(); },
      });
      return labelled(f, input, id);
    }
    case 'dates': {
      const id = nextId();
      const cur = (getPath(target, f.key) as string[] | undefined) ?? [];
      const area = h('textarea', {
        id, value: cur.join('\n'), placeholder: '2026-12-24\n2026-12-25',
        oninput: () => { setPath(target, f.key, area.value.split(/\s+/).map((x) => x.trim()).filter(Boolean)); ctx.changed(); },
      });
      return labelled(f, area, id, [h('span', { className: 'help' }, 'Una data per riga, nel formato anno-mese-giorno.')]);
    }
    case 'date': {
      const id = nextId();
      const input = h('input', { id, type: 'date', value: String(getPath(target, f.key) ?? ''), oninput: () => { setPath(target, f.key, input.value); ctx.changed(); } });
      return labelled(f, input, id);
    }
    case 'richtext': return richtextField(f, target, ctx);
    case 'image': return imageField(f, target, ctx);
    case 'model': return modelField(f, target, ctx);
    case 'photos': return photosField(f, target, ctx);
    case 'group': return labelled(f, renderFields(f.fields, ensure(target, f.key, () => ({})), ctx));
    case 'list': return listField(f, target, ctx);
    case 'ref': return refField(f, target, ctx);
    case 'blocks': return blocksField(f, target, ctx);
    case 'video': return videoField(f, target, ctx);
    case 'focus': return focusField(f, target, ctx);
  }
}

function textField(f: Extract<Field, { type: 'text' }>, target: Obj, ctx: Ctx) {
  const id = nextId();
  const multiline = !!f.multiline;
  const extra: HTMLElement[] = [];
  let value: string;
  let write: (v: string) => void;
  if (f.localized) {
    const loc = ensure<Loc>(target, f.key, () => ({}));
    value = loc[ctx.locale] ?? '';
    write = (v) => { if (v) loc[ctx.locale] = v; else delete loc[ctx.locale]; };
    // Nelle altre lingue si vede il testo di partenza, così si traduce senza cambiare pagina.
    if (ctx.locale !== ctx.defaultLocale && loc[ctx.defaultLocale]) {
      extra.push(h('span', { className: 'ref' }, `${ctx.localeNames[ctx.defaultLocale]}: ${loc[ctx.defaultLocale]}`));
    }
  } else {
    value = String(getPath(target, f.key) ?? '');
    write = (v) => setPath(target, f.key, v);
  }
  const props = {
    id, value, placeholder: f.placeholder ?? (f.localized && ctx.locale !== ctx.defaultLocale ? (getPath(target, f.key) as Loc)?.[ctx.defaultLocale] ?? '' : ''),
    oninput: (e: Event) => { write((e.target as HTMLInputElement).value); ctx.changed(); },
  };
  const control = multiline ? h('textarea', props) : h('input', { ...props, type: 'text' });
  if (f.max) {
    const count = h('span', { className: 'chars', 'aria-live': 'off' });
    const paint = () => {
      const n = control.value.length;
      count.textContent = `${n}/${f.max}`;
      count.classList.toggle('over', n > f.max!);
    };
    control.addEventListener('input', paint);
    paint();
    extra.push(count);
  }
  return labelled(f, control, id, extra);
}

function fileButton(label: string, accept: string, multiple: boolean, onFiles: (files: File[]) => void) {
  const input = h('input', { type: 'file', accept, multiple, hidden: true, onchange: () => { onFiles(Array.from(input.files ?? [])); input.value = ''; } });
  const btn = h('button', { type: 'button', className: 'btn ghost small', onclick: () => input.click() }, label);
  return [btn, input] as const;
}

function imageField(f: Field, target: Obj, ctx: Ctx) {
  const url = getPath(target, f.key) as string | undefined;
  const status = h('span', { className: 'status', 'aria-live': 'polite' });
  const [btn, input] = fileButton(url ? 'Cambia foto' : 'Carica foto', 'image/jpeg,image/png,image/webp', false, async ([file]) => {
    if (!file) return;
    status.textContent = 'Caricamento…';
    btn.disabled = true;
    try {
      const up = await uploadImage(file);
      setPath(target, f.key, up.url);
      ctx.changed(); ctx.rerender();
    } catch (err) {
      status.textContent = '';
      toast((err as Error).message, 'error');
    } finally { btn.disabled = false; }
  });
  const remove = url ? h('button', { type: 'button', className: 'btn ghost small', onclick: () => { setPath(target, f.key, undefined); ctx.changed(); ctx.rerender(); } }, 'Togli') : null;
  const pv = h('div', { className: 'pv' }, url ? h('img', { src: url, alt: '' }) : 'Nessuna foto');
  return labelled(f, h('div', { className: 'media-field' }, pv, h('div', { className: 'acts' }, btn, input, remove, status)));
}

function modelField(f: Field, target: Obj, ctx: Ctx) {
  const url = getPath(target, f.key) as string | undefined;
  const status = h('span', { className: 'status', 'aria-live': 'polite' });
  const name = !url ? 'Nessun modello' : url.startsWith('demo:') ? 'Modello dimostrativo del kit' : 'Modello caricato';
  const [btn, input] = fileButton(url && !url.startsWith('demo:') ? 'Cambia modello' : 'Carica .glb', '.glb,model/gltf-binary', false, async ([file]) => {
    if (!file) return;
    status.textContent = `Caricamento di ${(file.size / 1e6).toFixed(1)} MB…`;
    btn.disabled = true;
    try {
      const up = await uploadModel(file);
      setPath(target, f.key, up.url);
      ctx.changed(); ctx.rerender();
    } catch (err) {
      status.textContent = '';
      toast((err as Error).message, 'error');
    } finally { btn.disabled = false; }
  });
  const demo = url !== 'demo:piscina'
    ? h('button', { type: 'button', className: 'btn ghost small', onclick: () => { setPath(target, f.key, 'demo:piscina'); ctx.changed(); ctx.rerender(); } }, 'Usa il modello dimostrativo')
    : null;
  const link = url && !url.startsWith('demo:') ? h('a', { href: url, className: 'status', download: '' }, 'Scarica il file') : null;
  return labelled(f, h('div', { className: 'media-field' }, h('div', { className: 'pv' }, name), h('div', { className: 'acts' }, btn, input, demo, link, status)));
}

type Pic = { src: string; width?: number; height?: number; caption?: Loc };

function photosField(f: Field, target: Obj, ctx: Ctx) {
  const arr = ensure<Pic[]>(target, f.key, () => []);
  const status = h('span', { 'aria-live': 'polite' });
  async function add(files: File[]) {
    const pics = files.filter((x) => x.type.startsWith('image/'));
    if (!pics.length) return;
    let done = 0;
    for (const file of pics) {
      status.textContent = `Caricamento ${done + 1} di ${pics.length}…`;
      try {
        const up = await uploadImage(file);
        arr.push({ src: up.url, width: up.width, height: up.height, caption: {} });
        ctx.changed();
      } catch (err) {
        toast(`${file.name}: ${(err as Error).message}`, 'error');
      }
      done++;
    }
    ctx.rerender();
  }
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; ctx.changed(); ctx.rerender(); };

  const grid = h('div', { className: 'photos' }, ...arr.map((p, i) => {
    p.caption ??= {};
    const cap = h('input', {
      type: 'text', value: p.caption[ctx.locale] ?? '', 'aria-label': `Didascalia foto ${i + 1}`,
      placeholder: ctx.locale === ctx.defaultLocale ? 'Didascalia' : p.caption[ctx.defaultLocale] ?? 'Didascalia',
      oninput: () => { if (cap.value) p.caption![ctx.locale] = cap.value; else delete p.caption![ctx.locale]; ctx.changed(); },
    });
    return h('div', { className: 'photo' },
      h('div', { className: 'pv' }, h('img', { src: p.src, alt: '', loading: 'lazy' })),
      h('div', { className: 'body' }, cap,
        h('div', { className: 'tools' },
          h('span', {},
            h('button', { type: 'button', className: 'icon-btn', 'aria-label': 'Sposta prima', disabled: i === 0, onclick: () => move(i, -1) }, '←'), ' ',
            h('button', { type: 'button', className: 'icon-btn', 'aria-label': 'Sposta dopo', disabled: i === arr.length - 1, onclick: () => move(i, 1) }, '→')),
          h('button', { type: 'button', className: 'icon-btn', 'aria-label': 'Togli la foto', onclick: () => { arr.splice(i, 1); ctx.changed(); ctx.rerender(); } }, '✕'))));
  }));

  const [btn, input] = fileButton('Aggiungi foto', 'image/jpeg,image/png,image/webp', true, add);
  const drop = h('div', { className: 'drop' }, btn, input, h('span', {}, 'oppure trascina qui le foto. Vanno bene anche più foto insieme.'), status);
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); add(Array.from(e.dataTransfer?.files ?? [])); });
  return h('div', { className: 'field' }, arr.length ? grid : null, drop);
}

function listField(f: Extract<Field, { type: 'list' }>, target: Obj, ctx: Ctx) {
  const arr = ensure<Obj[]>(target, f.key, () => []);
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; ctx.changed(); ctx.rerender(); };
  const items = arr.map((item, i) => {
    const t = f.titleKey ? (item[f.titleKey] as Loc | undefined)?.[ctx.defaultLocale] : '';
    return h('div', { className: 'item' },
      h('div', { className: 'item-head' },
        h('span', { className: 'n' }, `${f.itemLabel} ${i + 1}`, t ? h('small', {}, ` · ${t}`) : null),
        !ctx.textOnly && h('button', { type: 'button', className: 'icon-btn', 'aria-label': 'Sposta su', disabled: i === 0, onclick: () => move(i, -1) }, '↑'),
        !ctx.textOnly && h('button', { type: 'button', className: 'icon-btn', 'aria-label': 'Sposta giù', disabled: i === arr.length - 1, onclick: () => move(i, 1) }, '↓'),
        !ctx.textOnly && h('button', { type: 'button', className: 'icon-btn', 'aria-label': `Togli ${f.itemLabel.toLowerCase()} ${i + 1}`, onclick: () => { arr.splice(i, 1); ctx.changed(); ctx.rerender(); } }, '✕')),
      h('div', { className: 'item-body' }, renderFields(f.fields, item, ctx)));
  });
  const add = h('button', { type: 'button', className: 'btn ghost small', onclick: () => { arr.push(blankFor(f.fields)); ctx.changed(); ctx.rerender(); } }, `+ ${f.addLabel}`);
  return labelled(f, h('div', { className: 'list' }, ...items, ctx.textOnly ? null : h('div', {}, add)));
}

function refField(f: Extract<Field, { type: 'ref' }>, target: Obj, ctx: Ctx) {
  const id = nextId();
  const opts = ctx.refs[f.collection] ?? [];
  const cur = String(getPath(target, f.key) ?? '');
  const sel = h('select', { id, onchange: () => { setPath(target, f.key, sel.value || undefined); ctx.changed(); } },
    h('option', { value: '' }, 'Nessuna'),
    ...opts.map((o) => h('option', { value: o.id }, o.label)));
  // Un collegamento a un elemento eliminato si mostra come "Nessuna"; il server lo toglie al salvataggio.
  sel.value = opts.some((o) => o.id === cur) ? cur : '';
  return labelled(f, sel, id, opts.length ? [] : [h('span', { className: 'help' }, 'Non c\'è ancora niente da scegliere.')]);
}

function blocksField(f: Extract<Field, { type: 'blocks' }>, target: Obj, ctx: Ctx) {
  const arr = ensure<Obj[]>(target, f.key, () => []);
  const kindOf = (kind: unknown) => f.kinds.find((k) => k.kind === kind);
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; ctx.changed(); ctx.rerender(); };
  const items = arr.map((block, i) => {
    const k = kindOf(block.kind);
    const label = k?.label ?? 'Blocco sconosciuto';
    const t = (block.title as Loc | undefined)?.[ctx.defaultLocale];
    return h('div', { className: 'item' },
      h('div', { className: 'item-head' },
        h('span', { className: 'n' }, `${i + 1}. ${label}`, t ? h('small', {}, ` · ${t}`) : null),
        !ctx.textOnly && h('button', { type: 'button', className: 'icon-btn', 'aria-label': `Sposta su il blocco ${i + 1}`, disabled: i === 0, onclick: () => move(i, -1) }, '↑'),
        !ctx.textOnly && h('button', { type: 'button', className: 'icon-btn', 'aria-label': `Sposta giù il blocco ${i + 1}`, disabled: i === arr.length - 1, onclick: () => move(i, 1) }, '↓'),
        !ctx.textOnly && h('button', { type: 'button', className: 'icon-btn', 'aria-label': `Togli il blocco ${i + 1}`, onclick: () => { arr.splice(i, 1); ctx.changed(); ctx.rerender(); } }, '✕')),
      h('div', { className: 'item-body' }, k
        ? renderFields(k.fields, block, ctx)
        : h('p', { className: 'help' }, 'Questo tipo di blocco non esiste più: si toglie al prossimo salvataggio.')));
  });
  const pickId = nextId();
  const pick = h('select', { id: pickId }, ...f.kinds.map((k) => h('option', { value: k.kind }, k.label)));
  const add = h('button', {
    type: 'button', className: 'btn ghost small',
    onclick: () => {
      const k = kindOf(pick.value);
      if (!k) return;
      arr.push({ kind: k.kind, ...structuredClone(k.blank) });
      ctx.changed(); ctx.rerender();
    },
  }, '+ Aggiungi');
  return labelled(f, h('div', { className: 'list' }, ...items,
    ctx.textOnly ? null : h('div', { className: 'add-block' }, h('label', { htmlFor: pickId }, 'Blocco da aggiungere'), pick, add)));
}

function videoField(f: Field, target: Obj, ctx: Ctx) {
  const url = getPath(target, f.key) as string | undefined;
  const status = h('span', { className: 'status', 'aria-live': 'polite' });
  const [btn, input] = fileButton(url ? 'Cambia video' : 'Carica video', 'video/mp4,video/webm', false, async ([file]) => {
    if (!file) return;
    status.textContent = `Caricamento di ${(file.size / 1e6).toFixed(1)} MB…`;
    btn.disabled = true;
    try {
      const up = await uploadVideo(file);
      setPath(target, f.key, up.url);
      ctx.changed(); ctx.rerender();
    } catch (err) {
      status.textContent = '';
      toast((err as Error).message, 'error');
    } finally { btn.disabled = false; }
  });
  const remove = url ? h('button', { type: 'button', className: 'btn ghost small', onclick: () => { setPath(target, f.key, undefined); ctx.changed(); ctx.rerender(); } }, 'Togli') : null;
  const pv = h('div', { className: 'pv' }, url ? h('video', { src: url, muted: true, controls: true, preload: 'metadata' }) : 'Nessun video');
  return labelled(f, h('div', { className: 'media-field' }, pv,
    h('div', { className: 'acts' }, btn, input, remove, status, h('span', { className: 'help' }, 'MP4 o WEBM fino a 90 MB. Meglio corto (10-20 secondi) e senza audio.'))));
}

function focusField(f: Extract<Field, { type: 'focus' }>, target: Obj, ctx: Ctx) {
  const photo = getPath(target, f.of) as string | undefined;
  if (!photo) return labelled(f, h('span', { className: 'help' }, 'Carica prima la foto.'));
  const m = /^([\d.]+)% ([\d.]+)%$/.exec(String(getPath(target, f.key) ?? ''));
  let x = m ? Number(m[1]) : 50;
  let y = m ? Number(m[2]) : 50;
  const dot = h('span', { className: 'focus-dot' });
  const readout = h('span', { className: 'help', 'aria-live': 'polite' });
  const clamp = (v: number) => Math.round(Math.min(100, Math.max(0, v)));
  const paint = () => {
    dot.style.left = `${x}%`;
    dot.style.top = `${y}%`;
    readout.textContent = getPath(target, f.key) ? `${x}% da sinistra, ${y}% dall'alto.` : 'Ora è al centro.';
  };
  const set = (nx: number, ny: number) => { x = clamp(nx); y = clamp(ny); setPath(target, f.key, `${x}% ${y}%`); ctx.changed(); paint(); };
  const img = h('img', { src: photo, alt: '' });
  const box = h('div', {
    className: 'focus-box', tabIndex: 0, role: 'group',
    'aria-label': `${f.label}. Tocca la foto oppure usa le frecce.`,
    onclick: (e: MouseEvent) => { const r = img.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100); },
    onkeydown: (e: KeyboardEvent) => {
      const d: Record<string, [number, number]> = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] };
      if (!d[e.key]) return;
      e.preventDefault();
      set(x + d[e.key][0], y + d[e.key][1]);
    },
  }, img, dot);
  const reset = h('button', { type: 'button', className: 'btn ghost small', onclick: () => { setPath(target, f.key, undefined); x = 50; y = 50; ctx.changed(); ctx.rerender(); } }, 'Rimetti al centro');
  paint();
  return labelled(f, h('div', { className: 'focus-field' }, box, h('div', { className: 'acts' }, readout, reset)));
}

function richtextField(f: Field, target: Obj, ctx: Ctx) {
  const host = h('div', { className: 'rt' }, h('span', { className: 'help' }, "Carico l'editor…"));
  // TipTap arriva solo qui, a richiesta: le altre schermate non lo scaricano.
  import('./richtext')
    .then(({ mountRichText }) => {
      if (!host.isConnected) return;
      mountRichText(host, getPath(target, f.key), f.label, (doc) => { setPath(target, f.key, doc); ctx.changed(); });
    })
    .catch(() => { host.textContent = "Non riesco a caricare l'editor. Ricarica la pagina."; });
  return labelled(f, host);
}
