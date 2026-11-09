# Note per Claude

Questa repo è un **modello** per siti vetrina di aziende con prodotti da mostrare.
Ogni modifica va pensata per "vale per tutti i progetti?", non per un cliente.
È separata dal Kamon Site Kit: non condividono codice.

## Come è organizzato

- `brand.json` è l'unico file che cambia da progetto a progetto (più `wrangler.jsonc`
  per nome del worker, database e spazio foto). Se stai per scrivere il nome di un
  cliente in un componente, fermati: va in `brand.json` o nel database.
- I contenuti (prodotti, sedi, foto, testi) stanno nel database D1, tabella `items`,
  dati in JSON. `src/lib/store.ts` li legge; se il database è vuoto o assente si
  vedono i contenuti d'esempio di `src/lib/seed.ts`, che devono restare **neutri**.
- Tutte le pagine pubbliche passano da `src/pages/[...path].astro`, così anche i pezzi
  fissi degli URL sono tradotti (`/prodotti/...`, `/en/products/...`). I nomi dei
  pezzi stanno in `SEGMENTS` (`src/lib/i18n.ts`), i testi fissi dell'interfaccia in `UI`.
- I testi del cliente sono oggetti `{ it, en, ... }` (tipo `T`); si leggono sempre con
  `t(testo, locale)`, che ricade sulla lingua principale se manca la traduzione.
- Le sezioni opzionali si accendono con `brand.json` → `features`.

## Area riservata

- L'editor è **guidato da schemi** (`src/lib/schema.ts`): ogni collezione descrive i
  suoi campi e `src/scripts/admin/form.ts` disegna il modulo. Una collezione nuova =
  un tipo in `content.ts` + uno schema + i controlli in `validate.ts` + il nome in
  `COLLECTIONS` (`store.ts`). Non scrivere moduli a mano per una collezione sola.
- `src/lib/validate.ts` decide cosa entra nel database: il browser può mandare
  qualsiasi cosa. I controlli vanno lì, non solo nell'editor.
- Accesso ripreso dal Site Kit, stesse regole: PBKDF2 a **100.000 iterazioni al
  massimo** (oltre, i Workers rifiutano), sessioni su D1 con hash del token, blocco
  dopo 8 tentativi, controllo dell'origine su ogni scrittura (in `middleware.ts`).
- `ensureTables()` (`src/lib/db.ts`) crea le tabelle se mancano: un deploy non deve
  dipendere dalle migrazioni. Se aggiungi una tabella, aggiungila lì e in `db/schema.sql`.
- Le foto si ridimensionano **nel browser** (`src/scripts/admin/upload.ts`) senza mai
  ritagliarle. La rotta `/media` serve solo nomi generati dal sito (`foto/`, `modelli/`, `video/` e `img/<uuid>/{full,1280,640,blur}`); la regola è in `media-keys.ts`.

## Blocchi, indirizzi e testo ricco

- Un **blocco nuovo** = il tipo in `content.ts` + la voce nello schema `blocks` (`schema.ts`)
  + il controllo in `validateBlocks` (`validate.ts`) + il componente in `src/components/blocks/`.
  Se ne manca uno, il blocco si perde in silenzio o rompe la pagina.
- La **logica pura** (regole, controlli, testo, indirizzi) vive in file senza
  `cloudflare:workers`, così si prova con vitest: ogni file nuovo di quel tipo ha il suo test.
- `publicUrl` (`routes.ts`) è l'**unico** posto che conosce la forma degli indirizzi
  pubblici. Sitemap, menu, redirect e anteprime la chiamano, non rifanno la stringa.
- I **ruoli** li fa rispettare il server: `canOpen` nel middleware decide cosa si apre;
  per il redattore `mergeTexts` e `keepSlug` tengono fermi struttura e indirizzi. Un campo
  di testo che decide la struttura (indirizzo, quantità) porta `structural: true` nello
  schema, altrimenti il redattore lo cambierebbe.
- Il **testo ricco** si salva come JSON e si mostra solo passando da `cleanDoc` e
  `renderDoc`, mai come HTML scritto dal browser. TipTap resta **solo nell'area riservata**:
  non deve finire nel codice delle pagine pubbliche.

## Regole di design da non rompere

- **Le foto dei prodotti si vedono sempre intere**: niente `object-fit: cover` sul
  prodotto, niente zoom oltre la misura della foto.
- Scena prodotto: su desktop la scena resta ferma e lo scroll fa avanzare le tappe;
  su telefono niente scroll agganciato (tappe in colonna, prodotto fisso in alto).
- Rispettare sempre `prefers-reduced-motion` (classe `.rm`: tutto in colonna, fermo).
- Niente Google Fonts: i font sono pacchetti `@fontsource` ospitati sul sito.
- Niente lineette lunghe nei testi visibili.

## Prenotazioni

- La disponibilità la decide **solo il server** (`src/lib/booking.ts`): il browser mostra.
  L'inserimento controlla i posti nella stessa istruzione SQL: non spezzarlo in due passi.
- Date e orari sono **locali del sito** (`brand.json` → `booking.timezone`), salvati come
  testo `YYYY-MM-DD` e `HH:MM`. Per "adesso" usa `localNow()`, mai `new Date()` così com'è:
  i Workers sono in UTC.
- Email e webhook partono dopo la risposta (`later()` in `src/lib/later.ts`) e passano tutti
  da `emitBooking()` (`src/lib/events.ts`). Un evento nuovo va aggiunto a `EVENTS`.
- Chiavi e segreti in tabella `settings` (`src/lib/settings.ts`), mai nei contenuti. Nel
  pannello le chiavi di servizi esterni tornano mascherate; il segreto dei webhook no,
  serve a chi riceve.
- I testi delle email sono in `src/lib/mail-text.ts`, uno per lingua.

## Cloudflare

- Si pubblica su **Workers** (l'adattatore Astro non supporta più Pages).
- Il punto d'ingresso è `src/worker.ts` (pagine con `handle` di Astro + `scheduled`).
- Sessioni di Astro spente (`session: false`): niente archivio KV inutile al deploy.
- I collegamenti (database `DB`, foto `MEDIA`) si leggono con
  `import { env } from 'cloudflare:workers'`. `Astro.locals.runtime` non esiste più.
- I tipi dei collegamenti sono scritti a mano in `src/env.d.ts` (non usare `wrangler types`:
  ridefinisce `Element` e rompe i tipi del browser nell'area riservata).
- `astro check` richiede TypeScript 6, non 7.

## Stile del codice

Italiano nei commenti, nei testi e nei nomi delle sezioni. Commenti solo dove
spiegano un *perché*. Niente librerie nuove senza una ragione seria.

## Contesto Kamon e stato

- A che punto siamo: `STATO.md` in questa repo. Leggilo all'inizio, aggiornalo a fine
  sessione (skill `chiudi-sessione`).
- Mappa di tutti i progetti, hosting e account: `~/Kamon/kamon-hub/` (`PROGETTI.md`,
  `INFRASTRUTTURA.md`, `CONVENZIONI.md`).
