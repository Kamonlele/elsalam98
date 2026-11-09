/** Piccoli attrezzi comuni dell'area riservata. */

export async function api<T = Record<string, unknown>>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    headers: json !== undefined ? { 'content-type': 'application/json', ...(rest.headers ?? {}) } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: 'same-origin',
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (res.status === 401 && !url.endsWith('/session') && !url.endsWith('/setup')) {
    location.href = `/admin/accedi?da=${encodeURIComponent(location.pathname)}`;
  }
  if (!res.ok) throw new Error(data.error ?? 'Qualcosa non ha funzionato. Riprova.');
  return data;
}

let timer = 0;
export function toast(text: string, kind: 'ok' | 'error' = 'ok') {
  let el = document.querySelector<HTMLElement>('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.append(el);
  }
  el.textContent = text;
  el.classList.toggle('error', kind === 'error');
  el.hidden = false;
  clearTimeout(timer);
  timer = window.setTimeout(() => { el!.hidden = true; }, kind === 'error' ? 6000 : 2600);
}

/** Collega un modulo semplice (login, primo accesso) a una chiamata JSON. */
export function bindForm(form: HTMLFormElement, url: string, method: string, after: () => void) {
  const msg = form.querySelector<HTMLElement>('.msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (btn) btn.disabled = true;
    if (msg) { msg.textContent = ''; msg.className = 'msg'; }
    try {
      await api(url, { method, json: Object.fromEntries(new FormData(form)) });
      after();
    } catch (err) {
      if (msg) { msg.textContent = (err as Error).message; msg.className = 'msg error'; }
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}
