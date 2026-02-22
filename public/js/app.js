document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.setAttribute('aria-expanded', navMenu.classList.contains('active'));
        });
    }

    document.querySelectorAll('.has-dropdown').forEach(function(item) {
        item.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                if (e.target.closest('.dropdown')) return;
                e.preventDefault();
                this.classList.toggle('open');
            }
        });
    });

    const form = document.getElementById('cf-form');
    if (form) {
        const comuneInput = document.getElementById('comune');
        const comuneList = document.getElementById('comune-list');
        let debounceTimer;

        if (comuneInput && comuneList) {
            comuneInput.addEventListener('input', function() {
                clearTimeout(debounceTimer);
                const query = this.value.trim();
                if (query.length < 2) {
                    comuneList.innerHTML = '';
                    comuneList.style.display = 'none';
                    return;
                }
                debounceTimer = setTimeout(function() {
                    fetch('/api/comuni?q=' + encodeURIComponent(query))
                        .then(function(r) { return r.json(); })
                        .then(function(data) {
                            if (data.length === 0) {
                                comuneList.innerHTML = '<div class="ac-item no-result">Nessun comune trovato</div>';
                                comuneList.style.display = 'block';
                                return;
                            }
                            comuneList.innerHTML = data.map(function(c) {
                                return '<div class="ac-item" data-nome="' + c.nome + '">' + c.nome + ' <small>(' + c.codice + ')</small></div>';
                            }).join('');
                            comuneList.style.display = 'block';
                        });
                }, 250);
            });

            comuneList.addEventListener('click', function(e) {
                var item = e.target.closest('.ac-item[data-nome]');
                if (item) {
                    comuneInput.value = item.getAttribute('data-nome');
                    comuneList.style.display = 'none';
                }
            });

            document.addEventListener('click', function(e) {
                if (!e.target.closest('.comune-wrapper')) {
                    comuneList.style.display = 'none';
                }
            });
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var errors = [];
            var cognome = document.getElementById('cognome').value.trim();
            var nome = document.getElementById('nome').value.trim();
            var sesso = document.getElementById('sesso').value;
            var dataNascita = document.getElementById('data_nascita').value;
            var comune = document.getElementById('comune').value.trim();

            document.querySelectorAll('.error-msg').forEach(function(el) { el.remove(); });
            document.querySelectorAll('.error').forEach(function(el) { el.classList.remove('error'); });

            if (!cognome) showError('cognome', 'Il cognome è obbligatorio');
            if (!nome) showError('nome', 'Il nome è obbligatorio');
            if (!sesso) showError('sesso', 'Seleziona il sesso');
            if (!dataNascita) showError('data_nascita', 'La data di nascita è obbligatoria');
            if (!comune) showError('comune', 'Il comune di nascita è obbligatorio');

            if (document.querySelectorAll('.error-msg').length > 0) return;

            var btn = form.querySelector('.btn-primary');
            btn.textContent = 'Calcolo in corso...';
            btn.disabled = true;

            fetch('/api/calcola', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cognome: cognome,
                    nome: nome,
                    sesso: sesso,
                    data_nascita: dataNascita,
                    comune: comune
                })
            })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                btn.textContent = 'Calcola Codice Fiscale';
                btn.disabled = false;
                if (data.success) {
                    var resultBox = document.getElementById('result-box');
                    var resultCode = document.getElementById('result-code');
                    resultCode.textContent = data.codice_fiscale;
                    resultBox.classList.add('show');
                    resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    data.errors.forEach(function(err) {
                        alert(err);
                    });
                }
            })
            .catch(function() {
                btn.textContent = 'Calcola Codice Fiscale';
                btn.disabled = false;
                alert('Errore di connessione. Riprova.');
            });
        });
    }

    document.querySelectorAll('.faq-question').forEach(function(q) {
        q.addEventListener('click', function() {
            this.parentElement.classList.toggle('open');
        });
    });
});

function showError(id, msg) {
    var el = document.getElementById(id);
    if (el) {
        el.classList.add('error');
        var errDiv = document.createElement('div');
        errDiv.className = 'error-msg';
        errDiv.textContent = msg;
        el.parentNode.appendChild(errDiv);
    }
}

function copyCF() {
    var code = document.getElementById('result-code').textContent;
    navigator.clipboard.writeText(code).then(function() {
        var btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copiato!';
        btn.classList.add('copied');
        setTimeout(function() {
            btn.textContent = 'Copia';
            btn.classList.remove('copied');
        }, 2000);
    });
}
