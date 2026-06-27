// Fornecedores: lead time aprendido a cada entrega.
window.Views = window.Views || {};
window.Views.fornecedores = function (view) {
  var U = window.UI;
  view.innerHTML = U.spinner();

  function relMeta(pct) {
    if (pct == null) return { bg: 'var(--slate-bg)', fg: 'var(--muted-2)', text: 'Sem histórico' };
    if (pct >= 95) return { bg: 'var(--green-bg)', fg: 'var(--green)', text: pct + '% pontual' };
    if (pct >= 85) return { bg: 'var(--amber-bg)', fg: 'var(--amber)', text: pct + '% pontual' };
    return { bg: 'var(--red-bg)', fg: 'var(--red)', text: pct + '% pontual' };
  }

  window.Api.get('/api/app/suppliers').then(function (d) {
    if (d.status === 'SETUP_REQUIRED') { window.Shell.setSync(null, false); view.innerHTML = U.empty('Integração não configurada.'); return; }
    window.Shell.setSync(new Date(), true);
    var list = d.suppliers || [];
    if (!list.length) { view.innerHTML = U.empty('Nenhum fornecedor encontrado no ERP.'); return; }

    var cards = list.map(function (s) {
      var r = relMeta(s.reliabilityPct);
      var leadStr = s.leadTimeDays != null ? U.dec(s.leadTimeDays, 1) + ' dias' : '—';
      return '<div class="card card--pad" data-open="' + s.id + '" style="cursor:pointer">'
        + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">'
        + '<span class="thumb thumb--lg">' + U.escapeHtml(U.initials(s.name)) + '</span>'
        + '<div class="card__title">' + U.escapeHtml(s.name) + '</div></div>'
        + '<div style="display:flex;gap:24px">'
        + '<div><div class="kpi__label" style="margin-bottom:6px">Lead Time médio</div>'
        + '<div style="font-family:var(--font-display);font-weight:700;font-size:22px">' + leadStr + (s.learned ? '' : '') + '</div></div>'
        + '<div><div class="kpi__label" style="margin-bottom:6px">Produtos</div>'
        + '<div style="font-family:var(--font-display);font-weight:700;font-size:22px">' + U.num(s.productCount) + '</div></div></div>'
        + '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line-soft)">'
        + '<span class="pill" style="background:' + r.bg + ';color:' + r.fg + '"><span class="pill__dot" style="background:' + r.fg + '"></span>' + r.text + '</span>'
        + (s.learned ? '' : '<span style="font-size:11px;color:var(--muted);margin-left:8px">lead estimado pelo ERP</span>')
        + '</div></div>';
    }).join('');

    view.innerHTML = '<div class="fade"><div class="grid-3">' + cards + '</div></div>';
    view.querySelectorAll('[data-open]').forEach(function (c) {
      c.addEventListener('click', function () { window.location.hash = '#/fornecedores/' + c.getAttribute('data-open'); });
    });
  }).catch(function (e) {
    view.innerHTML = U.empty('Não foi possível carregar os fornecedores: ' + e.message);
  });
};
