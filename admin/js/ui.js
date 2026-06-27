// Helpers de UI: formatadores, pills, toast e modal.
window.UI = (function () {
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function money(v) {
    var n = Number(v) || 0;
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function moneyShort(v) {
    var n = Number(v) || 0;
    if (n >= 1000000) return 'R$ ' + (n / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'M';
    if (n >= 1000) return 'R$ ' + (n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k';
    return money(n);
  }
  function dateBR(d) {
    if (!d) return '—';
    var dt = new Date(d);
    return isNaN(dt) ? '—' : dt.toLocaleDateString('pt-BR');
  }
  function dateTimeBR(d) {
    if (!d) return '—';
    var dt = new Date(d);
    return isNaN(dt) ? '—' : dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  function initials(name) {
    if (!name) return '?';
    var parts = String(name).trim().split(/\s+/);
    return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }
  function num(v) { return (Number(v) || 0).toLocaleString('pt-BR'); }

  // Pills por dominio.
  var LEAD = { NEW: ['Novo', 'amber'], CONTACTED: ['Contatado', 'blue'], NEGOTIATING: ['Negociação', 'slate'], WON: ['Ganho', 'green'], LOST: ['Perdido', 'red'] };
  var COMPANY = { ACTIVE: ['Ativo', 'green'], PENDING_INTEGRATION: ['Onboarding', 'amber'], SUSPENDED: ['Pausado', 'slate'] };
  var INTEGRATION = { CONNECTED: ['Sincronizado', 'green'], PENDING: ['Pendente', 'amber'], ERROR: ['Desconectado', 'red'] };
  var INVOICE = { PAID: ['Pago', 'green'], OPEN: ['Pendente', 'amber'], OVERDUE: ['Atrasado', 'red'] };

  function pill(map, key) {
    var def = map[key] || [key, 'slate'];
    return '<span class="pill pill--' + def[1] + '">' + escapeHtml(def[0]) + '</span>';
  }
  function erpPill(key) {
    var def = INTEGRATION[key] || [key, 'slate'];
    var color = def[1] === 'green' ? '#10B981' : def[1] === 'amber' ? '#E0A800' : '#94A3B8';
    return '<span class="erp" style="color:' + (def[1] === 'green' ? '#0F9D63' : def[1] === 'amber' ? '#A8902A' : '#94A3B8') + '">'
      + '<span class="pill__dot" style="background:' + color + '"></span>' + escapeHtml(def[0]) + '</span>';
  }

  // Toast.
  function toast(message, kind) {
    var wrap = document.getElementById('toast-wrap');
    if (!wrap) { wrap = el('<div id="toast-wrap" class="toast-wrap"></div>'); document.body.appendChild(wrap); }
    var t = el('<div class="toast ' + (kind === 'error' ? 'toast--error' : '') + '"><span class="toast__ico">' + (kind === 'error' ? '!' : '✓') + '</span><span>' + escapeHtml(message) + '</span></div>');
    wrap.appendChild(t);
    setTimeout(function () { t.remove(); }, 2800);
  }

  /**
   * Abre um modal com formulario.
   * fields: [{ name, label, type, placeholder, required, options:[{value,label}], value }]
   * onSubmit(values) -> pode ser async; retornar/throw controla fechamento.
   */
  function modal(opts) {
    var fieldsHtml = (opts.fields || []).map(function (f) {
      var inner;
      if (f.type === 'select') {
        inner = '<select class="input" name="' + f.name + '"' + (f.required ? ' required' : '') + '>'
          + (f.options || []).map(function (o) {
            var sel = (f.value != null && String(f.value) === String(o.value)) ? ' selected' : '';
            return '<option value="' + escapeHtml(o.value) + '"' + sel + '>' + escapeHtml(o.label) + '</option>';
          }).join('') + '</select>';
      } else if (f.type === 'textarea') {
        inner = '<textarea class="input" name="' + f.name + '" placeholder="' + escapeHtml(f.placeholder || '') + '"' + (f.required ? ' required' : '') + '>' + escapeHtml(f.value || '') + '</textarea>';
      } else {
        inner = '<input class="input" name="' + f.name + '" type="' + (f.type || 'text') + '" placeholder="' + escapeHtml(f.placeholder || '') + '" value="' + escapeHtml(f.value || '') + '"' + (f.required ? ' required' : '') + '>';
      }
      return '<div class="field"><label class="label">' + escapeHtml(f.label) + '</label>' + inner + '</div>';
    }).join('');

    var overlay = el(
      '<div class="overlay"><div class="modal">'
      + '<div class="modal__head"><div><h3 class="modal__title">' + escapeHtml(opts.title) + '</h3>'
      + (opts.sub ? '<p class="modal__sub">' + escapeHtml(opts.sub) + '</p>' : '') + '</div>'
      + '<button class="modal__close" type="button">×</button></div>'
      + '<form class="modal__body"><div class="fields">' + fieldsHtml + '</div>'
      + '<div class="modal__actions"><button type="button" class="btn btn--ghost" data-cancel>Cancelar</button>'
      + '<button type="submit" class="btn btn--yellow">' + escapeHtml(opts.submitLabel || 'Salvar') + '</button></div>'
      + '</form></div></div>'
    );

    function close() { overlay.remove(); }
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('.modal__close').addEventListener('click', close);
    overlay.querySelector('[data-cancel]').addEventListener('click', close);

    var form = overlay.querySelector('form');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var values = {};
      (opts.fields || []).forEach(function (f) {
        var v = form.elements[f.name].value;
        values[f.name] = typeof v === 'string' ? v.trim() : v;
      });
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; var lbl = btn.textContent; btn.textContent = 'Salvando…';
      try {
        await opts.onSubmit(values, close);
      } catch (err) {
        toast(err.message || 'Erro ao salvar.', 'error');
        btn.disabled = false; btn.textContent = lbl;
      }
    });

    document.body.appendChild(overlay);
    var first = overlay.querySelector('input,select,textarea');
    if (first) first.focus();
    return { close: close };
  }

  return {
    escapeHtml: escapeHtml, el: el, money: money, moneyShort: moneyShort,
    dateBR: dateBR, dateTimeBR: dateTimeBR, initials: initials, num: num,
    pill: pill, erpPill: erpPill, toast: toast, modal: modal,
    maps: { LEAD: LEAD, COMPANY: COMPANY, INTEGRATION: INTEGRATION, INVOICE: INVOICE },
  };
})();
