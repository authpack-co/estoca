// Helpers de UI do painel do cliente: formatadores, severidade, toast.
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

  function num(v) { return (Number(v) || 0).toLocaleString('pt-BR'); }
  function dec(v, d) {
    var n = Number(v);
    if (n == null || isNaN(n)) return '—';
    return n.toLocaleString('pt-BR', { minimumFractionDigits: d == null ? 0 : d, maximumFractionDigits: d == null ? 1 : d });
  }
  function dateBR(d) {
    if (!d) return '—';
    var dt = new Date(d);
    return isNaN(dt) ? '—' : dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
  function dateTimeBR(d) {
    if (!d) return '—';
    var dt = new Date(d);
    return isNaN(dt) ? '—' : dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  // "ha X min" relativo, para o indicador de sincronizacao.
  function ago(d) {
    if (!d) return '—';
    var diff = Math.max(0, Date.now() - new Date(d).getTime());
    var min = Math.floor(diff / 60000);
    if (min < 1) return 'agora mesmo';
    if (min < 60) return 'ha ' + min + ' min';
    var h = Math.floor(min / 60);
    if (h < 24) return 'ha ' + h + 'h';
    return dateBR(d);
  }
  function initials(name) {
    if (!name) return '?';
    var parts = String(name).trim().split(/\s+/).filter(Boolean);
    return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }
  function daysStr(v) {
    if (v == null) return 'sem consumo';
    return dec(v, 1) + ' dias';
  }

  // Severidade -> rotulo/cores. Linguagem de COBERTURA (nao "estoque minimo").
  var SEV = {
    HEALTHY:  { short: 'Saudavel',           label: 'Saudavel',            bg: 'var(--green-bg)', fg: 'var(--green)', dot: '#0F9D63' },
    WARNING:  { short: 'Atencao',            label: 'Cobertura apertada',  bg: 'var(--amber-bg)', fg: 'var(--amber)', dot: '#A8902A' },
    CRITICAL: { short: 'Comprar hoje',       label: 'Risco de ruptura',    bg: 'var(--red-bg)',   fg: 'var(--red)',   dot: '#D6453E' },
  };
  function sev(key) { return SEV[key] || SEV.HEALTHY; }
  function sevPill(key, ordered) {
    var m = sev(key);
    var text = ordered ? 'A caminho' : m.short;
    return '<span class="pill" style="background:' + m.bg + ';color:' + m.fg + '">'
      + '<span class="pill__dot" style="background:' + m.dot + '"></span>' + escapeHtml(text) + '</span>';
  }

  function toast(message, kind) {
    var wrap = document.getElementById('toast-wrap');
    if (!wrap) { wrap = el('<div id="toast-wrap" class="toast-wrap"></div>'); document.body.appendChild(wrap); }
    var t = el('<div class="toast ' + (kind === 'error' ? 'toast--error' : '') + '"><span class="toast__ico">' + (kind === 'error' ? '!' : '✓') + '</span><span>' + escapeHtml(message) + '</span></div>');
    wrap.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }

  function spinner() { return '<div class="spinner"></div>'; }
  function empty(msg) { return '<div class="empty">' + escapeHtml(msg) + '</div>'; }

  return {
    escapeHtml: escapeHtml, el: el, num: num, dec: dec, dateBR: dateBR, dateTimeBR: dateTimeBR,
    ago: ago, initials: initials, daysStr: daysStr, sev: sev, sevPill: sevPill,
    toast: toast, spinner: spinner, empty: empty,
  };
})();
