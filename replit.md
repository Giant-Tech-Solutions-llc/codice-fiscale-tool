# Codice Fiscale Online

## Overview
Italian Tax ID Code (Codice Fiscale) generator website built with Node.js/Express and EJS templating. Features three main tools (generator, reverse decoder, validator), SEO-optimized content pages (pillar + cluster strategy), all AdSense compliance pages, and modern mobile-first design with Italian flag color theme (green/white/red).

## Project Architecture
```
/
├── server.js              # Express server with all routes (port 5000)
├── routes/
│   ├── tool.routes.js     # Express router: GET/POST /tools/codice-fiscale-generator
│   └── tools.js           # Express router factory: GET /codice-fiscale-inverso, GET /verifica-codice-fiscale
├── controllers/
│   └── tool.controller.js # Tool controller: validate, sanitise, call service, render
├── src/
│   ├── codiceFiscale.js         # CF calculation engine (used by server routes)
│   ├── codiceFiscale.service.js # CF service module (generate, validate, decode, JSDoc)
│   └── comuni.json              # Italian municipalities database (JSON)
├── views/
│   ├── layouts/
│   │   └── main.ejs       # Main layout (HTML shell, SEO meta, OG tags, structured data slot)
│   ├── partials/
│   │   ├── header.ejs     # Semantic header with nav (Guide, Strumenti dropdowns)
│   │   └── footer.ejs     # Semantic footer
│   ├── home.ejs           # Homepage: hero, CTA, calculator, tools section, trust signals, FAQ
│   ├── codice-fiscale.ejs # Dedicated tool page (card layout, gender toggle, copy btn)
│   ├── codice-fiscale-inverso.ejs # CF reverse decoder (hero, tool card, SEO article, FAQ, CTA)
│   ├── verifica-codice-fiscale.ejs # CF validator (hero, tool card, SEO article, FAQ, CTA)
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
│   ├── guides/            # SEO guide pages (two-column layout with sidebar)
│   │   ├── guide-inverso.ejs    # Guide: Codice Fiscale Inverso (/guide/codice-fiscale-inverso)
│   │   └── guide-verifica.ejs   # Guide: Verifica Codice Fiscale (/guide/verifica-codice-fiscale)
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
│   ├── css/style.min.css  # Copy of style.css (must stay in sync)
│   ├── css/inverso.css    # Inverso tool-specific styles (breakdown, data cards, detail table)
│   ├── css/verifica.css   # Verifica tool-specific styles (verdict badge, check list, quick extract)
│   ├── js/app.js          # Client-side JavaScript (homepage calculator, nav, toast)
│   ├── js/inverso.js      # Inverso tool JS (client-side CF decode with omocodia support)
│   └── js/verifica.js     # Verifica tool JS (client-side CF validation with checklist)
├── pages/                 # Legacy PHP pages (kept for reference)
├── includes/              # Legacy PHP includes
├── assets/                # Legacy PHP assets
```

## Design System
- **Primary**: #1E7F4F (Italian green)
- **Accent**: #E63946 (rare use)
- **Background**: #F8FAFC
- **Text**: #111827 primary, #4B5563 secondary
- **Typography**: System font stack (no Google Fonts), H1 36px bold, H2 28px semibold, body 16px
- **Spacing**: 8pt system, 80px section padding desktop, 48px mobile
- **Cards**: 16px radius, soft shadows, clean elevation hierarchy
- **No external CSS/font dependencies**

## Key Features
- Codice Fiscale calculation with official algorithm
- Codice Fiscale inverse decoding (visual color-coded breakdown, data cards, detail table)
- Codice Fiscale validation (verdict badge, format/date/checksum checks, quick extract)
- Municipality autocomplete search (1,291 comuni)
- Copy-to-clipboard with toast confirmation
- JSON-LD structured data (FAQ, HowTo, Article, WebApplication)
- XML and HTML sitemaps
- robots.txt
- Mobile-first responsive design with sticky navbar
- Premium SaaS-quality UI with two-column hero layout
- Pill-style gender toggle, loading state button spinner
- Sticky bottom CTA on mobile
- All AdSense-required legal pages

## API Endpoints
- POST /api/calcola - Calculate Codice Fiscale (JSON API, used by client-side JS)
- POST /api/inverso - Decode/reverse a Codice Fiscale (legacy server endpoint, kept for backwards compat)
- POST /api/verifica - Validate a Codice Fiscale (legacy server endpoint, kept for backwards compat)
- GET /api/comuni?q=query - Search municipalities
- GET /sitemap.xml - XML sitemap
- GET /robots.txt - Robots file

## Tool Pages
- /calcola — Main calculator tool (legacy route)
- /codice-fiscale-inverso — Reverse decoder tool (fully client-side JS, no server API calls)
- /verifica-codice-fiscale — Validator tool (fully client-side JS, no server API calls)

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
- **Service Layer**: codiceFiscale.service.js exports generate(), validate(), decode()
- **Reverse Lookup**: COMUNI_REVERSE map built from comuni.json for cadastral code → municipality name

## Recent Changes
- **Guide pages added** (Mar 2026):
  - Two new SEO guide pages: `/guide/codice-fiscale-inverso` and `/guide/verifica-codice-fiscale`
  - Two-column layout (article + sticky sidebar) with TOC, data tables, FAQ accordions, CTA sections
  - New CSS classes in style.css: `.guide-page`, `.guide-container`, `.guide-article`, `.guide-header`, `.guide-intro`, `.guide-cta-inline`, `.guide-toc`, `.guide-table`, `.guide-related`, `.guide-sidebar`, `.sidebar-card`, `.sidebar-cta`, `.btn--block`, `.mono`
  - JSON-LD structured data: Article + BreadcrumbList + FAQPage schemas per guide
  - Views in `views/guides/` directory (layout-compatible partials)
  - Routes added to `server.js` routes object, sitemap.xml, HTML sitemap, and Guide dropdown nav
- **Tool pages rebuilt with SEO content** (Mar 2026):
  - Both tool pages rebuilt with hero sections, breadcrumbs, SEO article content, FAQ accordions, CTA sections
  - External CSS files: `/css/inverso.css`, `/css/verifica.css` (tool-specific styles)
  - External JS files: `/js/inverso.js`, `/js/verifica.js` (client-side logic)
  - JSON-LD structured data per page: WebPage, HowTo, FAQPage schemas
  - New shared CSS classes: `.tool-hero`, `.btn--primary/secondary/outline`, `.content-section`, `.seo-article`, `.visually-hidden`, `.cta-actions`
  - Breadcrumb updated to `<ol>/<li>` structure with CSS `::after` separators
  - routes/tools.js passes `extraHead` (keywords meta + tool CSS) and `structuredData` (JSON-LD) to layout
  - Codice Fiscale Inverso: visual color-coded breakdown, data cards, detail table, omocodia support
  - Verifica Codice Fiscale: verdict badge (valid/invalid), checklist, quick extract panel
  - All processing client-side, no data sent to server
  - Server-side decode()/validate() and API endpoints kept for backwards compatibility
  - Updated navigation with "Strumenti" dropdown, footer links, homepage tools section, HTML sitemap
- **Homepage UI/UX redesign** (Feb 2026): Complete visual overhaul following premium SaaS design spec
  - New design system: #1E7F4F primary, system fonts, 8pt spacing, soft shadows
  - Two-column hero with floating tool card, trust bullets, soft gradient background
  - Sticky navbar with green CTA button, scroll shadow effect, animated hamburger menu
  - Pill-style gender toggle replacing dropdown, 48px inputs, loading spinner on submit
  - Toast notification system for copy confirmation and errors
  - Clickable guide cards with category tags, improved FAQ accordion animations
  - Softer green CTA section with privacy reassurance line
  - Footer with legal disclaimer ("non affiliato all'Agenzia delle Entrate")
  - Mobile: sticky bottom CTA bar, body overflow lock on menu open, large tap targets
  - Removed Google Fonts dependency (system font stack only)
- Rebuilt views/home.ejs with SEO architecture
- Created views/codice-fiscale-pillar.ejs: pillar page with TOC, FAQ schema
- MVC tool routes at /tools/codice-fiscale-generator
- JSON-LD structured data (Organization, BreadcrumbList, WebApplication, FAQPage)
- Refactored EJS layout system with express-ejs-layouts
- Migrated from PHP to Node.js/Express
