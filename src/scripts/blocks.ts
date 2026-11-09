import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Movimento dei blocchi. Il testo si legge anche se questo script non parte: le pagine
 * arrivano visibili e ferme, gli stati di partenza delle animazioni li mette lo script.
 * Movimento ridotto (classe `.rm`): niente comparse, niente video, slider in colonna.
 */
export function initBlocks() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) document.documentElement.classList.add('rm');

  // Il video dell'apertura parte solo da qui: con movimento ridotto resta fermo sulla foto.
  if (!reduce) {
    for (const v of document.querySelectorAll<HTMLVideoElement>('.hero video')) {
      v.muted = true;
      v.play().catch(() => {});
    }
  }

  if (!reduce) reveal();
  document.querySelectorAll<HTMLElement>('[data-slider]').forEach((el) => slider(el, reduce));
  lightbox();
}

/** Ogni blocco compare una volta sola, con una dissolvenza e un piccolo spostamento. */
function reveal() {
  gsap.registerPlugin(ScrollTrigger);
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  for (const el of items) {
    // Quello che si vede già all'apertura resta com'è: niente attese prima di leggere.
    if (el.getBoundingClientRect().top < innerHeight * 0.9) continue;
    gsap.fromTo(el, { autoAlpha: 0, y: 28 }, {
      autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out', clearProps: 'transform,opacity,visibility',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  }
}

function slider(root: HTMLElement, reduce: boolean) {
  const track = root.querySelector<HTMLElement>('.sl-track');
  const nav = root.querySelector<HTMLElement>('.sl-nav');
  if (!track || reduce) return;
  // Le foto hanno larghezze diverse: si avanza di quasi uno schermo e l'aggancio CSS fa il resto.
  // Da destra a sinistra scrollLeft va verso il negativo: "avanti" è verso sinistra.
  const sign = getComputedStyle(track).direction === 'rtl' ? -1 : 1;
  const step = () => track.clientWidth * 0.8 * sign;
  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    const pos = Math.abs(track.scrollLeft);
    if (nav) nav.hidden = max <= 4;
    prev.disabled = pos <= 4;
    next.disabled = pos >= max - 4;
  };
  const prev = root.querySelector<HTMLButtonElement>('[data-prev]')!;
  const next = root.querySelector<HTMLButtonElement>('[data-next]')!;
  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  track.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();

  // Trascinamento col mouse; col dito scorre già da sé.
  let startX = 0, startLeft = 0, dragging = false, moved = false;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
    track.classList.add('dragging');
  });
  addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    track.scrollLeft = startLeft - dx;
  });
  addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    // Tornando l'aggancio CSS, il browser si ferma sulla foto più vicina.
    track.classList.remove('dragging');
  });
  track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
}

/** Un solo visore per tutte le gallerie della pagina. */
function lightbox() {
  const lb = document.getElementById('blk-lb') as HTMLDialogElement | null;
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-lightbox]'));
  if (!lb || !links.length) return;
  const img = lb.querySelector('img')!;
  const cap = lb.querySelector<HTMLElement>('.lb-cap')!;
  let cur = 0;
  const show = (i: number) => {
    cur = (i + links.length) % links.length;
    const src = links[cur].querySelector('img')!;
    img.src = links[cur].href; img.alt = src.alt; cap.textContent = src.alt;
  };
  links.forEach((a, i) => a.addEventListener('click', (e) => { e.preventDefault(); show(i); lb.showModal(); }));
  lb.querySelector('[data-prev]')!.addEventListener('click', () => show(cur - 1));
  lb.querySelector('[data-next]')!.addEventListener('click', () => show(cur + 1));
  lb.querySelector('[data-close]')!.addEventListener('click', () => lb.close());
  lb.addEventListener('keydown', (e) => {
    const rtl = document.dir === 'rtl';
    if (e.key === 'ArrowRight') show(cur + (rtl ? -1 : 1));
    if (e.key === 'ArrowLeft') show(cur + (rtl ? 1 : -1));
  });
  lb.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    if (el === lb || el.classList.contains('lb-img')) lb.close();
  });
}
