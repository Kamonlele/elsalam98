# Edilpro Piscine sul Showcase Kit — design

Data: 23 ottobre 2026. Sostituisce Aquazzura come primo sito vero del kit
(ROADMAP, fase 7).

## Perché

Edilpro Piscine (edilpropiscine.it, Soave VR, rivenditore Piscine Solaris,
lavora tra Verona e Vicenza) ha oggi un WordPress con WPBakery fermo al 2024,
con testi rovinati (parole attaccate: "tuasoluzione", "sumisura"). Lo
rifacciamo "di livello più alto" sul Showcase Kit.

Priorità del cliente, in quest'ordine:

1. **Immagine**: deve sembrare l'azienda più seria della zona. Foto grandi,
   poco testo, oggetto protagonista (vedi tono edilfare.it nella ROADMAP).
2. **Posizionamento su Google** a Verona e Vicenza: non perdere quello che il
   sito ha oggi e fare meglio.
3. **Contatti**: visite in showroom prenotate e richieste di preventivo dal
   configuratore.

Quando due scelte sono in conflitto vince la priorità più alta: per esempio,
una CTA in più che rovina una composizione fotografica non si mette.

## Due livelli di lavoro

Il kit è un modello: ogni cosa che serve a Edilpro ma vale per altri clienti
va **nel kit** (questa repo), senza il nome del cliente. Quello che è solo di
Edilpro va nel **progetto Edilpro**, una copia del kit (`git clone` come da
README) con il suo `brand.json`, `wrangler.jsonc`, contenuti e grafica.

*Scelta mia:* questo documento sta nel kit perché la gran parte del lavoro è
la fase 6 della ROADMAP.

## Obiettivi

### Nel kit

1. **Fase 6 della ROADMAP**, almeno quanto serve a Edilpro:
   - collezioni nuove `categories` e `projects` (realizzazioni), con schema
     nell'editor come `products` e `locations` (regole in `CLAUDE.md`);
   - pagine pubbliche: categoria (elenco prodotti di quella categoria + testo
     + realizzazioni collegate), realizzazione, showroom (sedi, orari, mappa),
     pagine libere a blocchi (chi siamo, giardini, accessori, privacy, cookie);
   - **blocchi** che il cliente sceglie e riordina, già animati dal codice:
     hero foto/video, testo + foto, galleria, slider orizzontale, valori in
     griglia, realizzazioni, CTA (prenota visita / configura). La home è una
     pagina a blocchi.
2. **Pipeline foto**: più misure (AVIF + WebP) generate nel browser al
   caricamento, `srcset`, placeholder sfocato, lazy load. Punto focale
   cliccabile per le foto di sfondo (hero, blocchi). Le foto **prodotto**
   restano sempre intere (regola di `CLAUDE.md`), il punto focale non si
   applica a loro.
3. **Lead da modulo**: endpoint pubblico generico che riceve una richiesta
   (contatto + risposte libere chiave/valore + provenienza), la salva in D1,
   la mostra nell'area riservata (elenco + CSV, come le prenotazioni) e
   manda l'evento `lead.creato` ai webhook con la stessa firma, gli stessi
   tentativi e lo stesso antispam delle prenotazioni (trappola, tempo minimo,
   5 l'ora per indirizzo, Turnstile se configurato). Email di avviso allo
   staff via Brevo se c'è la chiave. Flag `features.leads`.
4. **Redirect**: tabella di redirect 301 gestibile dall'area riservata
   (vecchio indirizzo → nuovo), più redirect automatico quando cambia lo slug
   di un elemento pubblicato. Le traduzioni AI della fase 5 **non** servono ora.
5. **SEO di base** generata: `sitemap.xml`, `robots.txt`, title e description
   per pagina modificabili, Open Graph, dati strutturati (`LocalBusiness` per
   le sedi, `Product` per i prodotti).
6. **Sito a lingua sola**: con `locales.active: ["it"]` niente selettore
   lingua, niente prefissi, niente hreflang verso lingue inesistenti, e
   l'editor non mostra il selettore delle lingue.
7. **Blog / news** (aggiunto il 24 ottobre; gli articoli li scrive Kamon):
   collezione articoli (titolo, indirizzo, data, autore, copertina, riassunto,
   testo, SEO), flag `features.blog`; parola dell'indirizzo per progetto in
   `brand.json` (`/news/`, `/news/<slug>/`); elenco a 12 per pagina
   (`/news/pagina/2/`); blocco "ultimi articoli"; pubblicazione programmata
   (data futura = visibile da quel giorno); feed `/news/rss.xml`.
8. **Editor di testo ricco** per gli articoli: titoli, grassetto, corsivo,
   link, elenchi, citazioni, foto con didascalia. TipTap solo nell'area
   riservata (ragione seria: un editor fatto a mano è fragile); si salva la
   struttura JSON e il server la trasforma in HTML con un elenco chiuso di
   elementi permessi. Niente video incorporati per ora (cookie).
9. **SEO in più**: `BlogPosting` per gli articoli (autore, date, immagine),
   articoli in sitemap con data di modifica, `BreadcrumbList` su tutte le
   pagine; nell'editor anteprima Google con conteggio caratteri (titolo 60,
   descrizione 155) e avvisi per descrizione o testo alternativo mancanti;
   redirect automatico anche al cambio di indirizzo di un articolo.
10. **Ruoli** (ultimi in ordine di lavoro; per Edilpro scrive Kamon da
    amministratore, servono per i clienti che vorranno ritoccare i testi):
    - Amministratore: tutto. Chi esiste già resta amministratore.
    - Redattore: articoli (crea, modifica, pubblica) e **solo i testi** di
      Pagine e Categorie (titoli, testi dei blocchi, testi dei pulsanti, SEO);
      niente blocchi aggiunti, tolti o spostati, foto, indirizzi, home, menu,
      stato. Il server, al salvataggio di un redattore, prende solo i campi di
      testo e tiene il resto com'è nel database.
    - Autore: solo articoli.
    - I divieti li fa rispettare il server, non solo il menu. I ruoli li
      assegna un amministratore da Accessi.

### Nel progetto Edilpro

1. `brand.json`: solo italiano, contatti, sede di Soave, palette e font dalla
   grafica approvata (vedi sotto).
2. Contenuti di partenza dal materiale **Piscine Solaris** (foto e schede),
   più i testi del sito attuale riscritti puliti.
3. Struttura (dal menu attuale):
   - Categorie: Piscine interrate, Piscine naturali, Piscine fuori terra.
   - Prodotti: i modelli Solaris per ciascuna categoria.
   - Pagine: Home, Chi siamo, Design giardini, Accessori piscina, Showroom,
     Privacy, Cookie.
   - Realizzazioni: vuote o quasi all'inizio; si riempiono quando arrivano
     foto di lavori Edilpro.
4. **Prenotazione visita** con il calendario del kit: una sede, Soave (VR),
   Statale 11 V.le del Commercio 25/C, aperta lun–ven 9–13 e 15–19, sab 9–15.
   Il sito attuale dice "si riceve su appuntamento": la prenotazione online
   prende quel posto. Le domande di qualificazione si definiscono in
   `brand.json` (*scelta mia di partenza*: tipo di piscina, tempi, comune).
5. **Configuratore** (vedi sezione dedicata).
6. **Contatti in GHL**: Edilpro diventa cliente WeLeads. Prenotazioni e
   configuratore arrivano allo stesso workflow GHL con trigger "Inbound
   Webhook", distinguendo per nome evento. Nessuna email al posto di GHL; le
   email del kit (conferme al cliente, avviso allo staff) restano.
7. **301 dal WordPress**. URL attuali (da `page-sitemap.xml`):
   `/`, `/chi-siamo/`, `/giardini/`, `/piscine-interrate/`,
   `/piscine-naturali/`, `/piscine-fuori-terra/`, `/accessori-piscina/`,
   `/privacy-policy/`, `/cookie-policy-eu/`.
   *Scelta mia:* dove possibile le pagine nuove tengono **lo stesso
   indirizzo** (per esempio la categoria interrate resta su
   `/piscine-interrate/`), così il redirect non serve proprio. Il resto va
   nella tabella redirect. Gli indirizzi `/wp-content/uploads/...` delle
   immagini indicizzate non si redirigono.
8. Hosting: **Cloudflare** (Workers + D1 + R2), come il kit nasce. Il dominio
   va puntato su Cloudflare.

## Configuratore

Deciso da Emanuele: **se ne fa uno nuovo per Edilpro**. Quello di RetePiscine
(https://retepiscine.kamonweb.it/configura-la-tua-piscina.html) è il punto di
partenza per meccanica e tono, non si copia: le opzioni seguono l'offerta
Edilpro (interrate, naturali, fuori terra, modelli e finiture Solaris) e le
foto di anteprima si fanno dal materiale Solaris, non da quelle di
RetePiscine.

Cosa si riprende da quello di RetePiscine: una domanda per schermata,
anteprima che cambia con le scelte (con la combinazione più vicina se manca
quella esatta), ultimi passi su tempi del progetto e contatti, evento
`generate_lead` nel dataLayer. Lì l'invio passava da Kamon Forms (plugin
WordPress); qui non c'è WordPress, quindi:

- il configuratore è una pagina del progetto Edilpro
  (`/configura-la-tua-piscina/`) e invia al **lead endpoint del kit**
  (obiettivo kit 3);
- passi e opzioni li propone Claude nella grafica (artifact Design), da far
  approvare insieme alle pagine;
- le risposte viaggiano come risposte del lead, così in GHL si mappano come
  le domande di qualificazione delle prenotazioni;
- dopo l'invio, invito a prenotare una visita in showroom (*scelta mia*).

*Scelta mia:* il configuratore resta specifico del progetto Edilpro, non un
modulo generico del kit. Un configuratore per piscine non vale per un'azienda
di affettatrici; nel kit va solo il pezzo generico (ricevere e consegnare un
lead). Se in futuro serve a più clienti di piscine, si promuove a modulo.

## Grafica

La prepara Claude come artifact **Design** (tipo Design di claude.ai), e
Emanuele la approva. Copre tutti i tipi di pagina: home, categoria, prodotto,
realizzazione, showroom, pagina libera, configuratore. Il builder del codice
**non inventa la direzione visiva**: fino all'approvazione della grafica il
lavoro sul kit usa lo stile attuale del kit, e il progetto Edilpro aspetta la
grafica per palette, font, home e ritmo delle pagine.

*Scelta mia:* i blocchi del kit si costruiscono prima della grafica; dopo
l'approvazione è previsto un giro di ritocchi su blocchi e modello dati.

Le regole di design di `CLAUDE.md` restano valide (prodotto intero, font
ospitati, reduced motion, niente lineette lunghe).

## Non obiettivi

- Inglese e altre lingue, traduzioni AI, glossario (fase 5).
- Catalogo sfogliabile, chatbot.
- Integrazione con il configuratore o il sito di Solaris.

## Anti-obiettivi (sarebbe un fallimento anche se funziona)

- Un sito che sembra un template, o che sembra il WordPress attuale con le
  foto più grandi.
- Perdere posizioni su Google al cambio: pagine attuali senza redirect,
  pagine che arrivano vuote senza JavaScript.
- Contatti persi: un invio che fallisce in silenzio, o un lead che resta solo
  nel database senza arrivare in GHL.
- Il nome Edilpro, o testi da piscina, dentro il codice del kit.

## Vincoli

- Tutte le regole di `CLAUDE.md` (editor guidato da schemi, `validate.ts`
  decide cosa entra, `ensureTables()`, segreti in `settings`, eventi in
  `EVENTS` via `events.ts`, orari locali con `localNow()`).
- Rendering lato server per tutte le pagine pubbliche.
- Niente librerie nuove senza ragione seria (GSAP c'è già).

## Scelte prese dopo la revisione

- *Scelta mia:* video nelle hero = loop brevi e muti caricati su R2 con
  fermo immagine; i video lunghi restano su YouTube/Vimeo non in elenco.
- *Scelta mia:* ai webhook GHL vanno tutti gli eventi (prenotazioni e
  `lead.creato`); si filtra nel workflow GHL.
- *Scelta mia:* il configuratore oggi raccoglie un solo campo "nome"; nel
  nuovo si chiedono nome e cognome separati, come nelle prenotazioni.

## Decisioni dopo la revisione

Deciso da Emanuele: **cookie, privacy e consenso con iubenda**. Banner e
testi di privacy e cookie policy li fornisce iubenda. Nel kit va un
collegamento generico a un gestore del consenso esterno: codice iubenda e
ID GTM dalle impostazioni del pannello (niente nel codice), Google Consent
Mode v2 con tutto negato finché il visitatore non accetta, GTM caricato dopo.
Le pagine Privacy e Cookie mostrano le policy iubenda. *Scelta mia:* pixel
Meta e Google Ads si mettono dentro GTM, non nel sito.

Dominio e posta (verificato dai DNS pubblici il 23 ottobre; chi ha gli accessi
ancora non si sa): `edilpropiscine.it` è registrato su **Aruba**, con DNS Aruba
e posta sul server Aruba (`MX 10 mx.edilpropiscine.it`). Il sito di oggi sta
su `89.46.105.60`. `edilprodesign.it` (la mail `info@` del sito) ha la posta su
Microsoft 365 e non va toccato. *Scelta mia:* al momento della messa online si
spostano i nameserver di `edilpropiscine.it` su Cloudflare, dopo aver copiato
tutti i record Aruba, compresi MX e `mx.edilpropiscine.it`, così la posta non
si ferma. È un passo a parte, alla fine, e serve l'accesso al pannello Aruba.

Deciso da Emanuele: il materiale Solaris (foto, schede, modelli da mettere
online) arriva in una cartella locale che prepara lui; le foto sono senza
loghi, si usano così come sono.

Deciso da Emanuele: il sottoaccount WeLeads/GHL di Edilpro non esiste ancora e
si crea, workflow compreso, dalla repo `weleads-crm`, **fuori da questo
progetto**. Qui basta documentare il payload dei webhook; la prova "arriva in
GHL" si fa quando il sottoaccount c'è.

## Lasciato al builder

- Modello dati dei blocchi e delle pagine (collezione `pages` o simile), purché
  passi da schemi come il resto.
- Come generare le misure foto nel browser e quali misure.
- Forma del payload `lead.creato`, coerente con quello delle prenotazioni
  (`contact` con nome e cognome separati, `answers`, `answers_text`, `source`).
- Ordine dei lavori, purché il kit venga prima del progetto Edilpro.

## Fatto quando

- Il kit ha categorie, realizzazioni, pagine a blocchi, lead, redirect,
  sitemap e foto in più misure, con esempi neutri in `seed.ts`.
- Il sito Edilpro è online su Cloudflare con la grafica approvata, tutte le
  pagine attuali rispondono (stesso indirizzo o 301), una prenotazione di
  prova e un configuratore di prova arrivano in GHL.
