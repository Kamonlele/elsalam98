import { api, toast } from './ui';

type Hook = { id?: string; name: string; url: string; secret?: string; events: string[]; active: boolean };
const LABELS: Record<string, string> = {
  'prenotazione.creata': 'Nuova prenotazione',
  'prenotazione.confermata': 'Confermata',
  'prenotazione.spostata': 'Spostata',
  'prenotazione.annullata': 'Annullata',
  'prenotazione.presente': 'È venuto',
  'prenotazione.assente': 'Non è venuto',
  'promemoria.inviato': 'Promemoria inviato',
};

export function initSettings() {
  const boot = JSON.parse(document.getElementById('st-boot')!.textContent!) as { webhooks: Hook[]; events: string[] };
  let hooks: Hook[] = boot.webhooks;
  const box = document.getElementById('hooks')!;
  const form = document.getElementById('settings') as HTMLFormElement;
  const msg = form.querySelector<HTMLElement>('.msg')!;

  function render() {
    box.replaceChildren(...hooks.map((h, i) => {
      const el = document.createElement('div');
      el.className = 'hook';
      el.innerHTML = `
        <div class="two">
          <div class="field"><label for="h-name-${i}">Nome</label><input id="h-name-${i}" type="text" data-k="name" placeholder="GoHighLevel"></div>
          <div class="field"><label for="h-url-${i}">Indirizzo</label><input id="h-url-${i}" type="text" data-k="url" placeholder="https://..."></div>
        </div>
        <div class="field"><span class="lbl">Eventi da inviare</span><div class="events"></div></div>
        <label class="check"><input type="checkbox" data-k="active"> Attivo</label>
        <div class="secret"></div>
        <div class="acts" style="display:flex;gap:8px;flex-wrap:wrap"></div>`;
      const name = el.querySelector<HTMLInputElement>('[data-k=name]')!;
      const url = el.querySelector<HTMLInputElement>('[data-k=url]')!;
      const active = el.querySelector<HTMLInputElement>('[data-k=active]')!;
      name.value = h.name; url.value = h.url; active.checked = h.active;
      name.addEventListener('input', () => (h.name = name.value));
      url.addEventListener('input', () => (h.url = url.value));
      active.addEventListener('change', () => (h.active = active.checked));
      const ev = el.querySelector('.events')!;
      for (const e of boot.events) {
        const l = document.createElement('label');
        const c = Object.assign(document.createElement('input'), { type: 'checkbox', checked: h.events.includes(e) });
        c.addEventListener('change', () => { h.events = c.checked ? [...h.events, e] : h.events.filter((x) => x !== e); });
        l.append(c, LABELS[e] ?? e);
        ev.append(l);
      }
      const sec = el.querySelector('.secret')!;
      if (h.secret) {
        const code = Object.assign(document.createElement('code'), { textContent: h.secret });
        const copy = Object.assign(document.createElement('button'), { type: 'button', className: 'btn ghost small', textContent: 'Copia' });
        copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(h.secret!); toast('Segreto copiato'); } catch { toast('Seleziona il testo e copialo a mano', 'error'); } });
        sec.append('Segreto per verificare la firma: ', code, copy);
      } else sec.textContent = 'Il segreto per la firma si crea al salvataggio.';
      const acts = el.querySelector('.acts')!;
      if (h.id) {
        const test = Object.assign(document.createElement('button'), { type: 'button', className: 'btn ghost small', textContent: 'Invia una prova' });
        test.addEventListener('click', async () => {
          test.disabled = true;
          try { await api('/api/admin/webhooks/test', { method: 'POST', json: { id: h.id } }); toast('Prova inviata: guarda il registro'); setTimeout(() => location.reload(), 900); }
          catch (err) { toast((err as Error).message, 'error'); test.disabled = false; }
        });
        acts.append(test);
      }
      const rm = Object.assign(document.createElement('button'), { type: 'button', className: 'btn danger small', textContent: 'Togli' });
      rm.addEventListener('click', () => { hooks.splice(i, 1); render(); });
      acts.append(rm);
      return el;
    }));
  }
  render();

  document.getElementById('add-hook')!.addEventListener('click', () => {
    hooks.push({ name: '', url: '', events: ['prenotazione.creata', 'prenotazione.confermata', 'prenotazione.spostata', 'prenotazione.annullata'], active: true });
    render();
    box.querySelector<HTMLInputElement>('.hook:last-child [data-k=name]')?.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
    btn.disabled = true;
    msg.textContent = '';
    msg.className = 'msg';
    const data = Object.fromEntries(new FormData(form)) as Record<string, unknown>;
    data.webhooks = hooks;
    try {
      const res = await api<{ webhooks: Hook[] }>('/api/admin/settings', { method: 'PUT', json: data });
      hooks = res.webhooks;
      render();
      toast('Impostazioni salvate');
    } catch (err) {
      msg.textContent = (err as Error).message;
      msg.className = 'msg error';
    } finally { btn.disabled = false; }
  });

  document.getElementById('run-now')?.addEventListener('click', async (e) => {
    const b = e.currentTarget as HTMLButtonElement;
    b.disabled = true;
    try {
      const r = await api<{ retried: number; reminded: number }>('/api/admin/programmata', { method: 'POST' });
      toast(`Ripetuti ${r.retried} invii, mandati ${r.reminded} promemoria`);
      setTimeout(() => location.reload(), 1200);
    } catch (err) { toast((err as Error).message, 'error'); b.disabled = false; }
  });

  document.querySelectorAll<HTMLButtonElement>('[data-retry]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    try { await api('/api/admin/webhooks/retry', { method: 'POST', json: { id: b.dataset.retry } }); location.reload(); }
    catch (err) { toast((err as Error).message, 'error'); b.disabled = false; }
  }));
}
