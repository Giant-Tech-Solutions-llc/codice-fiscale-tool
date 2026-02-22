# Codice Fiscale Online

## Overview
Italian Tax ID Code (Codice Fiscale) generator website built with Node.js/Express and EJS templating. Features a working calculator tool with official algorithm, SEO-optimized content pages (pillar + cluster strategy), all AdSense compliance pages, and modern mobile-first design with Italian flag color theme (green/white/red).

## Project Architecture
```
/
├── server.js              # Express server with all routes (port 5000)
├── src/
│   ├── codiceFiscale.js   # CF calculation engine (JS)
│   └── comuni.json        # Italian municipalities database (JSON)
├── views/
│   ├── layouts/
│   │   └── main.ejs       # Main layout (HTML shell, SEO meta, OG tags, structured data slot)
│   ├── partials/
│   │   ├── header.ejs     # Semantic header with nav
│   │   └── footer.ejs     # Semantic footer
│   ├── home.ejs           # Homepage with hero, calculator, FAQ
│   ├── tool.ejs           # Calculator tool page
│   ├── 404.ejs            # 404 error page
│   ├── sitemap-html.ejs   # HTML sitemap page
│   ├── privacy.ejs        # Privacy Policy
│   ├── terms.ejs          # Terms and Conditions
│   ├── disclaimer.ejs     # Disclaimer
│   ├── about.ejs          # About Us
│   ├── contact.ejs        # Contact page
│   ├── cookie-policy.ejs  # Cookie Policy
│   ├── dmca.ejs           # DMCA Policy
│   ├── editorial-policy.ejs # Editorial Policy
│   ├── gdpr.ejs           # GDPR Disclosure
│   └── articles/          # SEO content articles
│       ├── what-is-codice-fiscale.ejs
│       ├── how-is-codice-fiscale-calculated.ejs
│       ├── codice-fiscale-vs-partita-iva.ejs
│       ├── codice-fiscale-abroad.ejs
│       ├── lost-codice-fiscale-recovery.ejs
│       ├── legal-use-cases.ejs
│       └── examples-breakdown.ejs
├── public/
│   ├── css/style.css      # Main stylesheet
│   └── js/app.js          # Client-side JavaScript
├── pages/                 # Legacy PHP pages (kept for reference)
├── includes/              # Legacy PHP includes
├── assets/                # Legacy PHP assets
```

## Key Features
- Codice Fiscale calculation with official algorithm
- Municipality autocomplete search (1,291 comuni)
- Copy-to-clipboard functionality
- JSON-LD structured data (FAQ, HowTo, Article, WebApplication)
- XML and HTML sitemaps
- robots.txt
- Mobile-first responsive design
- Italian flag color theme (green #008C45, white, red #CD212A)
- All AdSense-required legal pages

## API Endpoints
- POST /api/calcola - Calculate Codice Fiscale
- GET /api/comuni?q=query - Search municipalities
- GET /sitemap.xml - XML sitemap
- GET /robots.txt - Robots file

## Technical Details
- **Language**: Node.js 20 with Express
- **Templating**: EJS with express-ejs-layouts (layout: views/layouts/main.ejs)
- **Layout System**: main.ejs layout + partials (header.ejs, footer.ejs), dynamic SEO via controller locals
- **Server**: Express on port 5000
- **Routing**: Clean URLs via Express routes
- **No database required**: Municipality data stored in JSON
- **Deployment**: Autoscale with `node server.js`

## Recent Changes
- Refactored EJS layout system: created layouts/main.ejs + partials/header.ejs + partials/footer.ejs with express-ejs-layouts
- Layout supports dynamic title, meta description, canonical, OpenGraph, Twitter cards, structured data placeholder
- All SEO values passed dynamically from controller (getLocals in server.js), nothing hardcoded in layout
- Migrated from PHP to Node.js/Express for Replit deployment compatibility
- Created all EJS templates matching PHP page content
- Set up autoscale deployment configuration
