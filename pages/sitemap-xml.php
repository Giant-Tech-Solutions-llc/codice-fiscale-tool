<?php
echo '<?xml version="1.0" encoding="UTF-8"?>';
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<?php
$urls = [
    '' => '1.0',
    'calcola' => '0.9',
    'cos-e-il-codice-fiscale' => '0.8',
    'come-si-calcola-il-codice-fiscale' => '0.8',
    'codice-fiscale-vs-partita-iva' => '0.7',
    'codice-fiscale-estero' => '0.7',
    'recupero-codice-fiscale' => '0.7',
    'utilizzi-legali-codice-fiscale' => '0.7',
    'esempi-codice-fiscale' => '0.7',
    'chi-siamo' => '0.5',
    'contatti' => '0.5',
    'privacy-policy' => '0.3',
    'termini-condizioni' => '0.3',
    'disclaimer' => '0.3',
    'cookie-policy' => '0.3',
    'dmca' => '0.3',
    'politica-editoriale' => '0.3',
    'gdpr' => '0.3',
    'mappa-del-sito' => '0.3',
];
$today = date('Y-m-d');
foreach ($urls as $path => $priority): ?>
    <url>
        <loc><?php echo SITE_URL . '/' . $path; ?></loc>
        <lastmod><?php echo $today; ?></lastmod>
        <changefreq><?php echo $priority >= 0.8 ? 'weekly' : 'monthly'; ?></changefreq>
        <priority><?php echo $priority; ?></priority>
    </url>
<?php endforeach; ?>
</urlset>
