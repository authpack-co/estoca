// Produtos: cobertura, lead time e situação por item (clicável).
window.Views = window.Views || {};
window.Views.produtos = function (view) {
  var U = window.UI;
  view.innerHTML = U.spinner();

  window.Api.get('/api/app/products').then(function (d) {
    if (d.status === 'SETUP_REQUIRED') {
      window.Shell.setSync(null, false);
      view.innerHTML = U.empty('Integração com o ERP ainda não configurada.');
      return;
    }
    window.Shell.setSync(d.lastSyncAt, true);
    var all = d.products || [];

    view.innerHTML =
      '<div class="fade">'
      + '<div class="search-box"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>'
      + '<input id="prod-search" placeholder="Pesquisar produto…" autocomplete="off"></div>'
      + '<div class="card card--clip">'
      + '<div class="ptable__head"><span>Produto</span><span>Cobertura</span><span>Lead Time</span><span>Situação</span></div>'
      + '<div id="prod-rows"></div></div></div>';

    var rowsEl = view.querySelector('#prod-rows');
    function render(list) {
      if (!list.length) { rowsEl.innerHTML = U.empty('Nenhum produto encontrado.'); return; }
      rowsEl.innerHTML = list.map(function (p) {
        var m = U.sev(p.severity);
        var cov = p.coverageDays == null ? '∞' : U.dec(p.coverageDays, 1) + ' dias';
        return '<div class="ptable__row" data-open="' + p.erpProductId + '">'
          + '<span style="display:flex;align-items:center;gap:12px;min-width:0">'
          + '<span class="thumb">' + U.escapeHtml(U.initials(p.name)) + '</span>'
          + '<span style="min-width:0"><span style="font-weight:600;display:block">' + U.escapeHtml(p.name) + '</span>'
          + '<span style="font-size:11.5px;color:var(--muted)">' + U.escapeHtml(p.supplierName || '—') + '</span></span></span>'
          + '<span class="mono" style="color:var(--ink)">' + cov + '</span>'
          + '<span class="mono" style="color:var(--muted-2)">' + U.num(p.leadTimeDays) + ' dias</span>'
          + '<span>' + U.sevPill(p.severity) + '</span></div>';
      }).join('');
      rowsEl.querySelectorAll('[data-open]').forEach(function (r) {
        r.addEventListener('click', function () { window.location.hash = '#/produtos/' + r.getAttribute('data-open'); });
      });
    }
    render(all);

    var search = view.querySelector('#prod-search');
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase();
      render(!q ? all : all.filter(function (p) {
        return (p.name || '').toLowerCase().indexOf(q) >= 0
          || (p.supplierName || '').toLowerCase().indexOf(q) >= 0;
      }));
    });
  }).catch(function (e) {
    view.innerHTML = U.empty('Não foi possível carregar os produtos: ' + e.message);
  });
};
