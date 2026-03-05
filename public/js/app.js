document.addEventListener('DOMContentLoaded', function() {
    var header = document.getElementById('site-header');
    if (header) {
        var scrollHandler = function() {
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', scrollHandler, { passive: true });
        scrollHandler();
    }

    var menuBtn = document.querySelector('.mobile-menu-btn');
    var navMenu = document.querySelector('.nav-menu');
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            menuBtn.classList.toggle('active');
            this.setAttribute('aria-expanded', navMenu.classList.contains('active'));
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
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

    var form = document.getElementById('cf-form');
    if (form) {
        var comuneInput = document.getElementById('comune');
        var comuneList = document.getElementById('comune-list');
        var debounceTimer;

        if (comuneInput && comuneList) {
            comuneInput.addEventListener('input', function() {
                clearTimeout(debounceTimer);
                var query = this.value.trim();
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
            var sessoEl = document.getElementById('sesso');
            var sesso = sessoEl ? sessoEl.value : '';
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
            btn.classList.add('loading');
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
                btn.classList.remove('loading');
                btn.disabled = false;
                if (data.success) {
                    var resultBox = document.getElementById('result-box');
                    var resultCode = document.getElementById('result-code');
                    resultCode.textContent = data.codice_fiscale;
                    resultBox.classList.add('show');
                    resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    data.errors.forEach(function(err) {
                        showToast(err);
                    });
                }
            })
            .catch(function() {
                btn.classList.remove('loading');
                btn.disabled = false;
                showToast('Errore di connessione. Riprova.');
            });
        });

        var sessoSelect = document.getElementById('sesso');
        if (sessoSelect) {
            sessoSelect.addEventListener('change', function() {
                sessoSelect.classList.remove('error');
                var errMsg = sessoSelect.parentNode.querySelector('.error-msg');
                if (errMsg) errMsg.remove();
            });
        }
    }

    document.querySelectorAll('.faq-question').forEach(function(q) {
        q.addEventListener('click', function() {
            var item = this.parentElement;
            var isOpen = item.classList.contains('open');
            item.classList.toggle('open');
            var answer = item.querySelector('.faq-answer');
            if (answer) {
                if (!isOpen) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                } else {
                    answer.style.maxHeight = '0';
                }
            }
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
        var originalHTML = btn.innerHTML;
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copiato!';
        btn.classList.add('copied');
        showToast('Codice Fiscale copiato!');
        setTimeout(function() {
            btn.innerHTML = originalHTML;
            btn.classList.remove('copied');
        }, 2000);
    });
}

function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}
