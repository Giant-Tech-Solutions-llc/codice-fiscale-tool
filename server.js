const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const expressLayouts = require('express-ejs-layouts');
const { calcola, cercaComune } = require('./src/codiceFiscale');
const { decode: decodeCF, validate: validateCF } = require('./src/codiceFiscale.service');
const toolRoutes = require('./routes/tool.routes');
const createToolsRouter = require('./routes/tools');

const app = express();
const PORT = 5000;

const SITE_NAME = 'Codice Fiscale Online';
const SITE_EMAIL = 'info@codicefiscaleonline.com';
const SITE_LANG = 'it';

app.use(compression({ level: 6, threshold: 1024 }));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
}));
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: 0,
  etag: true,
  lastModified: true,
  setHeaders: function(res, filePath) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

function getSiteUrl(req) {
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  return protocol + '://' + req.get('host');
}

function getLocals(req, pageTitle, pageDescription, route) {
  const siteUrl = getSiteUrl(req);
  const now = new Date();
  return {
    siteName: SITE_NAME,
    siteEmail: SITE_EMAIL,
    siteLang: SITE_LANG,
    siteUrl,
    siteYear: now.getFullYear(),
    pageTitle,
    pageDescription,
    canonicalUrl: siteUrl + '/' + (route || ''),
    ogTitle: '',
    ogDescription: '',
    ogUrl: '',
    ogType: 'website',
    ogImage: '',
    structuredData: '',
    today: now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    todayISO: now.toISOString().split('T')[0],
    extraHead: '',
    cssVersion: Date.now()
  };
}

function jsonLd(obj) {
  return '<script type="application/ld+json">' + JSON.stringify(obj) + '</script>';
}

function buildOrganizationSchema(siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: siteUrl,
    logo: siteUrl + '/favicon.svg',
    email: SITE_EMAIL,
    sameAs: [],
    description: 'Strumento gratuito per il calcolo del Codice Fiscale italiano. Algoritmo ufficiale, nessuna registrazione richiesta.'
  };
}

function buildBreadcrumbSchema(siteUrl, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url ? siteUrl + item.url : undefined
    }))
  };
}

function buildToolSchema(siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Calcola Codice Fiscale Online',
    url: siteUrl + '/tools/codice-fiscale-generator',
    description: 'Genera il tuo Codice Fiscale italiano inserendo i tuoi dati anagrafici. Strumento gratuito, veloce e preciso con algoritmo ufficiale.',
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'All',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR'
    },
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: siteUrl
    },
    featureList: [
      'Calcolo Codice Fiscale con algoritmo ufficiale',
      'Ricerca comune di nascita con autocompletamento',
      'Copia negli appunti con un click',
      'Nessuna registrazione richiesta',
      'Gratuito e senza limiti di utilizzo'
    ],
    inLanguage: 'it'
  };
}

function buildFaqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a
      }
    }))
  };
}

const homeFaqs = [
  { q: "Cos'è il Codice Fiscale e a cosa serve?", a: "Il Codice Fiscale è un codice alfanumerico di 16 caratteri che identifica in modo univoco ogni persona fisica in Italia ai fini fiscali e amministrativi. Serve per contratti, dichiarazioni dei redditi, iscrizione al SSN e ogni rapporto con la Pubblica Amministrazione." },
  { q: 'Il Codice Fiscale generato online è ufficialmente valido?', a: "Il nostro strumento applica l'algoritmo ufficiale dell'Agenzia delle Entrate. Il risultato è corretto nella stragrande maggioranza dei casi. Tuttavia, in caso di omocodia, l'Agenzia assegna un codice modificato." },
  { q: 'I miei dati personali vengono salvati?', a: 'No. Il calcolo avviene in tempo reale e nessun dato personale viene memorizzato sui nostri server. Non utilizziamo cookie di profilazione e non condividiamo dati con terze parti.' },
  { q: 'Posso calcolare il CF per un cittadino straniero?', a: "Sì. Il Codice Fiscale può essere calcolato anche per cittadini stranieri, a condizione di conoscere il comune italiano o lo stato estero di nascita così come registrato nel database dell'Agenzia delle Entrate." },
  { q: 'Cosa significa omocodia e come si risolve?', a: "L'omocodia si verifica quando due o più persone generano lo stesso Codice Fiscale. L'Agenzia delle Entrate risolve il conflitto sostituendo uno o più caratteri numerici con lettere secondo una tabella predefinita." },
  { q: 'Come posso recuperare il Codice Fiscale se l\'ho smarrito?', a: "Puoi recuperare il tuo Codice Fiscale online tramite il sito dell'Agenzia delle Entrate, recandoti di persona presso un ufficio dell'Agenzia, oppure chiamando il numero verde 800.90.96.96." }
];

const pillarFaqs = [
  { q: 'Quanti caratteri ha il Codice Fiscale?', a: 'Il Codice Fiscale delle persone fisiche è composto da 16 caratteri alfanumerici. Le persone giuridiche hanno un codice numerico di 11 cifre.' },
  { q: 'Il Codice Fiscale può cambiare nel tempo?', a: 'In linea generale il Codice Fiscale rimane invariato per tutta la vita. Può essere modificato solo in caso di correzione di errori anagrafici, rettifica del sesso, o per risolvere una situazione di omocodia.' },
  { q: 'Come si calcola il carattere di controllo?', a: 'I primi 15 caratteri del CF vengono convertiti in valori numerici usando due tabelle distinte per le posizioni pari e dispari. La somma totale viene divisa per 26 e il resto determina la lettera di controllo.' },
  { q: "Che differenza c'è tra tessera sanitaria e Codice Fiscale?", a: 'La tessera sanitaria è il documento fisico su cui è stampato il Codice Fiscale. Il CF è il codice in sé. La tessera sanitaria ha anche funzione di Carta Nazionale dei Servizi per l\'accesso ai servizi digitali della PA.' },
  { q: 'Un calcolatore online è affidabile?', a: "I calcolatori online come il nostro applicano lo stesso algoritmo usato dall'Agenzia delle Entrate e producono risultati corretti nella quasi totalità dei casi. L'unica eccezione riguarda le omocodie." },
  { q: 'Dove trovo il codice catastale del mio comune?', a: "Il codice catastale di ogni comune italiano è consultabile sul sito dell'Agenzia delle Entrate o dell'ISTAT. Il nostro strumento include un database aggiornato con tutti i codici catastali." }
];

const routeBreadcrumbs = {
  '': [{ name: 'Home', url: '/' }],
  'calcola': [{ name: 'Home', url: '/' }, { name: 'Calcola Codice Fiscale' }],
  'codice-fiscale': [{ name: 'Home', url: '/' }, { name: 'Guida Codice Fiscale' }],
  'cos-e-il-codice-fiscale': [{ name: 'Home', url: '/' }, { name: 'Guida', url: '/codice-fiscale' }, { name: "Cos'è il Codice Fiscale" }],
  'come-si-calcola-il-codice-fiscale': [{ name: 'Home', url: '/' }, { name: 'Guida', url: '/codice-fiscale' }, { name: 'Come si Calcola' }],
  'codice-fiscale-vs-partita-iva': [{ name: 'Home', url: '/' }, { name: 'Guida', url: '/codice-fiscale' }, { name: 'CF vs Partita IVA' }],
  'codice-fiscale-estero': [{ name: 'Home', url: '/' }, { name: 'Guida', url: '/codice-fiscale' }, { name: 'CF per Stranieri' }],
  'recupero-codice-fiscale': [{ name: 'Home', url: '/' }, { name: 'Guida', url: '/codice-fiscale' }, { name: 'Recupero CF' }],
  'utilizzi-legali-codice-fiscale': [{ name: 'Home', url: '/' }, { name: 'Guida', url: '/codice-fiscale' }, { name: 'Utilizzi Legali' }],
  'esempi-codice-fiscale': [{ name: 'Home', url: '/' }, { name: 'Guida', url: '/codice-fiscale' }, { name: 'Esempi' }],
  'guida/codice-fiscale-inverso': [{ name: 'Home', url: '/' }, { name: 'Guide', url: '/codice-fiscale' }, { name: 'Codice Fiscale Inverso' }],
  'guida/verifica-codice-fiscale': [{ name: 'Home', url: '/' }, { name: 'Guide', url: '/codice-fiscale' }, { name: 'Verifica Codice Fiscale' }],
  'guida/come-si-calcola': [{ name: 'Home', url: '/' }, { name: 'Guide', url: '/codice-fiscale' }, { name: 'Come si Calcola' }],
  'guida/struttura': [{ name: 'Home', url: '/' }, { name: 'Guide', url: '/codice-fiscale' }, { name: 'Struttura del CF' }],
  'guida/come-leggere': [{ name: 'Home', url: '/' }, { name: 'Guide', url: '/codice-fiscale' }, { name: 'Come Leggere il CF' }],
  'guida/lettere-mesi': [{ name: 'Home', url: '/' }, { name: 'Guide', url: '/codice-fiscale' }, { name: 'Lettere dei Mesi' }],
  'guida/donna-uomo': [{ name: 'Home', url: '/' }, { name: 'Guide', url: '/codice-fiscale' }, { name: 'CF Donna e Uomo' }],
  'guida/cose-il-codice-fiscale': [{ name: 'Home', url: '/' }, { name: 'Guide', url: '/codice-fiscale' }, { name: "Cos'è il Codice Fiscale" }],
  'guida/come-trovare': [{ name: 'Home', url: '/' }, { name: 'Guide', url: '/codice-fiscale' }, { name: 'Come Trovare il CF' }],
  'guida/neonato': [{ name: 'Home', url: '/' }, { name: 'Guide', url: '/codice-fiscale' }, { name: 'CF per Neonati' }],
  'chi-siamo': [{ name: 'Home', url: '/' }, { name: 'Chi Siamo' }],
  'contatti': [{ name: 'Home', url: '/' }, { name: 'Contatti' }],
  'privacy-policy': [{ name: 'Home', url: '/' }, { name: 'Privacy Policy' }],
  'termini-condizioni': [{ name: 'Home', url: '/' }, { name: 'Termini e Condizioni' }],
  'disclaimer': [{ name: 'Home', url: '/' }, { name: 'Disclaimer' }],
  'cookie-policy': [{ name: 'Home', url: '/' }, { name: 'Cookie Policy' }],
  'dmca': [{ name: 'Home', url: '/' }, { name: 'DMCA' }],
  'politica-editoriale': [{ name: 'Home', url: '/' }, { name: 'Politica Editoriale' }],
  'gdpr': [{ name: 'Home', url: '/' }, { name: 'GDPR' }],
  'mappa-del-sito': [{ name: 'Home', url: '/' }, { name: 'Mappa del Sito' }],
  'blog': [{ name: 'Home', url: '/' }, { name: 'Blog' }],
  'blog/come-si-calcola-il-codice-fiscale': [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: 'Come Si Calcola il CF' }],
  'blog/composizione-codice-fiscale': [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: 'Composizione del CF' }],
  'blog/come-leggere-il-codice-fiscale': [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: 'Come Leggere il CF' }],
  'blog/mesi-codice-fiscale': [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: 'Mesi nel CF' }],
  'blog/codice-fiscale-donna': [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: 'CF Donna' }],
  'blog/cose-il-codice-fiscale': [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: "Cos'è il CF" }],
  'blog/come-trovare-il-codice-fiscale': [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: 'Come Trovare il CF' }],
  'blog/codice-fiscale-neonato': [{ name: 'Home', url: '/' }, { name: 'Blog', url: '/blog' }, { name: 'CF Neonato' }]
};

function getStructuredData(siteUrl, routeKey) {
  const schemas = [];
  schemas.push(jsonLd(buildOrganizationSchema(siteUrl)));
  const crumbs = routeBreadcrumbs[routeKey];
  if (crumbs) {
    schemas.push(jsonLd(buildBreadcrumbSchema(siteUrl, crumbs)));
  }
  if (routeKey === '' || routeKey === 'calcola') {
    schemas.push(jsonLd(buildToolSchema(siteUrl)));
  }
  if (routeKey === '') {
    schemas.push(jsonLd(buildFaqSchema(homeFaqs)));
  }
  if (routeKey === 'calcola') {
    schemas.push(jsonLd(buildFaqSchema([
      { q: 'Quali dati servono per calcolare un codice fiscale?', a: 'Servono esattamente cinque informazioni: cognome, nome, sesso, data di nascita (giorno, mese, anno) e luogo di nascita (comune italiano o stato estero). Senza tutti e cinque i dati non è possibile generare un codice fiscale valido e completo.' },
      { q: 'Come si calcola il codice fiscale?', a: "Il codice fiscale si calcola in sei passaggi: (1) estrarre le prime tre consonanti del cognome; (2) estrarre tre consonanti dal nome con una regola speciale per nomi con 4+ consonanti; (3) prendere le ultime due cifre dell'anno di nascita; (4) convertire il mese di nascita nella lettera corrispondente; (5) codificare il giorno di nascita, sommando 40 per le femmine; (6) usare il codice catastale Belfiore per il comune o stato estero." },
      { q: 'Il codice fiscale calcolato è affidabile?', a: "Il codice fiscale calcolato è affidabile nella stragrande maggioranza dei casi, poiché lo strumento applica lo stesso algoritmo ufficiale. L'unica eccezione è l'omocodia: quando due persone condividono tutti i dati anagrafici, l'Agenzia delle Entrate assegna un codice modificato noto solo al loro database." },
      { q: 'Come influisce il sesso sul codice fiscale?', a: 'Il sesso influenza i caratteri 10–11 del codice fiscale. Per i maschi, le due cifre mostrano direttamente il giorno di nascita (01–31). Per le femmine, al giorno viene sommato 40 (41–71).' },
      { q: 'I miei dati vengono salvati durante il calcolo?', a: 'No. Il calcolo viene eseguito localmente nel browser. Nessun dato personale viene inviato ai server, memorizzato in alcun database, o elaborato in alcun modo oltre alla generazione del codice sullo schermo.' }
    ])));
  }
  if (routeKey === 'codice-fiscale') {
    schemas.push(jsonLd(buildFaqSchema(pillarFaqs)));
  }
  if (routeKey === 'guida/codice-fiscale-inverso') {
    schemas.push(jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Guida Completa al Codice Fiscale Inverso',
      description: 'Come decodificare un codice fiscale italiano: data di nascita, sesso, comune di nascita e analisi carattere per carattere.',
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: siteUrl + '/' },
      url: siteUrl + '/guida/codice-fiscale-inverso'
    }));
    schemas.push(jsonLd(buildFaqSchema([
      { q: 'Come si risale alla data di nascita dal codice fiscale?', a: 'I caratteri 7–8 danno le ultime due cifre dell\'anno, il carattere 9 dà il mese tramite codice lettera, e i caratteri 10–11 danno il giorno (per le femmine bisogna sottrarre 40).' },
      { q: 'Posso risalire al nome e cognome dal CF inverso?', a: 'No, non è possibile risalire con certezza al nome e cognome completi, poiché vengono codificate solo alcune consonanti/vocali che non identificano univocamente le parole originali.' },
      { q: 'Il CF inverso funziona anche per stranieri?', a: 'Sì. Se il codice catastale inizia con "Z", indica uno stato estero. Il nostro strumento riconosce e mostra il codice catastale, che puoi confrontare con l\'elenco ufficiale degli stati esteri.' }
    ])));
  }
  if (routeKey === 'guida/verifica-codice-fiscale') {
    schemas.push(jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Come Verificare un Codice Fiscale – Guida Completa alla Validazione CF',
      description: 'Come verificare se un codice fiscale italiano è formalmente valido: struttura, carattere di controllo, errori comuni e validatore online gratuito.',
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: siteUrl + '/' },
      url: siteUrl + '/guida/verifica-codice-fiscale'
    }));
    schemas.push(jsonLd(buildFaqSchema([
      { q: 'Come faccio a sapere se il mio codice fiscale è corretto?', a: 'Puoi usare il nostro strumento gratuito di verifica: inserisci il CF e riceverai immediatamente una risposta sulla sua validità formale. Per la verifica anagrafica ufficiale, rivolgiti all\'Agenzia delle Entrate.' },
      { q: 'Un CF valido formalmente è sicuramente il mio CF ufficiale?', a: 'Non necessariamente. La validazione formale conferma che la struttura è corretta, ma non può verificare l\'associazione con la tua identità nei registri ufficiali.' },
      { q: 'Perché il mio CF viene indicato come non valido?', a: 'Le cause più comuni sono: errore di trascrizione nell\'ultimo carattere (il carattere di controllo), lunghezza sbagliata, confusione tra O/0 o I/1, o un codice mese non valido.' },
      { q: 'La verifica del CF è sicura per la privacy?', a: 'Sì, tutta l\'elaborazione avviene nel browser. Nessun dato viene trasmesso ai nostri server. Non salviamo né registriamo alcun codice fiscale inserito.' }
    ])));
  }
  if (routeKey === 'guida/come-si-calcola') {
    schemas.push(jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Come si Calcola il Codice Fiscale: Algoritmo Completo',
      description: "Spiegazione dettagliata dell'algoritmo di calcolo del codice fiscale italiano: estrazione consonanti, codifica data, codice catastale e carattere di controllo.",
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: siteUrl + '/' },
      url: siteUrl + '/guida/come-si-calcola'
    }));
    schemas.push(jsonLd(buildFaqSchema([
      { q: 'Come funziona il calcolo del codice fiscale?', a: "Il CF viene calcolato con un algoritmo che estrae consonanti e vocali da cognome e nome, codifica anno/mese/giorno di nascita, aggiunge il codice catastale del comune e calcola un carattere di controllo finale." },
      { q: "Cosa succede se il cognome ha meno di 3 consonanti?", a: "Se le consonanti non bastano, si aggiungono le vocali nell'ordine in cui compaiono. Se anche le vocali non bastano, si completa con la lettera X." },
      { q: "Cos'è l'omocodia nel codice fiscale?", a: "L'omocodia si verifica quando due persone generano lo stesso CF. In tal caso, l'Agenzia delle Entrate sostituisce uno o più caratteri numerici con lettere secondo una tabella ufficiale." }
    ])));
  }
  if (routeKey === 'guida/struttura') {
    schemas.push(jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Struttura del Codice Fiscale: I 16 Caratteri Spiegati',
      description: 'Analisi dettagliata della struttura del codice fiscale italiano: significato di ogni carattere, posizione per posizione.',
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: siteUrl + '/' },
      url: siteUrl + '/guida/struttura'
    }));
    schemas.push(jsonLd(buildFaqSchema([
      { q: 'Quanti caratteri ha il codice fiscale?', a: 'Il codice fiscale è composto da 16 caratteri alfanumerici: 6 lettere per cognome e nome, 2 cifre per anno, 1 lettera per mese, 2 cifre per giorno/sesso, 4 caratteri per comune, 1 lettera di controllo.' },
      { q: "Cosa indica l'ultimo carattere del CF?", a: "L'ultimo carattere è il carattere di controllo, calcolato con un algoritmo specifico sui primi 15 caratteri. Serve a verificare che il codice non contenga errori di trascrizione." }
    ])));
  }
  if (routeKey === 'guida/come-leggere') {
    schemas.push(jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Come Leggere il Codice Fiscale: Guida Pratica',
      description: 'Guida pratica passo-passo per leggere e interpretare un codice fiscale italiano con esempi concreti.',
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: siteUrl + '/' },
      url: siteUrl + '/guida/come-leggere'
    }));
    schemas.push(jsonLd(buildFaqSchema([
      { q: 'Come si legge il codice fiscale?', a: 'Si leggono i primi 3 caratteri per il cognome, i successivi 3 per il nome, poi anno, mese e giorno di nascita, il codice catastale del comune e infine il carattere di controllo.' },
      { q: 'Si può risalire al nome dal codice fiscale?', a: "No, dal CF si possono ricavare solo alcune consonanti/vocali del nome e cognome, non le parole complete. Il CF non è univocamente invertibile per nome e cognome." }
    ])));
  }
  if (routeKey === 'guida/lettere-mesi') {
    schemas.push(jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Lettere dei Mesi nel Codice Fiscale: Tabella Completa',
      description: 'Tabella completa delle lettere che rappresentano i mesi nel codice fiscale italiano: da A (Gennaio) a T (Dicembre).',
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: siteUrl + '/' },
      url: siteUrl + '/guida/lettere-mesi'
    }));
    schemas.push(jsonLd(buildFaqSchema([
      { q: 'Quali lettere corrispondono ai mesi nel codice fiscale?', a: 'Gennaio=A, Febbraio=B, Marzo=C, Aprile=D, Maggio=E, Giugno=H, Luglio=L, Agosto=M, Settembre=P, Ottobre=R, Novembre=S, Dicembre=T.' },
      { q: 'Perché non si usano lettere consecutive?', a: "Le lettere F, G, I, J, K, N, O, Q vengono saltate per evitare confusioni con numeri e altri caratteri usati nel codice fiscale." }
    ])));
  }
  if (routeKey === 'guida/donna-uomo') {
    schemas.push(jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Codice Fiscale Donna e Uomo: Le Differenze',
      description: 'Come distinguere il codice fiscale di un uomo da quello di una donna: la regola del giorno +40 e esempi pratici.',
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: siteUrl + '/' },
      url: siteUrl + '/guida/donna-uomo'
    }));
    schemas.push(jsonLd(buildFaqSchema([
      { q: 'Come si distingue il CF di un uomo da quello di una donna?', a: 'Nel CF femminile, al giorno di nascita viene aggiunto 40. Quindi se il giorno è maggiore di 40, il CF appartiene a una donna.' },
      { q: 'Perché si aggiunge 40 al giorno per le donne?', a: "Il numero 40 è stato scelto perché nessun mese ha più di 31 giorni, quindi valori da 41 a 71 identificano univocamente il sesso femminile senza ambiguità." }
    ])));
  }
  if (routeKey === 'guida/cose-il-codice-fiscale') {
    schemas.push(jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: "Cos'è il Codice Fiscale Italiano: Guida Completa",
      description: "Cos'è il codice fiscale, storia, base legale (DPR 605/1973), chi lo deve avere e differenza con la Partita IVA.",
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: siteUrl + '/' },
      url: siteUrl + '/guida/cose-il-codice-fiscale'
    }));
    schemas.push(jsonLd(buildFaqSchema([
      { q: "Cos'è il codice fiscale?", a: "Il codice fiscale è un codice alfanumerico di 16 caratteri che identifica in modo univoco le persone fisiche nei rapporti con gli enti e le amministrazioni pubbliche italiane." },
      { q: 'Chi deve avere il codice fiscale?', a: 'Tutti i cittadini italiani e gli stranieri che hanno rapporti fiscali, lavorativi o burocratici in Italia devono avere un codice fiscale.' },
      { q: "Qual è la differenza tra codice fiscale e Partita IVA?", a: "Il codice fiscale identifica le persone fisiche, la Partita IVA identifica chi svolge attività economica. Il CF ha 16 caratteri alfanumerici, la Partita IVA ha 11 cifre." }
    ])));
  }
  if (routeKey === 'guida/come-trovare') {
    schemas.push(jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Come Trovare il Codice Fiscale: Tutti i Metodi',
      description: 'Come trovare e ottenere il proprio codice fiscale: tessera sanitaria, Agenzia delle Entrate, SPID, app IO e calcolo online.',
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: siteUrl + '/' },
      url: siteUrl + '/guida/come-trovare'
    }));
    schemas.push(jsonLd(buildFaqSchema([
      { q: 'Dove trovo il mio codice fiscale?', a: "Il CF è stampato sulla tessera sanitaria (fronte e retro con codice a barre). Puoi anche trovarlo su documenti fiscali, CUD, dichiarazioni dei redditi o richiederlo all'Agenzia delle Entrate." },
      { q: 'Posso trovare il CF online?', a: "Puoi calcolare il CF con il nostro strumento gratuito, oppure accedere al portale dell'Agenzia delle Entrate con SPID/CIE per ottenere il tuo CF ufficiale." }
    ])));
  }
  if (routeKey === 'guida/neonato') {
    schemas.push(jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Codice Fiscale per Neonati: Quando e Come Ottenerlo',
      description: 'Come e quando viene assegnato il codice fiscale ai neonati: procedura ospedaliera, comune, tessera sanitaria e tempistiche.',
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: siteUrl + '/' },
      url: siteUrl + '/guida/neonato'
    }));
    schemas.push(jsonLd(buildFaqSchema([
      { q: 'Quando viene assegnato il CF al neonato?', a: "Il codice fiscale viene assegnato automaticamente al momento della dichiarazione di nascita, solitamente in ospedale entro 3 giorni dalla nascita." },
      { q: 'Devo richiedere il CF per il mio neonato?', a: "No, il CF viene attribuito automaticamente dall'Agenzia delle Entrate dopo la registrazione della nascita. L'ospedale o il comune trasmettono i dati." },
      { q: 'Quando arriva la tessera sanitaria del neonato?', a: "La tessera sanitaria viene spedita a casa entro 2-3 settimane dalla nascita. Nel frattempo, il CF è comunque valido e utilizzabile." }
    ])));
  }
  const blogArticles = {
    'blog/come-si-calcola-il-codice-fiscale': {
      headline: 'Come Si Calcola il Codice Fiscale: Guida Completa e Pratica',
      description: 'Guida completa al calcolo del codice fiscale italiano: regole per cognome, nome, data di nascita, comune e carattere di controllo con esempi reali.',
      faqs: [
        { q: 'Quali dati servono per calcolare il codice fiscale?', a: 'Servono 5 dati: cognome, nome, sesso, data di nascita e luogo di nascita (comune italiano o stato estero).' },
        { q: 'Come si estraggono le lettere dal cognome?', a: 'Si prendono le prime 3 consonanti del cognome. Se le consonanti sono meno di 3, si aggiungono le vocali. Se le lettere totali sono meno di 3, si completa con X.' },
        { q: 'Il codice fiscale calcolato online è valido?', a: "Nella maggior parte dei casi sì, ma in casi di omocodia l'Agenzia delle Entrate assegna un codice diverso che i calcolatori online non possono conoscere." }
      ]
    },
    'blog/composizione-codice-fiscale': {
      headline: 'Composizione del Codice Fiscale: Struttura dei 16 Caratteri Spiegata',
      description: 'Struttura completa dei 16 caratteri del codice fiscale italiano: cosa rappresenta ogni posizione, tabelle di riferimento e regole di composizione.',
      faqs: [
        { q: 'Come è composto il codice fiscale?', a: 'Il codice fiscale è composto da 16 caratteri: 3 lettere per il cognome, 3 per il nome, 2 numeri per anno, 1 lettera per mese, 2 numeri per giorno/sesso, 4 caratteri per comune e 1 lettera di controllo.' },
        { q: 'Quante lettere e numeri ha il codice fiscale?', a: 'Il codice fiscale standard contiene 9 lettere e 7 numeri per un totale di 16 caratteri.' },
        { q: "Cos'è un codice fiscale a 11 cifre?", a: 'Un codice fiscale a 11 cifre è assegnato alle persone giuridiche (società, organizzazioni). È composto solo da numeri.' }
      ]
    },
    'blog/come-leggere-il-codice-fiscale': {
      headline: 'Come Leggere il Codice Fiscale: Guida Completa alla Decodifica',
      description: 'Come leggere e decodificare un codice fiscale italiano: estrarre cognome, nome, data di nascita, sesso e comune dai 16 caratteri.',
      faqs: [
        { q: 'Come decodificare il codice fiscale?', a: 'Analizza i 7 blocchi: le prime 3 lettere per il cognome, le successive 3 per il nome, 2 numeri per anno, 1 lettera per mese, 2 numeri per giorno/sesso, 4 caratteri per luogo e 1 lettera di controllo.' },
        { q: 'Come si legge il mese nel codice fiscale?', a: 'Il mese è indicato dalla lettera in posizione 9: A=Gennaio, B=Febbraio, C=Marzo, D=Aprile, E=Maggio, H=Giugno, L=Luglio, M=Agosto, P=Settembre, R=Ottobre, S=Novembre, T=Dicembre.' },
        { q: 'Si può risalire al nome dal codice fiscale?', a: 'No, dal CF si possono ricavare solo alcune consonanti/vocali, non il nome completo. Più nomi possono produrre le stesse lettere.' }
      ]
    },
    'blog/mesi-codice-fiscale': {
      headline: 'Mesi nel Codice Fiscale: Tabella Completa delle Lettere da A a T',
      description: 'Tabella completa delle lettere che rappresentano i mesi nel codice fiscale italiano: da A (Gennaio) a T (Dicembre), con spiegazione dettagliata.',
      faqs: [
        { q: 'Quali lettere corrispondono ai mesi nel codice fiscale?', a: 'A=Gennaio, B=Febbraio, C=Marzo, D=Aprile, E=Maggio, H=Giugno, L=Luglio, M=Agosto, P=Settembre, R=Ottobre, S=Novembre, T=Dicembre.' },
        { q: 'Perché le lettere dei mesi non sono consecutive?', a: 'Le lettere F, G, I, N, O, Q vengono saltate per evitare confusione con numeri e altri caratteri usati nel codice fiscale.' }
      ]
    },
    'blog/codice-fiscale-donna': {
      headline: 'Codice Fiscale Donna: Come Si Calcola e Differenza con Uomo',
      description: 'Come funziona il codice fiscale femminile: la regola del +40 al giorno di nascita, differenze con il codice maschile ed esempi pratici.',
      faqs: [
        { q: 'Come si distingue il CF di un uomo da quello di una donna?', a: 'Nel CF femminile, al giorno di nascita viene aggiunto 40. Valori da 01 a 31 indicano un uomo, da 41 a 71 indicano una donna.' },
        { q: 'Perché si aggiunge 40 al giorno per le donne?', a: 'Il numero 40 è stato scelto perché nessun mese ha più di 31 giorni, quindi valori da 41 a 71 identificano univocamente il sesso femminile.' }
      ]
    },
    'blog/cose-il-codice-fiscale': {
      headline: "Cos'è il Codice Fiscale: Guida Completa al CF Italiano",
      description: "Guida completa al codice fiscale italiano: cos'è, a cosa serve, chi lo rilascia, dove trovarlo e come funziona per stranieri.",
      faqs: [
        { q: "Cos'è il codice fiscale?", a: "Il codice fiscale è un codice univoco di 16 caratteri alfanumerici assegnato a ogni persona fisica in Italia per identificarla nei rapporti con lo Stato." },
        { q: 'Chi rilascia il codice fiscale?', a: "L'unico ente autorizzato è l'Agenzia delle Entrate. Per i neonati viene assegnato automaticamente tramite il Comune di nascita." },
        { q: 'Il codice fiscale scade?', a: 'No, il codice fiscale non scade mai. Quello che può scadere è la Tessera Sanitaria, ma il CF stampato su di essa resta sempre valido.' }
      ]
    },
    'blog/come-trovare-il-codice-fiscale': {
      headline: 'Come Trovare il Codice Fiscale di una Persona: Guida Completa',
      description: 'I 5 dati obbligatori per calcolare un codice fiscale, i metodi per trovarlo online e offline, e le regole di privacy da rispettare.',
      faqs: [
        { q: 'Come trovare un CF solo con nome e cognome?', a: 'Non è possibile. Servono obbligatoriamente 5 dati completi: nome, cognome, sesso, data di nascita e luogo di nascita.' },
        { q: 'Dove trovo il mio codice fiscale?', a: 'Sulla Tessera Sanitaria, nell\'app IO, sul sito dell\'Agenzia delle Entrate con SPID, su buste paga o dichiarazioni dei redditi.' }
      ]
    },
    'blog/codice-fiscale-neonato': {
      headline: 'Codice Fiscale Neonato: Come Richiederlo Online e Offline',
      description: 'Come richiedere il codice fiscale per un neonato: procedura online e offline, documenti necessari, tempi di rilascio e Tessera Sanitaria.',
      faqs: [
        { q: 'Come si richiede il codice fiscale per un neonato?', a: "Il CF viene attribuito automaticamente dal Comune alla registrazione della nascita. Se urgente, si può richiedere online tramite l'Agenzia delle Entrate con SPID/CIE/CNS." },
        { q: 'Quanto tempo ci vuole per ricevere il CF del neonato?', a: 'Richiedendo online, il certificato è disponibile in 2-5 giorni lavorativi. Di persona, il rilascio è immediato.' }
      ]
    }
  };
  if (blogArticles[routeKey]) {
    const ba = blogArticles[routeKey];
    schemas.push(jsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: ba.headline,
      description: ba.description,
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: siteUrl + '/' },
      url: siteUrl + '/' + routeKey
    }));
    schemas.push(jsonLd(buildFaqSchema(ba.faqs)));
  }
  return schemas.join('\n');
}

const routes = {
  '': { page: 'home', title: 'Calcola Codice Fiscale Online Gratis | ' + SITE_NAME, description: 'Calcola il tuo Codice Fiscale italiano online gratis. Strumento veloce, preciso e facile da usare. Genera il codice fiscale in pochi secondi.' },
  'calcola': { page: 'tool', title: 'Calcola Codice Fiscale Online Gratis – Generatore CF | ' + SITE_NAME, description: 'Calcola il codice fiscale italiano online gratis: inserisci cognome, nome, data e luogo di nascita e genera il CF in pochi secondi. Strumento gratuito basato su algoritmo ufficiale.' },
  'codice-fiscale': { page: 'codice-fiscale-pillar', title: 'Codice Fiscale: Guida Completa al Codice Fiscale Italiano | ' + SITE_NAME, description: "Guida completa al Codice Fiscale italiano: cos'è, come si calcola, come ottenerlo, recuperarlo e quando è obbligatorio. Aggiornata al " + new Date().getFullYear() + '.' },
  'cos-e-il-codice-fiscale': { page: 'articles/what-is-codice-fiscale', title: "Cos'è il Codice Fiscale? Guida Completa | " + SITE_NAME, description: "Scopri cos'è il Codice Fiscale italiano, a cosa serve, come è composto e perché è fondamentale per ogni cittadino e residente in Italia." },
  'come-si-calcola-il-codice-fiscale': { page: 'articles/how-is-codice-fiscale-calculated', title: 'Come si Calcola il Codice Fiscale? Spiegazione Completa | ' + SITE_NAME, description: "Guida dettagliata su come viene calcolato il Codice Fiscale italiano. Scopri l'algoritmo, le regole e ogni passaggio del calcolo." },
  'codice-fiscale-vs-partita-iva': { page: 'articles/codice-fiscale-vs-partita-iva', title: 'Codice Fiscale vs Partita IVA: Differenze | ' + SITE_NAME, description: "Qual è la differenza tra Codice Fiscale e Partita IVA? Scopri quando serve l'uno o l'altro e le differenze fondamentali." },
  'codice-fiscale-estero': { page: 'articles/codice-fiscale-abroad', title: "Codice Fiscale per Stranieri e Residenti all'Estero | " + SITE_NAME, description: "Come ottenere il Codice Fiscale se sei straniero o residente all'estero. Guida completa con procedure e documenti necessari." },
  'recupero-codice-fiscale': { page: 'articles/lost-codice-fiscale-recovery', title: 'Come Recuperare il Codice Fiscale Smarrito | ' + SITE_NAME, description: "Hai perso il Codice Fiscale? Scopri come recuperarlo online, presso l'Agenzia delle Entrate o tramite altri canali ufficiali." },
  'utilizzi-legali-codice-fiscale': { page: 'articles/legal-use-cases', title: 'Utilizzi Legali del Codice Fiscale | ' + SITE_NAME, description: 'Scopri tutti gli utilizzi legali del Codice Fiscale: contratti, dichiarazioni fiscali, sanità e molto altro.' },
  'esempi-codice-fiscale': { page: 'articles/examples-breakdown', title: 'Esempi di Codice Fiscale con Spiegazione | ' + SITE_NAME, description: 'Esempi pratici di Codice Fiscale con spiegazione dettagliata di ogni carattere. Impara a leggere e capire il codice fiscale.' },
  'privacy-policy': { page: 'privacy', title: 'Privacy Policy | ' + SITE_NAME, description: 'Informativa sulla privacy di ' + SITE_NAME + '. Scopri come trattiamo i tuoi dati personali.' },
  'termini-condizioni': { page: 'terms', title: 'Termini e Condizioni | ' + SITE_NAME, description: "Termini e condizioni d'uso del sito " + SITE_NAME + '.' },
  'disclaimer': { page: 'disclaimer', title: 'Disclaimer | ' + SITE_NAME, description: 'Disclaimer legale di ' + SITE_NAME + '. Limitazioni di responsabilità e avvertenze.' },
  'chi-siamo': { page: 'about', title: 'Chi Siamo | ' + SITE_NAME, description: 'Scopri chi siamo e la nostra missione. ' + SITE_NAME + ' offre strumenti gratuiti per il calcolo del Codice Fiscale.' },
  'contatti': { page: 'contact', title: 'Contatti | ' + SITE_NAME, description: 'Contattaci per domande, suggerimenti o segnalazioni. Siamo qui per aiutarti.' },
  'cookie-policy': { page: 'cookie-policy', title: 'Cookie Policy | ' + SITE_NAME, description: "Informativa sull'uso dei cookie su " + SITE_NAME + '.' },
  'dmca': { page: 'dmca', title: 'DMCA Policy | ' + SITE_NAME, description: 'DMCA policy e procedura di segnalazione per violazioni di copyright.' },
  'politica-editoriale': { page: 'editorial-policy', title: 'Politica Editoriale | ' + SITE_NAME, description: 'La nostra politica editoriale. Come creiamo e verifichiamo i contenuti.' },
  'gdpr': { page: 'gdpr', title: 'Informativa GDPR | ' + SITE_NAME, description: 'Informativa sul trattamento dei dati personali ai sensi del GDPR.' },
  'mappa-del-sito': { page: 'sitemap-html', title: 'Mappa del Sito | ' + SITE_NAME, description: 'Mappa del sito completa di ' + SITE_NAME + '. Trova tutte le pagine.' },
  'guida/codice-fiscale-inverso': { page: 'guides/guide-inverso', title: 'Guida Completa al Codice Fiscale Inverso – Come Decodificare il CF | ' + SITE_NAME, description: 'Guida completa al calcolo del codice fiscale inverso: come funziona la decodifica, cosa si può ricavare dal CF, tabella mesi, esempio pratico e strumento online gratuito.' },
  'guida/verifica-codice-fiscale': { page: 'guides/guide-verifica', title: 'Come Verificare un Codice Fiscale – Guida Completa alla Validazione CF | ' + SITE_NAME, description: 'Guida completa su come verificare un codice fiscale italiano: struttura, algoritmo del carattere di controllo, errori comuni e strumento di verifica online gratuito.' },
  'guida/come-si-calcola': { page: 'guides/guida-come-si-calcola', title: 'Come si Calcola il Codice Fiscale: Algoritmo Completo | ' + SITE_NAME, description: "Spiegazione dettagliata dell'algoritmo di calcolo del codice fiscale italiano: estrazione consonanti, codifica data, codice catastale e carattere di controllo." },
  'guida/struttura': { page: 'guides/guida-struttura', title: 'Struttura del Codice Fiscale: I 16 Caratteri Spiegati | ' + SITE_NAME, description: 'Analisi dettagliata della struttura del codice fiscale italiano: significato di ogni carattere, posizione per posizione.' },
  'guida/come-leggere': { page: 'guides/guida-come-leggere', title: 'Come Leggere il Codice Fiscale: Guida Pratica | ' + SITE_NAME, description: 'Guida pratica passo-passo per leggere e interpretare un codice fiscale italiano con esempi concreti.' },
  'guida/lettere-mesi': { page: 'guides/guida-lettere-mesi', title: 'Lettere dei Mesi nel Codice Fiscale: Tabella Completa | ' + SITE_NAME, description: 'Tabella completa delle lettere che rappresentano i mesi nel codice fiscale italiano: da A (Gennaio) a T (Dicembre).' },
  'guida/donna-uomo': { page: 'guides/guida-donna-uomo', title: 'Codice Fiscale Donna e Uomo: Le Differenze | ' + SITE_NAME, description: 'Come distinguere il codice fiscale di un uomo da quello di una donna: la regola del giorno +40 e esempi pratici.' },
  'guida/cose-il-codice-fiscale': { page: 'guides/guida-cose-il-codice-fiscale', title: "Cos'è il Codice Fiscale Italiano: Guida Completa | " + SITE_NAME, description: "Cos'è il codice fiscale, storia, base legale (DPR 605/1973), chi lo deve avere e differenza con la Partita IVA." },
  'guida/come-trovare': { page: 'guides/guida-come-trovare', title: 'Come Trovare il Codice Fiscale: Tutti i Metodi | ' + SITE_NAME, description: 'Come trovare e ottenere il proprio codice fiscale: tessera sanitaria, Agenzia delle Entrate, SPID, app IO e calcolo online.' },
  'guida/neonato': { page: 'guides/guida-neonato', title: 'Codice Fiscale per Neonati: Quando e Come Ottenerlo | ' + SITE_NAME, description: 'Come e quando viene assegnato il codice fiscale ai neonati: procedura ospedaliera, comune, tessera sanitaria e tempistiche.' },
  'blog': { page: 'blog', title: 'Blog — Approfondimenti sul Codice Fiscale | ' + SITE_NAME, description: 'Approfondimenti, guide pratiche e articoli completi sul codice fiscale italiano: calcolo, struttura, decodifica, differenze e procedure.' },
  'blog/come-si-calcola-il-codice-fiscale': { page: 'blog/come-si-calcola', title: 'Come Si Calcola il Codice Fiscale: Guida Completa | ' + SITE_NAME, description: 'Guida completa al calcolo del codice fiscale italiano: regole per cognome, nome, data di nascita, comune e carattere di controllo con esempi reali.' },
  'blog/composizione-codice-fiscale': { page: 'blog/composizione', title: 'Composizione Codice Fiscale: Struttura dei 16 Caratteri | ' + SITE_NAME, description: 'Struttura completa dei 16 caratteri del codice fiscale: cosa rappresenta ogni posizione, tabelle di riferimento e regole di composizione.' },
  'blog/come-leggere-il-codice-fiscale': { page: 'blog/come-leggere', title: 'Come Leggere il Codice Fiscale: Guida alla Decodifica | ' + SITE_NAME, description: 'Come leggere e decodificare un codice fiscale italiano: estrarre cognome, nome, data di nascita, sesso e comune dai 16 caratteri.' },
  'blog/mesi-codice-fiscale': { page: 'blog/mesi', title: 'Mesi Codice Fiscale: Tabella Completa Lettere da A a T | ' + SITE_NAME, description: 'Tabella completa delle lettere che rappresentano i mesi nel codice fiscale italiano: da A (Gennaio) a T (Dicembre).' },
  'blog/codice-fiscale-donna': { page: 'blog/donna', title: 'Codice Fiscale Donna: Come Si Calcola e Differenza con Uomo | ' + SITE_NAME, description: 'Come funziona il codice fiscale femminile: la regola del +40 al giorno di nascita, differenze con il codice maschile ed esempi pratici.' },
  'blog/cose-il-codice-fiscale': { page: 'blog/cose-il-codice-fiscale', title: "Cos'è il Codice Fiscale: Guida Completa al CF Italiano | " + SITE_NAME, description: "Guida completa al codice fiscale italiano: cos'è, a cosa serve, chi lo rilascia, dove trovarlo e come funziona per stranieri." },
  'blog/come-trovare-il-codice-fiscale': { page: 'blog/come-trovare', title: 'Come Trovare il Codice Fiscale di una Persona | ' + SITE_NAME, description: 'I 5 dati obbligatori per calcolare un codice fiscale, i metodi per trovarlo online e offline, e le regole di privacy da rispettare.' },
  'blog/codice-fiscale-neonato': { page: 'blog/neonato', title: 'Codice Fiscale Neonato: Come Richiederlo Online e Offline | ' + SITE_NAME, description: 'Come richiedere il codice fiscale per un neonato: procedura online e offline, documenti necessari, tempi di rilascio e Tessera Sanitaria.' },
};

app.use('/tools', (req, res, next) => {
  const locals = getLocals(
    req,
    'Calcola Codice Fiscale - Generatore Online Gratuito | ' + SITE_NAME,
    'Genera il tuo Codice Fiscale italiano inserendo i tuoi dati anagrafici. Strumento gratuito, veloce e preciso.',
    'tools' + req.path
  );
  const siteUrl = getSiteUrl(req);
  const toolCrumbs = [{ name: 'Home', url: '/' }, { name: 'Calcola Codice Fiscale' }];
  locals.structuredData = [
    jsonLd(buildOrganizationSchema(siteUrl)),
    jsonLd(buildBreadcrumbSchema(siteUrl, toolCrumbs)),
    jsonLd(buildToolSchema(siteUrl))
  ].join('\n');
  Object.assign(res.locals, locals);
  next();
}, toolRoutes);

app.get('/guide/codice-fiscale-inverso', (req, res) => res.redirect(301, '/guida/codice-fiscale-inverso'));
app.get('/guide/verifica-codice-fiscale', (req, res) => res.redirect(301, '/guida/verifica-codice-fiscale'));

app.use('/', createToolsRouter(getLocals, getStructuredData));

app.post('/api/calcola', (req, res) => {
  const { cognome, nome, sesso, data_nascita, comune } = req.body;
  const errors = [];
  if (!cognome || !cognome.trim()) errors.push('Il cognome è obbligatorio.');
  if (!nome || !nome.trim()) errors.push('Il nome è obbligatorio.');
  if (!sesso || !sesso.trim()) errors.push('Il sesso è obbligatorio.');
  if (!data_nascita || !data_nascita.trim()) errors.push('La data di nascita è obbligatoria.');
  if (!comune || !comune.trim()) errors.push('Il comune di nascita è obbligatorio.');

  if (errors.length > 0) {
    return res.json({ success: false, errors });
  }

  try {
    const result = calcola(cognome.trim(), nome.trim(), data_nascita.trim(), sesso.trim(), comune.trim());
    res.json({ success: true, codice_fiscale: result });
  } catch (e) {
    res.json({ success: false, errors: [e.message] });
  }
});

app.get('/api/comuni', (req, res) => {
  const query = (req.query.q || '').trim();
  if (query.length < 2) return res.json([]);
  res.json(cercaComune(query));
});

app.post('/api/inverso', (req, res) => {
  const { codice_fiscale } = req.body;
  if (!codice_fiscale || !codice_fiscale.trim()) {
    return res.json({ success: false, errors: ['Il Codice Fiscale è obbligatorio.'] });
  }
  try {
    const result = decodeCF(codice_fiscale.trim());
    res.json({ success: result.valid, ...result });
  } catch (e) {
    res.json({ success: false, errors: [e.message] });
  }
});

app.post('/api/verifica', (req, res) => {
  const { codice_fiscale } = req.body;
  if (!codice_fiscale || !codice_fiscale.trim()) {
    return res.json({ success: false, errors: ['Il Codice Fiscale è obbligatorio.'] });
  }
  try {
    const code = codice_fiscale.trim().toUpperCase();
    const CF_RE = /^[A-Z]{6}\d{2}[ABCDEHLMPRST]\d{2}[A-Z]\d{3}[A-Z]$/;
    const formatOk = code.length === 16 && CF_RE.test(code);

    let dateOk = false;
    let checksumOk = false;

    if (formatOk) {
      const MONTH_REV = { A:1,B:2,C:3,D:4,E:5,H:6,L:7,M:8,P:9,R:10,S:11,T:12 };
      const monthChar = code[8];
      const monthValid = !!MONTH_REV[monthChar];
      const dayVal = parseInt(code.substring(9, 11), 10);
      const actualDay = dayVal > 40 ? dayVal - 40 : dayVal;
      dateOk = monthValid && actualDay >= 1 && actualDay <= 31;

      const validation = validateCF(code);
      checksumOk = validation.errors.every(e => !e.includes('controllo'));
    }

    const checks = [
      { label: 'Formato', detail: formatOk ? 'Il formato è corretto (16 caratteri alfanumerici)' : 'Il formato non è valido', pass: formatOk },
      { label: 'Data di nascita', detail: !formatOk ? 'Non verificabile (formato non valido)' : (dateOk ? 'La data codificata è plausibile' : 'La data codificata non è valida'), pass: formatOk && dateOk },
      { label: 'Carattere di controllo', detail: !formatOk ? 'Non verificabile (formato non valido)' : (checksumOk ? 'Il checksum è corretto' : 'Il checksum non corrisponde'), pass: formatOk && checksumOk }
    ];

    const valid = formatOk && dateOk && checksumOk;
    const decoded = decodeCF(code);
    const d = decoded.data;

    res.json({
      success: true,
      valid,
      errors: valid ? [] : checks.filter(c => !c.pass).map(c => c.detail),
      codiceFiscale: code,
      checks,
      extract: d ? {
        genderLabel: d.genderLabel,
        dateStr: d.dateStr,
        municipalityName: d.municipalityName,
        municipalityCode: d.municipalityCode,
        surnameSegment: d.surnameSegment,
        nameSegment: d.nameSegment,
        checkChar: d.checkChar
      } : null
    });
  } catch (e) {
    res.json({ success: false, errors: [e.message] });
  }
});

app.get('/sitemap.xml', (req, res) => {
  const siteUrl = getSiteUrl(req);
  const todayISO = new Date().toISOString().split('T')[0];
  const urls = [
    { path: '', priority: '1.0' },
    { path: 'calcola', priority: '0.9' },
    { path: 'codice-fiscale-inverso', priority: '0.9' },
    { path: 'verifica-codice-fiscale', priority: '0.9' },
    { path: 'codice-fiscale', priority: '0.9' },
    { path: 'cos-e-il-codice-fiscale', priority: '0.8' },
    { path: 'come-si-calcola-il-codice-fiscale', priority: '0.8' },
    { path: 'codice-fiscale-vs-partita-iva', priority: '0.7' },
    { path: 'codice-fiscale-estero', priority: '0.7' },
    { path: 'recupero-codice-fiscale', priority: '0.7' },
    { path: 'utilizzi-legali-codice-fiscale', priority: '0.7' },
    { path: 'esempi-codice-fiscale', priority: '0.7' },
    { path: 'guida/codice-fiscale-inverso', priority: '0.8' },
    { path: 'guida/verifica-codice-fiscale', priority: '0.8' },
    { path: 'guida/come-si-calcola', priority: '0.8' },
    { path: 'guida/struttura', priority: '0.8' },
    { path: 'guida/come-leggere', priority: '0.8' },
    { path: 'guida/lettere-mesi', priority: '0.8' },
    { path: 'guida/donna-uomo', priority: '0.8' },
    { path: 'guida/cose-il-codice-fiscale', priority: '0.8' },
    { path: 'guida/come-trovare', priority: '0.8' },
    { path: 'guida/neonato', priority: '0.8' },
    { path: 'blog', priority: '0.7' },
    { path: 'blog/come-si-calcola-il-codice-fiscale', priority: '0.7' },
    { path: 'blog/composizione-codice-fiscale', priority: '0.7' },
    { path: 'blog/come-leggere-il-codice-fiscale', priority: '0.7' },
    { path: 'blog/mesi-codice-fiscale', priority: '0.7' },
    { path: 'blog/codice-fiscale-donna', priority: '0.7' },
    { path: 'blog/cose-il-codice-fiscale', priority: '0.7' },
    { path: 'blog/come-trovare-il-codice-fiscale', priority: '0.7' },
    { path: 'blog/codice-fiscale-neonato', priority: '0.7' },
    { path: 'chi-siamo', priority: '0.5' },
    { path: 'contatti', priority: '0.5' },
    { path: 'privacy-policy', priority: '0.3' },
    { path: 'termini-condizioni', priority: '0.3' },
    { path: 'disclaimer', priority: '0.3' },
    { path: 'cookie-policy', priority: '0.3' },
    { path: 'dmca', priority: '0.3' },
    { path: 'politica-editoriale', priority: '0.3' },
    { path: 'gdpr', priority: '0.3' },
    { path: 'mappa-del-sito', priority: '0.3' }
  ];

  res.type('application/xml');
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const u of urls) {
    const freq = parseFloat(u.priority) >= 0.8 ? 'weekly' : 'monthly';
    xml += `  <url>\n    <loc>${siteUrl}/${u.path}</loc>\n    <lastmod>${todayISO}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
  }
  xml += '</urlset>';
  res.send(xml);
});

app.get('/robots.txt', (req, res) => {
  const siteUrl = getSiteUrl(req);
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
});

function renderPage(req, res, routeKey) {
  const routeData = routes[routeKey];
  if (!routeData) {
    res.status(404);
    const locals = getLocals(req, 'Pagina non trovata | ' + SITE_NAME, 'La pagina che stai cercando non esiste.', '404');
    return res.render('404', locals);
  }
  const locals = getLocals(req, routeData.title, routeData.description, routeKey);
  locals.structuredData = getStructuredData(locals.siteUrl, routeKey);
  res.render(routeData.page, locals);
}

app.get('/', (req, res) => renderPage(req, res, ''));

for (const routeKey of Object.keys(routes)) {
  if (routeKey === '') continue;
  app.get('/' + routeKey, (req, res) => renderPage(req, res, routeKey));
}

app.use((req, res) => {
  res.status(404);
  const locals = getLocals(req, 'Pagina non trovata | ' + SITE_NAME, 'La pagina che stai cercando non esiste.', '404');
  res.render('404', locals);
});
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

module.exports = app;
