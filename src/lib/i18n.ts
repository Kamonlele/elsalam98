import { DEFAULT_LOCALE, LOCALES, type Locale } from './brand';

/** Testo tradotto: una voce per lingua. Le lingue mancanti ricadono sulla lingua principale. */
export type T = Partial<Record<Locale, string>>;

export function t(text: T | string | undefined, locale: Locale): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[locale] ?? text[DEFAULT_LOCALE] ?? Object.values(text)[0] ?? '';
}

/** Nomi dei pezzi di URL in ogni lingua. */
export const SEGMENTS = {
  products: { it: 'prodotti', en: 'products', fr: 'produits', de: 'produkte', es: 'productos', ar: 'products' },
  projects: { it: 'realizzazioni', en: 'projects', fr: 'realisations', de: 'projekte', es: 'proyectos', ar: 'projects' },
} satisfies Record<string, Record<Locale, string>>;

export function url(locale: Locale, ...parts: string[]): string {
  const prefix = locale === DEFAULT_LOCALE ? [] : [locale];
  const path = [...prefix, ...parts].filter(Boolean).join('/');
  return '/' + path + (path ? '/' : '');
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as string[]).includes(value);
}

/** Testi fissi dell'interfaccia. Quelli del cliente stanno nel database. */
const UI = {
  it: {
    book: 'Prenota una visita', specs: 'Scheda tecnica', gallery: 'Realizzazioni', product: 'Prodotto',
    galleryIntro: 'Tocca una foto per vederla a tutto schermo.', prev: 'Precedente', next: 'Successiva', close: 'Chiudi',
    products: 'I prodotti', discover: 'Scopri', notFound: 'Pagina non trovata', home: 'Torna alla home',
    bookTitle: 'Vieni a vederla dal vivo.', bookIntro: "Scegli lo showroom e l'orario. Ti mostriamo il prodotto montato e le finiture da vicino.",
    step1: 'Scegli dove e quando', step2: "Ricevi la conferma con l'invito per il calendario", step3: 'Il giorno prima ti mandiamo un promemoria',
    where: 'Dove', day: 'Giorno', time: 'Orario', full: 'pieno', name: 'Nome e cognome', email: 'Email', phone: 'Telefono',
    consent: 'Accetto che i miei dati vengano usati per organizzare la visita.', send: 'Prenota la visita',
    errName: 'Scrivi nome e cognome.', errEmail: "Controlla l'indirizzo email.", errPhone: 'Serve un numero per eventuali spostamenti.', errConsent: 'Per prenotare serve il consenso.',
    doneTitle: 'Visita prenotata.', doneText: 'Ti aspettiamo.', again: "Prenota un'altra visita",
    at: 'alle', videocall: 'Videochiamata', showroomOf: 'Showroom di', languages: 'Lingua', crumbHome: 'Home',
    city: 'Comune', choose: 'Scegli', loading: 'Carico gli orari…', noSlots: 'Nessun orario libero nei prossimi giorni. Prova un\'altra sede o chiamaci.',
    errFull: 'Quell\'orario è stato appena preso. Scegline un altro.', errGone: 'Quell\'orario non è più disponibile. Scegline un altro.',
    errTooMany: 'Hai già inviato diverse richieste. Riprova fra un\'ora o chiamaci.', errRobot: 'Non siamo riusciti a verificare la richiesta. Riprova.',
    errCity: 'Scrivi il tuo comune.', errQuestion: 'Rispondi a questa domanda.', errGeneric: 'Qualcosa non ha funzionato. Riprova o chiamaci.',
    addCalendar: 'Aggiungi al calendario', doneTitlePending: 'Richiesta inviata.', doneTextPending: 'Ti confermiamo l\'appuntamento appena possibile.',
    mailSent: 'Trovi il riepilogo anche nella tua email.', sending: 'Invio…',
    menu: 'Menu', directions: 'Indicazioni stradali', hours: 'Orari', photos: 'Foto',
    privacy: 'Informativa sulla privacy', cookiePolicy: 'Cookie policy', cookiePrefs: 'Preferenze cookie',
    readMin: 'min di lettura', by: 'di', morePosts: 'Altri articoli', noPosts: 'Ancora nessun articolo. Torna a trovarci presto.', pageOf: 'Pagina', rss: 'Feed RSS',
    alsoIn: 'Anche in', open: 'Apri', skip: 'Vai al contenuto',
  },
  en: {
    book: 'Book a visit', specs: 'Specifications', gallery: 'Projects', product: 'Product',
    galleryIntro: 'Tap a photo to see it full screen.', prev: 'Previous', next: 'Next', close: 'Close',
    products: 'Products', discover: 'Discover', notFound: 'Page not found', home: 'Back to home',
    bookTitle: 'See it in person.', bookIntro: 'Pick a showroom and a time. We will show you the product assembled and the finishes up close.',
    step1: 'Choose where and when', step2: 'Get a confirmation with a calendar invite', step3: 'We send a reminder the day before',
    where: 'Where', day: 'Day', time: 'Time', full: 'full', name: 'Full name', email: 'Email', phone: 'Phone',
    consent: 'I agree that my data is used to arrange the visit.', send: 'Book the visit',
    errName: 'Enter your full name.', errEmail: 'Check the email address.', errPhone: 'We need a number in case of changes.', errConsent: 'Consent is required to book.',
    doneTitle: 'Visit booked.', doneText: 'We look forward to seeing you.', again: 'Book another visit',
    at: 'at', videocall: 'Video call', showroomOf: 'Showroom in', languages: 'Language', crumbHome: 'Home',
    city: 'Town', choose: 'Choose', loading: 'Loading times…', noSlots: 'No free times in the coming days. Try another location or call us.',
    errFull: 'That time was just taken. Please choose another.', errGone: 'That time is no longer available. Please choose another.',
    errTooMany: 'You have already sent several requests. Try again in an hour or call us.', errRobot: 'We could not verify the request. Please try again.',
    errCity: 'Enter your town.', errQuestion: 'Please answer this question.', errGeneric: 'Something went wrong. Try again or call us.',
    addCalendar: 'Add to calendar', doneTitlePending: 'Request sent.', doneTextPending: 'We will confirm the appointment as soon as possible.',
    mailSent: 'You will also find a summary in your inbox.', sending: 'Sending…',
    menu: 'Menu', directions: 'Directions', hours: 'Opening hours', photos: 'Photos',
    privacy: 'Privacy policy', cookiePolicy: 'Cookie policy', cookiePrefs: 'Cookie preferences',
    readMin: 'min read', by: 'by', morePosts: 'More articles', noPosts: 'No articles yet. Check back soon.', pageOf: 'Page', rss: 'RSS feed',
    alsoIn: 'Also in', open: 'Open', skip: 'Skip to content',
  },
  fr: {
    book: 'Réserver une visite', specs: 'Fiche technique', gallery: 'Réalisations', product: 'Produit',
    galleryIntro: 'Touchez une photo pour la voir en plein écran.', prev: 'Précédente', next: 'Suivante', close: 'Fermer',
    products: 'Nos produits', discover: 'Découvrir', notFound: 'Page introuvable', home: "Retour à l'accueil",
    bookTitle: 'Venez la voir en vrai.', bookIntro: "Choisissez le showroom et l'horaire. Nous vous montrons le produit monté et les finitions de près.",
    step1: 'Choisissez où et quand', step2: 'Recevez la confirmation avec une invitation pour votre agenda', step3: 'La veille, nous vous envoyons un rappel',
    where: 'Où', day: 'Jour', time: 'Horaire', full: 'complet', name: 'Nom et prénom', email: 'E-mail', phone: 'Téléphone',
    consent: "J'accepte que mes données soient utilisées pour organiser la visite.", send: 'Réserver la visite',
    errName: 'Indiquez votre nom et prénom.', errEmail: "Vérifiez l'adresse e-mail.", errPhone: 'Un numéro est nécessaire en cas de changement.', errConsent: 'Le consentement est nécessaire pour réserver.',
    doneTitle: 'Visite réservée.', doneText: 'Nous vous attendons.', again: 'Réserver une autre visite',
    at: 'à', videocall: 'Appel vidéo', showroomOf: 'Showroom de', languages: 'Langue', crumbHome: 'Accueil',
    city: 'Commune', choose: 'Choisir', loading: 'Chargement des horaires…', noSlots: 'Aucun horaire libre dans les prochains jours. Essayez un autre showroom ou appelez-nous.',
    errFull: 'Cet horaire vient d\'être réservé. Choisissez-en un autre.', errGone: 'Cet horaire n\'est plus disponible. Choisissez-en un autre.',
    errTooMany: 'Vous avez déjà envoyé plusieurs demandes. Réessayez dans une heure ou appelez-nous.', errRobot: 'Nous n\'avons pas pu vérifier la demande. Réessayez.',
    errCity: 'Indiquez votre commune.', errQuestion: 'Répondez à cette question.', errGeneric: 'Une erreur est survenue. Réessayez ou appelez-nous.',
    addCalendar: 'Ajouter à l\'agenda', doneTitlePending: 'Demande envoyée.', doneTextPending: 'Nous vous confirmons le rendez-vous au plus vite.',
    mailSent: 'Vous trouverez aussi le récapitulatif dans votre boîte mail.', sending: 'Envoi…',
    menu: 'Menu', directions: 'Itinéraire', hours: 'Horaires', photos: 'Photos',
    privacy: 'Politique de confidentialité', cookiePolicy: 'Politique de cookies', cookiePrefs: 'Préférences cookies',
    readMin: 'min de lecture', by: 'par', morePosts: 'Autres articles', noPosts: 'Pas encore d\'articles. Revenez bientôt.', pageOf: 'Page', rss: 'Flux RSS',
    alsoIn: 'Aussi en', open: 'Ouvrir', skip: 'Aller au contenu',
  },
  ar: {
    book: 'احجز زيارة', specs: 'المواصفات الفنية', gallery: 'الأعمال المنجزة', product: 'المنتج',
    galleryIntro: 'المس الصورة لعرضها بملء الشاشة.', prev: 'السابق', next: 'التالي', close: 'إغلاق',
    products: 'المنتجات', discover: 'اكتشف', notFound: 'الصفحة غير موجودة', home: 'العودة إلى الصفحة الرئيسية',
    bookTitle: 'تعال لتراها بنفسك.', bookIntro: 'اختر المعرض والموعد.',
    step1: 'اختر المكان والموعد', step2: 'ستصلك رسالة تأكيد مع دعوة للتقويم', step3: 'نرسل لك تذكيرًا قبل الموعد بيوم',
    where: 'المكان', day: 'اليوم', time: 'الساعة', full: 'محجوز', name: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'الهاتف',
    consent: 'أوافق على استخدام بياناتي لتنظيم الزيارة.', send: 'احجز الزيارة',
    errName: 'اكتب اسمك الكامل.', errEmail: 'تحقق من عنوان البريد الإلكتروني.', errPhone: 'نحتاج إلى رقم هاتف في حال تغيير الموعد.', errConsent: 'الموافقة مطلوبة للحجز.',
    doneTitle: 'تم حجز الزيارة.', doneText: 'بانتظارك.', again: 'احجز زيارة أخرى',
    at: 'في', videocall: 'مكالمة فيديو', showroomOf: 'معرض', languages: 'اللغة', crumbHome: 'الرئيسية',
    city: 'المدينة', choose: 'اختر', loading: 'جارٍ تحميل المواعيد…', noSlots: 'لا توجد مواعيد متاحة في الأيام القادمة.',
    errFull: 'تم حجز هذا الموعد للتو. اختر موعدًا آخر.', errGone: 'هذا الموعد لم يعد متاحًا. اختر موعدًا آخر.',
    errTooMany: 'أرسلت عدة طلبات. حاول مرة أخرى بعد ساعة.', errRobot: 'تعذر التحقق من الطلب. حاول مرة أخرى.',
    errCity: 'اكتب اسم مدينتك.', errQuestion: 'أجب عن هذا السؤال.', errGeneric: 'حدث خطأ ما. حاول مرة أخرى.',
    addCalendar: 'أضف إلى التقويم', doneTitlePending: 'تم إرسال الطلب.', doneTextPending: 'سنؤكد الموعد في أقرب وقت.',
    mailSent: 'ستجد ملخصًا في بريدك الإلكتروني أيضًا.', sending: 'جارٍ الإرسال…',
    menu: 'القائمة', directions: 'الاتجاهات', hours: 'المواعيد', photos: 'الصور',
    privacy: 'سياسة الخصوصية', cookiePolicy: 'سياسة ملفات تعريف الارتباط', cookiePrefs: 'تفضيلات ملفات تعريف الارتباط',
    readMin: 'دقائق للقراءة', by: 'بقلم', morePosts: 'مقالات أخرى', noPosts: 'لا توجد مقالات بعد.', pageOf: 'صفحة', rss: 'خلاصة RSS',
    alsoIn: 'متوفر أيضًا بـ', open: 'افتح', skip: 'انتقل إلى المحتوى',
  },
} as const;

export type UiKey = keyof typeof UI.it;
export function ui(locale: Locale, key: UiKey): string {
  return (UI as Record<string, Record<UiKey, string>>)[locale]?.[key] ?? UI.it[key];
}
