/**
 * Consenso ai cookie: Google Consent Mode v2 con iubenda, poi Google Tag Manager.
 * Funzioni pure: gli ID finiscono dentro script inline, quindi qui si rifiutano
 * tutti quelli che non hanno la forma esatta.
 */
export type ConsentIds = { iubendaSiteId: string; iubendaPolicyId: string; gtmId: string };

const GTM = /^GTM-[A-Z0-9]{4,10}$/;
const DIGITS = /^\d{1,12}$/;

/** Messaggio d'errore per il pannello, o null se gli ID presenti vanno bene. Un campo vuoto è lecito. */
export function validConsentIds(s: Partial<ConsentIds>): string | null {
  if (s.gtmId && !GTM.test(s.gtmId.trim())) return 'L\'ID di Google Tag Manager ha la forma GTM-XXXXXX.';
  if (s.iubendaSiteId && !DIGITS.test(s.iubendaSiteId.trim())) return 'L\'ID del sito iubenda è fatto di sole cifre.';
  if (s.iubendaPolicyId && !DIGITS.test(s.iubendaPolicyId.trim())) return 'L\'ID della policy iubenda è fatto di sole cifre.';
  return null;
}

/** iubenda serve solo se ci sono entrambi gli ID: la sua configurazione li vuole insieme. */
export function iubendaOn(s: Partial<ConsentIds>): boolean {
  return DIGITS.test(s.iubendaSiteId?.trim() ?? '') && DIGITS.test(s.iubendaPolicyId?.trim() ?? '');
}
export function gtmOn(s: Partial<ConsentIds>): boolean {
  return GTM.test(s.gtmId?.trim() ?? '');
}

/**
 * Blocchi per il <head>, in quest'ordine: "tutto negato" (e dataLayer), configurazione iubenda,
 * script iubenda, GTM. Così i tag Google partono solo quando iubenda aggiorna il consenso.
 */
export function consentHead(s: ConsentIds, lang: string): string {
  const iub = iubendaOn(s);
  const gtm = gtmOn(s);
  if (!iub && !gtm) return '';
  // La lingua entra in una stringa JS: solo lettere e trattino.
  const l = /^[a-z]{2}(-[A-Za-z]{2,4})?$/.test(lang) ? lang : 'it';
  const out = [
    `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}`
    + `gtag('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied',wait_for_update:500});</script>`,
  ];
  if (iub) {
    const id = s.iubendaSiteId.trim();
    out.push(
      `<script>var _iub=_iub||[];_iub.csConfiguration={siteId:${id},cookiePolicyId:${s.iubendaPolicyId.trim()},lang:"${l}",googleConsentMode:true,perPurposeConsent:true};</script>`,
      `<script src="https://cs.iubenda.com/autoblocking/${id}.js"></script>`,
      `<script src="https://cdn.iubenda.com/cs/iubenda_cs.js" charset="UTF-8" async></script>`,
    );
  }
  if (gtm) {
    out.push(`<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${s.gtmId.trim()}');</script>`);
  }
  return out.join('\n');
}

export function gtmNoscript(gtmId: string): string {
  if (!gtmOn({ gtmId })) return '';
  return `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId.trim()}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
}
