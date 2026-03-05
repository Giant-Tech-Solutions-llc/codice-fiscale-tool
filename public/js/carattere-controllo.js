'use strict';

var ODD_VALUES = {
  '0':1,'1':0,'2':5,'3':7,'4':9,'5':13,'6':15,'7':17,'8':19,'9':21,
  A:1,B:0,C:5,D:7,E:9,F:13,G:15,H:17,I:19,J:21,K:2,L:4,M:18,N:20,
  O:11,P:3,Q:6,R:8,S:12,T:14,U:16,V:10,W:22,X:25,Y:24,Z:23
};
var EVEN_VALUES = {
  '0':0,'1':1,'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,
  A:0,B:1,C:2,D:3,E:4,F:5,G:6,H:7,I:8,J:9,K:10,L:11,M:12,N:13,
  O:14,P:15,Q:16,R:17,S:18,T:19,U:20,V:21,W:22,X:23,Y:24,Z:25
};
var CONTROL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function calcolaCarattereControllo(partial) {
  partial = partial.toUpperCase();
  var sum = 0;
  for (var i = 0; i < 15; i++) {
    var ch = partial[i];
    sum += (i % 2 === 0) ? ODD_VALUES[ch] : EVEN_VALUES[ch];
  }
  return CONTROL_CHARS[sum % 26];
}

document.addEventListener('DOMContentLoaded', function() {
  var input = document.getElementById('cc-input');
  var calcBtn = document.getElementById('cc-calc-btn');
  var resetBtn = document.getElementById('cc-reset-btn');
  var resultDiv = document.getElementById('cc-result');
  var resultChar = document.getElementById('cc-result-char');
  var resultFull = document.getElementById('cc-result-full');
  var errorMsg = document.getElementById('cc-error-msg');
  var charCount = document.getElementById('cc-char-count');

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.hidden = false;
    resultDiv.hidden = true;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError() {
    errorMsg.hidden = true;
    input.removeAttribute('aria-invalid');
  }

  function calculate() {
    clearError();
    var val = input.value.trim().toUpperCase();

    if (!val) {
      showError('Inserisci i primi 15 caratteri del codice fiscale.');
      return;
    }

    if (val.length !== 15) {
      showError('Devi inserire esattamente 15 caratteri (inseriti: ' + val.length + ').');
      return;
    }

    if (!/^[A-Z0-9]{15}$/.test(val)) {
      showError('Il codice deve contenere solo lettere (A-Z) e numeri (0-9).');
      return;
    }

    var controlChar = calcolaCarattereControllo(val);
    var fullCF = val + controlChar;

    resultChar.textContent = controlChar;
    resultFull.textContent = fullCF;
    resultDiv.hidden = false;
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  calcBtn.addEventListener('click', calculate);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') calculate();
  });

  input.addEventListener('input', function() {
    input.value = input.value.toUpperCase();
    clearError();
    if (charCount) {
      charCount.textContent = input.value.trim().length + '/15';
    }
  });

  resetBtn.addEventListener('click', function() {
    input.value = '';
    resultDiv.hidden = true;
    clearError();
    if (charCount) charCount.textContent = '0/15';
    input.focus();
  });
});
