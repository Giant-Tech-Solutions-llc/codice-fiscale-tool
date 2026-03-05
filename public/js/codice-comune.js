'use strict';

document.addEventListener('DOMContentLoaded', function() {
  var input = document.getElementById('comune-search-input');
  var searchBtn = document.getElementById('comune-search-btn');
  var resetBtn = document.getElementById('comune-reset-btn');
  var resultDiv = document.getElementById('comune-result');
  var resultList = document.getElementById('comune-result-list');
  var errorMsg = document.getElementById('comune-error-msg');
  var debounceTimer;

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

  function search() {
    clearError();
    var query = input.value.trim();
    if (!query) {
      showError('Inserisci il nome di un comune per cercarlo.');
      return;
    }
    if (query.length < 2) {
      showError('Inserisci almeno 2 caratteri per avviare la ricerca.');
      return;
    }

    fetch('/api/comuni?q=' + encodeURIComponent(query))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data || data.length === 0) {
          resultList.innerHTML = '<tr><td colspan="2" style="text-align:center;padding:1.5rem;color:#6b7280;">Nessun comune trovato per "<strong>' + escapeHtml(query) + '</strong>"</td></tr>';
          resultDiv.hidden = false;
          return;
        }

        resultList.innerHTML = data.map(function(c) {
          return '<tr>' +
            '<td style="font-weight:500;">' + escapeHtml(c.nome) + '</td>' +
            '<td><span class="codice-badge">' + escapeHtml(c.codice) + '</span></td>' +
            '</tr>';
        }).join('');

        resultDiv.hidden = false;
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      })
      .catch(function() {
        showError('Errore di connessione. Riprova più tardi.');
      });
  }

  searchBtn.addEventListener('click', search);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') search();
  });

  input.addEventListener('input', function() {
    clearError();
    clearTimeout(debounceTimer);
    var query = input.value.trim();
    if (query.length >= 2) {
      debounceTimer = setTimeout(search, 350);
    } else {
      resultDiv.hidden = true;
    }
  });

  resetBtn.addEventListener('click', function() {
    input.value = '';
    resultDiv.hidden = true;
    clearError();
    input.focus();
  });
});

function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
