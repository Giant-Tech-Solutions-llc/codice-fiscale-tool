<?php
define('SITE_NAME', 'Codice Fiscale Online');
define('SITE_TAGLINE', 'Calcola il tuo Codice Fiscale gratis');
define('SITE_URL', (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost:5000'));
define('SITE_LANG', 'it');
define('SITE_EMAIL', 'info@codicefiscaleonline.com');
define('SITE_YEAR', date('Y'));

$routes = [
    '' => ['page' => 'home', 'title' => 'Calcola Codice Fiscale Online Gratis | ' . SITE_NAME, 'description' => 'Calcola il tuo Codice Fiscale italiano online gratis. Strumento veloce, preciso e facile da usare. Genera il codice fiscale in pochi secondi.'],
    'calcola' => ['page' => 'tool', 'title' => 'Calcola Codice Fiscale - Generatore Online Gratuito | ' . SITE_NAME, 'description' => 'Genera il tuo Codice Fiscale italiano inserendo i tuoi dati anagrafici. Strumento gratuito, veloce e preciso con validazione in tempo reale.'],
    'cos-e-il-codice-fiscale' => ['page' => 'articles/what-is-codice-fiscale', 'title' => 'Cos\'è il Codice Fiscale? Guida Completa | ' . SITE_NAME, 'description' => 'Scopri cos\'è il Codice Fiscale italiano, a cosa serve, come è composto e perché è fondamentale per ogni cittadino e residente in Italia.'],
    'come-si-calcola-il-codice-fiscale' => ['page' => 'articles/how-is-codice-fiscale-calculated', 'title' => 'Come si Calcola il Codice Fiscale? Spiegazione Completa | ' . SITE_NAME, 'description' => 'Guida dettagliata su come viene calcolato il Codice Fiscale italiano. Scopri l\'algoritmo, le regole e ogni passaggio del calcolo.'],
    'codice-fiscale-vs-partita-iva' => ['page' => 'articles/codice-fiscale-vs-partita-iva', 'title' => 'Codice Fiscale vs Partita IVA: Differenze | ' . SITE_NAME, 'description' => 'Qual è la differenza tra Codice Fiscale e Partita IVA? Scopri quando serve l\'uno o l\'altro e le differenze fondamentali.'],
    'codice-fiscale-estero' => ['page' => 'articles/codice-fiscale-abroad', 'title' => 'Codice Fiscale per Stranieri e Residenti all\'Estero | ' . SITE_NAME, 'description' => 'Come ottenere il Codice Fiscale se sei straniero o residente all\'estero. Guida completa con procedure e documenti necessari.'],
    'recupero-codice-fiscale' => ['page' => 'articles/lost-codice-fiscale-recovery', 'title' => 'Come Recuperare il Codice Fiscale Smarrito | ' . SITE_NAME, 'description' => 'Hai perso il Codice Fiscale? Scopri come recuperarlo online, presso l\'Agenzia delle Entrate o tramite altri canali ufficiali.'],
    'utilizzi-legali-codice-fiscale' => ['page' => 'articles/legal-use-cases', 'title' => 'Utilizzi Legali del Codice Fiscale | ' . SITE_NAME, 'description' => 'Scopri tutti gli utilizzi legali del Codice Fiscale: contratti, dichiarazioni fiscali, sanità e molto altro.'],
    'esempi-codice-fiscale' => ['page' => 'articles/examples-breakdown', 'title' => 'Esempi di Codice Fiscale con Spiegazione | ' . SITE_NAME, 'description' => 'Esempi pratici di Codice Fiscale con spiegazione dettagliata di ogni carattere. Impara a leggere e capire il codice fiscale.'],
    'privacy-policy' => ['page' => 'privacy', 'title' => 'Privacy Policy | ' . SITE_NAME, 'description' => 'Informativa sulla privacy di ' . SITE_NAME . '. Scopri come trattiamo i tuoi dati personali.'],
    'termini-condizioni' => ['page' => 'terms', 'title' => 'Termini e Condizioni | ' . SITE_NAME, 'description' => 'Termini e condizioni d\'uso del sito ' . SITE_NAME . '.'],
    'disclaimer' => ['page' => 'disclaimer', 'title' => 'Disclaimer | ' . SITE_NAME, 'description' => 'Disclaimer legale di ' . SITE_NAME . '. Limitazioni di responsabilità e avvertenze.'],
    'chi-siamo' => ['page' => 'about', 'title' => 'Chi Siamo | ' . SITE_NAME, 'description' => 'Scopri chi siamo e la nostra missione. ' . SITE_NAME . ' offre strumenti gratuiti per il calcolo del Codice Fiscale.'],
    'contatti' => ['page' => 'contact', 'title' => 'Contatti | ' . SITE_NAME, 'description' => 'Contattaci per domande, suggerimenti o segnalazioni. Siamo qui per aiutarti.'],
    'cookie-policy' => ['page' => 'cookie-policy', 'title' => 'Cookie Policy | ' . SITE_NAME, 'description' => 'Informativa sull\'uso dei cookie su ' . SITE_NAME . '.'],
    'dmca' => ['page' => 'dmca', 'title' => 'DMCA Policy | ' . SITE_NAME, 'description' => 'DMCA policy e procedura di segnalazione per violazioni di copyright.'],
    'politica-editoriale' => ['page' => 'editorial-policy', 'title' => 'Politica Editoriale | ' . SITE_NAME, 'description' => 'La nostra politica editoriale. Come creiamo e verifichiamo i contenuti.'],
    'gdpr' => ['page' => 'gdpr', 'title' => 'Informativa GDPR | ' . SITE_NAME, 'description' => 'Informativa sul trattamento dei dati personali ai sensi del GDPR.'],
    'mappa-del-sito' => ['page' => 'sitemap-html', 'title' => 'Mappa del Sito | ' . SITE_NAME, 'description' => 'Mappa del sito completa di ' . SITE_NAME . '. Trova tutte le pagine.'],
];

function get_route() {
    $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    return $path;
}

function get_page_url($route) {
    return SITE_URL . '/' . $route;
}
