'use strict';

const codiceFiscaleService = require('../src/codiceFiscale.service.js');

const FIELD_RULES = [
  { field: 'cognome',      label: 'Il cognome è obbligatorio.',            pattern: /^[A-Za-zÀ-ÿ' -]{2,}$/ },
  { field: 'nome',         label: 'Il nome è obbligatorio.',               pattern: /^[A-Za-zÀ-ÿ' -]{2,}$/ },
  { field: 'sesso',        label: 'Il sesso è obbligatorio.',              pattern: /^[MF]$/ },
  { field: 'data_nascita', label: 'La data di nascita è obbligatoria.',    pattern: /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/ },
  { field: 'comune',       label: 'Il comune di nascita è obbligatorio.',  pattern: /^[A-Za-zÀ-ÿ' -]{2,}$/ }
];

function validateInputs(body) {
  const errors = [];

  for (const rule of FIELD_RULES) {
    const value = (body[rule.field] || '').trim();
    if (!value) {
      errors.push(rule.label);
    } else if (!rule.pattern.test(value)) {
      errors.push(`Il campo "${rule.field}" contiene un valore non valido.`);
    }
  }

  return errors;
}

function sanitise(body) {
  return {
    cognome:      (body.cognome      || '').trim(),
    nome:         (body.nome         || '').trim(),
    sesso:        (body.sesso        || '').trim().toUpperCase(),
    data_nascita: (body.data_nascita || '').trim(),
    comune:       (body.comune       || '').trim()
  };
}

const VIEW = 'codice-fiscale';
const EMPTY_FORM = { cognome: '', nome: '', sesso: '', data_nascita: '', comune: '' };

function showForm(req, res) {
  res.render(VIEW, {
    result: null,
    errors: [],
    formData: EMPTY_FORM
  });
}

function handleCalculation(req, res) {
  const raw = sanitise(req.body);
  const errors = validateInputs(raw);

  if (errors.length > 0) {
    return res.status(422).render(VIEW, {
      result: null,
      errors,
      formData: raw
    });
  }

  try {
    const codiceFiscale = codiceFiscaleService.generate({
      surname:      raw.cognome,
      name:         raw.nome,
      gender:       raw.sesso,
      dateOfBirth:  raw.data_nascita,
      municipality: raw.comune
    });

    return res.render(VIEW, {
      result: codiceFiscale,
      errors: [],
      formData: raw
    });
  } catch (err) {
    return res.status(422).render(VIEW, {
      result: null,
      errors: [err.message],
      formData: raw
    });
  }
}

module.exports = { showForm, handleCalculation };
