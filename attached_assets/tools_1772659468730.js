/**
 * routes/tools.js
 * Routes for the two new tools.
 * Add this file to your project and register it in server.js as shown below.
 *
 * In server.js, add:
 *   const toolsRouter = require('./routes/tools');
 *   app.use('/', toolsRouter);
 */

const express = require('express');
const router  = express.Router();

// ── Codice Fiscale Inverso ────────────────────────────────────────────────────
router.get('/codice-fiscale-inverso', (req, res) => {
  res.render('codice-fiscale-inverso', {
    title:       'Codice Fiscale Inverso – Decodifica CF Online Gratis',
    description: 'Calcolo codice fiscale inverso online: inserisci il CF e scopri data di nascita, sesso e comune di nascita con analisi visiva carattere per carattere.',
    canonical:   '/codice-fiscale-inverso',
  });
});

// ── Verifica Codice Fiscale ───────────────────────────────────────────────────
router.get('/verifica-codice-fiscale', (req, res) => {
  res.render('verifica-codice-fiscale', {
    title:       'Verifica Codice Fiscale Online Gratis – Controlla CF Valido',
    description: 'Verifica codice fiscale online gratis: controlla se un CF italiano è formalmente valido con il nostro validatore basato su algoritmo ufficiale.',
    canonical:   '/verifica-codice-fiscale',
  });
});

module.exports = router;
