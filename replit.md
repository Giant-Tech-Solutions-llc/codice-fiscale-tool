# Codice Fiscale Online

## Overview
Italian Tax ID Code (Codice Fiscale) generator website built with Node.js/Express and EJS templating. Features a working calculator tool with official algorithm, SEO-optimized content pages (pillar + cluster strategy), all AdSense compliance pages, and modern mobile-first design with Italian flag color theme (green/white/red).

## Project Architecture
```
/
├── server.js              # Express server with all routes (port 5000)
├── routes/
│   └── tool.routes.js     # Express router: GET/POST /tools/codice-fiscale-generator
├── controllers/
│   └── tool.controller.js # Tool controller: validate, sanitise, call service, render
├── src/
│   ├── codiceFiscale.js         # CF calculation engine (used by server routes)
│   ├── codiceFiscale.service.js # CF service module (generate + validate, JSDoc, mock comuni)
│   └── comuni.json              # Italian municipalities database (JSON)
├── views/
│   ├── layouts/
│   │   └── main.ejs       # Main layout (HTML shell, SEO meta, OG tags, structured data slot)
│   ├── partials/
│   │   ├── header.ejs     # Semantic header with nav
│   │   └── footer.ejs     # Semantic footer
│   ├── home.ejs           # Homepage: hero, CTA, calculator, trust signals, cluster links, FAQ
│   ├── codice-fiscale.ejs # Dedicated tool page (card layout, gender toggle, copy btn)
│   ├── codice-fiscale-pillar.ejs # SEO pillar page (1500+ words, TOC, 12 sections, FAQ schema)
│   ├── tool.ejs           # Legacy calculator tool page (/calcola route)
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
- POST /api/calcola - Calculate Codice Fiscale (JSON API, used by client-side JS)
- GET /api/comuni?q=query - Search municipalities
- GET /sitemap.xml - XML sitemap
- GET /robots.txt - Robots file

## Tool Routes (MVC)
- GET  /tools/codice-fiscale-generator — Renders calculator form (controller → service → EJS)
- POST /tools/codice-fiscale-generator — Validates input, generates CF server-side, re-renders with result/errors

## Technical Details
- **Language**: Node.js 20 with Express
- **Templating**: EJS with express-ejs-layouts (layout: views/layouts/main.ejs)
- **Layout System**: main.ejs layout + partials (header.ejs, footer.ejs), dynamic SEO via controller locals
- **Server**: Express on port 5000
- **Routing**: Clean URLs via Express routes
- **No database required**: Municipality data stored in JSON
- **Deployment**: Autoscale with `node server.js`

## Recent Changes
- Rebuilt views/home.ejs with SEO architecture: clear H1, hero CTA to /tools, embedded calculator, trust signals, "How It Works" steps, 7 cluster article cards, 6 FAQ items with FAQPage microdata, structured data placeholder
- Created views/codice-fiscale-pillar.ejs: 1786-word pillar page with 12 H2 sections, sticky TOC with anchor links, internal links to all 7 cluster articles + tool, FAQPage microdata (6 Qs), Article schema, breadcrumb
- Added /codice-fiscale route in server.js routes + sitemap.xml
- Created routes/tool.routes.js + controllers/tool.controller.js: MVC route for /tools/codice-fiscale-generator (GET/POST), input validation with regex field rules, sanitisation, calls codiceFiscale.service.js, server-side rendering with error/result/formData locals
- Updated views/tool.ejs: server-side error display, form value persistence, result rendering, schema gated to /calcola only
- Mounted tool routes in server.js at /tools with layout locals middleware
- Created src/codiceFiscale.service.js: clean service module with generate() + validate() + helpers, full JSDoc, mock municipality mapping
- Refactored EJS layout system: created layouts/main.ejs + partials/header.ejs + partials/footer.ejs with express-ejs-layouts
- Layout supports dynamic title, meta description, canonical, OpenGraph, Twitter cards, structured data placeholder
- All SEO values passed dynamically from controller (getLocals in server.js), nothing hardcoded in layout
- Migrated from PHP to Node.js/Express for Replit deployment compatibility
- Created all EJS templates matching PHP page content
- Set up autoscale deployment configuration
