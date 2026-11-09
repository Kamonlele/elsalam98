# Kamon Showcase Kit — Roadmap

Decisioni dell'8 ottobre 2026. Questo file è il punto di partenza di un
**secondo modello**, separato dal Kamon Site Kit.

## Due modelli, non uno

- **Kamon Site Kit** (repo esistente) resta com'è: una pagina, notizie,
  calendario, negozio. È il modello per club, associazioni, eventi.
  Il Dopolavoro 47 continua a vivere lì e non viene toccato.
- **Questo modello** è per aziende con prodotti da mostrare: multi-pagina,
  multilingua, molto fotografico, con prenotazione showroom.

Il nuovo modello **copia** dal Site Kit i pezzi che funzionano, senza
condividere codice: i due modelli evolvono ognuno per conto suo, e una
modifica a uno non può rompere l'altro.

## Perché serve un modello nuovo

Il Site Kit nasce dal sito del Dopolavoro 47: una pagina sola, contenuti in
un unico blocco JSON, pensato per notizie + calendario + negozio. Due
progetti pilota chiedono altro:

- **Colella** (colellaweb.it): oggi WordPress + WPML in IT/EN/FR. Prodotti
  "oggetto" (affettatrici a volano, elettriche, Berkel d'epoca restaurate),
  tre lingue, showroom ad Aosta e Treviso, visita in videochiamata.
- **Piscine Aquazzura** (piscineaquazzura.com): solo IT, tanto materiale foto
  e video non usato, prodotti singoli da impatto (fuoriterra in legno,
  minipiscine, Jacuzzi), 7 showroom, configuratore e catalogo esterni.

L'idea comune: **l'oggetto protagonista**. Un'affettatrice e una piscina in
legno si raccontano allo stesso modo — oggetto isolato, dettagli rivelati
allo scroll, contesto d'uso, specifiche, "vieni a vederlo". Un template, due
vestiti.

Riferimento di tono: edilfare.it — foto professionali grandi, poco testo,
pochi effetti. Il "grafico" lo fanno le foto e la composizione; il motion
accompagna, non sostituisce.

## Cosa si copia dal Site Kit

- Login admin, sessioni, PBKDF2, controllo same-origin (`lib/auth.ts`)
- `brand.json` + flag `features` + `apply-brand.mjs`
- Cloudflare Workers + D1 + R2, deploy con `prepare-deploy.mjs`
- Notifiche Brevo + Telegram (`lib/notify.ts`), chiavi in `app_settings`
- `ensureTables()`: un deploy non dipende mai dalle migrazioni
- Le regole di sicurezza del `CLAUDE.md` restano tutte valide

## Cosa si rifà

### 1. Livello contenuti

Nel Site Kit tutto il sito è una riga di `site_content`. Qui:

- `site_content` resta per le impostazioni globali e i testi delle pagine fisse
- tabelle vere per le **collezioni**:
  - `products` — prodotti/modelli, con categoria, galleria, specifiche
  - `projects` — realizzazioni e referenze (case study), con tipologia e luogo
  - `locations` — showroom/sedi, inclusa una sede virtuale "videochiamata"
  - `categories`
- ogni contenuto testuale è tradotto **per campo**, slug compresi
  (tabella `translations` oppure colonne JSON `{ it, en, fr }` — da decidere
  al primo prototipo, privilegiando la semplicità)

### 2. Sito pubblico multi-pagina

Invece di una pagina sola, template per tipo:

- home a blocchi
- categoria
- **prodotto-scena** (il pezzo forte del kit)
- realizzazione
- showroom (con mappa delle sedi)
- pagine istituzionali a blocchi

Lingua nell'URL (`/en/...`, `/fr/...`), con hreflang e sitemap generati.
Il rendering lato server è obbligatorio: le pagine devono arrivare complete a
Google.

### 3. Pagine a blocchi

Il cliente non disegna pagine: sceglie e riordina **blocchi già animati**
(hero foto/video, galleria, testo + foto, slider orizzontale, valori in
griglia, referenze, CTA prenotazione). Il motion lo decide il codice, così il
design non si rompe.

### 4. Pipeline foto

- Al caricamento, **il browser** ridimensiona e converte (AVIF/WebP in 3–4
  misure) prima di salire su R2. Niente servizi a pagamento: il sito resta
  autonomo.
- Punto focale cliccabile nell'admin, per i ritagli su mobile.
- Placeholder sfocato + lazy load.
- Video: poster + caricamento differito; hosting video da decidere (R2 vs
  YouTube/Vimeo non listati).

### 5. Multilingua

- Lingue attive in `brand.json` (es. `"locales": ["it", "en", "fr"]`).
  Un sito nasce predisposto anche se usa solo l'italiano.
- Pulsante **"traduci con AI"** nell'admin che precompila le altre lingue.
- **Glossario per cliente** (termini da non tradurre o da tradurre sempre
  uguale: nomi modello, "volano", "sfioro", marchi).
- Stato per lingua: *tradotto AI*, *revisionato*, *da aggiornare*. Se cambia
  l'italiano, le altre lingue si segnalano da sole come da aggiornare.
- La chiave dell'API di traduzione sta in `app_settings`, come Brevo.

### 6. Calendario prenotazioni (autonomo)

Funziona senza nessun servizio esterno.

- Sedi con orari, chiusure, ferie; tipi di appuntamento (visita showroom,
  consulenza, videochiamata) con durata e posti per slot.
- Il visitatore sceglie sede, prodotto d'interesse (dalla collezione) e slot.
- Admin: elenco prenotazioni, conferma, sposta, annulla, segna presente.
- Email di conferma e promemoria con file `.ics` (via Brevo).
- Turnstile + honeypot.
- UTM e fonte salvate con la prenotazione.
- Disponibilità sempre ricalcolata lato server (stessa logica di
  `lib/orders.ts`: il browser non decide niente).

### 7. Eventi e webhook

Un solo sistema di uscite per prenotazioni e form.

- Eventi: `prenotazione.creata`, `.confermata`, `.spostata`, `.annullata`,
  `promemoria.inviato`, `lead.creato` (form).
- Endpoint configurabili dall'admin (GHL, Make, Zapier, WhatsApp, ecc.),
  ognuno con gli eventi a cui è iscritto.
- Firma **HMAC** su ogni chiamata, segreto in `app_settings`.
- Retry con backoff + log degli invii visibile nell'admin.
- Se nessun webhook è configurato, il sito funziona uguale: è un'uscita,
  non una dipendenza.

### 8. Motion

Il `CLAUDE.md` dice "niente librerie nuove senza una ragione seria": qui la
ragione c'è.

- GSAP + ScrollTrigger per le scene dei prodotti
- Lenis per lo scroll morbido
- View Transitions per i passaggi tra pagine
- Sempre: `prefers-reduced-motion` rispettato, niente animazioni che
  bloccano la lettura

### Moduli rimandati

Configuratore, catalogo sfogliabile, chatbot: per ora fuori. Si aggiungono
dopo come moduli con il loro flag.

### Cosa NON si porta

Calendario partite, pronostici, inno, negozio con carrello e magazzino:
restano nel Site Kit. Le notizie si possono riprendere più avanti come
collezione, se un cliente le chiede.

## Decisioni prese (8 ottobre 2026)

- **Base tecnica: Astro su Cloudflare Workers**, D1 e R2. Niente vinext.
- Scena prodotto con due modalità: **3D** (modello `.glb`, inquadrature automatiche) e **foto**.
  Su desktop scroll agganciato, su telefono tappe in colonna con prodotto fisso in alto.
- Sotto la scena, la **gallery delle realizzazioni** con foto vere.
- **Le foto prodotto si vedono sempre intere**, mai ritagliate.
- Font ospitati sul sito, niente Google Fonts.
- Per Aquazzura: palette azzurra; foto da avere senza logo.

## Rischio tecnico (superato)

Il Site Kit usa `vinext` **1.0.0-beta.5** (Next su Vite, in beta). Partendo
da zero conviene scegliere adesso una base stabile, invece di ereditarla.
Opzioni:

- restare su vinext (aggiornando quando esce stabile)
- Next con OpenNext su Cloudflare
- Astro su Cloudflare (molto adatto a siti di contenuto con isole interattive)

## Altri punti aperti

- Hosting: Cloudflare (come il Site Kit) oppure il VPS Kamon su Hostinger.
  Per Colella c'è già una proposta di hosting sul VPS.
- Migrazione SEO: mappa completa dei redirect 301 dagli URL WordPress,
  in tutte le lingue. Serve un modulo redirect gestibile dall'admin.
- GTM e consenso cookie: da preservare (Colella usa GTM-NTLBH87).

## Fasi

1. ~~Decisione framework e prototipo del template prodotto-scena~~ fatto: Astro, prototipo in `prototipi/`.
2. ~~Ossatura Astro, lingue, collezioni, pagina prodotto~~ fatto.
3. ~~Area riservata~~ fatto (10 ottobre): accesso dal Site Kit, editor prodotti e sedi
   guidato da schemi, foto ridimensionate nel browser su R2, modelli .glb, accessi.
   Restano per dopo: traduzione AI con glossario e stati per lingua.
4. ~~Prenotazioni e webhook~~ fatto (10 ottobre): disponibilità dal server, posti per orario,
   domande di qualificazione, provenienza, email con .ics, promemoria programmati,
   webhook firmati con ripetizioni, pannello con conferma, sposta, annulla, presenze, CSV.
5. **Traduzione AI** con glossario e stati per lingua (i redirect sono già fatti).
6. ~~Blocchi pagina, collezioni e SEO~~ fatto (ottobre 2026): pagine a blocchi con home, categorie,
   realizzazioni, richieste (`lead.creato`), redirect 301 manuali e automatici, foto in più misure,
   sitemap, dati strutturati e anteprima Google, iubenda e GTM, articoli con editor ricco e RSS,
   ruoli amministratore, redattore e autore.
7. **Edilpro** come primo sito (solo IT, showroom e configuratore).
8. **Colella** con le tre lingue e i 301 dal WordPress.
