# Codice Fiscale Online

## Overview
Codice Fiscale Online is an Italian Tax ID Code (Codice Fiscale) generator website built with Node.js/Express and EJS templating. It provides three core tools: generation, reverse decoding, and validation of Codice Fiscale. The project aims to offer a modern, mobile-first, and SEO-optimized platform with a consistent Italian flag color theme. Its vision is to be the go-to online resource for Codice Fiscale-related services, featuring extensive guide pages and blog content to serve a broad user base.

## User Preferences
No explicit user preferences were provided in the original `replit.md` file.

## System Architecture
The application uses a Node.js/Express backend with EJS for server-side templating. The architecture is organized around an MVC pattern, with distinct routes, controllers, and a service layer for Codice Fiscale logic.

**UI/UX Decisions:**
- **Design System:** Primarily uses #1E7F4F (Italian green) with #E63946 for accent. Background is #F8FAFC, text colors are #111827 and #4B5563.
- **Typography:** System font stack is used, avoiding external font dependencies.
- **Layouts:** Homepage uses a centered single-column card layout. Tool pages (Inverso, Verifica, Calcola) use a two-column hero layout with a tool card on the right and SEO content on the left. Guide and blog pages also feature a two-column layout with a sidebar.
- **Components:** Features include pill-style gender toggles, soft-shadowed cards with 16px radius, loading state button spinners, copy-to-clipboard functionality with toast notifications, and sticky bottom CTAs on mobile.
- **Responsiveness:** Mobile-first responsive design is implemented across all pages with a sticky navbar.

**Technical Implementations:**
- **Core Logic:** `codiceFiscale.js` contains the CF calculation engine, while `codiceFiscale.service.js` provides `generate()`, `validate()`, and `decode()` functionalities.
- **Templating:** EJS with `express-ejs-layouts` for consistent layout (`main.ejs`) and partials (`header.ejs`, `footer.ejs`).
- **Routing:** Clean URLs are managed by Express routes.
- **SEO:** Extensive SEO optimization includes JSON-LD structured data (FAQ, HowTo, Article, WebApplication), XML and HTML sitemaps, and `robots.txt`. A pillar + cluster content strategy is employed with dedicated guide and blog sections.

**Feature Specifications:**
- **Codice Fiscale Tools:**
    - **Generation:** Calculates Codice Fiscale using the official algorithm.
    - **Reverse Decoding:** Decodes a Codice Fiscale with visual color-coded breakdown, data cards, and detailed tables, including omocodia support.
    - **Validation:** Validates Codice Fiscale format, date, and checksum, providing a verdict badge and a quick extract feature.
- **Content Management:** Dedicated sections for 10 guide pages (`/guida/`) and 8 blog posts (`/blog/`).
- **Legal Compliance:** Includes all AdSense-required legal pages (Privacy, Terms, Disclaimer, Cookie Policy, DMCA, Editorial Policy, GDPR).

## External Dependencies
- **Node.js**: Runtime environment.
- **Express**: Web application framework for Node.js.
- **EJS**: Embedded JavaScript templating.
- **express-ejs-layouts**: Layout extension for EJS in Express.
- **`comuni.json`**: Local JSON file serving as the database for Italian municipalities.