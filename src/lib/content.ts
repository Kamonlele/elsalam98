import type { T } from './i18n';
import type { RichDoc } from './richtext';

/** Una tappa della scena prodotto: testo e, in modalità foto, la sua foto. */
export type Stage = { label?: T; title: T; text: T; photo?: string };

export type Photo = { src: string; caption: T; width: number; height: number };

/** Come la pagina si presenta ai motori di ricerca e quando si condivide. */
export type Seo = { title?: T; description?: T; image?: string };

export type Cta = { label: T; href: string };

/** Un pezzo di pagina scelto dal cliente. `focus` è il punto focale della foto di sfondo dell'apertura, "x% y%". */
export type Block =
  | { kind: 'hero'; title: T; text?: T; photo?: string; focus?: string; video?: string; cta?: Cta }
  | { kind: 'text'; title?: T; text: T }
  | { kind: 'textPhoto'; title?: T; text: T; photo: string; side: 'left' | 'right'; cta?: Cta }
  | { kind: 'gallery'; title?: T; photos: Photo[] }
  | { kind: 'slider'; title?: T; photos: Photo[] }
  | { kind: 'values'; title?: T; items: { title: T; text: T }[] }
  | { kind: 'products'; title?: T; category?: string }
  | { kind: 'categories'; title?: T }
  | { kind: 'projects'; title?: T; category?: string; limit?: number }
  | { kind: 'posts'; title?: T; limit?: number }
  | { kind: 'locations'; title?: T }
  | { kind: 'booking'; title?: T }
  | { kind: 'cta'; title: T; text?: T; cta: Cta }
  | { kind: 'policy'; policy: 'privacy' | 'cookie' }
  /** Numeri grandi con la loro spiegazione. */
  | { kind: 'stats'; title?: T; items: { value: T; label: T }[]; note?: T }
  /** Cronologia: date in ordine, ognuna con titolo, testo e un documento facoltativo. */
  | { kind: 'timeline'; title?: T; items: TimelineItem[] }
  /** Elenco di documenti da scaricare (PDF), con le versioni in altre lingue. */
  | { kind: 'documents'; title?: T; text?: T; items: DocItem[] };

export type TimelineItem = { date: T; title: T; text?: T; photo?: string; link?: Cta };
export type DocItem = { title: T; meta?: T; href: string; versions?: { label: string; href: string }[] };

export type Product = {
  id: string;
  status: 'published' | 'draft';
  sort: number;
  slug: T;
  name: T;
  kicker?: T;
  intro: T;
  /** '3d' usa un modello (file .glb oppure un modello dimostrativo del kit), 'photo' le foto delle tappe. */
  scene: { mode: '3d' | 'photo'; model?: string };
  stages: Stage[];
  cover?: string;
  specs?: {
    featured?: { value: string; label: T };
    groups: { title: T; rows: { label: T; value: T }[] }[];
    note?: T;
  };
  gallery: Photo[];
  bookable: boolean;
  /** Id della categoria. */
  category?: string;
  seo?: Seo;
};

export type Category = {
  id: string;
  status: 'published' | 'draft';
  sort: number;
  slug: T;
  name: T;
  intro: T;
  cover?: string;
  blocks: Block[];
  seo?: Seo;
};

/** Una realizzazione: un lavoro fatto, con le sue foto. */
export type Project = {
  id: string;
  status: 'published' | 'draft';
  sort: number;
  slug: T;
  title: T;
  place?: string;
  year?: string;
  category?: string;
  intro: T;
  cover?: string;
  photos: Photo[];
  seo?: Seo;
};

export type Page = {
  id: string;
  status: 'published' | 'draft';
  sort: number;
  slug: T;
  title: T;
  /** La pagina che si vede su "/". Ce n'è al massimo una. */
  home: boolean;
  inMenu: boolean;
  blocks: Block[];
  seo?: Seo;
};

/** Un articolo. Con una data futura resta nascosto fino a quel giorno (data locale del sito). */
export type Post = {
  id: string;
  status: 'published' | 'draft';
  sort: number;
  slug: T;
  title: T;
  /** YYYY-MM-DD */
  date: string;
  author: string;
  cover?: string;
  excerpt: T;
  body: RichDoc;
  seo?: Seo;
  /** Ultimo salvataggio, per il lastmod della sitemap. */
  updatedAt?: number;
};

export type Location = {
  id: string;
  kind: 'showroom' | 'video';
  name: T;
  city?: string;
  address?: string;
  /** Orari di visita per giorno della settimana (0 domenica ... 6 sabato). */
  slots: Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, string[]>>;
  closed?: string[];
  /** Persone (o gruppi) che si possono ricevere nello stesso orario. */
  capacity?: number;
};

export type Collections = { products: Product; locations: Location; categories: Category; projects: Project; pages: Page; posts: Post };
