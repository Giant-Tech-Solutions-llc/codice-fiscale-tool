<?php
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

require_once __DIR__ . '/includes/config.php';

$route = get_route();

if ($route === 'sitemap.xml') {
    header('Content-Type: application/xml; charset=utf-8');
    require __DIR__ . '/pages/sitemap-xml.php';
    exit;
}

if ($route === 'robots.txt') {
    header('Content-Type: text/plain');
    echo "User-agent: *\nAllow: /\nSitemap: " . SITE_URL . "/sitemap.xml\n";
    exit;
}

if ($route === 'api/calcola') {
    header('Content-Type: application/json');
    require_once __DIR__ . '/src/CodiceFiscale.php';
    
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        $data = $_POST;
    }
    
    $nome = trim($data['nome'] ?? '');
    $cognome = trim($data['cognome'] ?? '');
    $sesso = trim($data['sesso'] ?? '');
    $data_nascita = trim($data['data_nascita'] ?? '');
    $comune = trim($data['comune'] ?? '');
    
    $errors = [];
    if (empty($cognome)) $errors[] = 'Il cognome è obbligatorio.';
    if (empty($nome)) $errors[] = 'Il nome è obbligatorio.';
    if (empty($sesso)) $errors[] = 'Il sesso è obbligatorio.';
    if (empty($data_nascita)) $errors[] = 'La data di nascita è obbligatoria.';
    if (empty($comune)) $errors[] = 'Il comune di nascita è obbligatorio.';
    
    if (!empty($errors)) {
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit;
    }
    
    try {
        $cf = new CodiceFiscale();
        $result = $cf->calcola($cognome, $nome, $data_nascita, $sesso, $comune);
        echo json_encode(['success' => true, 'codice_fiscale' => $result]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'errors' => [$e->getMessage()]]);
    }
    exit;
}

if ($route === 'api/comuni') {
    header('Content-Type: application/json');
    require_once __DIR__ . '/src/CodiceFiscale.php';
    $cf = new CodiceFiscale();
    $query = trim($_GET['q'] ?? '');
    if (strlen($query) < 2) {
        echo json_encode([]);
        exit;
    }
    $results = $cf->cercaComune($query);
    echo json_encode($results);
    exit;
}

if (isset($routes[$route])) {
    $page_data = $routes[$route];
    $page_title = $page_data['title'];
    $page_description = $page_data['description'];
    $canonical_url = SITE_URL . '/' . $route;
    if ($route === '') $canonical_url = SITE_URL . '/';
    
    require __DIR__ . '/includes/header.php';
    require __DIR__ . '/pages/' . $page_data['page'] . '.php';
    require __DIR__ . '/includes/footer.php';
} else {
    http_response_code(404);
    $page_title = 'Pagina non trovata | ' . SITE_NAME;
    $page_description = 'La pagina che stai cercando non esiste.';
    $canonical_url = SITE_URL . '/404';
    require __DIR__ . '/includes/header.php';
    require __DIR__ . '/pages/404.php';
    require __DIR__ . '/includes/footer.php';
}
