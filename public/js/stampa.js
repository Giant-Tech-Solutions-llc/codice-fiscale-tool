'use strict';

var MONTH_MAP = {
  A:'Gennaio', B:'Febbraio', C:'Marzo', D:'Aprile', E:'Maggio', H:'Giugno',
  L:'Luglio', M:'Agosto', P:'Settembre', R:'Ottobre', S:'Novembre', T:'Dicembre'
};

var OMOCODIA_MAP = { L:'0', M:'1', N:'2', P:'3', Q:'4', R:'5', S:'6', T:'7', U:'8', V:'9' };

function normalizeOmocodia(cf) {
  var chars = cf.split('');
  var omoPositions = [6, 7, 9, 10, 12, 13, 14];
  for (var p = 0; p < omoPositions.length; p++) {
    var pos = omoPositions[p];
    if (OMOCODIA_MAP[chars[pos]]) chars[pos] = OMOCODIA_MAP[chars[pos]];
  }
  return chars.join('');
}

function extractInfo(cf) {
  cf = cf.trim().toUpperCase();
  if (cf.length !== 16) return null;
  if (!/^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/i.test(cf)) return null;

  var normalized = normalizeOmocodia(cf);
  var monthChar = normalized[8];
  var monthName = MONTH_MAP[monthChar] || '?';
  var dayRaw = parseInt(normalized.substring(9, 11), 10);
  var gender = dayRaw > 40 ? 'Femmina' : 'Maschio';
  var day = dayRaw > 40 ? dayRaw - 40 : dayRaw;
  var yearSuffix = parseInt(normalized.substring(6, 8), 10);
  var currentSuffix = new Date().getFullYear() % 100;
  var year = yearSuffix <= currentSuffix ? 2000 + yearSuffix : 1900 + yearSuffix;
  var MONTH_ORDER = ['A','B','C','D','E','H','L','M','P','R','S','T'];
  var monthNum = MONTH_ORDER.indexOf(monthChar) + 1;

  return {
    cf: cf,
    birthDate: String(day).padStart(2, '0') + '/' + String(monthNum).padStart(2, '0') + '/' + year,
    gender: gender,
    municipalityCode: normalized.substring(11, 15)
  };
}

document.addEventListener('DOMContentLoaded', function() {
  var input = document.getElementById('stampa-input');
  var generateBtn = document.getElementById('stampa-generate-btn');
  var resetBtn = document.getElementById('stampa-reset-btn');
  var printBtn = document.getElementById('stampa-print-btn');
  var cardDiv = document.getElementById('stampa-card');
  var errorMsg = document.getElementById('stampa-error-msg');

  var cardCF = document.getElementById('card-cf');
  var cardBirth = document.getElementById('card-birth');
  var cardGender = document.getElementById('card-gender');
  var cardMunicipality = document.getElementById('card-municipality');

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.hidden = false;
    cardDiv.hidden = true;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError() {
    errorMsg.hidden = true;
    input.removeAttribute('aria-invalid');
  }

  function generate() {
    clearError();
    var val = input.value.trim();

    if (!val) {
      showError('Inserisci un codice fiscale per generare la tessera.');
      return;
    }

    var info = extractInfo(val);
    if (!info) {
      showError('Il formato del codice fiscale non è valido. Verifica e riprova.');
      return;
    }

    cardCF.textContent = info.cf;
    cardBirth.textContent = info.birthDate;
    cardGender.textContent = info.gender;
    cardMunicipality.textContent = info.municipalityCode;

    cardDiv.hidden = false;
    cardDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  generateBtn.addEventListener('click', generate);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') generate();
  });

  input.addEventListener('input', function() {
    input.value = input.value.toUpperCase();
    clearError();
  });

  resetBtn.addEventListener('click', function() {
    input.value = '';
    cardDiv.hidden = true;
    clearError();
    input.focus();
  });

  printBtn.addEventListener('click', function() {
    window.print();
  });
});
