const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const { calcola, cercaComune } = require('./src/codiceFiscale');
const toolRoutes = require('./routes/tool.routes');

const app = express();
const PORT = 5000;

const SITE_NAME = 'Codice Fiscale Online';
const SITE_EMAIL = 'info@codicefiscaleonline.com';
const SITE_LANG = 'it';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0 }));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
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
    extraHead: ''
  };
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
