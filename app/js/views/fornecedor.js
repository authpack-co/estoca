// Detalhe do fornecedor: pontualidade e histórico de pedidos (lead time calculado).
window.Views = window.Views || {};
window.Views.fornecedor = function (view, id) {
  var U = window.UI;
  view.innerHTML = U.spinner();

  window.Api.get('/api/app/suppliers/' + id).then(function (d) {
    if (d.status === 'SETUP_REQUIRED') { view.innerHTML = U.empty('Integração não configurada.'); return; }
    var s = d.supplier;
    window.Shell.setSync(new Date(), true);

    var relText = s.reliabilityPct != null ? s.reliabilityPct + '%' : '—';
    var relColor = s.reliabilityPct == null ? 'var(--muted-2)' : (s.reliabilityPct >= 95 ? 'var(--green)' : (s.reliabilityPct >= 85 ? 'var(--amber)' : 'var(--red)'));
    var varStr = s.varianceDays != null ? '± ' + U.dec(s.varianceDays, 1) + ' d' : '—';
    var leadStr = s.leadTimeDays != null ? U.dec(s.leadTimeDays, 1) + ' dias' : '—';

    var ordersHtml = (s.orders || []).length ? (s.orders).map(function (o) {
      return '<div style="display:grid;grid-template-columns:1.8fr 1fr 1fr 1fr;align-items:center;padding:14px 22px;border-bottom:1px solid var(--line-soft);font-size:13.5px">'
        + '<span style="font-weight:600">' + U.escapeHtml(o.product || '—') + '</span>'
        + '<span class="mono" style="color:var(--muted-2)">' + U.dateBR(o.orderedAt) + '</span>'
        + '<span class="mono" style="color:var(--muted-2)">' + U.dateBR(o.receivedAt) + '</span>'
        + '<span class="mono" style="font-weight:600">' + U.num(o.leadTimeDays) + ' dias</span></div>';
    }).join('') : U.empty('Ainda não há recebimentos registrados. Os lead times serão calculados conforme os pedidos chegarem.');

    view.innerHTML =
      '<div class="fade" style="max-width:900px">'
      + '<button class="back-link" id="back">← Voltar para fornecedores</button>'
      + '<div style="display:flex;align-items:center;gap:14px;margin-bottom:22px">'
      + '<span class="thumb thumb--xl">' + U.escapeHtml(U.initials(s.name)) + '</span>'
      + '<div><div class="detail-title" style="font-size:26px">' + U.escapeHtml(s.name) + '</div>'
      + '<div class="detail-sub">' + U.num(s.productCount) + ' produtos fornecidos' + (s.state ? ' · ' + U.escapeHtml(s.state) : '') + '</div></div></div>'

      + '<div class="grid-3" style="margin-bottom:16px">'
      + metric('Lead Time médio', leadStr, s.learned ? 'calculado pelos recebimentos' : 'estimado pelo ERP')
      + metric('Pontualidade', relText, 'entregas dentro do prazo', relColor)
      + metric('Variação', varStr, 'desvio entre pedidos')
      + '</div>'

      + '<div class="card card--clip">'
      + '<div class="card__head" style="display:block"><div class="card__title">Últimos pedidos</div>'
      + '<div class="card__sub">o Lead Time é calculado automaticamente: recebimento − pedido</div></div>'
      + '<div style="display:grid;grid-template-columns:1.8fr 1fr 1fr 1fr;padding:12px 22px;font-family:var(--font-mono);font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--line-soft)">'
      + '<span>Produto</span><span>Pedido</span><span>Chegada</span><span>Lead Time</span></div>'
      + ordersHtml + '</div></div>';

    view.querySelector('#back').addEventListener('click', function () { window.location.hash = '#/fornecedores'; });
  }).catch(function (e) {
    view.innerHTML = '<button class="back-link" onclick="location.hash=\'#/fornecedores\'">← Voltar</button>'
      + U.empty('Não foi possível carregar o fornecedor: ' + e.message);
  });

  function metric(label, value, hint, color) {
    return '<div class="kpi"><div class="kpi__label">' + label + '</div>'
      + '<div class="kpi__value" style="font-size:26px' + (color ? ';color:' + color : '') + '">' + value + '</div>'
      + '<div class="kpi__hint">' + hint + '</div></div>';
  }
};
