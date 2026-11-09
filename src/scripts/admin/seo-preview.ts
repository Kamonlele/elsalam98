import { brand, type Locale } from '../../lib/brand';
import type { Block, Photo, Post, Seo } from '../../lib/content';
import { t, type T } from '../../lib/i18n';
import type { RichDoc } from '../../lib/richtext';
import { publicUrl, type Kind } from '../../lib/routes';
import { blocksSummary, clip, DESCRIPTION_MAX, postSummary, seoWarnings } from '../../lib/seo';

type Item = {
  seo?: Seo; slug?: T; home?: boolean; blocks?: Block[]; body?: RichDoc; photos?: Photo[]; gallery?: Photo[];
  intro?: T; stages?: { text?: T }[]; [k: string]: unknown;
};

const el = (tag: string, className: string, text = '') => {
  const e = document.createElement(tag);
  e.className = className;
  e.textContent = text;
  return e;
};

/**
 * Anteprima del risultato su Google, sotto il gruppo SEO. Ritorna la funzione che la ridisegna:
 * si chiama a ogni modifica, senza toccare i campi (il cursore resta dov'è).
 */
export function mountSeoPreview(host: HTMLElement, read: () => { item: Item; kind: Kind | null; titleKey: string; locale: string }) {
  const box = el('div', 'serp-box');
  const url = el('div', 'serp-url');
  const title = el('div', 'serp-title');
  const desc = el('div', 'serp-desc');
  box.append(url, title, desc);
  const warns = el('ul', 'serp-warn');
  const ok = el('p', 'serp-ok', 'Niente da segnalare.');
  const wrap = el('div', 'serp');
  const h3 = el('h3', '', 'Come potrebbe apparire su Google');
  wrap.append(h3, box, warns, ok);
  host.append(wrap);

  return function paint() {
    const { item, kind, titleKey, locale } = read();
    const loc = locale as Locale;
    const name = (path: string) => t(path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], item) as T | undefined, loc);
    const origin = brand.identity.siteUrl.replace(/\/$/, '');
    const path = kind && (item.home || item.slug?.[loc] || item.slug?.[brand.locales.default as Locale])
      ? publicUrl(kind, { slug: item.slug ?? {}, home: item.home }, loc)
      : '/…';
    url.textContent = [new URL(origin).host, ...path.split('/').filter(Boolean)].join(' › ');

    // Come il sito: quello scritto, altrimenti il titolo dell'elemento (e l'inizio del testo per la descrizione).
    const own = t(item.seo?.title, loc).trim();
    title.textContent = own || (item.home ? brand.identity.name : `${name(titleKey) || 'Titolo'} | ${brand.identity.name}`);
    const fallback = kind === 'posts'
      ? postSummary(item as unknown as Post, loc, DESCRIPTION_MAX)
      : clip(t(item.intro, loc) || t(item.stages?.[0]?.text, loc) || blocksSummary(item.blocks ?? [], loc), DESCRIPTION_MAX);
    desc.textContent = t(item.seo?.description, loc).trim() || fallback;

    const list = seoWarnings({ seo: item.seo, blocks: item.blocks, body: item.body, photos: item.photos ?? item.gallery }, loc);
    warns.replaceChildren(...list.map((w) => el('li', '', w)));
    warns.hidden = list.length === 0;
    ok.hidden = list.length > 0;
  };
}
