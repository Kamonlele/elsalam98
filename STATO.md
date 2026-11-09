# Stato: sito Al Salam Boccaccio 98 (elsalam98.net)

Copia del Kamon Showcase Kit. Aggiornato da Claude a fine sessione.

## Ultima sessione

**2026-11-09**: rifacimento di elsalam98.net (WordPress + Elementor + GTranslate) con il kit.

## Demo

- **https://elsalam98-demo.vercel.app** (Vercel, team d47, progetto `elsalam98-demo`), pubblica ma nascosta a Google (noindex).
- È una copia statica in `demo/`. Per rifarla: `npm run build`, `astro preview`, scaricare solo le pagine HTML con wget,
  poi copiare `_astro/`, `archive/` e `brand/` da `dist/client/` e togliere ogni `http://localhost`.
  Non usare `wget --page-requisites`: il 9/11 ha lasciato file mancanti e la demo è uscita senza stili.
  Ogni push su `main` la ripubblica.

## Cosa c'è

- Lingue: inglese (principale, su `/`), italiano `/it/`, francese `/fr/`, arabo `/ar/` da destra a sinistra.
  I testi sono tradotti a mano, non più con GTranslate. **L'arabo va fatto rileggere a un madrelingua.**
- Pagine (in `src/lib/seed.ts`, finché il database è vuoto): home, la nave, cronologia, la causa,
  documenti, stampa. Contenuti ripresi tutti dal vecchio sito, riorganizzati.
- Foto del vecchio sito in `public/archive/` (webp). Logo in `public/brand/`.
- Nessuna prenotazione, nessun modulo, niente blog (`features` in `brand.json`).

## Modifiche fatte al kit qui dentro (da riportare nel kit)

Valgono per tutti i progetti, non solo per questo sito:

1. **Arabo e scrittura da destra a sinistra**: `ar` tra le lingue, `dir="rtl"`, testi dell'interfaccia
   in arabo, font IBM Plex Sans Arabic, slider e visore che girano al contrario.
2. **Selettore lingua** con nome della lingua (menu del telefono) e sigla (barra in alto).
3. **Tre blocchi nuovi**: `stats` (numeri), `timeline` (cronologia), `documents` (PDF da scaricare
   con le versioni in altre lingue). Tipo, schema, controlli e componente, come da regola del kit.
4. **Collegamenti tradotti**: un pulsante verso `/documents/` porta a `/it/documenti/` sulla pagina
   italiana (`src/lib/links.ts`, con test).
5. Barra in alto: si passa al menu del telefono sotto i 1000 px invece di 860.

I test del kit passano tutti (182) con `brand.json` e `seed.ts` del kit; qui alcuni falliscono
perché si aspettano l'italiano come lingua principale e il blog acceso: è normale.

## Prossimi passi

1. Rilettura dei testi (soprattutto arabo) da parte del cliente.
2. **I PDF** (33 file, circa 130 MB) puntano ancora a `elsalam98.net/wp-content/uploads`.
   Prima di spegnere WordPress vanno copiati su R2: serve aggiungere i PDF alla rotta `/media`
   del kit (oggi accetta solo foto, video e modelli). Poi si cambia la riga `DOCS` in `seed.ts`.
3. I video del vecchio sito (bordo nave 2006, Sahar Arabi, Robert Lieff) non erano leggibili:
   servono i link YouTube/Vimeo per rimetterli.
4. Cloudflare: database D1 e bucket R2, `wrangler.jsonc`, deploy, poi DNS.
5. Redirect dal vecchio sito: era una pagina sola, quindi basta che `/` resti la home.

## Decisioni

- 2026-11-09: inglese lingua principale (era la lingua del vecchio sito); le frasi su
  responsabilità del RINA restano attribuite (periti delle famiglie, comunicati, sentenze).
