import type { Locale } from '../../lib/brand';
import type { T } from '../../lib/i18n';
import { publicUrl, type Kind } from '../../lib/routes';
import { newLabel, type Schema } from '../../lib/schema';
import { getPath, renderFields, type Ctx } from './form';
import { mountSeoPreview } from './seo-preview';
import { api, toast } from './ui';

type Boot = {
  schema: Schema;
  id: string | null;
  status: 'published' | 'draft';
  data: Record<string, unknown>;
  locales: string[];
  defaultLocale: string;
  localeNames: Record<string, string>;
  refs: Record<string, { id: string; label: string }[]>;
  /** Che tipo di indirizzo pubblico ha questa collezione, per "Vedi sul sito". */
  kind: Kind | null;
  /** Redattore su pagine e categorie: il server tiene solo i testi. */
  textOnly: boolean;
};

export function initEditor() {
  const boot = JSON.parse(document.getElementById('ed-boot')!.textContent!) as Boot;
  const { schema } = boot;
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const formEl = $('ed-form');
  const stateEl = $('ed-state');
  const saveBtn = $<HTMLButtonElement>('ed-save');

  let id = boot.id;
  let data = boot.data;
  let status = boot.status;
  let dirty = false;
  let saving = false;
  // Ridisegna l'anteprima di Google, se il modulo ne ha una.
  let paintSeo: (() => void) | null = null;

  const ctx: Ctx = {
    root: data,
    locale: boot.defaultLocale,
    defaultLocale: boot.defaultLocale,
    localeNames: boot.localeNames,
    refs: boot.refs,
    changed: () => { dirty = true; paintBar(); },
    rerender: () => render(),
    textOnly: boot.textOnly,
  };

  function title() {
    const v = getPath(data, schema.titleKey) as Record<string, string> | undefined;
    return v?.[boot.defaultLocale]?.trim() || newLabel(schema);
  }

  function paintBar() {
    $('ed-title').textContent = title();
    document.title = `${title()} | Area riservata`;
    stateEl.textContent = saving ? 'Salvataggio…' : dirty ? 'Modifiche non salvate' : id ? 'Tutto salvato' : 'Non ancora salvato';
    stateEl.classList.toggle('dirty', dirty);
    saveBtn.disabled = saving;
    document.querySelectorAll<HTMLButtonElement>('#ed-status button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.status === status)));
    document.querySelectorAll<HTMLButtonElement>('#ed-langs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === ctx.locale)));
    $('ed-delete').hidden = !id || boot.textOnly;
    const view = $<HTMLAnchorElement>('ed-view');
    const item = data as { slug?: T; home?: boolean };
    const hasUrl = !!item.home || !!item.slug?.[boot.defaultLocale as Locale];
    view.hidden = !(boot.kind && id && status === 'published' && hasUrl && !dirty);
    if (!view.hidden) view.href = publicUrl(boot.kind!, { slug: item.slug ?? {}, home: item.home }, boot.defaultLocale as Locale);
    paintSeo?.();
    const note = $('ed-langnote');
    note.hidden = ctx.locale === boot.defaultLocale;
    note.textContent = `Stai scrivendo i testi in ${boot.localeNames[ctx.locale].toLowerCase()}. Sotto ogni campo vedi il testo in ${boot.localeNames[boot.defaultLocale].toLowerCase()}. Se lasci vuoto, il sito usa ${boot.localeNames[boot.defaultLocale].toLowerCase()}.`;
  }

  function render() {
    const y = window.scrollY;
    paintSeo = null;
    formEl.replaceChildren(...schema.sections.map((s) => {
      const card = document.createElement('section');
      card.className = 'card';
      const h2 = document.createElement('h2');
      h2.textContent = s.title;
      card.append(h2);
      if (s.intro) {
        const p = document.createElement('p');
        p.className = 'intro';
        p.textContent = s.intro;
        card.append(p);
      }
      card.append(renderFields(s.fields, data, ctx));
      if (s.fields.some((f) => f.type === 'group' && f.key === 'seo')) {
        paintSeo = mountSeoPreview(card, () => ({ item: data, kind: boot.kind, titleKey: schema.titleKey, locale: ctx.locale }));
      }
      return card;
    }));
    window.scrollTo(0, y);
    paintBar();
  }

  const langs = document.getElementById('ed-langs');
  if (langs) {
    for (const l of boot.locales) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.lang = l;
      b.textContent = l.toUpperCase();
      b.title = boot.localeNames[l];
      b.addEventListener('click', () => { ctx.locale = l; render(); });
      langs.append(b);
    }
  }
  document.querySelectorAll<HTMLButtonElement>('#ed-status button').forEach((b) => b.addEventListener('click', () => {
    if (boot.textOnly) return;
    status = b.dataset.status as typeof status;
    dirty = true;
    paintBar();
  }));

  async function save() {
    if (saving) return;
    saving = true;
    paintBar();
    const newId = id ?? crypto.randomUUID();
    try {
      const res = await api<{ data: Record<string, unknown> }>(`/api/admin/items/${schema.name}/${newId}`, { method: 'PUT', json: { status, data } });
      data = res.data;
      ctx.root = data;
      if (!id) history.replaceState(null, '', `/admin/${schema.section}/${newId}`);
      id = newId;
      dirty = false;
      toast(status === 'published' ? 'Salvato e pubblicato' : 'Salvato come bozza');
      saving = false;
      render();
    } catch (err) {
      saving = false;
      paintBar();
      toast((err as Error).message, 'error');
    }
  }
  saveBtn.addEventListener('click', save);
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
  });

  $('ed-delete').addEventListener('click', async () => {
    if (!id || !confirm(`Eliminare "${title()}"? Non si può annullare.`)) return;
    try {
      await api(`/api/admin/items/${schema.name}/${id}`, { method: 'DELETE' });
      dirty = false;
      location.href = `/admin/${schema.section}`;
    } catch (err) { toast((err as Error).message, 'error'); }
  });

  window.addEventListener('beforeunload', (e) => { if (dirty) e.preventDefault(); });
  render();
}
