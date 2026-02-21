<!DOCTYPE html>
<html lang="<?php echo SITE_LANG; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($page_title); ?></title>
    <meta name="description" content="<?php echo htmlspecialchars($page_description); ?>">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="<?php echo htmlspecialchars($canonical_url); ?>">
    <meta property="og:title" content="<?php echo htmlspecialchars($page_title); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($page_description); ?>">
    <meta property="og:url" content="<?php echo htmlspecialchars($canonical_url); ?>">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="<?php echo SITE_NAME; ?>">
    <meta property="og:locale" content="it_IT">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo htmlspecialchars($page_title); ?>">
    <meta name="twitter:description" content="<?php echo htmlspecialchars($page_description); ?>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23008C45'/><text x='50' y='68' font-family='Arial' font-size='50' font-weight='bold' fill='white' text-anchor='middle'>CF</text></svg>" type="image/svg+xml">
    <link rel="stylesheet" href="/assets/css/style.css">
    <?php if (isset($extra_head)) echo $extra_head; ?>
</head>
<body>
    <header class="site-header">
        <nav class="container nav-container">
            <a href="/" class="logo" aria-label="<?php echo SITE_NAME; ?> - Home">
                <span class="logo-icon">CF</span>
                <span class="logo-text"><?php echo SITE_NAME; ?></span>
            </a>
            <button class="mobile-menu-btn" aria-label="Menu" aria-expanded="false">
                <span></span><span></span><span></span>
            </button>
            <ul class="nav-menu" role="menubar">
                <li role="none"><a href="/" role="menuitem">Home</a></li>
                <li role="none"><a href="/calcola" role="menuitem">Calcola CF</a></li>
                <li role="none" class="has-dropdown">
                    <a href="/cos-e-il-codice-fiscale" role="menuitem" aria-haspopup="true">Guide</a>
                    <ul class="dropdown" role="menu">
                        <li role="none"><a href="/cos-e-il-codice-fiscale" role="menuitem">Cos'è il Codice Fiscale</a></li>
                        <li role="none"><a href="/come-si-calcola-il-codice-fiscale" role="menuitem">Come si Calcola</a></li>
                        <li role="none"><a href="/codice-fiscale-vs-partita-iva" role="menuitem">CF vs Partita IVA</a></li>
                        <li role="none"><a href="/codice-fiscale-estero" role="menuitem">CF per Stranieri</a></li>
                        <li role="none"><a href="/recupero-codice-fiscale" role="menuitem">Recupero CF</a></li>
                        <li role="none"><a href="/utilizzi-legali-codice-fiscale" role="menuitem">Utilizzi Legali</a></li>
                        <li role="none"><a href="/esempi-codice-fiscale" role="menuitem">Esempi CF</a></li>
                    </ul>
                </li>
                <li role="none"><a href="/chi-siamo" role="menuitem">Chi Siamo</a></li>
                <li role="none"><a href="/contatti" role="menuitem">Contatti</a></li>
            </ul>
        </nav>
    </header>
    <main id="main-content">
