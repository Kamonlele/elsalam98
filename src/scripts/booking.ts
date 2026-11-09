type Loc = { id: string; label: string; kind: 'showroom' | 'video' };
type Data = {
  locale: string; product: string; locations: Loc[]; askCity: boolean; questions: string[];
  turnstile: string; email: boolean; text: Record<string, string>;
};
type Day = { date: string; times: { time: string; free: boolean }[] };

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/**
 * Prenotazione della visita. I giorni e gli orari arrivano dal server (/api/disponibilita):
 * il browser mostra, il server decide. Al termine la prenotazione è salvata, le email
 * e i webhook partono dal server.
 */
export function initBooking(root: HTMLElement) {
  const data = JSON.parse(root.dataset.booking ?? '{}') as Data;
  const T = data.text;
  const started = Date.now();
  const $ = (id: string) => document.getElementById(id)!;
  const form = $('booking') as HTMLFormElement;
  const dayFmt = new Intl.DateTimeFormat(data.locale, { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
  const monthFmt = new Intl.DateTimeFormat(data.locale, { month: 'short', timeZone: 'UTC' });
  const longFmt = new Intl.DateTimeFormat(data.locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const asDate = (s: string) => { const [a, b, c] = s.split('-').map(Number); return new Date(Date.UTC(a, b - 1, c)); };

  let days: Day[] = [];

  function chip(name: string, value: string, label: string, sub = '', checked = false, disabled = false) {
    const id = `${name}-${value}`.replace(/[^a-z0-9-]/gi, '');
    return `<label class="chip" for="${id}"><input type="radio" id="${id}" name="${name}" value="${esc(value)}"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}><span>${esc(label)}${sub ? ` <small>${esc(sub)}</small>` : ''}</span></label>`;
  }
  const picked = (name: string) => (form.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement | null)?.value;
  const loc = () => data.locations.find((l) => l.id === picked('sede')) ?? data.locations[0];

  $('sedi').innerHTML = data.locations.map((l, i) => chip('sede', l.id, l.label, '', i === 0)).join('');

  async function loadDays(keep?: { date?: string; time?: string }) {
    $('giorni').innerHTML = `<span class="hint">${esc(T.loading)}</span>`;
    $('orari').innerHTML = '';
    try {
      const res = await fetch(`/api/disponibilita?sede=${encodeURIComponent(loc().id)}`);
      days = ((await res.json()) as { days?: Day[] }).days ?? [];
    } catch { days = []; }
    const usable = days.filter((x) => x.times.some((s) => s.free));
    if (!usable.length) { $('giorni').innerHTML = `<span class="hint">${esc(T.noSlots)}</span>`; return; }
    const sel = usable.find((x) => x.date === keep?.date)?.date ?? usable[0].date;
    $('giorni').innerHTML = usable.map((x) => chip('giorno', x.date, dayFmt.format(asDate(x.date)), monthFmt.format(asDate(x.date)), x.date === sel)).join('');
    renderSlots(keep?.time);
  }
  function renderSlots(prefer?: string) {
    const day = days.find((x) => x.date === picked('giorno'));
    const times = day?.times ?? [];
    const first = times.find((s) => s.free && s.time === prefer) ?? times.find((s) => s.free);
    $('orari').innerHTML = times.map((s) => chip('ora', s.time, s.time, s.free ? '' : T.full, s.time === first?.time, !s.free)).join('');
  }
  $('sedi').addEventListener('change', () => loadDays());
  $('giorni').addEventListener('change', () => renderSlots(picked('ora')));
  loadDays();

  function setErr(key: string, msg: string) {
    const f = form.querySelector(`[data-f="${key}"]`);
    if (!f) return;
    f.classList.toggle('bad', !!msg);
    f.querySelector('.err')!.textContent = msg;
  }

  /** Provenienza della visita, salvata nella sessione al primo arrivo sul sito (vedi Base.astro). */
  function source(): Record<string, string> {
    try { return JSON.parse(sessionStorage.getItem('kit-fonte') ?? '{}'); } catch { return {}; }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const val = (id: string) => (($(id) as HTMLInputElement | null)?.value ?? '').trim();
    const nome = val('nome'), email = val('email'), tel = val('tel'), comune = data.askCity ? val('comune') : '';
    const checks: [string, boolean, string][] = [
      ['nome', nome.length >= 3, T.errName],
      ['email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), T.errEmail],
      ['tel', tel.replace(/\D/g, '').length >= 8, T.errPhone],
      ...(data.askCity ? [['comune', comune.length >= 2, T.errCity] as [string, boolean, string]] : []),
    ];
    const risposte: Record<string, string> = {};
    for (const q of data.questions) {
      const v = ($(`q-${q}`) as HTMLSelectElement).value;
      checks.push([`q-${q}`, !!v, T.errQuestion]);
      if (v) risposte[q] = v;
    }
    let ok = true;
    for (const [k, good, msg] of checks) { setErr(k, good ? '' : msg); if (!good) ok = false; }
    const privacy = ($('privacy') as HTMLInputElement).checked;
    $('form-err').textContent = privacy ? '' : T.errConsent;
    if (!ok || !privacy) {
      form.querySelector<HTMLElement>('.bad input, .bad select')?.focus();
      return;
    }
    if (!picked('giorno') || !picked('ora')) { $('form-err').textContent = T.errGone; return; }

    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    btn.disabled = true;
    btn.textContent = T.sending;
    const date = picked('giorno')!, time = picked('ora')!, place = loc();
    try {
      const res = await fetch('/api/prenotazioni', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sede: place.id, data: date, ora: time, prodotto: data.product, nome, email, tel, comune, risposte,
          privacy: true, lingua: data.locale, fonte: source(), sito: val('sito'), ms: Date.now() - started,
          turnstile: (form.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null)?.value,
        }),
      });
      const out = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; status?: string; ref?: string; ics?: string };
      if (!res.ok || !out.ok) {
        const code = out.error ?? '';
        if (code === 'slot-full' || code === 'slot-gone') { $('form-err').textContent = code === 'slot-full' ? T.errFull : T.errGone; await loadDays({ date }); return; }
        const map: Record<string, [string, string]> = { name: ['nome', T.errName], email: ['email', T.errEmail], phone: ['tel', T.errPhone], city: ['comune', T.errCity] };
        if (map[code]) { setErr(map[code][0], map[code][1]); return; }
        if (code.startsWith('question:')) { setErr(`q-${code.slice(9)}`, T.errQuestion); return; }
        $('form-err').textContent = code === 'too-many' ? T.errTooMany : code === 'robot' ? T.errRobot : code === 'consent' ? T.errConsent : T.errGeneric;
        return;
      }
      const confirmed = out.status === 'confermata';
      const where = place.kind === 'video' ? T.videocall : `${T.showroomOf} ${place.label}`;
      $('done-title').textContent = confirmed ? T.doneTitle : T.doneTitlePending;
      $('summary').textContent = `${where}, ${longFmt.format(asDate(date))} ${T.at} ${time}`;
      $('done-text').textContent = [confirmed ? T.doneText : T.doneTextPending, data.email ? T.mailSent : ''].filter(Boolean).join(' ');
      const ics = $('ics') as HTMLAnchorElement;
      if (out.ics) ics.href = URL.createObjectURL(new Blob([out.ics], { type: 'text/calendar' }));
      ics.hidden = !out.ics;
      form.hidden = true;
      $('done').hidden = false;
      // Per Google Tag Manager: la prenotazione è la conversione da misurare.
      (window as unknown as { dataLayer?: unknown[] }).dataLayer?.push({ event: 'prenotazione_visita', sede: place.label, prodotto: data.product, stato: out.status });
    } catch {
      $('form-err').textContent = T.errGeneric;
    } finally {
      btn.disabled = false;
      btn.textContent = T.send;
    }
  });

  $('again').addEventListener('click', () => {
    $('done').hidden = true;
    form.hidden = false;
    loadDays();
  });
}
