const comuni = require('./comuni.json');

const MESI = {
  1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'H',
  7: 'L', 8: 'M', 9: 'P', 10: 'R', 11: 'S', 12: 'T'
};

const DISPARI = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13,
  '6': 15, '7': 17, '8': 19, '9': 21,
  'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13,
  'G': 15, 'H': 17, 'I': 19, 'J': 21, 'K': 2, 'L': 4,
  'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8,
  'S': 12, 'T': 14, 'U': 16, 'V': 10, 'W': 22, 'X': 25,
  'Y': 24, 'Z': 23
};

const PARI = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5,
  'G': 6, 'H': 7, 'I': 8, 'J': 9, 'K': 10, 'L': 11,
  'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17,
  'S': 18, 'T': 19, 'U': 20, 'V': 21, 'W': 22, 'X': 23,
  'Y': 24, 'Z': 25
};

const ACCENTI = {
  'À':'A','Á':'A','Â':'A','Ã':'A','Ä':'A','Å':'A',
  'È':'E','É':'E','Ê':'E','Ë':'E',
  'Ì':'I','Í':'I','Î':'I','Ï':'I',
  'Ò':'O','Ó':'O','Ô':'O','Õ':'O','Ö':'O',
  'Ù':'U','Ú':'U','Û':'U','Ü':'U',
  'Ñ':'N','Ç':'C'
};

function normalizza(str) {
  str = str.trim().toUpperCase();
  for (const [acc, rep] of Object.entries(ACCENTI)) {
    str = str.split(acc).join(rep);
  }
  return str.replace(/[^A-Z]/g, '');
}

function estraiConsonanti(str) {
  return str.replace(/[AEIOU]/g, '');
}

function estraiVocali(str) {
  return str.replace(/[^AEIOU]/g, '');
}

function calcolaCognome(cognome) {
  const consonanti = estraiConsonanti(cognome);
  const vocali = estraiVocali(cognome);
  const lettere = (consonanti + vocali).padEnd(3, 'X');
  return lettere.substring(0, 3);
}

function calcolaNome(nome) {
  const consonanti = estraiConsonanti(nome);
  if (consonanti.length >= 4) {
    return consonanti[0] + consonanti[2] + consonanti[3];
  }
  const vocali = estraiVocali(nome);
  const lettere = (consonanti + vocali).padEnd(3, 'X');
  return lettere.substring(0, 3);
}

function calcolaAnno(anno) {
  return String(anno % 100).padStart(2, '0');
}

function calcolaMese(mese) {
  return MESI[mese];
}

function calcolaGiorno(giorno, sesso) {
  if (sesso === 'F') giorno += 40;
  return String(giorno).padStart(2, '0');
}

function trovaCodiceComune(comune) {
  const comuneUpper = comune.trim().toUpperCase();
  for (const [nome, codice] of Object.entries(comuni)) {
    if (nome.toUpperCase() === comuneUpper) return codice;
  }
  for (const [nome, codice] of Object.entries(comuni)) {
    if (nome.toUpperCase().startsWith(comuneUpper)) return codice;
  }
  return null;
}

function calcolaChecksum(codice) {
  let somma = 0;
  for (let i = 0; i < 15; i++) {
    const char = codice[i];
    if ((i + 1) % 2 !== 0) {
      somma += DISPARI[char];
    } else {
      somma += PARI[char];
    }
  }
  const resto = somma % 26;
  return String.fromCharCode(65 + resto);
}

function calcola(cognome, nome, dataNascita, sesso, comune) {
  cognome = normalizza(cognome);
  nome = normalizza(nome);
  sesso = sesso.trim().toUpperCase();

  if (sesso !== 'M' && sesso !== 'F') {
    throw new Error('Il sesso deve essere M o F.');
  }

  let anno, mese, giorno;
  let match;
  if ((match = dataNascita.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
    anno = parseInt(match[1]);
    mese = parseInt(match[2]);
    giorno = parseInt(match[3]);
  } else if ((match = dataNascita.match(/^(\d{2})\/(\d{2})\/(\d{4})$/))) {
    giorno = parseInt(match[1]);
    mese = parseInt(match[2]);
    anno = parseInt(match[3]);
  } else {
    throw new Error('Formato data non valido. Usa DD/MM/YYYY o YYYY-MM-DD.');
  }

  if (mese < 1 || mese > 12 || giorno < 1 || giorno > 31) {
    throw new Error('Data di nascita non valida.');
  }

  const codiceComune = trovaCodiceComune(comune);
  if (!codiceComune) {
    throw new Error('Comune non trovato: ' + comune);
  }

  let cf = '';
  cf += calcolaCognome(cognome);
  cf += calcolaNome(nome);
  cf += calcolaAnno(anno);
  cf += calcolaMese(mese);
  cf += calcolaGiorno(giorno, sesso);
  cf += codiceComune;
  cf += calcolaChecksum(cf);

  return cf;
}

function cercaComune(query) {
  const queryUpper = query.trim().toUpperCase();
  const results = [];
  for (const [nome, codice] of Object.entries(comuni)) {
    if (nome.toUpperCase().includes(queryUpper)) {
      results.push({ nome, codice });
      if (results.length >= 20) break;
    }
  }
  return results;
}

module.exports = { calcola, cercaComune };
