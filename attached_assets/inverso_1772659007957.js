/**
 * inverso.js – Codice Fiscale Inverso (Reverse Decoder)
 * Decodes an Italian tax code into: birthdate, gender, birthplace, visual breakdown.
 * All processing is client-side. No data is ever sent to any server.
 */

'use strict';

// ─── Month code map ────────────────────────────────────────────────────────────
const MONTH_MAP = {
  A: { num: 1,  name: 'Gennaio' },
  B: { num: 2,  name: 'Febbraio' },
  C: { num: 3,  name: 'Marzo' },
  D: { num: 4,  name: 'Aprile' },
  E: { num: 5,  name: 'Maggio' },
  H: { num: 6,  name: 'Giugno' },
  L: { num: 7,  name: 'Luglio' },
  M: { num: 8,  name: 'Agosto' },
  P: { num: 9,  name: 'Settembre' },
  R: { num: 10, name: 'Ottobre' },
  S: { num: 11, name: 'Novembre' },
  T: { num: 12, name: 'Dicembre' },
};

// Odd-position character values for checksum
const ODD_VALUES = {
  '0':1,'1':0,'2':5,'3':7,'4':9,'5':13,'6':15,'7':17,'8':19,'9':21,
  A:1,B:0,C:5,D:7,E:9,F:13,G:15,H:17,I:19,J:21,K:2,L:4,M:18,N:20,
  O:11,P:3,Q:6,R:8,S:12,T:14,U:16,V:10,W:22,X:25,Y:24,Z:23
};
const EVEN_VALUES = {
  '0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,
  A:0,B:1,C:2,D:3,E:4,F:5,G:6,H:7,I:8,J:9,K:10,L:11,M:12,N:13,
  O:14,P:15,Q:16,R:17,S:18,T:19,U:20,V:21,W:22,X:23,Y:24,Z:25
};
const CONTROL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Validate CF checksum character
 */
function validateChecksum(cf) {
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const ch = cf[i].toUpperCase();
    sum += (i % 2 === 0) ? ODD_VALUES[ch] : EVEN_VALUES[ch];
  }
  return CONTROL_CHARS[sum % 26] === cf[15].toUpperCase();
}

/**
 * Decode a Codice Fiscale – returns structured result or throws Error
 */
function decodeCF(raw) {
  const cf = raw.trim().toUpperCase();

  // Basic format validation
  if (cf.length !== 16) throw new Error(`Il codice fiscale deve essere di 16 caratteri (inseriti: ${cf.length}).`);
  if (!/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/i.test(cf)) {
    throw new Error('Il formato del codice fiscale non è corretto. Verifica lettere e numeri nelle posizioni giuste.');
  }

  // Month
  const monthChar = cf[8].toUpperCase();
  const monthData = MONTH_MAP[monthChar];
  if (!monthData) throw new Error(`Codice mese non valido: "${monthChar}".`);

  // Day & gender
  let dayRaw = parseInt(cf.substring(9, 11), 10);
  let gender, day;
  if (dayRaw > 40) {
    gender = 'Femmina';
    day = dayRaw - 40;
  } else {
    gender = 'Maschio';
    day = dayRaw;
  }
  if (day < 1 || day > 31) throw new Error(`Giorno di nascita non valido: ${day}.`);

  // Year (heuristic: if > current year's last 2 digits, assume 1900s)
  const yearSuffix = parseInt(cf.substring(6, 8), 10);
  const currentYear = new Date().getFullYear();
  const currentSuffix = currentYear % 100;
  const year = yearSuffix <= currentSuffix ? 2000 + yearSuffix : 1900 + yearSuffix;

  // Checksum
  const checksumValid = validateChecksum(cf);

  // Municipality code
  const municipalityCode = cf.substring(11, 15).toUpperCase();

  // Age
  const birthDate = new Date(year, monthData.num - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;

  return {
    cf,
    surname: cf.substring(0, 3),
    name:    cf.substring(3, 6),
    year,
    yearSuffix: cf.substring(6, 8),
    monthChar,
    monthName: monthData.name,
    monthNum: monthData.num,
    day,
    dayRaw: cf.substring(9, 11),
    gender,
    municipalityCode,
    checkChar: cf[15],
    checksumValid,
    birthDateFormatted: `${String(day).padStart(2,'0')}/${String(monthData.num).padStart(2,'0')}/${year}`,
    age,
  };
}

// ─── Segment colour classes ─────────────────────────────────────────────────
const SEGMENTS = [
  { start: 0, end: 3,  cls: 'legend-cognome',   label: 'Cognome' },
  { start: 3, end: 6,  cls: 'legend-nome',       label: 'Nome' },
  { start: 6, end: 8,  cls: 'legend-anno',       label: 'Anno' },
  { start: 8, end: 9,  cls: 'legend-mese',       label: 'Mese' },
  { start: 9, end: 11, cls: 'legend-giorno',     label: 'Giorno/Sesso' },
  { start: 11, end: 15, cls: 'legend-comune',    label: 'Comune' },
  { start: 15, end: 16, cls: 'legend-controllo', label: 'Controllo' },
];

/**
 * Render visual character breakdown
 */
function renderBreakdown(cf) {
  const container = document.getElementById('cf-chars');
  container.innerHTML = '';
  for (let i = 0; i < cf.length; i++) {
    const seg = SEGMENTS.find(s => i >= s.start && i < s.end);
    const span = document.createElement('span');
    span.className = `cf-char ${seg ? seg.cls : ''}`;
    span.textContent = cf[i];
    span.setAttribute('title', seg ? seg.label : '');
    container.appendChild(span);
  }
}

/**
 * Render detail table rows
 */
function renderTable(result) {
  const rows = [
    { seg: 'Cognome',     chars: result.cf.substring(0,3),  value: result.cf.substring(0,3),  meaning: 'Consonanti/vocali estratte dal cognome' },
    { seg: 'Nome',        chars: result.cf.substring(3,6),  value: result.cf.substring(3,6),  meaning: 'Consonanti/vocali estratte dal nome' },
    { seg: 'Anno',        chars: result.yearSuffix,          value: result.year,                meaning: `Anno di nascita (${result.year})` },
    { seg: 'Mese',        chars: result.monthChar,           value: result.monthName,           meaning: `Codice mese = ${result.monthName}` },
    { seg: 'Giorno/Sesso',chars: result.dayRaw,              value: `${String(result.day).padStart(2,'0')} (${result.gender})`, meaning: result.gender === 'Femmina' ? 'Giorno + 40 per femmine' : 'Giorno di nascita' },
    { seg: 'Comune',      chars: result.municipalityCode,    value: result.municipalityCode,    meaning: 'Codice catastale comune/stato di nascita' },
    { seg: 'Controllo',   chars: result.checkChar,           value: result.checksumValid ? '✓ Corretto' : '✗ Errato', meaning: 'Carattere di controllo algoritmo' },
  ];

  const tbody = document.getElementById('detail-tbody');
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td><strong>${r.seg}</strong></td>
      <td class="mono">${r.chars}</td>
      <td>${r.value}</td>
      <td>${r.meaning}</td>
    </tr>
  `).join('');
}

// ─── DOM interaction ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const input       = document.getElementById('cf-input');
  const decodeBtn   = document.getElementById('decode-btn');
  const resetBtn    = document.getElementById('reset-btn');
  const resultSec   = document.getElementById('result-section');
  const errorMsg    = document.getElementById('error-msg');

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.hidden = false;
    resultSec.hidden = true;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError() {
    errorMsg.hidden = true;
    input.removeAttribute('aria-invalid');
  }

  function decode() {
    clearError();
    const val = input.value.trim();
    if (!val) {
      showError('Inserisci un codice fiscale prima di procedere.');
      return;
    }

    let result;
    try {
      result = decodeCF(val);
    } catch (e) {
      showError(e.message);
      return;
    }

    // Render breakdown
    renderBreakdown(result.cf);
    renderTable(result);

    // Fill cards
    document.getElementById('result-nascita').textContent = result.birthDateFormatted;
    document.getElementById('result-sesso').textContent   = result.gender;
    document.getElementById('result-comune').textContent  = result.municipalityCode;
    document.getElementById('result-eta').textContent     = `${result.age} anni`;

    // Add warning if checksum invalid
    if (!result.checksumValid) {
      showError('⚠️ Attenzione: il carattere di controllo non è corretto. Il CF potrebbe contenere errori.');
    }

    resultSec.hidden = false;
    resultSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  decodeBtn.addEventListener('click', decode);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') decode(); });
  input.addEventListener('input', () => {
    input.value = input.value.toUpperCase();
    clearError();
  });

  resetBtn.addEventListener('click', () => {
    input.value = '';
    resultSec.hidden = true;
    clearError();
    input.focus();
  });
});
