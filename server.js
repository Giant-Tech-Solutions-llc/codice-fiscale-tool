const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const expressLayouts = require('express-ejs-layouts');
const { calcola, cercaComune } = require('./src/codiceFiscale');
const toolRoutes = require('./routes/tool.routes');

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
  'chi-siamo': [{ name: 'Home', url: '/' }, { name: 'Chi Siamo' }],
  'contatti': [{ name: 'Home', url: '/' }, { name: 'Contatti' }],
  'privacy-policy': [{ name: 'Home', url: '/' }, { name: 'Privacy Policy' }],
  'termini-condizioni': [{ name: 'Home', url: '/' }, { name: 'Termini e Condizioni' }],
  'disclaimer': [{ name: 'Home', url: '/' }, { name: 'Disclaimer' }],
  'cookie-policy': [{ name: 'Home', url: '/' }, { name: 'Cookie Policy' }],
  'dmca': [{ name: 'Home', url: '/' }, { name: 'DMCA' }],
  'politica-editoriale': [{ name: 'Home', url: '/' }, { name: 'Politica Editoriale' }],
  'gdpr': [{ name: 'Home', url: '/' }, { name: 'GDPR' }],
  'mappa-del-sito': [{ name: 'Home', url: '/' }, { name: 'Mappa del Sito' }]
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
  if (routeKey === 'codice-fiscale') {
    schemas.push(jsonLd(buildFaqSchema(pillarFaqs)));
  }
  return schemas.join('\n');
}

const routes = {
  '': { page: 'home', title: 'Calcola Codice Fiscale Online Gratis | ' + SITE_NAME, description: 'Calcola il tuo Codice Fiscale italiano online gratis. Strumento veloce, preciso e facile da usare. Genera il codice fiscale in pochi secondi.' },
  'calcola': { page: 'tool', title: 'Calcola Codice Fiscale - Generatore Online Gratuito | ' + SITE_NAME, description: 'Genera il tuo Codice Fiscale italiano inserendo i tuoi dati anagrafici. Strumento gratuito, veloce e preciso con validazione in tempo reale.' },
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
  'mappa-del-sito': { page: 'sitemap-html', title: 'Mappa del Sito | ' + SITE_NAME, description: 'Mappa del sito completa di ' + SITE_NAME + '. Trova tutte le pagine.' }
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

app.get('/sitemap.xml', (req, res) => {
  const siteUrl = getSiteUrl(req);
  const todayISO = new Date().toISOString().split('T')[0];
  const urls = [
    { path: '', priority: '1.0' },
    { path: 'calcola', priority: '0.9' },
    { path: 'codice-fiscale', priority: '0.9' },
    { path: 'cos-e-il-codice-fiscale', priority: '0.8' },
    { path: 'come-si-calcola-il-codice-fiscale', priority: '0.8' },
    { path: 'codice-fiscale-vs-partita-iva', priority: '0.7' },
    { path: 'codice-fiscale-estero', priority: '0.7' },
    { path: 'recupero-codice-fiscale', priority: '0.7' },
    { path: 'utilizzi-legali-codice-fiscale', priority: '0.7' },
    { path: 'esempi-codice-fiscale', priority: '0.7' },
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
