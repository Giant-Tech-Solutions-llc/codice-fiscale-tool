/**
 * codiceFiscale.service.js
 *
 * Service module for generating and validating Italian Tax ID Codes
 * (Codice Fiscale) according to the official algorithm defined by
 * D.P.R. 29 settembre 1973, n. 605.
 *
 * Exports: generate, validate, extractSurname, extractName,
 *          encodeDate, computeCheckChar, lookupMunicipality
 *
 * @module codiceFiscaleService
 */

'use strict';

// ---------------------------------------------------------------------------
// Lookup tables
// ---------------------------------------------------------------------------

/**
 * Month-to-letter mapping used in CF calculation.
 * January = A … December = T (non-sequential by design).
 * @constant {Object<number, string>}
 */
const MONTH_MAP = {
  1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'H',
  7: 'L', 8: 'M', 9: 'P', 10: 'R', 11: 'S', 12: 'T'
};

/**
 * Reverse month map: letter → month number (1-12).
 * Used during validation to decode the month character.
 * @constant {Object<string, number>}
 */
const MONTH_REVERSE = Object.fromEntries(
  Object.entries(MONTH_MAP).map(([k, v]) => [v, Number(k)])
);

/**
 * Odd-position character values for checksum calculation.
 * Positions are 1-indexed; odd = 1, 3, 5, …, 15.
 * @constant {Object<string, number>}
 */
const ODD_VALUES = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13,
  '6': 15, '7': 17, '8': 19, '9': 21,
  'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13,
  'G': 15, 'H': 17, 'I': 19, 'J': 21, 'K': 2, 'L': 4,
  'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8,
  'S': 12, 'T': 14, 'U': 16, 'V': 10, 'W': 22, 'X': 25,
  'Y': 24, 'Z': 23
};

/**
 * Even-position character values for checksum calculation.
 * Positions are 1-indexed; even = 2, 4, 6, …, 14.
 * @constant {Object<string, number>}
 */
const EVEN_VALUES = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5,
  'G': 6, 'H': 7, 'I': 8, 'J': 9, 'K': 10, 'L': 11,
  'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17,
  'S': 18, 'T': 19, 'U': 20, 'V': 21, 'W': 22, 'X': 23,
  'Y': 24, 'Z': 25
};

/**
 * Accented-character normalisation map.
 * @constant {Object<string, string>}
 */
const ACCENT_MAP = {
  'À': 'A', 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'Ä': 'A', 'Å': 'A',
  'È': 'E', 'É': 'E', 'Ê': 'E', 'Ë': 'E',
  'Ì': 'I', 'Í': 'I', 'Î': 'I', 'Ï': 'I',
  'Ò': 'O', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ö': 'O',
  'Ù': 'U', 'Ú': 'U', 'Û': 'U', 'Ü': 'U',
  'Ñ': 'N', 'Ç': 'C'
};

/**
 * Mock municipality-to-cadastral-code mapping.
 * In production this would be loaded from comuni.json or a database.
 * Keys are uppercase municipality names; values are 4-char cadastral codes.
 * @constant {Object<string, string>}
 */
const MUNICIPALITY_CODES = {
  'ROMA': 'H501',
  'MILANO': 'F205',
  'NAPOLI': 'F839',
  'TORINO': 'L219',
  'PALERMO': 'G273',
  'GENOVA': 'D969',
  'BOLOGNA': 'A944',
  'FIRENZE': 'D612',
  'BARI': 'A662',
  'CATANIA': 'C351',
  'VENEZIA': 'L736',
  'VERONA': 'L781',
  'MESSINA': 'F158',
  'PADOVA': 'G224',
  'TRIESTE': 'L424',
  'BRESCIA': 'B157',
  'TARANTO': 'L049',
  'REGGIO CALABRIA': 'H224',
  'MODENA': 'F257',
  'PRATO': 'G999',
  'CAGLIARI': 'B354',
  'PARMA': 'G337',
  'LIVORNO': 'E625',
  'PERUGIA': 'G478',
  'RAVENNA': 'H199',
  'FOGGIA': 'D643',
  'SALERNO': 'H703',
  'RIMINI': 'H294',
  'FERRARA': 'D548',
  'SASSARI': 'I452',
  'SIRACUSA': 'I754',
  'PESCARA': 'G482',
  'MONZA': 'F704',
  'BERGAMO': 'A794',
  'TRENTO': 'L378',
  'VICENZA': 'L840',
  'TERNI': 'L117',
  'BOLZANO': 'A952',
  'NOVARA': 'F952',
  'ANCONA': 'A271',
  'LECCE': 'E506',
  'PISA': 'G702',
  'COMO': 'C933',
  'UDINE': 'L483',
  'AREZZO': 'A390',
  'LATINA': 'E472',
  'POTENZA': 'G942',
  'CATANZARO': 'C352',
  'CAMPOBASSO': 'B519'
};

/**
 * Regex pattern that describes the structural format of a standard
 * 16-character Codice Fiscale. Does NOT account for omocodia variants.
 * @constant {RegExp}
 */
const CF_PATTERN = /^[A-Z]{6}\d{2}[ABCDEHLMPRST]\d{2}[A-Z]\d{3}[A-Z]$/;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a string for CF processing.
 * Trims, uppercases, replaces accented characters, strips non-alpha.
 *
 * @param {string} str - Raw input string.
 * @returns {string} Cleaned uppercase alphabetic string.
 */
function normalise(str) {
  let s = str.trim().toUpperCase();
  for (const [acc, rep] of Object.entries(ACCENT_MAP)) {
    s = s.split(acc).join(rep);
  }
  return s.replace(/[^A-Z]/g, '');
}

/**
 * Extract consonants from an alphabetic string.
 *
 * @param {string} str - Uppercase alphabetic string.
 * @returns {string} Only the consonant characters, in original order.
 */
function getConsonants(str) {
  return str.replace(/[AEIOU]/g, '');
}

/**
 * Extract vowels from an alphabetic string.
 *
 * @param {string} str - Uppercase alphabetic string.
 * @returns {string} Only the vowel characters, in original order.
 */
function getVowels(str) {
  return str.replace(/[^AEIOU]/g, '');
}

/**
 * Parse a date string in YYYY-MM-DD or DD/MM/YYYY format.
 *
 * @param {string} dateStr - Date string.
 * @returns {{ year: number, month: number, day: number }}
 * @throws {Error} If the format is unrecognised or the date is invalid.
 */
function parseDate(dateStr) {
  let match;
  let year, month, day;

  if ((match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
    year = parseInt(match[1], 10);
    month = parseInt(match[2], 10);
    day = parseInt(match[3], 10);
  } else if ((match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) {
    day = parseInt(match[1], 10);
    month = parseInt(match[2], 10);
    year = parseInt(match[3], 10);
  } else {
    throw new Error('Formato data non valido. Usa YYYY-MM-DD o DD/MM/YYYY.');
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error('Data di nascita non valida.');
  }

  return { year, month, day };
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Encode a surname into its 3-character CF representation.
 *
 * Algorithm:
 *  1. Take consonants in order.
 *  2. If fewer than 3 consonants, append vowels in order.
 *  3. If still fewer than 3 characters total, pad with 'X'.
 *  4. Return the first 3 characters.
 *
 * @param {string} surname - Raw surname string.
 * @returns {string} 3-character uppercase code.
 *
 * @example
 * extractSurname('Rossi')   // → 'RSS'
 * extractSurname('Fo')      // → 'FOX'
 * extractSurname('Aiello')  // → 'LLA'
 */
function extractSurname(surname) {
  const s = normalise(surname);
  const consonants = getConsonants(s);
  const vowels = getVowels(s);
  return (consonants + vowels).padEnd(3, 'X').substring(0, 3);
}

/**
 * Encode a first name into its 3-character CF representation.
 *
 * Algorithm:
 *  1. Extract consonants in order.
 *  2. If there are 4 or more consonants, take the 1st, 3rd and 4th.
 *  3. Otherwise, take consonants then vowels in order.
 *  4. Pad with 'X' if fewer than 3 characters and return first 3.
 *
 * The "skip second consonant" rule (step 2) is the key difference
 * from surname encoding and is defined in the official algorithm.
 *
 * @param {string} name - Raw first name string.
 * @returns {string} 3-character uppercase code.
 *
 * @example
 * extractName('Mario')      // → 'MRA'  (M, R + vowel A)
 * extractName('Alessandro') // → 'LSN'  (1st, 3rd, 4th consonant)
 * extractName('Ada')        // → 'DAA'  (D + vowels A, A)
 */
function extractName(name) {
  const s = normalise(name);
  const consonants = getConsonants(s);
  if (consonants.length >= 4) {
    return consonants[0] + consonants[2] + consonants[3];
  }
  const vowels = getVowels(s);
  return (consonants + vowels).padEnd(3, 'X').substring(0, 3);
}

/**
 * Encode birth date and gender into the 5-character CF segment:
 *   2 digits (year) + 1 letter (month) + 2 digits (day, +40 for female).
 *
 * @param {number} year  - Full birth year (e.g. 1985).
 * @param {number} month - Birth month 1–12.
 * @param {number} day   - Birth day 1–31.
 * @param {string} gender - 'M' or 'F'.
 * @returns {string} 5-character date+gender code.
 * @throws {Error} If gender is not 'M' or 'F'.
 *
 * @example
 * encodeDate(1985, 3, 15, 'M') // → '85C15'
 * encodeDate(1990, 7, 22, 'F') // → '90L62'
 */
function encodeDate(year, month, day, gender) {
  const g = gender.trim().toUpperCase();
  if (g !== 'M' && g !== 'F') {
    throw new Error('Il sesso deve essere M o F.');
  }

  const yy = String(year % 100).padStart(2, '0');
  const m = MONTH_MAP[month];
  if (!m) {
    throw new Error('Mese non valido: ' + month);
  }
  const dd = String(g === 'F' ? day + 40 : day).padStart(2, '0');

  return yy + m + dd;
}

/**
 * Look up a municipality name and return its 4-character cadastral code.
 *
 * Performs exact match first, then prefix match against the mock
 * municipality map. Case-insensitive.
 *
 * @param {string} municipality - Municipality name (e.g. 'Roma').
 * @returns {string|null} 4-char cadastral code, or null if not found.
 *
 * @example
 * lookupMunicipality('Roma')   // → 'H501'
 * lookupMunicipality('xyz')    // → null
 */
function lookupMunicipality(municipality) {
  const key = municipality.trim().toUpperCase();

  if (MUNICIPALITY_CODES[key]) {
    return MUNICIPALITY_CODES[key];
  }

  for (const [name, code] of Object.entries(MUNICIPALITY_CODES)) {
    if (name.startsWith(key)) {
      return code;
    }
  }

  return null;
}

/**
 * Compute the 16th check character (CIN — Carattere Identificativo Numerico)
 * from the first 15 characters of a Codice Fiscale.
 *
 * Algorithm:
 *  1. For each of the 15 characters, look up its numeric value in the
 *     ODD table (positions 1, 3, 5 …) or EVEN table (positions 2, 4, 6 …).
 *  2. Sum all 15 values.
 *  3. Take remainder mod 26 → map to letter (0 = A … 25 = Z).
 *
 * @param {string} partial - The first 15 characters of a CF (uppercase).
 * @returns {string} Single uppercase letter (the check character).
 * @throws {Error} If partial is not exactly 15 characters.
 *
 * @example
 * computeCheckChar('RSSMRA85C15H501') // → 'R'
 */
function computeCheckChar(partial) {
  if (partial.length !== 15) {
    throw new Error('Il codice parziale deve avere esattamente 15 caratteri.');
  }

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const ch = partial[i];
    sum += (i + 1) % 2 !== 0 ? ODD_VALUES[ch] : EVEN_VALUES[ch];
  }

  return String.fromCharCode(65 + (sum % 26));
}

// ---------------------------------------------------------------------------
// Core public API
// ---------------------------------------------------------------------------

/**
 * Generate a Codice Fiscale from personal data.
 *
 * @param {Object} data
 * @param {string} data.surname     - Surname / family name.
 * @param {string} data.name        - First / given name.
 * @param {string} data.gender      - 'M' (male) or 'F' (female).
 * @param {string} data.dateOfBirth - Birth date in YYYY-MM-DD or DD/MM/YYYY.
 * @param {string} data.municipality - Italian municipality name.
 * @returns {string} 16-character Codice Fiscale (uppercase).
 * @throws {Error} On invalid input or unknown municipality.
 *
 * @example
 * generate({
 *   surname: 'Rossi',
 *   name: 'Mario',
 *   gender: 'M',
 *   dateOfBirth: '1985-03-15',
 *   municipality: 'Roma'
 * });
 * // → 'RSSMRA85C15H501R'
 */
function generate({ surname, name, gender, dateOfBirth, municipality }) {
  if (!surname || !surname.trim()) throw new Error('Il cognome è obbligatorio.');
  if (!name || !name.trim()) throw new Error('Il nome è obbligatorio.');
  if (!gender || !gender.trim()) throw new Error('Il sesso è obbligatorio.');
  if (!dateOfBirth || !dateOfBirth.trim()) throw new Error('La data di nascita è obbligatoria.');
  if (!municipality || !municipality.trim()) throw new Error('Il comune di nascita è obbligatorio.');

  const { year, month, day } = parseDate(dateOfBirth.trim());

  const municipalityCode = lookupMunicipality(municipality);
  if (!municipalityCode) {
    throw new Error('Comune non trovato: ' + municipality.trim());
  }

  let cf = '';
  cf += extractSurname(surname);
  cf += extractName(name);
  cf += encodeDate(year, month, day, gender);
  cf += municipalityCode;
  cf += computeCheckChar(cf);

  return cf;
}

/**
 * Validate a Codice Fiscale string.
 *
 * Performs three levels of validation:
 *  1. **Format** — must be exactly 16 uppercase alphanumeric characters
 *     matching the expected pattern (letters and digits in correct positions).
 *  2. **Date plausibility** — the encoded month letter must be valid and the
 *     day value must be in range (1–31 for males, 41–71 for females).
 *  3. **Checksum** — the 16th character must match the control character
 *     computed from the first 15 characters.
 *
 * Note: This validator handles standard CFs only, not omocodia variants
 * (where some digits are replaced with letters by the Agenzia delle Entrate).
 *
 * @param {string} cf - The Codice Fiscale string to validate.
 * @returns {{ valid: boolean, errors: string[] }}
 *   `valid` is true when all checks pass; `errors` lists human-readable
 *   descriptions of every failed check (may contain multiple entries).
 *
 * @example
 * validate('RSSMRA85C15H501R')
 * // → { valid: true, errors: [] }
 *
 * validate('INVALID')
 * // → { valid: false, errors: ['Il Codice Fiscale deve essere di 16 caratteri alfanumerici.'] }
 */
function validate(cf) {
  const errors = [];

  if (typeof cf !== 'string') {
    return { valid: false, errors: ['Il Codice Fiscale deve essere una stringa.'] };
  }

  const code = cf.trim().toUpperCase();

  // --- 1. Format check ---
  if (code.length !== 16) {
    errors.push('Il Codice Fiscale deve essere di 16 caratteri.');
  }

  if (code.length === 16 && !CF_PATTERN.test(code)) {
    errors.push(
      'Il formato del Codice Fiscale non è valido. ' +
      'Verifica che lettere e numeri siano nelle posizioni corrette.'
    );
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // --- 2. Date plausibility ---
  const monthChar = code[8];
  const monthNum = MONTH_REVERSE[monthChar];
  if (!monthNum) {
    errors.push('Il carattere del mese (' + monthChar + ') non è valido.');
  }

  const dayValue = parseInt(code.substring(9, 11), 10);
  const isFemale = dayValue > 40;
  const actualDay = isFemale ? dayValue - 40 : dayValue;
  if (actualDay < 1 || actualDay > 31) {
    errors.push('Il giorno codificato (' + dayValue + ') non è valido.');
  }

  // --- 3. Checksum verification ---
  const expectedCheck = computeCheckChar(code.substring(0, 15));
  if (code[15] !== expectedCheck) {
    errors.push(
      'Il carattere di controllo non corrisponde. ' +
      'Atteso: ' + expectedCheck + ', trovato: ' + code[15] + '.'
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

const comuni = require('./comuni.json');

const COMUNI_REVERSE = {};
for (const [nome, codice] of Object.entries(comuni)) {
  COMUNI_REVERSE[codice.toUpperCase()] = nome;
}

const MONTH_NAMES_IT = {
  1: 'Gennaio', 2: 'Febbraio', 3: 'Marzo', 4: 'Aprile',
  5: 'Maggio', 6: 'Giugno', 7: 'Luglio', 8: 'Agosto',
  9: 'Settembre', 10: 'Ottobre', 11: 'Novembre', 12: 'Dicembre'
};

function decode(cf) {
  if (typeof cf !== 'string') {
    return { valid: false, errors: ['Il Codice Fiscale deve essere una stringa.'], data: null };
  }

  const code = cf.trim().toUpperCase();
  const validation = validate(code);

  if (code.length !== 16 || !CF_PATTERN.test(code)) {
    return { valid: false, errors: validation.errors, data: null };
  }

  const surnameSegment = code.substring(0, 3);
  const nameSegment = code.substring(3, 6);
  const yearSegment = code.substring(6, 8);
  const monthChar = code[8];
  const daySegment = code.substring(9, 11);
  const municipalityCode = code.substring(11, 15);
  const checkChar = code[15];

  const monthNum = MONTH_REVERSE[monthChar] || null;
  const dayValue = parseInt(daySegment, 10);
  const isFemale = dayValue > 40;
  const actualDay = isFemale ? dayValue - 40 : dayValue;
  const gender = isFemale ? 'F' : 'M';
  const genderLabel = isFemale ? 'Femmina' : 'Maschio';

  const yearNum = parseInt(yearSegment, 10);
  const currentYear = new Date().getFullYear() % 100;
  const century = yearNum <= currentYear ? 2000 : 1900;
  const fullYear = century + yearNum;

  const municipalityName = COMUNI_REVERSE[municipalityCode.toUpperCase()] || null;

  const dateStr = monthNum
    ? String(actualDay).padStart(2, '0') + '/' + String(monthNum).padStart(2, '0') + '/' + fullYear
    : null;

  const segments = [
    { chars: surnameSegment, label: 'Cognome', cssClass: 'legend-cognome', description: 'Tre caratteri derivati dalle consonanti e vocali del cognome' },
    { chars: nameSegment, label: 'Nome', cssClass: 'legend-nome', description: 'Tre caratteri derivati dalle consonanti e vocali del nome' },
    { chars: yearSegment, label: 'Anno', cssClass: 'legend-anno', description: 'Ultime due cifre dell\'anno di nascita' },
    { chars: monthChar, label: 'Mese', cssClass: 'legend-mese', description: monthNum ? MONTH_NAMES_IT[monthNum] + ' (mese ' + monthNum + ')' : 'Lettera del mese di nascita' },
    { chars: daySegment, label: 'Giorno/Sesso', cssClass: 'legend-giorno', description: gender === 'F' ? 'Giorno ' + actualDay + ' + 40 (femmina)' : 'Giorno ' + actualDay + ' (maschio)' },
    { chars: municipalityCode, label: 'Comune', cssClass: 'legend-comune', description: municipalityName ? municipalityName + ' (' + municipalityCode + ')' : 'Codice catastale: ' + municipalityCode },
    { chars: checkChar, label: 'Controllo', cssClass: 'legend-controllo', description: 'Carattere di controllo (CIN)' }
  ];

  return {
    valid: validation.valid,
    errors: validation.errors,
    data: {
      codiceFiscale: code,
      surnameSegment,
      nameSegment,
      yearSegment,
      monthChar,
      monthNum,
      monthName: monthNum ? MONTH_NAMES_IT[monthNum] : null,
      daySegment,
      dayValue,
      actualDay,
      gender,
      genderLabel,
      fullYear,
      dateStr,
      municipalityCode,
      municipalityName,
      checkChar,
      segments
    }
  };
}

module.exports = {
  generate,
  validate,
  decode,
  extractSurname,
  extractName,
  encodeDate,
  computeCheckChar,
  lookupMunicipality
};
