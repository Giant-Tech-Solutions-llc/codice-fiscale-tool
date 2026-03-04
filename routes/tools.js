const express = require('express');

module.exports = function createToolsRouter(getLocals, getStructuredData) {
  const router = express.Router();

  router.get('/codice-fiscale-inverso', (req, res) => {
    const locals = getLocals(
      req,
      'Codice Fiscale Inverso – Decodifica CF Online Gratis',
      'Calcolo codice fiscale inverso online: inserisci il CF e scopri data di nascita, sesso e comune di nascita con analisi visiva carattere per carattere.',
      'codice-fiscale-inverso'
    );
    locals.structuredData = getStructuredData(locals.siteUrl, 'codice-fiscale-inverso');
    res.render('codice-fiscale-inverso', locals);
  });

  router.get('/verifica-codice-fiscale', (req, res) => {
    const locals = getLocals(
      req,
      'Verifica Codice Fiscale Online Gratis – Controlla CF Valido',
      'Verifica codice fiscale online gratis: controlla se un CF italiano è formalmente valido con il nostro validatore basato su algoritmo ufficiale.',
      'verifica-codice-fiscale'
    );
    locals.structuredData = getStructuredData(locals.siteUrl, 'verifica-codice-fiscale');
    res.render('verifica-codice-fiscale', locals);
  });

  return router;
};
