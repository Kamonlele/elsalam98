import type { Collections, DocItem, Page, Photo, TimelineItem } from './content';
import type { T } from './i18n';

/**
 * Contenuti di partenza del sito Al Salam Boccaccio 98, ripresi da elsalam98.net.
 * Si vedono finché il database è vuoto; dall'area riservata si copiano nel database
 * e da lì in poi si modificano dal pannello.
 */

const L = (en: string, it: string, fr: string, ar: string): T => ({ en, it, fr, ar });
const same = (s: string): T => ({ en: s });

// I PDF stanno ancora sul vecchio sito. Quando passano su R2 basta cambiare questa riga.
const DOCS = 'https://www.elsalam98.net/wp-content/uploads';
const pdf = (path: string) => `${DOCS}/${path}`;
const img = (name: string) => `/archive/${name}.webp`;
const photo = (name: string, w: number, h: number, caption: T): Photo => ({ src: img(name), width: w, height: h, caption });

/* ---------------- documenti ---------------- */

const blackBox: DocItem = {
  title: L('Black box transcript', 'Trascrizione della scatola nera', 'Transcription de la boîte noire', 'تفريغ تسجيلات الصندوق الأسود'),
  meta: L('Bridge recordings, night of 2 to 3 February 2006', 'Registrazioni del ponte di comando, notte tra il 2 e il 3 febbraio 2006', 'Enregistrements de la passerelle, nuit du 2 au 3 février 2006', 'تسجيلات غرفة القيادة، ليلة 2 إلى 3 فبراير 2006'),
  href: pdf('2022/09/blackbox-Elsalam_98.pdf'),
};

const investigations: DocItem[] = [
  blackBox,
  {
    title: L('Panama investigation: preliminary report', 'Inchiesta di Panama: rapporto preliminare', 'Enquête du Panama : rapport préliminaire', 'تحقيق بنما: التقرير الأولي'),
    meta: L('Panama Maritime Authority, document 1', 'Autorità Marittima di Panama, documento 1', 'Autorité maritime du Panama, document 1', 'هيئة بنما البحرية، الوثيقة 1'),
    href: pdf('2022/06/1-AMP-preliminary.pdf'),
  },
  {
    title: L('Panama investigation: final report', 'Inchiesta di Panama: rapporto finale', 'Enquête du Panama : rapport final', 'تحقيق بنما: التقرير النهائي'),
    meta: L('Panama Maritime Authority, document 2', 'Autorità Marittima di Panama, documento 2', 'Autorité maritime du Panama, document 2', 'هيئة بنما البحرية، الوثيقة 2'),
    href: pdf('2022/06/2-AMP-final.pdf'),
  },
  {
    title: L('Panama: casualty investigation analysis form', 'Panama: scheda di analisi del sinistro', 'Panama : fiche d’analyse de l’accident', 'بنما: استمارة تحليل تقرير التحقيق في الحادث'),
    meta: L('Document 3', 'Documento 3', 'Document 3', 'الوثيقة 3'),
    href: pdf('2022/06/3-FORM-FOR-ANALYSIS-OF-CASUALTY-INVESTIGATION-REPORTS.pdf'),
  },
  {
    title: L('Egypt investigation: final technical report', 'Inchiesta egiziana: rapporto tecnico finale', 'Enquête égyptienne : rapport technique final', 'التحقيق المصري: التقرير الفني النهائي'),
    meta: L('Pages 36 and 37 describe the role of RINA. Document 4', 'Alle pagine 36 e 37 il ruolo del RINA. Documento 4', 'Le rôle du RINA aux pages 36 et 37. Document 4', 'دور RINA في الصفحتين 36 و37. الوثيقة 4'),
    href: pdf('2022/06/4-Egypt-final.pdf'),
  },
  {
    title: L('Egypt: casualty investigation analysis form', 'Egitto: scheda di analisi del sinistro', 'Égypte : fiche d’analyse de l’accident', 'مصر: استمارة تحليل تقرير التحقيق في الحادث'),
    meta: L('Document 5', 'Documento 5', 'Document 5', 'الوثيقة 5'),
    href: pdf('2022/06/5-FORM-FOR-ANALYSIS-OF-CASUALTY-INVESTIGATION-REPORTS.pdf'),
  },
];

const rulings: DocItem[] = [
  {
    title: L('Italian Supreme Court of Cassation, United Sections', 'Corte Suprema di Cassazione, Sezioni Unite', 'Cour de cassation italienne, chambres réunies', 'محكمة النقض الإيطالية العليا، الدوائر المجتمعة'),
    meta: L('December 2020. Document 6', 'Dicembre 2020. Documento 6', 'Décembre 2020. Document 6', 'ديسمبر 2020. الوثيقة 6'),
    href: pdf('2022/06/6-Cassation-2020.pdf'),
  },
  {
    title: L('Court of Justice of the European Union, case C-641/18', 'Corte di Giustizia dell’Unione Europea, causa C-641/18', 'Cour de justice de l’Union européenne, affaire C-641/18', 'محكمة العدل التابعة للاتحاد الأوروبي، القضية C-641/18'),
    meta: L('May 2020. Document 7', 'Maggio 2020. Documento 7', 'Mai 2020. Document 7', 'مايو 2020. الوثيقة 7'),
    href: pdf('2022/06/7-CJEU-case-C-641-18.pdf'),
  },
  {
    title: L('Regional Administrative Court of Liguria (TAR), ruling 1569/2007', 'TAR Liguria, sentenza 1569/2007', 'Tribunal administratif de Ligurie (TAR), jugement 1569/2007', 'المحكمة الإدارية الإقليمية في ليغوريا، الحكم 1569/2007'),
    meta: L('RINA ordered to hand over part of the documents. Document 8', 'Il RINA deve consegnare parte dei documenti. Documento 8', 'Le RINA doit remettre une partie des documents. Document 8', 'إلزام RINA بتسليم جزء من الوثائق. الوثيقة 8'),
    href: pdf('2022/06/8-TAR-Liguria-1569-2007.pdf'),
  },
];

const citedRulings: DocItem[] = [
  {
    title: L('CJEU Annual Report 2020', 'Relazione annuale 2020 della Corte di Giustizia UE', 'Rapport annuel 2020 de la CJUE', 'التقرير السنوي 2020 لمحكمة العدل الأوروبية'),
    meta: L('The ruling is included among the year’s key decisions', 'La sentenza è tra le decisioni più importanti dell’anno', 'L’arrêt figure parmi les décisions clés de l’année', 'الحكم مدرج ضمن أهم قرارات العام'),
    href: pdf('2022/10/ra_jud_2020_en.pdf'),
  },
  {
    title: L('Superior School of the Judiciary, newsletter 1/2021', 'Notiziario della Scuola superiore della Magistratura n. 1/2021', 'École supérieure de la magistrature, bulletin 1/2021', 'نشرة المدرسة العليا للقضاء، العدد 1/2021'),
    href: pdf('2022/10/SSM_Notiziario-della-Scuola-superiore-della-magistratura_n.-1_2021.pdf'),
  },
  {
    title: L('Supreme Court of Cassation, First President’s report 2021', 'Corte Suprema di Cassazione, Relazione 2021 del Primo Presidente', 'Cour de cassation, rapport 2021 du Premier président', 'محكمة النقض العليا، تقرير الرئيس الأول لعام 2021'),
    href: pdf('2022/10/Corte_Suprema_Cassazione-Relazione_2021_Primo_Presidente1.pdf'),
  },
];

const erika: DocItem[] = [
  {
    title: L('Erika: judgment of the Paris Criminal Court', 'Erika: sentenza del Tribunale di Parigi', 'Erika : jugement du tribunal correctionnel de Paris', 'إريكا: حكم المحكمة الجنائية في باريس'),
    meta: L('2008. Document 9', '2008. Documento 9', '2008. Document 9', '2008. الوثيقة 9'),
    href: pdf('2022/06/9-Jugement-Erika-2008.pdf'),
  },
  {
    title: L('Erika: judgment of the Court of Appeal', 'Erika: sentenza della Corte d’Appello', 'Erika : arrêt de la cour d’appel', 'إريكا: حكم محكمة الاستئناف'),
    meta: L('2010. Document 10', '2010. Documento 10', '2010. Document 10', '2010. الوثيقة 10'),
    href: pdf('2022/06/10-appel_erika-2010.pdf'),
  },
  {
    title: L('Erika: judgment of the French Court of Cassation', 'Erika: sentenza della Corte di Cassazione francese', 'Erika : arrêt de la Cour de cassation', 'إريكا: حكم محكمة النقض الفرنسية'),
    meta: L('25 September 2012. Document 11', '25 settembre 2012. Documento 11', '25 septembre 2012. Document 11', '25 سبتمبر 2012. الوثيقة 11'),
    href: pdf('2022/06/11-cassation-2013.pdf'),
  },
];

const pressReleases: DocItem[] = [
  {
    title: L('Court-appointed experts find contributory negligence by RINA', 'I periti del tribunale trovano una corresponsabilità del RINA', 'Les experts du tribunal relèvent une négligence du RINA', 'خبراء المحكمة يثبتون إهمالًا ساهم فيه RINA'),
    meta: L('Families’ press release, 15 May 2024', 'Comunicato stampa delle famiglie, 15 maggio 2024', 'Communiqué des familles, 15 mai 2024', 'بيان صحفي للعائلات، 15 مايو 2024'),
    href: pdf('2024/05/Al-SALAM-BOCCACIO-98-PRESS-RELEASE.pdf'),
    versions: [{ label: 'IT', href: pdf('2024/05/COMUNICATO-STAMPA-Al-SALAM-BOCCACCIO-98-italiano.pdf') }],
  },
  {
    title: L('Press release on the Al Salam Boccaccio 98 ruling', 'Comunicato stampa: sentenza sul naufragio della nave Al Salam Boccaccio 98', 'Communiqué : arrêt sur le naufrage de l’Al Salam Boccaccio 98', 'بيان صحفي حول الحكم في غرق العبّارة السلام بوكاتشو 98'),
    meta: same('IT'),
    href: pdf('2022/06/15-Comunicato_stampa-Sentenza_naufragio_nave_Al_Salam_Boccaccio_98.pdf'),
  },
];

const italianPress: DocItem[] = [
  {
    title: L('Negligence by RINA: the expert report implicates the certification company', 'Negligenze del Rina: la perizia inguaia la multinazionale delle certificazioni', 'Négligences du RINA : l’expertise met en cause la multinationale de la certification', 'إهمال RINA: تقرير الخبراء يورّط شركة الإشهاد متعددة الجنسيات'),
    meta: same('IT'),
    href: pdf('2026/02/Negligenze-del-Rina.-La-perizia-inguaia-la-multinazionale.pdf'),
    versions: [
      { label: 'EN', href: pdf('2026/02/Negligenze-del-Rina.-La-perizia-inguaia-la-multinazionale-en-GB.pdf') },
      { label: 'AR', href: pdf('2026/02/Negligenze-del-Rina.-La-perizia-inguaia-la-multinazionale-ar.pdf') },
    ],
  },
  {
    title: L('La Repubblica: the case against RINA, Italy asks Egypt for the black box tapes', 'La Repubblica: causa al Rina, la svolta. «Dateci i nastri della scatola nera»', 'La Repubblica : procès contre le RINA, l’Italie demande à l’Égypte les bandes de la boîte noire', 'لا ريبوبليكا: منعطف في القضية ضد RINA، إيطاليا تطلب من مصر أشرطة الصندوق الأسود'),
    meta: L('Genoa edition, 2 November 2022. IT', 'Edizione di Genova, 2 novembre 2022. IT', 'Édition de Gênes, 2 novembre 2022. IT', 'طبعة جنوة، 2 نوفمبر 2022. IT'),
    href: pdf('2026/02/LA_REPUBBLICA_ED_GENOVA_02112022.pdf'),
    versions: [
      { label: 'EN', href: pdf('2026/02/LA_REPUBBLICA_ED_GENOVA_02112022-en-GB.pdf') },
      { label: 'AR', href: pdf('2026/02/LA_REPUBBLICA_ED_GENOVA_02112022-ar.pdf') },
    ],
  },
  {
    title: L('Il Fatto Quotidiano: the Court of Cassation stops the certifier’s “escape” to Panama', 'Il Fatto Quotidiano: la Cassazione ferma la “fuga” a Panama dell’ente certificatore', 'Il Fatto Quotidiano : la Cassation stoppe la « fuite » du certificateur au Panama', 'إيل فاتو كوتيديانو: محكمة النقض توقف «هروب» جهة الإشهاد إلى بنما'),
    meta: same('IT'),
    href: pdf('2022/06/13-Il-Fatto-Quotidiano-Cassazione-ferma-la-fuga-a-Panama-dellente-certificatore.pdf'),
  },
  {
    title: L('Informare: the families’ committee starts a civil case against RINA', 'Informare: il Comitato dei familiari avvia una causa civile contro il RINA', 'Informare : le comité des familles engage une action civile contre le RINA', 'إنفورماري: لجنة العائلات ترفع دعوى مدنية ضد RINA'),
    meta: same('IT'),
    href: pdf('2022/06/14-Il-Comitato-dei-familiari-avvia-una-causa-civile-contro-il-RINA-informare.pdf'),
  },
];

const egyptianPress: DocItem[] = [
  { title: same('Egypt Today'), meta: same('EN'), href: pdf('2022/06/16-EgyptToday.pdf') },
  {
    title: L('Al Jazeera: Egypt ferry’s black box recovered', 'Al Jazeera: recuperata la scatola nera del traghetto egiziano', 'Al Jazeera : la boîte noire du ferry égyptien récupérée', 'الجزيرة: انتشال الصندوق الأسود للعبّارة المصرية'),
    meta: same('EN'), href: pdf('2022/06/17-Egypt-ferrys-black-box-recovered-News-Al-Jazeera.pdf'),
  },
  {
    title: L('Al Jazeera: Egypt ferry victims seek justice', 'Al Jazeera: le vittime del traghetto egiziano chiedono giustizia', 'Al Jazeera : les victimes du ferry égyptien demandent justice', 'الجزيرة: ضحايا العبّارة المصرية يطالبون بالعدالة'),
    meta: same('EN'), href: pdf('2022/06/18-Egypt-ferry-victims-seek-justice-Humanitarian-Crises-News-Al-Jazeera.pdf'),
  },
];

const foreignPress: DocItem[] = [
  {
    title: L('The New York Times: “Wicked collusion” is found in thousand deaths on ferry', 'The New York Times: “collusione malvagia” dietro i mille morti del traghetto', 'The New York Times : une « collusion perverse » derrière les mille morts du ferry', 'نيويورك تايمز: «تواطؤ شرير» وراء ألف ضحية على متن العبّارة'),
    meta: same('EN'), href: pdf('2022/06/19-Wicked-Collusion-Is-Found-in-Thousand-Deaths-on-Ferry-The-New-York-Times.pdf'),
  },
  {
    title: L('The New York Times: Egyptian ferry sinks in Red Sea, 1,000 may be lost', 'The New York Times: traghetto egiziano affonda nel Mar Rosso, forse 1.000 vittime', 'The New York Times : un ferry égyptien coule en mer Rouge, 1 000 disparus possibles', 'نيويورك تايمز: غرق عبّارة مصرية في البحر الأحمر واحتمال فقدان ألف شخص'),
    meta: same('EN'), href: pdf('2022/06/20-Egyptian-Ferry-Sinks-in-Red-Sea-1000-May-Be-Lost-The-New-York-Times.pdf'),
  },
  {
    title: L('The Guardian: sunk ferry “may have been short of lifeboats”', 'The Guardian: il traghetto affondato “forse non aveva abbastanza scialuppe”', 'The Guardian : le ferry « manquait peut-être de canots de sauvetage »', 'الغارديان: العبّارة الغارقة «ربما كانت تفتقر إلى قوارب نجاة كافية»'),
    meta: same('EN'), href: pdf('2022/06/21-Sunk-ferry-may-have-been-short-of-lifeboats-Travel-The-Guardian.pdf'),
  },
  {
    title: L('Sinking of an Egyptian ferry: a 100 million trial', 'Naufragio di un traghetto egiziano: un processo da 100 milioni', 'Naufrage d’un ferry égyptien : un procès à 100 millions', 'غرق عبّارة مصرية: محاكمة بقيمة 100 مليون'),
    meta: same('FR'), href: pdf('2022/06/22-Naufrage-dun-ferry-egyptien-Un-proces-a-100-millions.pdf'),
  },
];

/* ---------------- cronologia ---------------- */

const timeline: TimelineItem[] = [
  {
    date: L('1969 to 1970', '1969-1970', '1969-1970', '1969 إلى 1970'),
    title: L('The Boccaccio is built in Italy', 'In Italia nasce il Boccaccio', 'Le Boccaccio est construit en Italie', 'بناء العبّارة «بوكاتشو» في إيطاليا'),
    text: L(
      'Built by Italcantieri in Castellammare di Stabia for Tirrenia, the Italian state shipping company. A 130 metre ferry, one of five sister ships known in Italy as the “Poets”. Until 1999 she sails mainly between the mainland and Sardinia.',
      'Costruito da Italcantieri a Castellammare di Stabia per Tirrenia, la compagnia di navigazione di Stato. Un traghetto di 130 metri, uno dei cinque gemelli chiamati in Italia “i Poeti”. Fino al 1999 naviga soprattutto tra il continente e la Sardegna.',
      'Construit par Italcantieri à Castellammare di Stabia pour Tirrenia, la compagnie maritime publique italienne. Un ferry de 130 mètres, l’un des cinq navires jumeaux surnommés en Italie les « Poètes ». Jusqu’en 1999, il navigue surtout entre le continent et la Sardaigne.',
      'بنتها شركة إيتالكانتييري في كاستيلاماري دي ستابيا لصالح شركة تيرينيا الإيطالية الحكومية للملاحة. عبّارة بطول 130 مترًا، واحدة من خمس سفن شقيقة عُرفت في إيطاليا باسم «الشعراء». حتى عام 1999 أبحرت أساسًا بين البر الإيطالي وجزيرة سردينيا.',
    ),
  },
  {
    date: L('1990 to 1991', '1990-1991', '1990-1991', '1990 إلى 1991'),
    title: L('Four decks are added', 'Vengono aggiunti quattro ponti', 'Quatre ponts sont ajoutés', 'إضافة أربعة طوابق'),
    text: L(
      'To carry more passengers, the Boccaccio and her sisters Carducci, Manzoni, Pascoli and Petrarca are rebuilt with four extra upper decks and sponsons. According to the families’ technical experts, this transformation is at the root of the tragedy.',
      'Per portare più passeggeri, il Boccaccio e i gemelli Carducci, Manzoni, Pascoli e Petrarca vengono ricostruiti con quattro ponti superiori in più e con gli sponson. Secondo i periti delle famiglie, questa trasformazione è all’origine della tragedia.',
      'Pour transporter plus de passagers, le Boccaccio et ses jumeaux Carducci, Manzoni, Pascoli et Petrarca sont reconstruits avec quatre ponts supérieurs supplémentaires et des sponsons. Selon les experts techniques des familles, cette transformation est à l’origine de la tragédie.',
      'لزيادة عدد الركاب، أُعيد بناء «بوكاتشو» وشقيقاتها كاردوتشي ومانزوني وباسكولي وبتراركا بإضافة أربعة طوابق علوية وعوامات جانبية. ووفقًا لخبراء العائلات الفنيين، فإن هذا التعديل هو أصل المأساة.',
    ),
    photo: img('before-after-1991'),
  },
  {
    date: L('April 1999', 'Aprile 1999', 'Avril 1999', 'أبريل 1999'),
    title: L('Sold to Egypt, under the flag of Panama', 'Venduto in Egitto, con bandiera di Panama', 'Vendu à l’Égypte, sous pavillon panaméen', 'بيعها إلى مصر تحت علم بنما'),
    text: L(
      'Tirrenia sells the ship for about 2 million dollars to Pacific Sunlight Marine Inc. of Panama, a company owned by the Egyptian Ismail family. She is renamed Al Salam (“peace”) Boccaccio 98 and sails the Red Sea and the Mediterranean.',
      'Tirrenia vende la nave per circa 2 milioni di dollari a Pacific Sunlight Marine Inc. di Panama, società della famiglia egiziana Ismail. Diventa Al Salam (“pace”) Boccaccio 98 e naviga nel Mar Rosso e nel Mediterraneo.',
      'Tirrenia vend le navire pour environ 2 millions de dollars à Pacific Sunlight Marine Inc. (Panama), société de la famille égyptienne Ismail. Il est rebaptisé Al Salam (« paix ») Boccaccio 98 et navigue en mer Rouge et en Méditerranée.',
      'باعت تيرينيا السفينة بنحو مليوني دولار لشركة باسيفيك صن لايت مارين البنمية المملوكة لعائلة إسماعيل المصرية. أصبح اسمها «السلام بوكاتشو 98» وأبحرت في البحر الأحمر والبحر المتوسط.',
    ),
  },
  {
    date: L('2002', '2002', '2002', '2002'),
    title: L('A sister ship sinks after a fire', 'Una nave gemella affonda dopo un incendio', 'Un navire jumeau coule après un incendie', 'غرق سفينة شقيقة بعد حريق'),
    text: L(
      'The Al Salam Petrarca 90, transformed in the same way, catches fire, capsizes and sinks while being towed out of the port of Duba, Saudi Arabia. One sailor dies and ten are injured. A warning that goes unheeded.',
      'L’Al Salam Petrarca 90, trasformata allo stesso modo, prende fuoco, si inclina e affonda mentre viene rimorchiata fuori dal porto di Duba, in Arabia Saudita. Muore un marinaio, dieci sono feriti. Un avvertimento rimasto inascoltato.',
      'L’Al Salam Petrarca 90, transformé de la même manière, prend feu, chavire et coule pendant son remorquage hors du port de Duba, en Arabie saoudite. Un marin meurt, dix sont blessés. Un avertissement resté lettre morte.',
      'اشتعلت النيران في «السلام بتراركا 90» المعدّلة بالطريقة نفسها، فمالت وغرقت أثناء قطرها خارج ميناء ضبا في السعودية. توفي بحّار وأصيب عشرة آخرون. كان ذلك إنذارًا لم يلتفت إليه أحد.',
    ),
  },
  {
    date: L('2 February 2006, 19:51', '2 febbraio 2006, ore 19:51', '2 février 2006, 19 h 51', '2 فبراير 2006، الساعة 19:51'),
    title: L('Departure from Duba', 'La partenza da Duba', 'Le départ de Duba', 'الإبحار من ضبا'),
    text: L(
      'The Al Salam Boccaccio 98 leaves Duba, Saudi Arabia, for Safaga, Egypt, with more than 1,400 passengers and crew and a few dozen vehicles on board.',
      'L’Al Salam Boccaccio 98 lascia Duba, in Arabia Saudita, diretta a Safaga, in Egitto, con più di 1.400 persone tra passeggeri ed equipaggio e alcune decine di veicoli a bordo.',
      'L’Al Salam Boccaccio 98 quitte Duba, en Arabie saoudite, pour Safaga, en Égypte, avec plus de 1 400 passagers et membres d’équipage et quelques dizaines de véhicules à bord.',
      'غادرت «السلام بوكاتشو 98» ميناء ضبا في السعودية متجهة إلى سفاجا في مصر، وعلى متنها أكثر من 1400 راكب وفرد طاقم وعشرات المركبات.',
    ),
    photo: img('route-duba-safaga'),
  },
  {
    date: L('Night of 2 to 3 February 2006', 'Notte tra il 2 e il 3 febbraio 2006', 'Nuit du 2 au 3 février 2006', 'ليلة 2 إلى 3 فبراير 2006'),
    title: L('Fire, water on the car deck, and the sinking', 'Incendio, acqua nel garage e affondamento', 'Incendie, eau dans le garage et naufrage', 'حريق ومياه في مرآب السيارات ثم الغرق'),
    text: L(
      'A fire breaks out on board. The seawater used to fight it cannot drain from the garage deck because the scuppers are blocked. With the wind, the ship lists to starboard. At 23:33 UTC she sinks to a depth of 900 metres. Only 364 passengers and 24 crew survive. More than 700 of the victims are believed to be still inside the wreck.',
      'A bordo scoppia un incendio. L’acqua di mare usata per spegnerlo non riesce a uscire dal garage perché gli ombrinali sono ostruiti. Con il vento, la nave si inclina sul lato di dritta. Alle 23:33 UTC affonda a 900 metri di profondità. Si salvano solo 364 passeggeri e 24 membri dell’equipaggio. Più di 700 vittime si trovano probabilmente ancora nel relitto.',
      'Un incendie se déclare à bord. L’eau de mer utilisée pour l’éteindre ne peut pas s’évacuer du garage, car les dalots sont obstrués. Avec le vent, le navire gîte sur tribord. À 23 h 33 UTC, il coule par 900 mètres de fond. Seuls 364 passagers et 24 membres d’équipage survivent. Plus de 700 victimes seraient encore prisonnières de l’épave.',
      'اندلع حريق على متن السفينة. لم تتمكن مياه البحر المستخدمة في إطفائه من التصريف خارج المرآب لأن فتحات التصريف كانت مسدودة. ومع الرياح مالت السفينة إلى الجانب الأيمن. في الساعة 23:33 بالتوقيت العالمي غرقت على عمق 900 متر. نجا 364 راكبًا و24 فردًا من الطاقم فقط، ويُعتقد أن أكثر من 700 ضحية ما زالوا داخل الحطام.',
    ),
    link: { label: L('Read the black box transcript', 'Leggi la trascrizione della scatola nera', 'Lire la transcription de la boîte noire', 'اقرأ تفريغ الصندوق الأسود'), href: blackBox.href },
  },
  {
    date: L('June 2006 to January 2007', 'Giugno 2006 - gennaio 2007', 'Juin 2006 à janvier 2007', 'يونيو 2006 إلى يناير 2007'),
    title: L('The remaining sister ships are scrapped', 'Le navi gemelle rimaste vengono demolite', 'Les navires jumeaux restants sont démolis', 'تفكيك السفن الشقيقة المتبقية'),
    text: L(
      'Al Salam Pascoli 96, Manzoni 94 and Carducci 92 are withdrawn from service and demolished at the Alang shipyard in India. The families do not believe this is a coincidence.',
      'Al Salam Pascoli 96, Manzoni 94 e Carducci 92 vengono ritirate dal servizio e demolite nel cantiere di Alang, in India. Le famiglie non credono che sia una coincidenza.',
      'Al Salam Pascoli 96, Manzoni 94 et Carducci 92 sont retirés du service et démolis au chantier d’Alang, en Inde. Les familles ne croient pas à une coïncidence.',
      'سُحبت «السلام باسكولي 96» و«مانزوني 94» و«كاردوتشي 92» من الخدمة وفُككت في حوض ألانغ في الهند. ولا تعتقد العائلات أن ذلك مجرد صدفة.',
    ),
    photo: img('carducci-92-alang'),
  },
  {
    date: L('2007', '2007', '2007', '2007'),
    title: L('A court orders RINA to release documents', 'Un tribunale obbliga il RINA a consegnare i documenti', 'Un tribunal oblige le RINA à remettre des documents', 'محكمة تلزم RINA بتسليم الوثائق'),
    text: L(
      'RINA, the classification society that certified the ship, refuses to hand over its records to a victim’s relative. The Regional Administrative Court of Liguria orders it to release part of them.',
      'Il RINA, la società di classificazione che certificava la nave, rifiuta di consegnare i suoi documenti a un familiare di una vittima. Il TAR della Liguria gli ordina di consegnarne una parte.',
      'Le RINA, la société de classification qui certifiait le navire, refuse de remettre ses documents au proche d’une victime. Le tribunal administratif de Ligurie lui ordonne d’en communiquer une partie.',
      'رفضت RINA، هيئة التصنيف التي كانت تمنح السفينة شهاداتها، تسليم سجلاتها لأحد أقارب الضحايا، فأمرتها المحكمة الإدارية في ليغوريا بتسليم جزء منها.',
    ),
    link: { label: L('TAR ruling', 'Sentenza del TAR', 'Jugement du TAR', 'حكم المحكمة الإدارية'), href: rulings[2].href },
  },
  {
    date: L('2008 to 2009', '2008-2009', '2008-2009', '2008 إلى 2009'),
    title: L('Criminal convictions in Egypt', 'Le condanne penali in Egitto', 'Condamnations pénales en Égypte', 'أحكام جنائية في مصر'),
    text: L(
      'In March 2009 the Hurghada Court of Appeal sentences the shipowner Mamdouh Ismail and other executives to up to seven years for multiple manslaughter. The trials cover only what happened after the sinking, not the safety of the ship.',
      'Nel marzo 2009 la Corte d’Appello di Hurghada condanna l’armatore Mamdouh Ismail e altri dirigenti fino a sette anni per omicidio colposo plurimo. I processi riguardano solo quanto accaduto dopo l’affondamento, non la sicurezza della nave.',
      'En mars 2009, la cour d’appel d’Hurghada condamne l’armateur Mamdouh Ismail et d’autres dirigeants à des peines allant jusqu’à sept ans pour homicides involontaires multiples. Les procès ne portent que sur la suite du naufrage, pas sur la sécurité du navire.',
      'في مارس 2009 حكمت محكمة استئناف الغردقة على مالك السفينة ممدوح إسماعيل ومسؤولين آخرين بالسجن حتى سبع سنوات بتهمة القتل الخطأ المتعدد. تناولت المحاكمات ما حدث بعد الغرق فقط، لا سلامة السفينة.',
    ),
  },
  {
    date: L('January 2011', 'Gennaio 2011', 'Janvier 2011', 'يناير 2011'),
    title: L('The families sue RINA in Genoa', 'Le famiglie fanno causa al RINA a Genova', 'Les familles assignent le RINA à Gênes', 'العائلات تقاضي RINA في جنوة'),
    text: L(
      'Families of victims and survivors bring a civil case before the Court of Genoa, where RINA is based. The first hearing is held in January 2011.',
      'Famiglie delle vittime e sopravvissuti avviano una causa civile davanti al Tribunale di Genova, dove ha sede il RINA. La prima udienza si tiene nel gennaio 2011.',
      'Des familles de victimes et des survivants saisissent le tribunal de Gênes, où siège le RINA. La première audience a lieu en janvier 2011.',
      'رفعت عائلات الضحايا والناجون دعوى مدنية أمام محكمة جنوة حيث مقر RINA. عُقدت الجلسة الأولى في يناير 2011.',
    ),
  },
  {
    date: L('2012 to 2014', '2012-2014', '2012-2014', '2012 إلى 2014'),
    title: L('Blocked by “sovereign immunity”', 'Bloccati dall’“immunità sovrana”', 'Bloqués par l’« immunité souveraine »', 'التعطيل بحجة «الحصانة السيادية»'),
    text: L(
      'RINA argues that it acted on behalf of Panama and can only be tried there. The Court of Genoa agrees in 2012, the Court of Appeal in 2014. The case stops for years.',
      'Il RINA sostiene di aver agito per conto di Panama e di poter essere giudicato solo lì. Il Tribunale di Genova gli dà ragione nel 2012, la Corte d’Appello nel 2014. La causa si ferma per anni.',
      'Le RINA soutient avoir agi pour le compte du Panama et ne pouvoir être jugé que là-bas. Le tribunal de Gênes lui donne raison en 2012, la cour d’appel en 2014. L’affaire est bloquée pendant des années.',
      'احتجت RINA بأنها تصرفت نيابة عن بنما ولا يجوز محاكمتها إلا هناك. أيدتها محكمة جنوة عام 2012 ثم محكمة الاستئناف عام 2014، فتوقفت القضية لسنوات.',
    ),
  },
  {
    date: L('May and December 2020', 'Maggio e dicembre 2020', 'Mai et décembre 2020', 'مايو وديسمبر 2020'),
    title: L('Two historic rulings for the families', 'Due sentenze storiche per le famiglie', 'Deux arrêts historiques pour les familles', 'حكمان تاريخيان لصالح العائلات'),
    text: L(
      'The Court of Justice of the European Union, in May, and the United Sections of the Italian Supreme Court, in December, reject sovereign immunity. The Supreme Court calls human rights the “centerpiece” of the Italian legal system. The case can return to Genoa.',
      'La Corte di Giustizia dell’Unione Europea a maggio e le Sezioni Unite della Cassazione a dicembre respingono l’immunità sovrana. La Cassazione definisce i diritti umani il “fulcro” dell’ordinamento italiano. La causa può tornare a Genova.',
      'La Cour de justice de l’Union européenne en mai, puis les chambres réunies de la Cour de cassation italienne en décembre, rejettent l’immunité souveraine. La Cour suprême qualifie les droits humains de « pivot » de l’ordre juridique italien. L’affaire peut revenir à Gênes.',
      'رفضت محكمة العدل الأوروبية في مايو، ثم الدوائر المجتمعة لمحكمة النقض الإيطالية في ديسمبر، الدفع بالحصانة السيادية. ووصفت المحكمة العليا حقوق الإنسان بأنها «محور» النظام القانوني الإيطالي. وبات بإمكان القضية العودة إلى جنوة.',
    ),
    link: { label: L('Read the rulings', 'Leggi le sentenze', 'Lire les arrêts', 'اقرأ الأحكام'), href: '/documents/' },
  },
  {
    date: L('2021', '2021', '2021', '2021'),
    title: L('Hearings resume in Genoa', 'Riprendono le udienze a Genova', 'Les audiences reprennent à Gênes', 'استئناف الجلسات في جنوة'),
    text: L(
      'The two cases, now joined, start again. The judge appoints three independent experts to establish whether RINA and Registro Italiano Navale are responsible for the sinking.',
      'Le due cause, ora riunite, ripartono. Il giudice nomina tre periti indipendenti per stabilire se il RINA e il Registro Italiano Navale siano responsabili dell’affondamento.',
      'Les deux affaires, désormais jointes, reprennent. Le juge nomme trois experts indépendants pour établir si le RINA et le Registro Italiano Navale sont responsables du naufrage.',
      'استؤنفت القضيتان بعد ضمّهما. وعيّن القاضي ثلاثة خبراء مستقلين لتحديد ما إذا كانت RINA وسجل الملاحة الإيطالي مسؤولين عن الغرق.',
    ),
  },
  {
    date: L('15 May 2024', '15 maggio 2024', '15 mai 2024', '15 مايو 2024'),
    title: L('The court’s experts report', 'La perizia del tribunale', 'Le rapport des experts du tribunal', 'تقرير خبراء المحكمة'),
    text: L(
      'According to the families’ legal team, the court-appointed experts find contributory negligence by RINA. Families meet with the lawyers to discuss the findings.',
      'Secondo i legali delle famiglie, i periti nominati dal tribunale riscontrano una negligenza concorrente del RINA. Le famiglie incontrano gli avvocati per discutere i risultati.',
      'Selon les avocats des familles, les experts désignés par le tribunal relèvent une négligence du RINA ayant contribué au naufrage. Les familles rencontrent les avocats pour en discuter.',
      'بحسب فريق الدفاع عن العائلات، خلص الخبراء المعيّنون من المحكمة إلى وجود إهمال من جانب RINA ساهم في الكارثة. والتقت العائلات بالمحامين لمناقشة النتائج.',
    ),
    photo: img('meeting-2024-hall'),
    link: { label: L('Press release', 'Comunicato stampa', 'Communiqué de presse', 'البيان الصحفي'), href: pressReleases[0].href },
  },
];

/* ---------------- pagine ---------------- */

const home: Page = {
  id: 'home',
  status: 'published',
  sort: 0,
  slug: { en: 'home' },
  title: L('Home', 'Home', 'Accueil', 'الرئيسية'),
  home: true,
  inMenu: false,
  seo: {
    title: L('Al Salam Boccaccio 98: the truth about the 2006 Red Sea ferry disaster', 'Al Salam Boccaccio 98: la verità sul naufragio del 2006 nel Mar Rosso', 'Al Salam Boccaccio 98 : la vérité sur le naufrage de 2006 en mer Rouge', 'السلام بوكاتشو 98: الحقيقة حول كارثة العبّارة في البحر الأحمر عام 2006'),
    description: L(
      'More than 1,000 people died when the Al Salam Boccaccio 98 sank in 2006. The victims’ families publish the facts, the documents and the progress of the legal case.',
      'Più di 1.000 persone morirono nel naufragio dell’Al Salam Boccaccio 98 nel 2006. Le famiglie delle vittime pubblicano i fatti, i documenti e l’andamento della causa.',
      'Plus de 1 000 personnes sont mortes dans le naufrage de l’Al Salam Boccaccio 98 en 2006. Les familles publient les faits, les documents et l’avancée du procès.',
      'لقي أكثر من ألف شخص حتفهم في غرق «السلام بوكاتشو 98» عام 2006. تنشر عائلات الضحايا هنا الوقائع والوثائق ومستجدات القضية.',
    ),
  },
  blocks: [
    {
      kind: 'hero',
      title: L('The night the Al Salam Boccaccio 98 sank', 'La notte in cui affondò l’Al Salam Boccaccio 98', 'La nuit où l’Al Salam Boccaccio 98 a sombré', 'ليلة غرق «السلام بوكاتشو 98»'),
      text: L(
        'More than 1,000 people died in the Red Sea in 2006. Their families are still seeking the truth in court.',
        'Più di 1.000 persone morirono nel Mar Rosso nel 2006. Le loro famiglie cercano ancora la verità in tribunale.',
        'Plus de 1 000 personnes sont mortes en mer Rouge en 2006. Leurs familles cherchent toujours la vérité devant la justice.',
        'لقي أكثر من ألف شخص حتفهم في البحر الأحمر عام 2006، وما زالت عائلاتهم تبحث عن الحقيقة أمام القضاء.',
      ),
      photo: img('boccaccio-at-sea'),
      focus: '50% 55%',
      cta: { label: L('Follow the timeline', 'Segui la cronologia', 'Suivre la chronologie', 'تابع التسلسل الزمني'), href: '/timeline/' },
    },
    {
      kind: 'stats',
      items: [
        { value: L('1,400+', '1.400+', '1 400+', '+1400'), label: L('people on board', 'persone a bordo', 'personnes à bord', 'شخص على متن العبّارة') },
        { value: same('388'), label: L('survivors: 364 passengers and 24 crew', 'sopravvissuti: 364 passeggeri e 24 membri dell’equipaggio', 'survivants : 364 passagers et 24 membres d’équipage', 'ناجيًا: 364 راكبًا و24 من الطاقم') },
        { value: L('1,000+', '1.000+', '1 000+', '+1000'), label: L('people dead', 'morti', 'morts', 'ضحية') },
        { value: L('9th', '9°', '9e', 'التاسعة'), label: L('deadliest civilian shipwreck in history', 'naufragio civile più grave della storia', 'naufrage civil le plus meurtrier de l’histoire', 'بين أسوأ كوارث غرق السفن المدنية في التاريخ') },
      ],
      note: L(
        'The most serious maritime disaster in Egypt’s history.',
        'Il disastro marittimo più grave della storia dell’Egitto.',
        'La pire catastrophe maritime de l’histoire de l’Égypte.',
        'أسوأ كارثة بحرية في تاريخ مصر.',
      ),
    },
    {
      kind: 'text',
      title: L('Why this site exists', 'Perché esiste questo sito', 'Pourquoi ce site existe', 'لماذا هذا الموقع'),
      text: L(
        'We are the relatives of the passengers who died. We created this site to bring the facts to light and to reach the truth.\n\nExposing the mistakes made on that ship can help prevent them from happening again, and make navigation safer for everyone.\n\nSince 2010, more than 15% of the families affected, together with dozens of survivors and crew members, have been taking part in the legal case in Italy. It is the largest shipwreck lawsuit currently under way in the world.',
        'Siamo i familiari dei passeggeri morti. Abbiamo creato questo sito per far emergere i fatti e arrivare alla verità.\n\nMostrare gli errori commessi su quella nave può aiutare a non ripeterli e rendere la navigazione più sicura per tutti.\n\nDal 2010 più del 15% delle famiglie colpite, insieme a decine di sopravvissuti e membri dell’equipaggio, partecipa alla causa in Italia. È la più grande causa per un naufragio oggi in corso nel mondo.',
        'Nous sommes les proches des passagers disparus. Nous avons créé ce site pour faire connaître les faits et parvenir à la vérité.\n\nMontrer les erreurs commises sur ce navire peut éviter qu’elles se répètent et rendre la navigation plus sûre pour tous.\n\nDepuis 2010, plus de 15 % des familles touchées, ainsi que des dizaines de survivants et de membres d’équipage, participent au procès en Italie. C’est le plus grand procès pour naufrage actuellement en cours dans le monde.',
        'نحن أقارب الركاب الذين فقدوا حياتهم. أنشأنا هذا الموقع لكشف الوقائع والوصول إلى الحقيقة.\n\nإن كشف الأخطاء التي ارتُكبت على تلك السفينة يساعد على عدم تكرارها، ويجعل الملاحة أكثر أمانًا للجميع.\n\nمنذ عام 2010 يشارك أكثر من 15% من العائلات المتضررة، ومعهم عشرات الناجين وأفراد الطاقم، في الدعوى القضائية في إيطاليا. إنها أكبر قضية غرق سفينة منظورة حاليًا في العالم.',
      ),
    },
    {
      kind: 'textPhoto',
      title: L('One ship, rebuilt into another', 'Una nave ricostruita in un’altra', 'Un navire transformé en un autre', 'سفينة أُعيد بناؤها لتصبح أخرى'),
      text: L(
        'In 1991 four decks were added to the Boccaccio. She came out taller, heavier and less stable. Two of the five sister ships transformed this way sank within four years.',
        'Nel 1991 al Boccaccio furono aggiunti quattro ponti. Ne uscì più alto, più pesante e meno stabile. Due delle cinque navi gemelle trasformate così affondarono nel giro di quattro anni.',
        'En 1991, quatre ponts ont été ajoutés au Boccaccio. Il en est ressorti plus haut, plus lourd et moins stable. Deux des cinq navires jumeaux transformés ainsi ont coulé en quatre ans.',
        'في عام 1991 أُضيفت أربعة طوابق إلى «بوكاتشو»، فخرجت أعلى وأثقل وأقل استقرارًا. وغرقت اثنتان من السفن الشقيقة الخمس التي عُدّلت بالطريقة نفسها خلال أربع سنوات.',
      ),
      photo: img('five-sister-ships'),
      side: 'right',
      cta: { label: L('About the ship', 'La nave', 'Le navire', 'عن السفينة'), href: '/the-ship/' },
    },
    {
      kind: 'documents',
      title: L('Key documents', 'Documenti principali', 'Documents essentiels', 'أهم الوثائق'),
      items: [blackBox, investigations[2], investigations[4], rulings[1]],
    },
    {
      kind: 'cta',
      title: L('Every document, in one place', 'Tutti i documenti, in un solo posto', 'Tous les documents, au même endroit', 'جميع الوثائق في مكان واحد'),
      text: L(
        'Investigation reports, court rulings and press coverage, free to read and download.',
        'Rapporti d’inchiesta, sentenze e articoli di stampa, da leggere e scaricare liberamente.',
        'Rapports d’enquête, décisions de justice et articles de presse, en libre lecture et téléchargement.',
        'تقارير التحقيق والأحكام القضائية والتغطية الصحفية، متاحة للقراءة والتنزيل مجانًا.',
      ),
      cta: { label: L('Open the archive', 'Apri l’archivio', 'Ouvrir les archives', 'افتح الأرشيف'), href: '/documents/' },
    },
  ],
};

const ship: Page = {
  id: 'the-ship',
  status: 'published',
  sort: 1,
  slug: { en: 'the-ship', it: 'la-nave', fr: 'le-navire', ar: 'the-ship' },
  title: L('The ship', 'La nave', 'Le navire', 'السفينة'),
  home: false,
  inMenu: true,
  blocks: [
    {
      kind: 'textPhoto',
      title: L('A ferry of the “Poets” class', 'Un traghetto della classe “Poeti”', 'Un ferry de la classe des « Poètes »', 'عبّارة من فئة «الشعراء»'),
      text: L(
        'The Boccaccio was a 130 metre ferry built between 1969 and 1970 by Italcantieri, later Fincantieri, in Castellammare di Stabia, for the state company Tirrenia. With her four sisters Carducci, Manzoni, Pascoli and Petrarca she sailed mainly between the Italian mainland and Sardinia until 1999.',
        'Il Boccaccio era un traghetto di 130 metri costruito tra il 1969 e il 1970 da Italcantieri, poi Fincantieri, a Castellammare di Stabia, per la società di Stato Tirrenia. Con i quattro gemelli Carducci, Manzoni, Pascoli e Petrarca ha navigato soprattutto tra il continente e la Sardegna fino al 1999.',
        'Le Boccaccio était un ferry de 130 mètres construit entre 1969 et 1970 par Italcantieri, devenu Fincantieri, à Castellammare di Stabia, pour la compagnie publique Tirrenia. Avec ses quatre jumeaux Carducci, Manzoni, Pascoli et Petrarca, il a navigué surtout entre le continent et la Sardaigne jusqu’en 1999.',
        'كانت «بوكاتشو» عبّارة بطول 130 مترًا بنتها إيتالكانتييري (فينكانتييري لاحقًا) في كاستيلاماري دي ستابيا بين عامي 1969 و1970 لصالح شركة تيرينيا الحكومية. أبحرت مع شقيقاتها الأربع كاردوتشي ومانزوني وباسكولي وبتراركا بين البر الإيطالي وسردينيا حتى عام 1999.',
      ),
      photo: img('boccaccio-moored'),
      side: 'left',
    },
    {
      kind: 'gallery',
      title: L('1990 to 1991: before and after', '1990-1991: prima e dopo', '1990-1991 : avant et après', '1990 إلى 1991: قبل التعديل وبعده'),
      photos: [
        photo('before-after-1991', 874, 490, L('Left, the original ferries. Right, after the transformation.', 'A sinistra i traghetti originali, a destra dopo la trasformazione.', 'À gauche les ferries d’origine, à droite après la transformation.', 'على اليسار العبّارات الأصلية، وعلى اليمين بعد التعديل.')),
        photo('drawings-modifications', 1754, 1232, L('Official drawing filed in the lawsuit: in red the 1990 to 1991 modifications, in green the original vessel.', 'Disegno ufficiale agli atti della causa: in rosso le modifiche del 1990-1991, in verde la nave originale.', 'Plan officiel versé au dossier : en rouge les modifications de 1990-1991, en vert le navire d’origine.', 'رسم رسمي مقدَّم في الدعوى: باللون الأحمر تعديلات 1990 إلى 1991، وبالأخضر السفينة الأصلية.')),
        photo('five-sister-ships', 419, 190, L('The five sister ships, all transformed the same way. Courtesy marinacivil.com', 'Le cinque navi gemelle, tutte trasformate allo stesso modo. Per gentile concessione di marinacivil.com', 'Les cinq navires jumeaux, tous transformés de la même manière. Avec l’aimable autorisation de marinacivil.com', 'السفن الشقيقة الخمس، وقد عُدّلت جميعها بالطريقة نفسها. بإذن من marinacivil.com')),
        photo('building-plan', 1411, 611, L('Building plan of the ship.', 'Piano di costruzione della nave.', 'Plan de construction du navire.', 'مخطط بناء السفينة.')),
      ],
    },
    {
      kind: 'text',
      title: L('Taller, heavier, less stable', 'Più alta, più pesante, meno stabile', 'Plus haut, plus lourd, moins stable', 'أعلى وأثقل وأقل استقرارًا'),
      text: L(
        'In 1991 the Boccaccio and her sisters were rebuilt to carry more passengers: four upper decks were added, with sponsons along the hull.\n\nAs the official drawings in the lawsuit show, she left the shipyard as a new ship: top heavy, wider, taller, more exposed to the wind, with a completely different and poorer stability. According to the families’ technical experts, that transformation is at the root of the tragedy.',
        'Nel 1991 il Boccaccio e i suoi gemelli furono ricostruiti per portare più passeggeri: si aggiunsero quattro ponti superiori, con gli sponson lungo lo scafo.\n\nCome mostrano i disegni ufficiali agli atti della causa, uscì dal cantiere come una nave nuova: pesante in alto, più larga, più alta, più esposta al vento, con una stabilità del tutto diversa e peggiore. Secondo i periti delle famiglie, quella trasformazione è all’origine della tragedia.',
        'En 1991, le Boccaccio et ses jumeaux ont été reconstruits pour transporter plus de passagers : quatre ponts supérieurs ont été ajoutés, avec des sponsons le long de la coque.\n\nComme le montrent les plans officiels versés au dossier, il est sorti du chantier comme un nouveau navire : alourdi dans les hauts, plus large, plus haut, plus exposé au vent, avec une stabilité totalement différente et dégradée. Selon les experts des familles, cette transformation est à l’origine de la tragédie.',
        'في عام 1991 أُعيد بناء «بوكاتشو» وشقيقاتها لنقل مزيد من الركاب، فأُضيفت أربعة طوابق علوية مع عوامات جانبية على طول البدن.\n\nوكما تُظهر الرسومات الرسمية المقدّمة في الدعوى، خرجت من الحوض سفينةً جديدة: ثقيلة من الأعلى، أعرض وأعلى، وأكثر تعرضًا للرياح، وباستقرار مختلف تمامًا وأضعف. ووفقًا لخبراء العائلات الفنيين، فإن هذا التعديل هو أصل المأساة.',
      ),
    },
    {
      kind: 'textPhoto',
      title: L('Sold to Egypt in 1999', 'Venduta in Egitto nel 1999', 'Vendu à l’Égypte en 1999', 'بيعت إلى مصر عام 1999'),
      text: L(
        'In April 1999 Tirrenia sold the ship for about 2 million dollars to Pacific Sunlight Marine Inc. of Panama, a company of the Egyptian Ismail family. Renamed Al Salam Boccaccio 98, she sailed the Red Sea and the Mediterranean under the flag of Panama.\n\nThe other transformed sisters were bought by the same group. From late 2005 until the sinking the ship was managed by El Salam Maritime Transport Co., at the same Cairo address as Pacific Sunlight Marine and El Salam Shipping & Trading: 30 Yakoub Artin, Heliopolis.',
        'Nell’aprile 1999 Tirrenia vendette la nave per circa 2 milioni di dollari a Pacific Sunlight Marine Inc. di Panama, società della famiglia egiziana Ismail. Ribattezzata Al Salam Boccaccio 98, navigò nel Mar Rosso e nel Mediterraneo con bandiera panamense.\n\nAnche le altre gemelle trasformate furono acquistate dallo stesso gruppo. Dalla fine del 2005 fino all’affondamento la nave era gestita da El Salam Maritime Transport Co., allo stesso indirizzo del Cairo di Pacific Sunlight Marine e di El Salam Shipping & Trading: 30 Yakoub Artin, Heliopolis.',
        'En avril 1999, Tirrenia a vendu le navire pour environ 2 millions de dollars à Pacific Sunlight Marine Inc. (Panama), société de la famille égyptienne Ismail. Rebaptisé Al Salam Boccaccio 98, il a navigué en mer Rouge et en Méditerranée sous pavillon panaméen.\n\nLes autres jumeaux transformés ont été achetés par le même groupe. De fin 2005 jusqu’au naufrage, le navire était géré par El Salam Maritime Transport Co., à la même adresse au Caire que Pacific Sunlight Marine et El Salam Shipping & Trading : 30 Yakoub Artin, Héliopolis.',
        'في أبريل 1999 باعت تيرينيا السفينة بنحو مليوني دولار لشركة باسيفيك صن لايت مارين البنمية التابعة لعائلة إسماعيل المصرية. وتحت اسم «السلام بوكاتشو 98» أبحرت في البحر الأحمر والبحر المتوسط رافعةً علم بنما.\n\nواشترت المجموعة نفسها السفن الشقيقة المعدّلة الأخرى. ومن أواخر 2005 حتى الغرق كانت تديرها شركة السلام للنقل البحري، في العنوان نفسه بالقاهرة الذي تشغله باسيفيك صن لايت مارين والسلام للشحن والتجارة: 30 شارع يعقوب أرتين، مصر الجديدة.',
      ),
      photo: img('al-salam-in-port'),
      side: 'right',
    },
    {
      kind: 'slider',
      title: L('The end of the sister ships', 'La fine delle navi gemelle', 'La fin des navires jumeaux', 'نهاية السفن الشقيقة'),
      photos: [
        photo('carducci-92-alang', 1473, 1105, L('Al Salam Carducci 92 being demolished in Alang, India. Courtesy of the families’ lawyers.', 'L’Al Salam Carducci 92 in demolizione ad Alang, in India. Per gentile concessione dei legali delle famiglie.', 'L’Al Salam Carducci 92 en cours de démolition à Alang, en Inde. Avec l’autorisation des avocats des familles.', '«السلام كاردوتشي 92» أثناء تفكيكها في ألانغ بالهند. بإذن من محامي العائلات.')),
        photo('sister-ship-scrapping', 718, 545, L('A sister ship on the beach at Alang.', 'Una nave gemella sulla spiaggia di Alang.', 'Un navire jumeau sur la plage d’Alang.', 'سفينة شقيقة على شاطئ ألانغ.')),
        photo('boccaccio-at-sea', 1024, 768, L('Al Salam Boccaccio 98 at sea.', 'L’Al Salam Boccaccio 98 in navigazione.', 'L’Al Salam Boccaccio 98 en mer.', '«السلام بوكاتشو 98» في البحر.')),
      ],
    },
    {
      kind: 'text',
      title: L('Scrapped within months', 'Demolite nel giro di pochi mesi', 'Démolis en quelques mois', 'تفكيكها خلال أشهر'),
      text: L(
        'Several hypotheses have been raised about the stability of the ferry. The added decks, even with the sponsons, may have seriously compromised her balance, reduced the freeboard and the stability margins.\n\nWhat is certain is that between June 2006 and January 2007 all the surviving sisters, Al Salam Pascoli 96, Al Salam Manzoni 94 and Al Salam Carducci 92, were withdrawn from passenger service and scrapped in Alang, India. Is it a coincidence? We do not believe so.',
        'Sulla stabilità del traghetto sono state fatte diverse ipotesi. I ponti aggiunti, anche con gli sponson, potrebbero aver compromesso seriamente l’equilibrio della nave, riducendo il bordo libero e i margini di stabilità.\n\nDi certo, tra giugno 2006 e gennaio 2007 tutte le gemelle rimaste, Al Salam Pascoli 96, Al Salam Manzoni 94 e Al Salam Carducci 92, furono ritirate dal trasporto passeggeri e demolite ad Alang, in India. È una coincidenza? Noi non lo crediamo.',
        'Plusieurs hypothèses ont été avancées sur la stabilité du ferry. Les ponts ajoutés, même avec les sponsons, ont pu compromettre gravement son équilibre et réduire le franc-bord et les marges de stabilité.\n\nCe qui est certain, c’est qu’entre juin 2006 et janvier 2007 tous les jumeaux restants, Al Salam Pascoli 96, Al Salam Manzoni 94 et Al Salam Carducci 92, ont été retirés du transport de passagers et démolis à Alang, en Inde. Une coïncidence ? Nous ne le croyons pas.',
        'طُرحت فرضيات عدة حول استقرار العبّارة. فالطوابق المضافة، حتى مع العوامات الجانبية، ربما أضرّت بشدة بتوازنها وقلّلت ارتفاع الحافة الحرة وهوامش الاستقرار.\n\nالمؤكد أنه بين يونيو 2006 ويناير 2007 سُحبت جميع السفن الشقيقة المتبقية، «السلام باسكولي 96» و«السلام مانزوني 94» و«السلام كاردوتشي 92»، من نقل الركاب وفُككت في ألانغ بالهند. هل هي صدفة؟ لا نعتقد ذلك.',
      ),
    },
  ],
};

const timelinePage: Page = {
  id: 'timeline',
  status: 'published',
  sort: 2,
  slug: { en: 'timeline', it: 'cronologia', fr: 'chronologie', ar: 'timeline' },
  title: L('Timeline', 'Cronologia', 'Chronologie', 'التسلسل الزمني'),
  home: false,
  inMenu: true,
  blocks: [
    {
      kind: 'text',
      title: L('From the shipyard to the courtroom', 'Dal cantiere al tribunale', 'Du chantier au tribunal', 'من حوض بناء السفن إلى قاعة المحكمة'),
      text: L(
        'Fifty years of the ship’s history, the night of the sinking and the long road of the families towards justice.',
        'Cinquant’anni di storia della nave, la notte dell’affondamento e il lungo percorso delle famiglie verso la giustizia.',
        'Cinquante ans d’histoire du navire, la nuit du naufrage et le long chemin des familles vers la justice.',
        'خمسون عامًا من تاريخ السفينة، وليلة الغرق، ومسيرة العائلات الطويلة نحو العدالة.',
      ),
    },
    { kind: 'timeline', items: timeline },
  ],
};

const theCase: Page = {
  id: 'the-case',
  status: 'published',
  sort: 3,
  slug: { en: 'the-case', it: 'la-causa', fr: 'le-proces', ar: 'the-case' },
  title: L('The case', 'La causa', 'Le procès', 'القضية'),
  home: false,
  inMenu: true,
  blocks: [
    {
      kind: 'text',
      title: L('The role of RINA', 'Il ruolo del RINA', 'Le rôle du RINA', 'دور RINA'),
      text: L(
        'How can two identical ships, the Al Salam Petrarca 90 and the Al Salam Boccaccio 98, both capsize and sink after their crews tried to put out a fire? How could no one foresee and prevent the second disaster after the first?\n\nRINA S.p.A. and Registro Italiano Navale were the classification societies of the ferries from before their construction until the day of the sinking, under every owner: Tirrenia from 1969 to 1999, El Salam Shipping & Trading until 2005, El Salam Maritime Transport from 2005 to 2006. As recognised organisations they also certified navigation safety on behalf of the flag state, first Italy and, from 1999, Panama.\n\nWhen a victim’s relative asked for those records, RINA refused. In 2007 the Regional Administrative Court of Liguria ordered it to hand over part of them, and the experts could finally study the projects and inspections.',
        'Come è possibile che due navi identiche, l’Al Salam Petrarca 90 e l’Al Salam Boccaccio 98, si rovescino e affondino dopo che gli equipaggi hanno cercato di spegnere un incendio? Come è possibile che, dopo il primo disastro, nessuno abbia previsto e impedito il secondo?\n\nRINA S.p.A. e Registro Italiano Navale sono stati gli enti di classificazione dei traghetti da prima della costruzione fino al giorno dell’affondamento, con ogni armatore: Tirrenia dal 1969 al 1999, El Salam Shipping & Trading fino al 2005, El Salam Maritime Transport dal 2005 al 2006. Come organismi riconosciuti certificavano anche la sicurezza della navigazione per conto dello Stato di bandiera, prima l’Italia e dal 1999 Panama.\n\nQuando un familiare di una vittima ha chiesto quei documenti, il RINA li ha negati. Nel 2007 il TAR della Liguria lo ha obbligato a consegnarne una parte, e i periti hanno potuto finalmente studiare progetti e ispezioni.',
        'Comment deux navires identiques, l’Al Salam Petrarca 90 et l’Al Salam Boccaccio 98, peuvent-ils chavirer et couler après que leurs équipages ont tenté d’éteindre un incendie ? Comment personne n’a-t-il pu prévoir et empêcher la seconde catastrophe après la première ?\n\nRINA S.p.A. et le Registro Italiano Navale ont été les sociétés de classification des ferries depuis avant leur construction jusqu’au jour du naufrage, sous chaque armateur : Tirrenia de 1969 à 1999, El Salam Shipping & Trading jusqu’en 2005, El Salam Maritime Transport de 2005 à 2006. En tant qu’organismes reconnus, ils certifiaient aussi la sécurité de la navigation pour le compte de l’État du pavillon, l’Italie puis, à partir de 1999, le Panama.\n\nLorsqu’un proche de victime a demandé ces documents, le RINA a refusé. En 2007, le tribunal administratif de Ligurie l’a obligé à en remettre une partie, et les experts ont enfin pu étudier les plans et les inspections.',
        'كيف يمكن لسفينتين متطابقتين، «السلام بتراركا 90» و«السلام بوكاتشو 98»، أن تنقلبا وتغرقا بعد أن حاول طاقماهما إطفاء حريق؟ وكيف لم يتوقع أحد الكارثة الثانية ولم يمنعها بعد الأولى؟\n\nكانت شركة RINA وسجل الملاحة الإيطالي هيئتي التصنيف للعبّارات منذ ما قبل بنائها حتى يوم الغرق، مع كل مالك: تيرينيا من 1969 إلى 1999، ثم السلام للشحن والتجارة حتى 2005، ثم السلام للنقل البحري من 2005 إلى 2006. وبصفتهما منظمتين معترفًا بهما، كانتا تمنحان أيضًا شهادات سلامة الملاحة نيابةً عن دولة العلم، إيطاليا أولًا ثم بنما منذ 1999.\n\nعندما طلب أحد أقارب الضحايا تلك السجلات، رفضت RINA. وفي عام 2007 ألزمتها المحكمة الإدارية في ليغوريا بتسليم جزء منها، فتمكن الخبراء أخيرًا من دراسة التصاميم وعمليات التفتيش.',
      ),
    },
    {
      kind: 'gallery',
      title: L('Certificates and inspections, according to RINA', 'Certificati e ispezioni secondo il RINA', 'Certificats et inspections selon le RINA', 'الشهادات وعمليات التفتيش بحسب RINA'),
      photos: [
        photo('rina-certificates', 986, 247, L('Certificates valid on 3 February 2006, as stated by RINA.', 'Certificati validi al 3 febbraio 2006, secondo il RINA.', 'Certificats valides au 3 février 2006, selon le RINA.', 'الشهادات السارية في 3 فبراير 2006 بحسب RINA.')),
        photo('rina-surveys', 1059, 679, L('Surveys and inspections on board since the 2003 class renewal.', 'Visite e ispezioni a bordo dal rinnovo di classe del 2003.', 'Visites et inspections à bord depuis le renouvellement de classe de 2003.', 'الزيارات وعمليات التفتيش على متن السفينة منذ تجديد التصنيف عام 2003.')),
      ],
    },
    {
      kind: 'text',
      text: L(
        'The ship was visited and inspected many times every year. Across the five identical sister ships, inspections add up to roughly two hundred occasions to verify the safety of the ship, the crew and the company. It was not enough.',
        'La nave è stata visitata e ispezionata molte volte ogni anno. Sommando le cinque gemelle identiche, si arriva a circa duecento occasioni per verificare la sicurezza della nave, dell’equipaggio e della compagnia. Non è bastato.',
        'Le navire a été visité et inspecté de nombreuses fois chaque année. Sur les cinq navires jumeaux identiques, cela représente environ deux cents occasions de vérifier la sécurité du navire, de l’équipage et de la compagnie. Cela n’a pas suffi.',
        'خضعت السفينة للزيارة والتفتيش مرات عديدة كل عام. وبإضافة السفن الشقيقة الخمس المتطابقة، يصل العدد إلى نحو مئتي مناسبة للتحقق من سلامة السفينة وطاقمها والشركة. ولم يكن ذلك كافيًا.',
      ),
    },
    {
      kind: 'values',
      title: L('What the investigations found', 'Cosa hanno trovato le inchieste', 'Ce qu’ont révélé les enquêtes', 'ما توصلت إليه التحقيقات'),
      items: [
        {
          title: L('Panama: the garage floods in ten minutes', 'Panama: il garage si allaga in dieci minuti', 'Panama : le garage inondé en dix minutes', 'بنما: المرآب يغرق خلال عشر دقائق'),
          text: L(
            'A test on the sister ship Al Salam Carducci 92 showed that the fixed fire-fighting system floods the garage deck in about ten minutes. The final report adds that the system could not control the fire from its initial stage.',
            'Una prova sulla gemella Al Salam Carducci 92 ha mostrato che l’impianto antincendio fisso allaga il garage in circa dieci minuti. Il rapporto finale aggiunge che l’impianto non era in grado di controllare l’incendio fin dall’inizio.',
            'Un essai sur le jumeau Al Salam Carducci 92 a montré que le système fixe d’extinction inonde le garage en dix minutes environ. Le rapport final ajoute que ce système ne pouvait pas maîtriser l’incendie dès le départ.',
            'أظهر اختبار على السفينة الشقيقة «السلام كاردوتشي 92» أن نظام الإطفاء الثابت يغمر المرآب بالمياه في نحو عشر دقائق. وأضاف التقرير النهائي أن النظام لم يكن قادرًا على السيطرة على الحريق منذ بدايته.',
          ),
        },
        {
          title: L('Egypt: water cannot drain beyond 6.5°', 'Egitto: oltre 6,5° l’acqua non esce', 'Égypte : au-delà de 6,5°, l’eau ne s’évacue plus', 'مصر: لا تُصرَّف المياه بعد ميل 6.5 درجة'),
          text: L(
            'The Egyptian committee found that the garage drainage works by gravity and stops discharging water into the sea when the ship heels more than 6.5 degrees. Testing the sister ship, it judged the system inefficient.',
            'La commissione egiziana ha accertato che lo scarico del garage funziona per gravità e smette di portare l’acqua in mare se la nave si inclina oltre 6,5 gradi. Provando la nave gemella, lo ha giudicato inefficiente.',
            'La commission égyptienne a établi que l’évacuation du garage fonctionne par gravité et cesse de rejeter l’eau à la mer au-delà d’une gîte de 6,5 degrés. Après essai sur le navire jumeau, elle l’a jugée inefficace.',
            'وجدت اللجنة المصرية أن تصريف المرآب يعمل بالجاذبية ويتوقف عن إخراج المياه إلى البحر إذا مالت السفينة أكثر من 6.5 درجة. وبعد اختبار السفينة الشقيقة، اعتبرت النظام غير كفء.',
          ),
        },
        {
          title: L('Two countries, one conclusion', 'Due Paesi, una conclusione', 'Deux pays, une conclusion', 'بلدان واستنتاج واحد'),
          text: L(
            'Different committees of experts, in different countries, agree: the system was inefficient. Water had to leave the hull quickly, not stay trapped in the garage and overturn the ferry.',
            'Commissioni diverse, in Paesi diversi, concordano: l’impianto era inefficiente. L’acqua doveva uscire in fretta dallo scafo, non restare intrappolata nel garage fino a rovesciare il traghetto.',
            'Des commissions différentes, dans des pays différents, s’accordent : le système était inefficace. L’eau devait quitter rapidement la coque, et non rester piégée dans le garage au point de faire chavirer le ferry.',
            'لجان مختلفة في بلدان مختلفة تتفق: كان النظام غير كفء. كان يجب أن تخرج المياه بسرعة من البدن، لا أن تبقى محبوسة في المرآب حتى تقلب العبّارة.',
          ),
        },
      ],
    },
    {
      kind: 'textPhoto',
      title: L('Ten years lost to “sovereign immunity”', 'Dieci anni persi per l’“immunità sovrana”', 'Dix ans perdus à cause de l’« immunité souveraine »', 'عشر سنوات ضائعة بسبب «الحصانة السيادية»'),
      text: L(
        'RINA rejects all accusations. It first asked to bring eleven other parties in Egypt and Panama into the case, which the court refused. Then it argued that, having certified the ship for Panama, it could only be tried there as a foreign sovereign. Genoa agreed in 2012, the Court of Appeal in 2014.\n\nIn 2014 a second group of relatives also sued Registro Italiano Navale, RINA’s parent company. In 2020 the Court of Justice of the European Union and the United Sections of the Italian Supreme Court overturned the Genoa decisions. The cases returned to Genoa.',
        'Il RINA respinge ogni accusa. Prima ha chiesto di chiamare in causa altri undici soggetti tra Egitto e Panama, richiesta respinta. Poi ha sostenuto che, avendo certificato la nave per Panama, poteva essere giudicato solo lì, come uno Stato straniero. Genova gli ha dato ragione nel 2012, la Corte d’Appello nel 2014.\n\nNel 2014 un secondo gruppo di familiari ha citato anche il Registro Italiano Navale, controllante del RINA. Nel 2020 la Corte di Giustizia UE e le Sezioni Unite della Cassazione hanno ribaltato le decisioni di Genova. Le cause sono tornate a Genova.',
        'Le RINA rejette toutes les accusations. Il a d’abord demandé d’appeler en cause onze autres parties en Égypte et au Panama, ce que le tribunal a refusé. Puis il a soutenu qu’ayant certifié le navire pour le Panama, il ne pouvait être jugé que là-bas, comme un État étranger. Gênes lui a donné raison en 2012, la cour d’appel en 2014.\n\nEn 2014, un second groupe de proches a aussi assigné le Registro Italiano Navale, société mère du RINA. En 2020, la Cour de justice de l’UE et les chambres réunies de la Cour de cassation italienne ont renversé les décisions de Gênes. Les affaires sont revenues à Gênes.',
        'ترفض RINA جميع الاتهامات. طلبت أولًا إدخال أحد عشر طرفًا آخر من مصر وبنما في الدعوى، فرفضت المحكمة. ثم احتجت بأنها، وقد منحت الشهادات للسفينة نيابة عن بنما، لا تُحاكم إلا هناك كدولة أجنبية. أيدتها جنوة عام 2012 ومحكمة الاستئناف عام 2014.\n\nوفي عام 2014 رفعت مجموعة ثانية من الأقارب دعوى أيضًا ضد سجل الملاحة الإيطالي، الشركة الأم لـ RINA. وفي عام 2020 ألغت محكمة العدل الأوروبية والدوائر المجتمعة لمحكمة النقض الإيطالية قرارات جنوة، فعادت القضيتان إلى جنوة.',
      ),
      photo: img('lawyers-luxembourg'),
      side: 'right',
    },
    {
      kind: 'documents',
      title: L('The rulings', 'Le sentenze', 'Les décisions', 'الأحكام'),
      items: [rulings[0], rulings[1]],
    },
    {
      kind: 'text',
      title: L('Since 2021: back in Genoa', 'Dal 2021: di nuovo a Genova', 'Depuis 2021 : retour à Gênes', 'منذ 2021: العودة إلى جنوة'),
      text: L(
        'The two cases, now joined, resumed in 2021. The judge appointed three experts to establish whether the sinking and the deaths are the fault of RINA and Registro Italiano Navale, and how much the master’s conduct weighed, if at all. At the families’ request, an expert whose company was certified by RINA was excluded, to avoid any conflict of interest.\n\nThe families have appointed eight experts of their own: stability, shipbuilding, ship handling, safety management, fire and explosion, navigation safety, marine science and ro-ro passenger ships. RINA now lists the case in its annual reports among its main incidents and potential risks.',
        'Le due cause, riunite, sono ripartite nel 2021. Il giudice ha nominato tre periti per stabilire se l’affondamento e le morti siano colpa del RINA e del Registro Italiano Navale, e quanto abbia pesato, se ha pesato, la condotta del comandante. Su richiesta delle famiglie è stato escluso un perito la cui azienda era certificata dal RINA, per evitare ogni conflitto di interessi.\n\nLe famiglie hanno nominato otto periti di parte: stabilità, costruzione navale, manovra, gestione della sicurezza, incendio ed esplosione, sicurezza della navigazione, scienze marine e navi passeggeri ro-ro. Il RINA oggi inserisce la causa nei suoi bilanci tra i principali sinistri e rischi potenziali.',
        'Les deux affaires, jointes, ont repris en 2021. Le juge a nommé trois experts pour établir si le naufrage et les décès sont imputables au RINA et au Registro Italiano Navale, et quel a été le poids éventuel de la conduite du commandant. À la demande des familles, un expert dont l’entreprise était certifiée par le RINA a été écarté, pour éviter tout conflit d’intérêts.\n\nLes familles ont nommé huit experts : stabilité, construction navale, manœuvre, gestion de la sécurité, incendie et explosion, sécurité de la navigation, sciences marines et navires rouliers à passagers. Le RINA mentionne désormais l’affaire dans ses rapports annuels parmi ses principaux sinistres et risques potentiels.',
        'استؤنفت القضيتان بعد ضمّهما عام 2021. وعيّن القاضي ثلاثة خبراء لتحديد ما إذا كان الغرق والوفيات بسبب خطأ RINA وسجل الملاحة الإيطالي، ومدى تأثير سلوك القبطان إن كان له تأثير. وبطلب من العائلات استُبعد خبير كانت شركته حاصلة على شهادة من RINA، تفاديًا لأي تضارب في المصالح.\n\nوعيّنت العائلات ثمانية خبراء من جهتها في مجالات الاستقرار وبناء السفن والمناورة وإدارة السلامة والحرائق والانفجارات وسلامة الملاحة وعلوم البحار وسفن الركاب الدحرجية. وباتت RINA تدرج القضية في تقاريرها السنوية ضمن أبرز الحوادث والمخاطر المحتملة.',
      ),
    },
    {
      kind: 'textPhoto',
      title: L('A precedent: the Erika', 'Un precedente: l’Erika', 'Un précédent : l’Erika', 'سابقة: ناقلة «إريكا»'),
      text: L(
        'In 1999 the oil tanker Erika sank in the Bay of Biscay, devastating the coast of Brittany. RINA was her classification society. French courts held RINA criminally liable at every level, with a final ruling by the Court of Cassation on 25 September 2012. RINA later settled the compensation.',
        'Nel 1999 la petroliera Erika affondò nel Golfo di Biscaglia devastando le coste della Bretagna. Il RINA era il suo ente di classificazione. I tribunali francesi lo hanno ritenuto penalmente responsabile in tutti i gradi di giudizio, fino alla Cassazione il 25 settembre 2012. Il RINA ha poi chiuso la questione dei risarcimenti.',
        'En 1999, le pétrolier Erika a coulé dans le golfe de Gascogne, dévastant les côtes bretonnes. Le RINA était sa société de classification. La justice française l’a reconnu pénalement responsable à tous les degrés, jusqu’à l’arrêt de la Cour de cassation du 25 septembre 2012. Le RINA a ensuite réglé les indemnisations.',
        'في عام 1999 غرقت ناقلة النفط «إريكا» في خليج بسكاي ودمّرت سواحل بريتاني. كانت RINA هيئة تصنيفها. وأدانتها المحاكم الفرنسية جنائيًا في جميع درجات التقاضي، وصولًا إلى حكم محكمة النقض في 25 سبتمبر 2012. ثم سوّت RINA مسألة التعويضات.',
      ),
      photo: img('erika-sinking'),
      side: 'left',
      cta: { label: L('Erika rulings', 'Sentenze Erika', 'Décisions Erika', 'أحكام إريكا'), href: '/documents/' },
    },
  ],
};

const documentsPage: Page = {
  id: 'documents',
  status: 'published',
  sort: 4,
  slug: { en: 'documents', it: 'documenti', fr: 'documents', ar: 'documents' },
  title: L('Documents', 'Documenti', 'Documents', 'الوثائق'),
  home: false,
  inMenu: true,
  blocks: [
    {
      kind: 'text',
      title: L('The archive', 'L’archivio', 'Les archives', 'الأرشيف'),
      text: L(
        'Official reports, court rulings and records from the case, in their original language. Each document opens as a PDF.',
        'Rapporti ufficiali, sentenze e atti della causa, nella lingua originale. Ogni documento si apre in PDF.',
        'Rapports officiels, décisions de justice et pièces du dossier, dans leur langue d’origine. Chaque document s’ouvre en PDF.',
        'تقارير رسمية وأحكام قضائية ووثائق القضية بلغتها الأصلية. يُفتح كل مستند بصيغة PDF.',
      ),
    },
    { kind: 'documents', title: L('Investigations', 'Inchieste', 'Enquêtes', 'التحقيقات'), items: investigations },
    { kind: 'documents', title: L('Court rulings', 'Sentenze', 'Décisions de justice', 'الأحكام القضائية'), items: rulings },
    {
      kind: 'documents',
      title: L('The ruling in official reports', 'La sentenza nelle relazioni ufficiali', 'L’arrêt dans les rapports officiels', 'الحكم في التقارير الرسمية'),
      text: L(
        'The principles of these rulings are so important that they are cited in the annual reports of the EU Court of Justice, the Italian Superior School of the Judiciary and the Supreme Court.',
        'I principi di queste sentenze sono così importanti da essere citati nelle relazioni annuali della Corte di Giustizia UE, della Scuola superiore della Magistratura e della Cassazione.',
        'Les principes de ces arrêts sont si importants qu’ils sont cités dans les rapports annuels de la Cour de justice de l’UE, de l’École supérieure de la magistrature et de la Cour de cassation.',
        'مبادئ هذين الحكمين بالغة الأهمية، لذلك ورد ذكرهما في التقارير السنوية لمحكمة العدل الأوروبية والمدرسة العليا للقضاء ومحكمة النقض الإيطالية.',
      ),
      items: citedRulings,
    },
    { kind: 'documents', title: L('The Erika case', 'Il caso Erika', 'L’affaire Erika', 'قضية إريكا'), items: erika },
  ],
};

const pressPage: Page = {
  id: 'press',
  status: 'published',
  sort: 5,
  slug: { en: 'press', it: 'stampa', fr: 'presse', ar: 'press' },
  title: L('Press', 'Stampa', 'Presse', 'الصحافة'),
  home: false,
  inMenu: true,
  blocks: [
    { kind: 'documents', title: L('Press releases from the families', 'Comunicati delle famiglie', 'Communiqués des familles', 'بيانات العائلات الصحفية'), items: pressReleases },
    {
      kind: 'slider',
      title: L('Families and lawyers, 15 May 2024', 'Famiglie e avvocati, 15 maggio 2024', 'Familles et avocats, 15 mai 2024', 'العائلات والمحامون، 15 مايو 2024'),
      photos: [
        photo('meeting-2024-hall', 1600, 1200, L('The meeting with the families.', 'L’incontro con le famiglie.', 'La rencontre avec les familles.', 'اللقاء مع العائلات.')),
        photo('meeting-2024-panel', 1600, 720, L('The legal team presents the experts’ findings.', 'Il collegio legale presenta i risultati della perizia.', 'L’équipe juridique présente les conclusions des experts.', 'فريق الدفاع يعرض نتائج تقرير الخبراء.')),
        photo('meeting-2024-families', 1280, 576, L('Relatives of the victims.', 'Familiari delle vittime.', 'Proches des victimes.', 'أقارب الضحايا.')),
      ],
    },
    {
      kind: 'text',
      title: L('A word from our attorney', 'Le parole del nostro avvocato', 'Le mot de notre avocat', 'كلمة من محامينا'),
      text: L(
        '“We are doing everything we can to make sure justice is yours. You deserve it after all this time. This should not take 22 years, as the Exxon Valdez case did.”\n\nRobert L. Lieff, attorney, San Francisco and New York, visiting colleagues in Turin',
        '“Stiamo facendo tutto il possibile perché la giustizia sia vostra. Ve la meritate, dopo tutto questo tempo. Non dovrebbero volerci 22 anni come per il caso Exxon Valdez.”\n\nRobert L. Lieff, avvocato a San Francisco e New York, in visita ai colleghi di Torino',
        '« Nous faisons tout notre possible pour que justice vous soit rendue. Vous la méritez après tout ce temps. Cela ne devrait pas prendre 22 ans comme l’affaire de l’Exxon Valdez. »\n\nRobert L. Lieff, avocat à San Francisco et New York, en visite chez ses confrères à Turin',
        '«نبذل كل ما في وسعنا لتنالوا العدالة. أنتم تستحقونها بعد كل هذا الوقت. لا ينبغي أن يستغرق الأمر 22 عامًا كما حدث في قضية إكسون فالديز.»\n\nروبرت إل. ليف، محامٍ في سان فرانسيسكو ونيويورك، خلال زيارته لزملائه في تورينو',
      ),
    },
    { kind: 'documents', title: L('Italian press', 'Stampa italiana', 'Presse italienne', 'الصحافة الإيطالية'), items: italianPress },
    { kind: 'documents', title: L('Egyptian press', 'Stampa egiziana', 'Presse égyptienne', 'الصحافة المصرية'), items: egyptianPress },
    { kind: 'documents', title: L('International press', 'Stampa internazionale', 'Presse internationale', 'الصحافة الدولية'), items: foreignPress },
  ],
};

export const seed: { [N in keyof Collections]: Collections[N][] } = {
  products: [],
  locations: [],
  categories: [],
  projects: [],
  pages: [home, ship, timelinePage, theCase, documentsPage, pressPage],
  posts: [],
};
