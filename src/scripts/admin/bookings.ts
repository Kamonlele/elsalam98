import { api, toast } from './ui';

type Day = { date: string; times: { time: string; free: boolean }[] };

export function initBookings() {
  const root = document.getElementById('bookings');
  const notify = document.getElementById('notify') as HTMLInputElement;
  try { notify.checked = localStorage.getItem('kit-avvisa') !== 'no'; } catch { /* nessun archivio locale */ }
  notify.addEventListener('change', () => { try { localStorage.setItem('kit-avvisa', notify.checked ? 'si' : 'no'); } catch { /* pazienza */ } });

  const fmt = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const label = (date: string) => { const [y, m, d] = date.split('-').map(Number); return fmt.format(new Date(Date.UTC(y, m - 1, d))); };

  async function act(card: HTMLElement, action: string, extra: Record<string, unknown> = {}) {
    const id = card.dataset.id!;
    const buttons = card.querySelectorAll<HTMLButtonElement>('button');
    buttons.forEach((b) => (b.disabled = true));
    try {
      await api(`/api/admin/prenotazioni/${id}`, { method: 'PATCH', json: { action, notify: notify.checked, ...extra } });
      toast({ conferma: 'Confermata', annulla: 'Annullata', sposta: 'Spostata', presente: 'Segnato: è venuto', assente: 'Segnato: non è venuto' }[action] ?? 'Fatto');
      setTimeout(() => location.reload(), 600);
    } catch (err) {
      toast((err as Error).message, 'error');
      buttons.forEach((b) => (b.disabled = false));
    }
  }

  async function openMove(card: HTMLElement) {
    card.querySelector('.move-panel')?.remove();
    const panel = document.createElement('div');
    panel.className = 'move-panel';
    panel.textContent = 'Carico gli orari liberi…';
    card.append(panel);
    try {
      const { days } = await api<{ days: Day[] }>(`/api/admin/prenotazioni/${card.dataset.id}`);
      const free = days.map((d) => ({ ...d, times: d.times.filter((x) => x.free) })).filter((d) => d.times.length);
      if (!free.length) { panel.textContent = 'Non ci sono orari liberi nei prossimi giorni.'; return; }
      panel.innerHTML = '';
      const daySel = document.createElement('select');
      const timeSel = document.createElement('select');
      free.forEach((d) => daySel.append(new Option(label(d.date), d.date)));
      const fill = () => { timeSel.replaceChildren(...free.find((d) => d.date === daySel.value)!.times.map((x) => new Option(x.time, x.time))); };
      daySel.addEventListener('change', fill);
      fill();
      const wrap = (text: string, el: HTMLElement) => { const l = document.createElement('label'); l.append(text, el); return l; };
      const ok = Object.assign(document.createElement('button'), { type: 'button', className: 'btn small', textContent: 'Sposta qui' });
      const no = Object.assign(document.createElement('button'), { type: 'button', className: 'btn ghost small', textContent: 'Lascia stare' });
      ok.addEventListener('click', () => act(card, 'sposta', { date: daySel.value, time: timeSel.value }));
      no.addEventListener('click', () => panel.remove());
      panel.append(wrap('Giorno', daySel), wrap('Ora', timeSel), ok, no);
      daySel.focus();
    } catch (err) {
      panel.textContent = (err as Error).message;
    }
  }

  root?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-act]');
    if (!btn) return;
    const card = btn.closest<HTMLElement>('.bk')!;
    const action = btn.dataset.act!;
    if (action === 'sposta') return void openMove(card);
    if (action === 'annulla' && !confirm(`Annullare la visita di ${card.querySelector('h3')?.textContent}?`)) return;
    act(card, action);
  });

  // Le note si salvano da sole quando si esce dal campo.
  root?.addEventListener('focusout', async (e) => {
    const area = e.target as HTMLTextAreaElement;
    if (!area.matches('[data-note]') || area.value === area.defaultValue) return;
    const card = area.closest<HTMLElement>('.bk')!;
    try {
      await api(`/api/admin/prenotazioni/${card.dataset.id}`, { method: 'PATCH', json: { action: 'nota', note: area.value } });
      area.defaultValue = area.value;
      toast('Nota salvata');
    } catch (err) { toast((err as Error).message, 'error'); }
  });
}
