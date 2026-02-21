# Codice Fiscale Online

## Overview
Italian Tax ID Code (Codice Fiscale) generator website built in pure PHP. Features a working calculator tool, SEO-optimized content pages, and all AdSense compliance pages. Designed for WordPress migration compatibility.

## Project Architecture
```
/
├── index.php              # Main entry point / router
├── router.php             # PHP built-in server router
├── includes/
│   ├── config.php         # Site configuration, routes, helpers
│   ├── header.php         # HTML head, nav, header template
│   └── footer.php         # Footer, closing HTML template
├── src/
│   ├── CodiceFiscale.php  # CF calculation engine class
│   └── comuni.php         # Italian municipalities database
├── pages/
│   ├── home.php           # Homepage with hero, features, FAQ
│   ├── tool.php           # Calculator tool page
│   ├── 404.php            # 404 error page
│   ├── sitemap-xml.php    # XML sitemap generator
│   ├── sitemap-html.php   # HTML sitemap page
│   ├── privacy.php        # Privacy Policy
│   ├── terms.php          # Terms and Conditions
│   ├── disclaimer.php     # Disclaimer
│   ├── about.php          # About Us
│   ├── contact.php        # Contact page
│   ├── cookie-policy.php  # Cookie Policy
│   ├── dmca.php           # DMCA Policy
│   ├── editorial-policy.php # Editorial Policy
│   ├── gdpr.php           # GDPR Disclosure
│   └── articles/          # SEO content articles
│       ├── what-is-codice-fiscale.php
│       ├── how-is-codice-fiscale-calculated.php
│       ├── codice-fiscale-vs-partita-iva.php
│       ├── codice-fiscale-abroad.php
│       ├── lost-codice-fiscale-recovery.php
│       ├── legal-use-cases.php
│       └── examples-breakdown.php
├── assets/
│   ├── css/style.css      # Main stylesheet
│   └── js/app.js          # Client-side JavaScript
```

## Key Features
- Codice Fiscale calculation with official algorithm
- Municipality autocomplete search
- Copy-to-clipboard functionality
- JSON-LD structured data (FAQ, HowTo, Article, WebApplication)
- XML and HTML sitemaps
- robots.txt
- Mobile-first responsive design
- All AdSense-required legal pages

## Technical Details
- **Language**: PHP 8.2
- **Server**: PHP built-in server on port 5000
- **Routing**: Single entry point (index.php) with clean URLs
- **No database required**: Municipality data stored in PHP array

## Recent Changes
- Initial build: Complete site with all pages and tool functionality
