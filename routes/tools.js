const express = require('express');

module.exports = function createToolsRouter(getLocals, getStructuredData) {
  const router = express.Router();

  router.get('/codice-fiscale-inverso', (req, res) => {
    const locals = getLocals(
      req,
      'Codice Fiscale Inverso – Decodifica CF Online Gratis | Calcolo Codice Fiscale',
      'Calcolo codice fiscale inverso online gratis: inserisci il CF e scopri immediatamente data di nascita, sesso, comune di nascita e struttura completa. Strumento gratuito basato su algoritmo ufficiale.',
      'codice-fiscale-inverso'
    );

    locals.extraHead = '<meta name="keywords" content="codice fiscale inverso, calcolo codice fiscale inverso, cf inverso, decodifica codice fiscale, data di nascita da codice fiscale, dati da codice fiscale, calcola codice fiscale inverso" />\n<link rel="stylesheet" href="/css/inverso.css" />';

    locals.structuredData = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "${locals.siteUrl}/codice-fiscale-inverso#webpage",
      "url": "${locals.siteUrl}/codice-fiscale-inverso",
      "name": "Codice Fiscale Inverso – Decodifica CF Online Gratis",
      "description": "Calcolo codice fiscale inverso: inserisci il CF e scopri data di nascita, sesso e comune di nascita.",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {"@type":"ListItem","position":1,"name":"Home","item":"${locals.siteUrl}/"},
          {"@type":"ListItem","position":2,"name":"Strumenti"},
          {"@type":"ListItem","position":3,"name":"Codice Fiscale Inverso"}
        ]
      }
    },
    {
      "@type": "HowTo",
      "name": "Come decodificare un Codice Fiscale",
      "step": [
        {"@type":"HowToStep","name":"Inserisci il CF","text":"Digita il codice fiscale di 16 caratteri nel campo apposito."},
        {"@type":"HowToStep","name":"Clicca Decodifica","text":"Premi il pulsante per avviare l'analisi istantanea."},
        {"@type":"HowToStep","name":"Leggi i risultati","text":"Visualizza data di nascita, sesso, comune di nascita e la scomposizione visiva carattere per carattere."}
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type":"Question",
          "name":"Cosa si può ricavare dal codice fiscale inverso?",
          "acceptedAnswer":{"@type":"Answer","text":"Dal codice fiscale è possibile estrarre: data di nascita completa (giorno, mese, anno), sesso (M/F) e comune o stato estero di nascita."}
        },
        {
          "@type":"Question",
          "name":"Il calcolo del codice fiscale inverso è affidabile?",
          "acceptedAnswer":{"@type":"Answer","text":"Sì, il nostro strumento usa l'algoritmo ufficiale dell'Agenzia delle Entrate per decodificare ogni segmento del CF con precisione."}
        },
        {
          "@type":"Question",
          "name":"È possibile risalire al nome e cognome dal codice fiscale?",
          "acceptedAnswer":{"@type":"Answer","text":"No, il codice fiscale non contiene informazioni sufficienti per risalire con certezza al nome e cognome completi, poiché vengono usate solo alcune consonanti/vocali."}
        }
      ]
    }
  ]
}
<\/script>`;

    res.render('codice-fiscale-inverso', locals);
  });

  router.get('/verifica-codice-fiscale', (req, res) => {
    const locals = getLocals(
      req,
      'Verifica Codice Fiscale Online Gratis – Controlla CF Valido | Calcolo Codice Fiscale',
      'Verifica codice fiscale online gratis: controlla istantaneamente se un CF italiano è formalmente valido o contiene errori. Validazione basata su algoritmo ufficiale Agenzia delle Entrate.',
      'verifica-codice-fiscale'
    );

    locals.extraHead = '<meta name="keywords" content="verifica codice fiscale, controlla codice fiscale, validazione codice fiscale, codice fiscale valido, verifica cf online, controllare codice fiscale, codice fiscale corretto" />\n<link rel="stylesheet" href="/css/verifica.css" />';

    locals.structuredData = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "${locals.siteUrl}/verifica-codice-fiscale#webpage",
      "url": "${locals.siteUrl}/verifica-codice-fiscale",
      "name": "Verifica Codice Fiscale Online Gratis",
      "description": "Valida un codice fiscale italiano e scopri se è formalmente corretto.",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {"@type":"ListItem","position":1,"name":"Home","item":"${locals.siteUrl}/"},
          {"@type":"ListItem","position":2,"name":"Strumenti"},
          {"@type":"ListItem","position":3,"name":"Verifica Codice Fiscale"}
        ]
      }
    },
    {
      "@type": "HowTo",
      "name": "Come verificare la validità di un Codice Fiscale",
      "step": [
        {"@type":"HowToStep","name":"Inserisci il CF","text":"Digita il codice fiscale da verificare nel campo di testo."},
        {"@type":"HowToStep","name":"Clicca Verifica","text":"Premi il pulsante per avviare la validazione automatica."},
        {"@type":"HowToStep","name":"Leggi il risultato","text":"Il sistema risponde con VALIDO o NON VALIDO, indicando l'eventuale errore specifico trovato."}
      ]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type":"Question",
          "name":"Come si verifica se un codice fiscale è corretto?",
          "acceptedAnswer":{"@type":"Answer","text":"Un codice fiscale è formalmente valido se: ha esattamente 16 caratteri, rispetta il formato alfanumerico standard, e il carattere di controllo finale (16° carattere) corrisponde al valore calcolato dall'algoritmo ufficiale."}
        },
        {
          "@type":"Question",
          "name":"Cosa controlla il validatore di codice fiscale?",
          "acceptedAnswer":{"@type":"Answer","text":"Il nostro validatore verifica: lunghezza (deve essere 16 caratteri), formato (pattern lettere/numeri corretto), validità del codice mese, validità del giorno/sesso, e soprattutto il carattere di controllo finale calcolato con l'algoritmo ufficiale."}
        },
        {
          "@type":"Question",
          "name":"Un codice fiscale valido formalmente è sempre quello ufficiale?",
          "acceptedAnswer":{"@type":"Answer","text":"Non necessariamente. La validazione formale confirma che il CF rispetta la struttura algoritmica, ma non può confrontarlo con i registri ufficiali dell'Agenzia delle Entrate, che è l'unica a poter confermare l'associazione a una persona reale."}
        }
      ]
    }
  ]
}
<\/script>`;

    res.render('verifica-codice-fiscale', locals);
  });

  return router;
};
