# Kamon Showcase Kit

Modello Kamon per siti vetrina di aziende con prodotti da mostrare: multi-pagina,
multilingua, molto fotografico, con area riservata da cui il cliente aggiorna tutto
e calendario di prenotazione showroom.

Separato dal Kamon Site Kit (club, associazioni, eventi): i due modelli non
condividono codice.

**Base tecnica:** Astro su Cloudflare Workers, database D1, foto su R2.

## Cosa c'è oggi

- Pagine pubbliche: home e pagine a blocchi, categorie, prodotti, realizzazioni, articoli, 404
- Multilingua con URL tradotti e hreflang (lingue in `brand.json`)
- Pagina prodotto a blocchi:
  - **scena prodotto** in 3D (file `.glb` o modello dimostrativo) oppure a foto
  - **realizzazioni**: foto intere che scorrono, a tutto schermo al tocco
  - **scheda tecnica** raggruppata
  - **prenotazione visita** per sede, giorno e orario, con domande di qualificazione
- Contenuti dal database, con esempi neutri finché il database è vuoto
- **Area riservata** su `/admin`: pagine, categorie, prodotti, realizzazioni, articoli, sedi,
  prenotazioni, richieste, redirect, impostazioni, accessi (con tre ruoli)
- **SEO e consenso**: sitemap, robots, anteprima Google, dati strutturati, iubenda e GTM
- **Prenotazioni vere**: disponibilità calcolata dal server, email con invito per il
  calendario, promemoria del giorno prima, webhook firmati verso GHL, Make o Zapier

Prossimi passi in [ROADMAP.md](ROADMAP.md). Il prototipo di partenza è in `prototipi/`.

## Partire con un progetto nuovo

```bash
git clone <questa-repo> nome-progetto
cd nome-progetto
npm install
npm run dev            # http://localhost:4321
```

1. Compila `brand.json`: nome, lingue attive, contatti, colori, sezioni accese.
2. In `wrangler.jsonc` metti nome del worker, database D1 e bucket R2 del progetto.

## Area riservata

Il primo accesso si crea su `/admin/primo-accesso`: la pagina si chiude da sola dopo
il primo utente. Da lì il cliente può:

- **Prodotti**: nome, indirizzo della pagina, categoria, scena (modello 3D `.glb` o una foto per
  tappa), tappe, galleria, scheda tecnica, prenotazione sì o no. Bozza o pubblicato.
- **Pagine, categorie, realizzazioni, articoli**: vedi le sezioni qui sotto.
- **Sedi**: showroom o videochiamata, orari di visita per giorno, giorni di chiusura.
- **Accessi**: aggiungere e togliere persone, cambiare la propria password.
- **Lingue**: un selettore in alto nell'editor; nelle altre lingue sotto ogni campo si
  vede il testo italiano. Se una traduzione manca, il sito usa l'italiano.
- **Ordine**: le frecce nell'elenco decidono l'ordine sul sito.

## Collezioni e blocchi

Ogni collezione ha il suo elenco nel pannello, con bozza o pubblicato e l'ordine deciso
dalle frecce. Ognuna ha il suo indirizzo per lingua: se lo lasci vuoto si ricava dal nome.

| collezione | indirizzo pubblico | note |
|---|---|---|
| Pagine | `/chi-siamo/` | una sola è la **home** (si apre su `/`); "nel menu" la mostra in alto |
| Categorie | `/esterni/` | stanno alla radice come le pagine: gli indirizzi si controllano insieme |
| Prodotti | `/prodotti/nome/` | scena 3D o a foto, scheda tecnica, categoria |
| Realizzazioni | `/realizzazioni/nome/` | luogo, anno, categoria, foto |
| Articoli | `/news/titolo/` | vedi sotto |

Pagine e categorie si compongono con **blocchi**, riordinabili: `hero` (anche con video),
`text`, `textPhoto`, `gallery`, `slider`, `values`, `products`, `categories`, `projects`,
`posts`, `locations`, `booking`, `cta`, `policy` (privacy o cookie). Il movimento lo decide
il codice, non il cliente. I blocchi che puntano a una categoria perdono il collegamento se
quella categoria sparisce.

## Articoli

Elenco su `/news/` (il pezzo si cambia in `brand.json` → `blog.segment`), pagine a 12 per
volta, feed RSS su `/news/rss.xml`. Il testo si scrive con un **editor ricco** (titoli,
grassetto, corsivo, link, elenchi, citazioni, foto) che salva un documento JSON; sul sito
passa sempre da `cleanDoc` e `renderDoc`, mai come HTML. Con una **data futura** l'articolo
resta nascosto fino a quel giorno (data locale del sito). Ogni articolo ha riassunto,
autore e copertina.

## Ruoli

| ruolo | cosa può fare |
|---|---|
| Amministratore | tutto: contenuti, impostazioni, redirect, richieste, accessi |
| Redattore | gli articoli, più i **testi** di pagine e categorie (non foto, non indirizzi, non quantità) |
| Autore | solo gli articoli |

Il ruolo si sceglie in **Accessi**. I permessi non stanno nell'interfaccia: li fa rispettare
il server.

## Richieste e `lead.creato`

Con `features.leads` acceso, un modulo del sito manda la richiesta a `/api/richieste`
(stesse difese delle prenotazioni: campo trappola, tempo minimo, 5 all'ora per indirizzo,
Turnstile se configurato; il consenso privacy è obbligatorio). Le richieste si vedono in
`/admin/richieste`, da gestire una per una, e partono verso i webhook come evento
`lead.creato`, firmato come quelli delle prenotazioni.

Il modulo manda un JSON (`POST /api/richieste`, stessa origine del sito):

```json
{
  "modulo": "contatti",
  "nome": "Maria", "cognome": "Rossi",
  "email": "maria@example.com", "tel": "+39 333 000 0000",
  "privacy": true,
  "risposte": [{ "id": "tempi", "label": "Quando pensi di acquistare?", "value": "entro-3-mesi" }],
  "comune": "Torino",
  "pagina": "/showroom/",
  "fonte": { "utm_source": "google", "utm_medium": "cpc" },
  "sito": "",
  "ms": 8400,
  "turnstile": "token-del-widget"
}
```

- `modulo`: nome del modulo, minuscole, cifre e trattini (2-40 caratteri).
- `nome` e `cognome` almeno 2 caratteri; `tel` almeno 8 cifre; `privacy` deve essere `true`.
- `risposte`: al massimo 40; quelle senza `id` valido o senza valore si scartano.
- `comune`, `pagina` facoltativi; `fonte` tiene solo `utm_*`, `gclid`, `fbclid`, `referrer`, `landing`.
- `sito` è il campo trappola (deve restare vuoto) e `ms` i millisecondi passati a compilare:
  sotto 3000, o con `sito` pieno, la risposta è `{ "ok": true, "ref": "" }` ma non si salva nulla.
- `turnstile` serve solo se Turnstile è configurato.

Risposta: `{ "ok": true, "ref": "K7Q2XM" }`. Gli errori tornano come codice in `{ "error": "..." }`,
il testo da mostrare lo sceglie il modulo:

| Codice | Stato | Quando |
| --- | --- | --- |
| `invalid` | 400 | il corpo non è un oggetto JSON |
| `form` | 400 | `modulo` mancante o scritto male |
| `name` | 400 | nome o cognome troppo corti |
| `email` | 400 | email non valida |
| `phone` | 400 | telefono con meno di 8 cifre |
| `consent` | 400 | `privacy` non è `true` |
| `answers` | 400 | più di 40 risposte |
| `origin` | 403 | la richiesta non arriva dal sito |
| `robot` | 403 | Turnstile non superato |
| `too-many` | 429 | più di 5 richieste nell'ultima ora dallo stesso indirizzo |

Con `features.leads` spento la rotta risponde 404. Il webhook che parte:

```json
{
  "event": "lead.creato",
  "sent_at": "2026-10-23T09:15:00.000Z",
  "site": "Nome azienda",
  "lead": {
    "id": "5b0c1f7e-...",
    "ref": "K7Q2XM",
    "form": "contatti",
    "page": "/showroom/",
    "created_at": "2026-10-23T09:14:58.000Z",
    "admin_url": "https://www.esempio.it/admin/richieste"
  },
  "contact": {
    "first_name": "Maria", "last_name": "Rossi", "name": "Maria Rossi",
    "email": "maria@example.com", "phone": "+39 333 000 0000", "city": "Torino"
  },
  "answers": { "tempi": "entro-3-mesi" },
  "answers_text": "Quando pensi di acquistare?: entro-3-mesi",
  "source": { "utm_source": "google", "utm_medium": "cpc" }
}
```

## Redirect

Da `/admin/redirect`: una regola per riga ("vecchio nuovo"), anche incollate in blocco,
con il conteggio di quante volte sono servite. Quando cambi l'indirizzo di una pagina,
categoria, prodotto, realizzazione o articolo già online il redirect 301 si crea da solo, in
tutte le lingue; anche una pagina che diventa la home lascia il redirect dal suo vecchio
indirizzo a `/`. Una regola a mano non può portare a un indirizzo che a sua volta rimanda
altrove (né creare un giro, A verso B e B verso A): l'errore dice dove puntare. Chi arriva su un indirizzo che non esiste e ne ha uno registrato viene mandato
al nuovo; senza regola vede la 404.

## SEO

- `/sitemap.xml` con tutte le pagine pubblicate, `/robots.txt`. Solo gli articoli hanno
  `lastmod` (la data dell'ultima modifica): per gli altri contenuti il sito non la conosce e
  una data inventata peggiorerebbe il segnale.
- Ogni contenuto ha titolo e descrizione per Google e immagine di condivisione; se mancano
  si ricavano dal contenuto. Nell'editor un'**anteprima Google** avvisa quando titolo o
  descrizione sono troppo lunghi.
- Dati strutturati JSON-LD: azienda e sedi, prodotti, articoli, briciole di pane.
- Lingue alternative (`hreflang`) su ogni pagina, se il sito ha più di una lingua.

## Foto

Si ridimensionano nel browser prima del caricamento (WEBP, lato lungo massimo 2400 px),
**mai ritagliate**, e finiscono su R2. Per ogni foto il browser produce `full`, `1280`,
`640` e una miniatura sfocata (`/media/img/<uuid>/...`): il sito usa `srcset` e mostra la
miniatura finché la foto non arriva. Le foto dei prodotti si vedono sempre intere. `/media`
serve anche video (`video/`) e modelli 3D `.glb` fino a 40 MB (`modelli/`).

## Cookie e statistiche

In **Impostazioni** si scrivono gli ID di **iubenda** (sito e policy, servono entrambi) e
di **Google Tag Manager** (`GTM-XXXXXX`). Con iubenda acceso il sito parte con ogni
consenso negato (Consent Mode v2) e GTM si attiva solo dopo la scelta del visitatore. Senza
iubenda il consenso resta negato in partenza: GTM da solo non basta. Gli ID si
controllano nella forma prima di finire nelle pagine. Il blocco `policy` mostra privacy e
cookie policy di iubenda dentro una pagina.

Contenuti d'esempio: finché il database è vuoto il sito mostra gli esempi di `seed.ts`.
Dall'area riservata si possono copiare nel database per modificarli; dal primo
salvataggio in poi il sito mostra solo quello che c'è nel database.

## Prenotazioni

Le regole valide per tutto il sito stanno in `brand.json` → `booking`:

| campo | cosa fa |
|---|---|
| `timezone` | fuso orario delle sedi (i Workers girano in UTC) |
| `daysAhead` | quanti giorni avanti si può prenotare |
| `minNoticeHours` | preavviso minimo |
| `visitMinutes` | durata della visita nell'invito per il calendario |
| `autoConfirm` | `true`: confermata subito; `false`: la conferma il cliente dal pannello |
| `askCity` | chiede il comune (utile per capire la zona del contatto) |
| `questions` | domande di qualificazione a scelta, nelle lingue del sito |
| `turnstileSiteKey` | chiave pubblica di Cloudflare Turnstile (facoltativa) |

Orari, chiusure e posti per orario si impostano per ogni sede dal pannello.

**Come funziona.** Il modulo chiede gli orari liberi a `/api/disponibilita`; alla
richiesta il server ricontrolla tutto e salva con un'unica istruzione che verifica i
posti, così due persone non possono prendere lo stesso ultimo posto. Antispam: campo
trappola, tempo minimo di compilazione, massimo 5 richieste all'ora per indirizzo,
Turnstile se configurato. Con la prenotazione si salva la provenienza (utm, gclid,
fbclid, sito di provenienza) e la pagina manda a Google Tag Manager l'evento
`prenotazione_visita`.

**Email** (Brevo, chiave nelle impostazioni del pannello): al cliente nella sua lingua
con l'invito `.ics` (stesso evento aggiornato se la visita si sposta, tolto se si
annulla), a voi l'avviso di ogni nuova prenotazione. Senza chiave le prenotazioni
funzionano lo stesso.

**Attività programmata** ogni 15 minuti (`wrangler.jsonc` → `triggers`, gestita da
`src/worker.ts`): promemoria per le visite del giorno dopo, dalle 9 alle 21, e
ripetizione dei webhook non consegnati.

### Webhook

Eventi: `prenotazione.creata`, `.confermata`, `.spostata`, `.annullata`, `.presente`,
`.assente`, `promemoria.inviato` (e `prova` dal pannello). Il corpo è JSON con
`booking`, `contact` (nome e cognome separati), `answers`, `answers_text`, `source`.
Se l'indirizzo non risponde con 2xx si riprova dopo 1, 5, 30 minuti, 2, 6 e 24 ore.

Per GoHighLevel: workflow con trigger "Inbound Webhook", si incolla l'indirizzo nel
pannello e si mappano i campi `contact.*`.

Ogni chiamata è firmata. Intestazione `X-Kamon-Signature: t=<secondi>,v1=<hex>`, dove
`v1` è l'HMAC-SHA256 di `"<t>.<corpo>"` con il segreto mostrato nel pannello:

```js
const [t, v1] = header.split(',').map((p) => p.split('=')[1]);
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SEGRETO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${corpo}`));
const valida = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('') === v1
  && Math.abs(Date.now() / 1000 - Number(t)) < 300;
```

## Pubblicare su Cloudflare

```bash
npx wrangler login
npx wrangler d1 create nome-progetto            # copia il database_id in wrangler.jsonc
npx wrangler r2 bucket create nome-progetto-media
npm run deploy
```

In `wrangler.jsonc` metti nome del worker, `database_id` e nome del bucket. Le tabelle
le crea il sito da solo al primo avvio (oppure `npm run db:apply`). Poi apri
`/admin/primo-accesso` sul dominio pubblicato.

## Comandi

| comando | cosa fa |
|---|---|
| `npm run dev` | sviluppo in locale |
| `npm run build` | build di produzione |
| `npm run preview` | prova la build in locale (runtime Cloudflare) |
| `npm run deploy` | build + pubblicazione su Cloudflare |
| `npm run db:apply` | crea le tabelle sul database |
| `npm run check` | controllo dei tipi |

## Come è fatto

```
brand.json                il vestito del progetto
wrangler.jsonc            worker, database, spazio foto
db/schema.sql             tabella dei contenuti
src/pages/[...path].astro tutte le pagine pubbliche (URL tradotti)
src/pages/admin/          area riservata (accesso, elenchi, editor, accessi)
src/pages/api/admin/      salvataggi, caricamenti, sessione, utenti
src/pages/media/          serve foto, video e modelli caricati
src/middleware.ts         protegge /admin e /api/admin
src/worker.ts             punto d'ingresso: pagine + attività programmata
src/pages/api/            disponibilità, prenotazione e richieste (pubbliche)
src/layouts/Base.astro    testa della pagina, colori da brand.json, menu, lingue
src/components/           ProductPage, Scene, Gallery, Specs, Booking, blocks/ (un file per blocco)
src/scripts/              scena (3D/foto), prenotazione, modello dimostrativo
src/scripts/admin/        editor guidato dagli schemi, caricamento foto
src/lib/                  brand, lingue, contenuti, database, accesso, schemi dei moduli, controlli
src/styles/               stile completo e font
prototipi/                prototipi HTML da cui è nato il template
```
