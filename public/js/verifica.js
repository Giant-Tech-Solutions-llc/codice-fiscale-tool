'use strict';

const VALID_MONTHS = new Set(['A','B','C','D','E','H','L','M','P','R','S','T']);

const MONTH_NAMES = {
  A:'Gennaio', B:'Febbraio', C:'Marzo', D:'Aprile', E:'Maggio', H:'Giugno',
  L:'Luglio', M:'Agosto', P:'Settembre', R:'Ottobre', S:'Novembre', T:'Dicembre'
};

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

const OMOCODIA_MAP = { L:'0', M:'1', N:'2', P:'3', Q:'4', R:'5', S:'6', T:'7', U:'8', V:'9' };
function normalizeOmocodia(cf) {
  const chars = cf.split('');
  const omoPositions = [6, 7, 9, 10, 12, 13, 14];
  for (const pos of omoPositions) {
    if (OMOCODIA_MAP[chars[pos]]) chars[pos] = OMOCODIA_MAP[chars[pos]];
  }
  return chars.join('');
}

function validateCF(raw) {
  const cf = raw.trim().toUpperCase();
  const checks = [];
  let firstFail = null;

  function check(label, condition, detail, failDetail) {
    const passed = condition;
    checks.push({ label, passed, detail: passed ? detail : failDetail });
    if (!passed && !firstFail) firstFail = { label, detail: failDetail };
    return passed;
  }

  const lengthOk = check(
    'Lunghezza (16 caratteri)',
    cf.length === 16,
    `${cf.length} caratteri rilevati – corretto`,
    `${cf.length} caratteri rilevati – devono essere esattamente 16`
  );
  if (!lengthOk) return { passed: false, checks, extracted: null, firstFail };

  const formatOk = check(
    'Formato alfanumerico',
    /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/.test(cf),
    'Lettere e numeri nelle posizioni corrette',
    'Lettere o numeri non nelle posizioni corrette (verifica il formato)'
  );
  if (!formatOk) return { passed: false, checks, extracted: null, firstFail };

  const normalized = normalizeOmocodia(cf);

  const monthChar = normalized[8];
  const monthOk = check(
    'Codice mese valido',
    VALID_MONTHS.has(monthChar),
    `"${monthChar}" = ${MONTH_NAMES[monthChar] || '?'} – valido`,
    `"${monthChar}" non è un codice mese valido (validi: A B C D E H L M P R S T)`
  );

  const dayRaw = parseInt(normalized.substring(9, 11), 10);
  const isF = dayRaw > 40;
  const day = isF ? dayRaw - 40 : dayRaw;
  const dayOk = check(
    'Giorno di nascita / Sesso',
    (dayRaw >= 1 && dayRaw <= 31) || (dayRaw >= 41 && dayRaw <= 71),
    isF ? `${normalized.substring(9,11)} → giorno ${day} (Femmina)` : `${normalized.substring(9,11)} → giorno ${day} (Maschio)`,
    `Valore "${normalized.substring(9,11)}" non valido (attesi 01–31 per M, 41–71 per F)`
  );

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const ch = cf[i];
    sum += (i % 2 === 0) ? ODD_VALUES[ch] : EVEN_VALUES[ch];
  }
  const expectedControl = CONTROL_CHARS[sum % 26];
  const checksumOk = check(
    'Carattere di controllo (16°)',
    cf[15] === expectedControl,
    `"${cf[15]}" – corretto`,
    `"${cf[15]}" errato – atteso "${expectedControl}". Probabile errore di trascrizione.`
  );

  const passed = lengthOk && formatOk && monthOk && dayOk && checksumOk;

  let extracted = null;
  if (passed) {
    const yearSuffix = parseInt(normalized.substring(6, 8), 10);
    const currentSuffix = new Date().getFullYear() % 100;
    const year = yearSuffix <= currentSuffix ? 2000 + yearSuffix : 1900 + yearSuffix;
    const MONTH_ORDER = ['A','B','C','D','E','H','L','M','P','R','S','T'];
    const monthNum = MONTH_ORDER.indexOf(monthChar) + 1;
    extracted = {
      birthDate: `${String(day).padStart(2,'0')}/${String(monthNum).padStart(2,'0')}/${year}`,
      gender: isF ? 'Femmina' : 'Maschio',
      municipalityCode: normalized.substring(11, 15),
    };
  }

  return { passed, checks, extracted, firstFail };
}

document.addEventListener('DOMContentLoaded', () => {
  const input      = document.getElementById('cf-verifica-input');
  const btn        = document.getElementById('verifica-btn');
  const resetBtn   = document.getElementById('verifica-reset-btn');
  const resultDiv  = document.getElementById('verifica-result');
  const badge      = document.getElementById('verdict-badge');
  const icon       = document.getElementById('verdict-icon');
  const text       = document.getElementById('verdict-text');
  const sub        = document.getElementById('verdict-sub');
  const checkItems = document.getElementById('check-items');
  const quickExt   = document.getElementById('quick-extract');

  function verify() {
    const val = input.value.trim();
    if (!val) {
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }

    const result = validateCF(val);

    badge.className = `verdict-badge ${result.passed ? 'verdict-valid' : 'verdict-invalid'}`;
    icon.textContent = result.passed ? '✓' : '✗';
    text.textContent = result.passed ? 'CODICE FISCALE VALIDO' : 'CODICE FISCALE NON VALIDO';
    sub.textContent  = result.passed
      ? 'Il codice fiscale è formalmente corretto e rispetta tutti i controlli.'
      : `Errore rilevato: ${result.firstFail ? result.firstFail.detail : 'Struttura non valida.'}`;

    checkItems.innerHTML = result.checks.map(c => `
      <li class="check-item ${c.passed ? 'check-pass' : 'check-fail'}">
        <span class="check-icon" aria-hidden="true">${c.passed ? '✓' : '✗'}</span>
        <span class="check-label">${c.label}</span>
        <span class="check-detail">${c.detail}</span>
      </li>
    `).join('');

    if (result.passed && result.extracted) {
      document.getElementById('qe-nascita').textContent = result.extracted.birthDate;
      document.getElementById('qe-sesso').textContent   = result.extracted.gender;
      document.getElementById('qe-comune').textContent  = result.extracted.municipalityCode;
      quickExt.hidden = false;
    } else {
      quickExt.hidden = true;
    }

    resultDiv.hidden = false;
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  btn.addEventListener('click', verify);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') verify(); });
  input.addEventListener('input', () => {
    input.value = input.value.toUpperCase();
    input.removeAttribute('aria-invalid');
  });

  resetBtn.addEventListener('click', () => {
    input.value = '';
    resultDiv.hidden = true;
    quickExt.hidden = true;
    input.focus();
  });
});
