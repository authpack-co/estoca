// ============================================================
// Estoca — Landing interactions (vanilla JS)
// Envia o lead capturado para o backend (endpoint publico).
// ============================================================

(function () {
  'use strict';

  // Ajuste se o backend estiver em outra URL.
  var API_BASE = 'http://localhost:4001';

  var form = document.getElementById('contact-form');
  var success = document.getElementById('contact-success');
  var resetBtn = document.getElementById('contact-reset');

  if (form && success) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Enviando…'; }

      var payload = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.phone.value.trim(),
        msg: form.elements.msg.value.trim()
      };

      fetch(API_BASE + '/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Falha ao enviar (' + res.status + ')');
          form.hidden = true;
          success.hidden = false;
        })
        .catch(function (err) {
          console.error('[Estoca] Erro ao enviar lead:', err);
          alert('Nao foi possivel enviar agora. Verifique se o backend esta rodando em ' + API_BASE + '.');
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
        });
    });
  }

  if (resetBtn && form && success) {
    resetBtn.addEventListener('click', function () {
      form.reset();
      success.hidden = true;
      form.hidden = false;
    });
  }
})();
