/**
 * Come l'area riservata disegna i moduli di ogni collezione.
 * Sono dati semplici (niente funzioni) perché viaggiano fino al browser.
 * Una collezione nuova = un tipo in content.ts + uno schema qui.
 */
import { features } from './brand';
import { DESCRIPTION_MAX, TITLE_MAX } from './seo';
import type { Name } from './store';

type ShowIf = { path: string; equals: string };
type Base = { key: string; label: string; help?: string; showIf?: ShowIf };

export type Field =
  | (Base & { type: 'text'; localized?: boolean; multiline?: boolean; placeholder?: string; /** Lunghezza consigliata: sotto il campo compare il contatore n/max, che vira all'arancione oltre. */ max?: number;
      /** Testo che decide la struttura (indirizzi, quantità): il redattore non lo cambia. */ structural?: boolean })
  | (Base & { type: 'select'; options: { value: string; label: string }[] })
  | (Base & { type: 'checkbox' })
  | (Base & { type: 'image' })
  | (Base & { type: 'model' })
  | (Base & { type: 'times' })
  | (Base & { type: 'dates' })
  /** Un giorno, salvato come YYYY-MM-DD. */
  | (Base & { type: 'date' })
  /** Testo con titoli, elenchi, link e foto: si salva come documento JSON ripulito dal server. */
  | (Base & { type: 'richtext' })
  | (Base & { type: 'photos' })
  | (Base & { type: 'group'; fields: Field[] })
  | (Base & { type: 'list'; itemLabel: string; addLabel: string; fields: Field[]; titleKey?: string })
  /** Tendina con gli elementi di un'altra collezione; salva l'id. */
  | (Base & { type: 'ref'; collection: Name })
  /** Lista di blocchi di tipi diversi: ogni elemento ha `kind` e i campi del suo tipo. */
  | (Base & { type: 'blocks'; kinds: BlockKind[] })
  | (Base & { type: 'video' })
  /** Punto focale sulla foto del campo `of` (stesso livello), salvato come "x% y%". */
  | (Base & { type: 'focus'; of: string });

export type BlockKind = { kind: string; label: string; fields: Field[]; blank: Record<string, unknown> };

export type Section = { title: string; intro?: string; fields: Field[] };
export type Schema = {
  name: Name;
  section: string;
  singular: string;
  plural: string;
  /** Per scrivere "Nuova pagina" e non "Nuovo pagina". */
  feminine?: boolean;
  /** Campo usato come titolo nell'elenco. */
  titleKey: string;
  sections: Section[];
  /** Si apre un elemento nuovo con questi valori. */
  blank: Record<string, unknown>;
};

const seo = (what: string): Section => ({
  title: 'Motori di ricerca e condivisione',
  intro: `Facoltativo. Se lasci vuoto si usano il titolo e il testo ${what}.`,
  fields: [{
    type: 'group', key: 'seo', label: 'Anteprima',
    fields: [
      { type: 'text', key: 'title', label: 'Titolo per Google', localized: true, help: 'Meglio sotto i 60 caratteri.', max: TITLE_MAX },
      { type: 'text', key: 'description', label: 'Descrizione per Google', localized: true, multiline: true, help: 'Una o due frasi, meglio sotto i 155 caratteri.', max: DESCRIPTION_MAX },
      { type: 'image', key: 'image', label: 'Immagine quando si condivide il link' },
    ],
  }],
});

const ctaFields = (help?: string): Field[] => [
  { type: 'text', key: 'cta.label', label: 'Testo del pulsante', localized: true, help },
  { type: 'text', structural: true, key: 'cta.href', label: 'Indirizzo del pulsante', placeholder: '/prenota/', help: 'Una pagina del sito (/chi-siamo/) o un indirizzo completo (https://...).' },
];
const blockTitle: Field = { type: 'text', key: 'title', label: 'Titolo', localized: true };
const blockText: Field = { type: 'text', key: 'text', label: 'Testo', localized: true, multiline: true, help: 'Una riga vuota separa i paragrafi.' };
const categoryRef = (help: string): Field => ({ type: 'ref', key: 'category', label: 'Categoria', collection: 'categories', help });

const products: Schema = {
  name: 'products',
  section: 'prodotti',
  singular: 'prodotto',
  plural: 'Prodotti',
  titleKey: 'name',
  sections: [
    {
      title: 'Nome e indirizzo',
      fields: [
        { type: 'text', key: 'name', label: 'Nome del prodotto', localized: true },
        { type: 'text', key: 'kicker', label: 'Etichetta sopra il titolo', localized: true, help: 'Una riga corta, per esempio "Piscina fuoriterra in legno".' },
        { type: 'text', key: 'intro', label: 'Frase per l\'elenco prodotti', localized: true, multiline: true },
        { type: 'text', structural: true, key: 'slug', label: 'Indirizzo della pagina', localized: true, help: 'Se lo lasci vuoto si ricava dal nome. Cambiarlo dopo la pubblicazione rompe i link già condivisi.' },
        { type: 'image', key: 'cover', label: 'Foto per l\'elenco prodotti', help: 'Si vede intera, senza ritagli. Meglio orizzontale.' },
        categoryRef('Il prodotto compare nella pagina della sua categoria.'),
      ],
    },
    {
      title: 'Scena prodotto',
      intro: 'La parte alta della pagina: il prodotto e le sue tappe, che avanzano scorrendo.',
      fields: [
        {
          type: 'select', key: 'scene.mode', label: 'Come si mostra il prodotto',
          options: [{ value: '3d', label: 'Modello 3D che gira con lo scroll' }, { value: 'photo', label: 'Una foto per ogni tappa' }],
        },
        { type: 'model', key: 'scene.model', label: 'Modello 3D (.glb)', help: 'Il file lo prepara chi fa il modello. Le inquadrature si calcolano da sole.', showIf: { path: 'scene.mode', equals: '3d' } },
        {
          type: 'list', key: 'stages', label: 'Tappe', itemLabel: 'Tappa', addLabel: 'Aggiungi una tappa', titleKey: 'title',
          help: 'La prima tappa è l\'apertura della pagina: il suo titolo è il titolo principale. L\'ultima porta alla prenotazione.',
          fields: [
            { type: 'text', key: 'label', label: 'Nome breve', localized: true, help: 'Una parola, compare nell\'indicatore in basso. Per esempio "Legno".' },
            { type: 'text', key: 'title', label: 'Titolo', localized: true },
            { type: 'text', key: 'text', label: 'Testo', localized: true, multiline: true },
            { type: 'image', key: 'photo', label: 'Foto della tappa', showIf: { path: 'scene.mode', equals: 'photo' } },
          ],
        },
      ],
    },
    {
      title: 'Realizzazioni',
      intro: 'Le foto sotto la scena. Si vedono sempre intere e si aprono a tutto schermo.',
      fields: [{ type: 'photos', key: 'gallery', label: 'Foto' }],
    },
    {
      title: 'Scheda tecnica',
      fields: [
        { type: 'text', key: 'specs.featured.value', label: 'Misura in evidenza', placeholder: '6,0 × 3,5 m' },
        { type: 'text', key: 'specs.featured.label', label: 'Sotto la misura', localized: true, placeholder: 'misura del modello in esposizione' },
        {
          type: 'list', key: 'specs.groups', label: 'Gruppi', itemLabel: 'Gruppo', addLabel: 'Aggiungi un gruppo', titleKey: 'title',
          fields: [
            { type: 'text', key: 'title', label: 'Nome del gruppo', localized: true, placeholder: 'Struttura' },
            {
              type: 'list', key: 'rows', label: 'Voci', itemLabel: 'Voce', addLabel: 'Aggiungi una voce', titleKey: 'label',
              fields: [
                { type: 'text', key: 'label', label: 'Voce', localized: true, placeholder: 'Altezza' },
                { type: 'text', key: 'value', label: 'Valore', localized: true, placeholder: '1,30 m' },
              ],
            },
          ],
        },
        { type: 'text', key: 'specs.note', label: 'Nota sotto la scheda', localized: true, multiline: true },
      ],
    },
    {
      title: 'Prenotazione',
      fields: [{ type: 'checkbox', key: 'bookable', label: 'Mostra "Prenota una visita" su questo prodotto' }],
    },
    seo('del prodotto'),
  ],
  blank: {
    name: {}, kicker: {}, intro: {}, slug: {},
    scene: { mode: 'photo' },
    stages: [{ label: {}, title: {}, text: {} }],
    gallery: [],
    specs: { featured: { value: '', label: {} }, groups: [], note: {} },
    bookable: true,
  },
};

const DAYS: [string, string][] = [['1', 'Lunedì'], ['2', 'Martedì'], ['3', 'Mercoledì'], ['4', 'Giovedì'], ['5', 'Venerdì'], ['6', 'Sabato'], ['0', 'Domenica']];

const locations: Schema = {
  name: 'locations',
  section: 'sedi',
  singular: 'sede',
  feminine: true,
  plural: 'Sedi',
  titleKey: 'name',
  sections: [
    {
      title: 'La sede',
      fields: [
        { type: 'select', key: 'kind', label: 'Tipo', options: [{ value: 'showroom', label: 'Showroom' }, { value: 'video', label: 'Videochiamata' }] },
        { type: 'text', key: 'name', label: 'Nome', localized: true },
        { type: 'text', key: 'city', label: 'Città', help: 'Nella prenotazione la sede si sceglie per città.', showIf: { path: 'kind', equals: 'showroom' } },
        { type: 'text', key: 'address', label: 'Indirizzo', showIf: { path: 'kind', equals: 'showroom' } },
        { type: 'text', key: 'capacity', label: 'Visite nello stesso orario', placeholder: '1', help: 'Quante prenotazioni si possono accettare per lo stesso orario. Di solito 1.' },
      ],
    },
    {
      title: 'Orari di visita',
      intro: 'Gli orari in cui si può prenotare, separati da virgola. Per esempio: 10:00, 11:30, 15:00. Lascia vuoto il giorno di chiusura.',
      fields: DAYS.map(([k, label]) => ({ type: 'times' as const, key: `slots.${k}`, label })),
    },
    {
      title: 'Chiusure',
      fields: [{ type: 'dates', key: 'closed', label: 'Giorni di chiusura', help: 'Ferie e festivi: non si potrà prenotare in questi giorni.' }],
    },
  ],
  blank: { kind: 'showroom', name: {}, slots: {}, closed: [] },
};

/** I blocchi che il cliente può mettere nelle pagine e nelle categorie. */
export const BLOCK_KINDS: BlockKind[] = [
  {
    kind: 'hero', label: 'Apertura con foto o video',
    fields: [
      blockTitle, blockText,
      { type: 'image', key: 'photo', label: 'Foto di sfondo' },
      { type: 'focus', key: 'focus', of: 'photo', label: 'Punto da tenere sempre in vista', help: 'Tocca la foto sul soggetto: quando lo schermo taglia la foto, quel punto resta visibile.' },
      { type: 'video', key: 'video', label: 'Video di sfondo', help: 'Facoltativo: parte senza audio. La foto resta come anteprima.' },
      ...ctaFields('Facoltativo.'),
    ],
    blank: { title: {}, text: {}, cta: { label: {}, href: '' } },
  },
  { kind: 'text', label: 'Testo', fields: [blockTitle, blockText], blank: { title: {}, text: {} } },
  {
    kind: 'textPhoto', label: 'Testo e foto',
    fields: [
      blockTitle, blockText,
      { type: 'image', key: 'photo', label: 'Foto', help: 'Si vede sempre intera, nelle sue proporzioni.' },
      { type: 'select', key: 'side', label: 'Foto', options: [{ value: 'left', label: 'A sinistra' }, { value: 'right', label: 'A destra' }] },
      ...ctaFields('Facoltativo.'),
    ],
    blank: { title: {}, text: {}, side: 'left', cta: { label: {}, href: '' } },
  },
  { kind: 'gallery', label: 'Galleria di foto', fields: [blockTitle, { type: 'photos', key: 'photos', label: 'Foto' }], blank: { title: {}, photos: [] } },
  { kind: 'slider', label: 'Foto a scorrimento', fields: [blockTitle, { type: 'photos', key: 'photos', label: 'Foto' }], blank: { title: {}, photos: [] } },
  {
    kind: 'values', label: 'Punti di forza',
    fields: [
      blockTitle,
      {
        type: 'list', key: 'items', label: 'Punti', itemLabel: 'Punto', addLabel: 'Aggiungi un punto', titleKey: 'title',
        fields: [{ type: 'text', key: 'title', label: 'Titolo', localized: true }, { type: 'text', key: 'text', label: 'Testo', localized: true, multiline: true }],
      },
    ],
    blank: { title: {}, items: [{ title: {}, text: {} }] },
  },
  { kind: 'products', label: 'Elenco prodotti', fields: [blockTitle, categoryRef('Lascia "Nessuna" per mostrare tutti i prodotti.')], blank: { title: {} } },
  { kind: 'categories', label: 'Elenco categorie', fields: [blockTitle], blank: { title: {} } },
  {
    kind: 'projects', label: 'Realizzazioni',
    fields: [
      blockTitle,
      categoryRef('Lascia "Nessuna" per mostrare le realizzazioni di tutte le categorie.'),
      { type: 'text', structural: true, key: 'limit', label: 'Quante mostrarne', placeholder: '6' },
    ],
    blank: { title: {} },
  },
  ...(features.blog ? [{
    kind: 'posts', label: 'Ultimi articoli',
    fields: [blockTitle, { type: 'text', structural: true, key: 'limit', label: 'Quanti mostrarne', placeholder: '3' } as Field],
    blank: { title: {} },
  }] : []),
  { kind: 'locations', label: 'Sedi e orari', fields: [blockTitle], blank: { title: {} } },
  { kind: 'booking', label: 'Prenotazione visita', fields: [blockTitle], blank: { title: {} } },
  {
    kind: 'cta', label: 'Invito con pulsante',
    fields: [blockTitle, { type: 'text', key: 'text', label: 'Testo', localized: true, multiline: true }, ...ctaFields()],
    blank: { title: {}, text: {}, cta: { label: {}, href: '' } },
  },
  {
    kind: 'policy', label: 'Privacy o cookie',
    fields: [{ type: 'select', key: 'policy', label: 'Quale testo', options: [{ value: 'privacy', label: 'Informativa privacy' }, { value: 'cookie', label: 'Cookie policy' }] }],
    blank: { policy: 'privacy' },
  },
  {
    kind: 'stats', label: 'Numeri',
    fields: [
      blockTitle,
      {
        type: 'list', key: 'items', label: 'Numeri', itemLabel: 'Numero', addLabel: 'Aggiungi un numero', titleKey: 'value',
        fields: [
          { type: 'text', key: 'value', label: 'Numero', localized: true, placeholder: '1.000+', help: 'Scritto come deve apparire: cifre, + o simboli.' },
          { type: 'text', key: 'label', label: 'Cosa conta', localized: true },
        ],
      },
      { type: 'text', key: 'note', label: 'Nota sotto i numeri', localized: true, help: 'Facoltativa: la fonte dei numeri.' },
    ],
    blank: { title: {}, items: [{ value: {}, label: {} }], note: {} },
  },
  {
    kind: 'timeline', label: 'Cronologia',
    fields: [
      blockTitle,
      {
        type: 'list', key: 'items', label: 'Tappe', itemLabel: 'Tappa', addLabel: 'Aggiungi una tappa', titleKey: 'title',
        fields: [
          { type: 'text', key: 'date', label: 'Data', localized: true, placeholder: '3 febbraio 2006' },
          { type: 'text', key: 'title', label: 'Titolo', localized: true },
          { type: 'text', key: 'text', label: 'Testo', localized: true, multiline: true },
          { type: 'image', key: 'photo', label: 'Foto', help: 'Facoltativa. Si vede intera.' },
          { type: 'group', key: 'link', label: 'Collegamento', fields: [
            { type: 'text', key: 'label', label: 'Testo del collegamento', localized: true },
            { type: 'text', key: 'href', label: 'Indirizzo', structural: true, placeholder: '/documenti/ oppure https://...' },
          ] },
        ],
      },
    ],
    blank: { title: {}, items: [{ date: {}, title: {}, text: {}, link: { label: {}, href: '' } }] },
  },
  {
    kind: 'documents', label: 'Documenti da scaricare',
    fields: [
      blockTitle, { type: 'text', key: 'text', label: 'Testo', localized: true, multiline: true },
      {
        type: 'list', key: 'items', label: 'Documenti', itemLabel: 'Documento', addLabel: 'Aggiungi un documento', titleKey: 'title',
        fields: [
          { type: 'text', key: 'title', label: 'Titolo', localized: true },
          { type: 'text', key: 'meta', label: 'Fonte e data', localized: true, placeholder: 'Corte di Cassazione, 2020' },
          { type: 'text', key: 'href', label: 'Indirizzo del file', structural: true },
          {
            type: 'list', key: 'versions', label: 'Altre lingue', itemLabel: 'Versione', addLabel: 'Aggiungi una versione', titleKey: 'label',
            fields: [
              { type: 'text', key: 'label', label: 'Lingua', placeholder: 'EN' },
              { type: 'text', key: 'href', label: 'Indirizzo del file', structural: true },
            ],
          },
        ],
      },
    ],
    blank: { title: {}, text: {}, items: [{ title: {}, meta: {}, href: '', versions: [] }] },
  },
];
export const blockLabel = (kind: string) => BLOCK_KINDS.find((k) => k.kind === kind)?.label ?? kind;

const blocks = (help: string): Field => ({ type: 'blocks', key: 'blocks', label: 'Blocchi', help, kinds: BLOCK_KINDS });

const categories: Schema = {
  name: 'categories',
  section: 'categorie',
  singular: 'categoria',
  feminine: true,
  plural: 'Categorie',
  titleKey: 'name',
  sections: [
    {
      title: 'Nome e indirizzo',
      fields: [
        { type: 'text', key: 'name', label: 'Nome della categoria', localized: true },
        { type: 'text', key: 'intro', label: 'Testo introduttivo', localized: true, multiline: true, help: 'In cima alla pagina della categoria e nei suoi riquadri.' },
        { type: 'text', structural: true, key: 'slug', label: 'Indirizzo della pagina', localized: true, help: 'Se lo lasci vuoto si ricava dal nome. Cambiarlo dopo la pubblicazione rompe i link già condivisi.' },
        { type: 'image', key: 'cover', label: 'Foto della categoria' },
      ],
    },
    {
      title: 'Contenuto della pagina',
      intro: 'Sotto l\'introduzione si vedono i prodotti della categoria, poi questi blocchi.',
      fields: [blocks('Aggiungi, togli e sposta i blocchi: l\'ordine qui è l\'ordine sul sito.')],
    },
    seo('della categoria'),
  ],
  blank: { name: {}, intro: {}, slug: {}, blocks: [] },
};

const projects: Schema = {
  name: 'projects',
  section: 'realizzazioni',
  singular: 'realizzazione',
  feminine: true,
  plural: 'Realizzazioni',
  titleKey: 'title',
  sections: [
    {
      title: 'Il lavoro',
      fields: [
        { type: 'text', key: 'title', label: 'Titolo', localized: true },
        { type: 'text', key: 'place', label: 'Luogo', placeholder: 'Torino' },
        { type: 'text', key: 'year', label: 'Anno', placeholder: '2026' },
        categoryRef('Le realizzazioni si vedono anche nella pagina della loro categoria.'),
        { type: 'text', key: 'intro', label: 'Racconto', localized: true, multiline: true },
        { type: 'text', structural: true, key: 'slug', label: 'Indirizzo della pagina', localized: true, help: 'Se lo lasci vuoto si ricava dal titolo.' },
        { type: 'image', key: 'cover', label: 'Foto per l\'elenco' },
      ],
    },
    {
      title: 'Foto',
      intro: 'Si vedono sempre intere e si aprono a tutto schermo.',
      fields: [{ type: 'photos', key: 'photos', label: 'Foto' }],
    },
    seo('della realizzazione'),
  ],
  blank: { title: {}, intro: {}, slug: {}, photos: [] },
};

const pages: Schema = {
  name: 'pages',
  section: 'pagine',
  singular: 'pagina',
  feminine: true,
  plural: 'Pagine',
  titleKey: 'title',
  sections: [
    {
      title: 'Titolo e indirizzo',
      fields: [
        { type: 'text', key: 'title', label: 'Titolo della pagina', localized: true, help: 'Si vede nel menu e nella scheda del browser.' },
        { type: 'checkbox', key: 'home', label: 'Questa è la home del sito', help: 'Si apre all\'indirizzo principale. Può esserci una sola home.' },
        { type: 'text', structural: true, key: 'slug', label: 'Indirizzo della pagina', localized: true, help: 'Se lo lasci vuoto si ricava dal titolo. Alla home non serve.' },
        { type: 'checkbox', key: 'inMenu', label: 'Mostra nel menu del sito' },
      ],
    },
    {
      title: 'Contenuto',
      fields: [blocks('Aggiungi, togli e sposta i blocchi: l\'ordine qui è l\'ordine sul sito.')],
    },
    seo('della pagina'),
  ],
  blank: { title: {}, slug: {}, home: false, inMenu: true, blocks: [] },
};

const posts: Schema = {
  name: 'posts',
  section: 'articoli',
  singular: 'articolo',
  plural: 'Articoli',
  titleKey: 'title',
  sections: [
    {
      title: "L'articolo",
      fields: [
        { type: 'text', key: 'title', label: 'Titolo', localized: true, help: 'Il titolo della pagina e del link su Google.' },
        { type: 'date', key: 'date', label: 'Data di pubblicazione', help: "Con una data futura l'articolo resta nascosto e compare da solo quel giorno." },
        { type: 'text', key: 'author', label: 'Autore' },
        { type: 'text', key: 'excerpt', label: "Riassunto per l'elenco", localized: true, multiline: true, help: "Una o due frasi. Se lo lasci vuoto si usa l'inizio del testo." },
        { type: 'text', structural: true, key: 'slug', label: 'Indirizzo della pagina', localized: true, help: 'Se lo lasci vuoto si ricava dal titolo. Cambiarlo dopo la pubblicazione rompe i link già condivisi.' },
        { type: 'image', key: 'cover', label: 'Foto di copertina', help: "In cima all'articolo e nell'elenco. Meglio orizzontale." },
      ],
    },
    {
      title: 'Testo',
      intro: 'Il testo è uno solo per tutte le lingue. Usa i titoli per dividerlo in parti: aiutano chi legge e Google.',
      fields: [{ type: 'richtext', key: 'body', label: 'Testo' }],
    },
    seo("dell'articolo"),
  ],
  blank: { title: {}, slug: {}, excerpt: {}, author: '', date: '', body: { type: 'doc', content: [{ type: 'paragraph' }] } },
};

// L'ordine qui è l'ordine del menu dell'area riservata.
export const SCHEMAS: Record<Name, Schema> = { pages, posts, categories, products, projects, locations };
export const newLabel = (s: Schema) => `${s.feminine ? 'Nuova' : 'Nuovo'} ${s.singular}`;
/** Le collezioni spente in brand.json (per ora solo gli articoli) spariscono anche dall'area riservata. */
export const schemaOn = (s: Schema) => s.name !== 'posts' || !!features.blog;
export const bySection = (section: string) => Object.values(SCHEMAS).filter(schemaOn).find((s) => s.section === section);
