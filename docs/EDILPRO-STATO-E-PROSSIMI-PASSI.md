# Edilpro Piscine: stato e prossimi passi

Aggiornato il 28 ottobre 2026. Per riprendere da un altro computer: clona questa
repo e chiedi a Claude di leggere questo file.

## Dove siamo

- **Cliente:** Edilpro Piscine (edilpropiscine.it, Soave VR, rivenditore Piscine
  Solaris). Primo sito vero del Showcase Kit, al posto di Aquazzura. Solo italiano.
- **Kit:** la fase 6 è finita e unita in `main` il 24 ottobre (PR #1). Contiene
  pagine a blocchi, richieste `lead.creato`, redirect 301, SEO, cookie iubenda + GTM,
  blog con editor ricco e ruoli amministratore / redattore / autore.
- **Sito Edilpro:** non ancora iniziato. Aspetta la cartella Solaris e la grafica.

## Dove sono i documenti

| Cosa | File |
|---|---|
| Progetto Edilpro approvato (obiettivi, decisioni, configuratore, dominio) | `docs/superpowers/specs/2026-10-23-edilpro-design.md` |
| Piano della fase 6 del kit (fatto) | `docs/superpowers/plans/2026-10-23-kit-fase-6.md` |
| Scelte prese durante il lavoro e ritocchi rimandati | `docs/superpowers/plans/2026-10-23-kit-fase-6-registro.md` |
| Come usare il kit (richieste, redirect, SEO, ruoli, iubenda) | `README.md` |
| Regole per chi scrive codice nel kit | `CLAUDE.md` |

## Decisioni già prese

- Priorità del cliente: **immagine**, poi **posizionamento su Google** (Verona e
  Vicenza), poi **contatti**.
- Due azioni principali: **prenotazione visita in showroom** (sede unica a Soave,
  lun–ven 9–13 e 15–19, sab 9–15) e **configuratore** per il preventivo.
- **Configuratore nuovo** per Edilpro: quello di RetePiscine
  (retepiscine.kamonweb.it/configura-la-tua-piscina.html) è solo un riferimento.
  Opzioni dall'offerta Edilpro (interrate, naturali, fuori terra), foto dal
  materiale Solaris. Invia all'endpoint `POST /api/richieste` del kit.
- **Contatti in GHL**: Edilpro diventa cliente WeLeads. Il sottoaccount GHL e il
  workflow si creano dalla repo `weleads-crm`, non da qui.
- **Hosting Cloudflare** (Workers + D1 + R2).
- **Dominio** su Aruba (DNS e posta Aruba). Alla messa online si spostano i
  nameserver su Cloudflare **dopo** aver copiato tutti i record, posta compresa.
  `edilprodesign.it` ha la posta su Microsoft 365 e non si tocca.
- **Cookie e privacy** con iubenda.
- **Blog**: gli articoli li scrive Kamon.
- **Indirizzi** uguali a quelli di oggi dove possibile (`/piscine-interrate/`,
  `/chi-siamo/`, ...), il resto con redirect 301.

## Prossimi passi, in ordine

1. **Cartella Solaris** (la prepara Emanuele): foto, schede, modelli da mettere
   online. Le foto non hanno loghi. Serve una cartella locale, non un link
   Dropbox o Gmail (i file binari non passano dai connettori).
2. **Grafica** come artifact Design di claude.ai, fatta da Claude e approvata da
   Emanuele: home, categoria, prodotto, realizzazione, showroom, pagina libera,
   articolo e il configuratore nuovo con passi e opzioni.
3. **Piano del sito Edilpro**: copia del kit con il suo `brand.json`, contenuti,
   grafica, configuratore e redirect dal WordPress.
4. A parte, nella repo `weleads-crm`: sottoaccount GHL e workflow per Edilpro.

## Frase per ripartire

> Leggi `docs/EDILPRO-STATO-E-PROSSIMI-PASSI.md` nella repo kamon-showcase-kit.
> La cartella Solaris è in `<percorso>`. Partiamo dalla grafica.
