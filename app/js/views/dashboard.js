// Dashboard: "O que eu preciso fazer hoje?"
window.Views = window.Views || {};
window.Views.dashboard = function (view) {
  var U = window.UI;
  view.innerHTML = U.spinner();

  function greeting() {
    var h = new Date().getHours();
    if (h < 12) return 'Bom dia'; if (h < 18) return 'Boa tarde'; return 'Boa noite';
  }
  function firstName() {
    var u = window.Auth.user() || {};
    return (u.name || 'comprador').split(/\s+/)[0];
  }

  window.Api.get('/api/app/dashboard').then(function (d) {
    var side = document.getElementById('side-company');
    if (side && d.company) side.textContent = d.company.name;

    if (d.status === 'SETUP_REQUIRED') {
      window.Shell.setSync(null, false);
      view.innerHTML = '<div class="card card--pad fade" style="text-align:center;padding:48px">'
        + '<div style="font-family:var(--font-display);font-weight:700;font-size:20px;margin-bottom:8px">Integração pendente</div>'
        + '<p style="color:var(--muted-2);max-width:440px;margin:0 auto">A conexão com o ERP ainda não foi configurada. Assim que o administrador concluir a integração, suas análises aparecerão aqui automaticamente.</p></div>';
      return;
    }
    window.Shell.setSync(d.integration && d.integration.lastSyncAt, true);

    var k = d.kpis;
    var recs = d.recommendations || [];

    var actionsHtml = recs.length ? recs.map(function (r) {
      var m = U.sev(r.severity);
      var pillText = r.severity === 'CRITICAL' ? 'Urgente' : 'Em breve';
      var cov = r.coverageDays == null ? 'sem consumo' : U.dec(r.coverageDays, 1) + ' dias';
      return '<div class="action">'
        + '<span class="action__dot" style="background:' + m.dot + '"></span>'
        + '<div class="action__body"><div class="action__title">Comprar ' + U.escapeHtml(r.productName) + '</div>'
        + '<div class="action__reason">Estoque dura ' + cov + ' · fornecedor demora ' + U.num(r.leadTimeDays) + ' dias</div></div>'
        + '<span class="pill" style="background:' + m.bg + ';color:' + m.fg + '">' + pillText + '</span>'
        + '<button class="btn btn--ghost btn--sm" data-open="' + r.erpProductId + '">Ver produto</button>'
        + '</div>';
    }).join('') : '<div class="empty">Tudo sob controle — nenhuma compra recomendada agora. 🎉</div>';

    var maxCount = Math.max.apply(null, (d.classification || []).map(function (c) { return c.count; }).concat([1]));
    var SEVDOT = { HEALTHY: '#0F9D63', WARNING: '#A8902A', CRITICAL: '#D6453E' };
    var barsHtml = (d.classification || []).map(function (c) {
      var w = Math.round((c.count / maxCount) * 100);
      return '<div class="bar"><div class="bar__head">'
        + '<span style="display:flex;align-items:center;gap:7px"><span style="width:8px;height:8px;border-radius:50%;background:' + SEVDOT[c.key] + '"></span>' + U.escapeHtml(c.label) + '</span>'
        + '<span class="mono" style="color:var(--muted-2)">' + U.num(c.count) + '</span></div>'
        + '<div class="bar__track"><div class="bar__fill" style="background:' + SEVDOT[c.key] + ';width:' + w + '%"></div></div></div>';
    }).join('');

    var topHtml = (d.topSold || []).length ? (d.topSold).map(function (t) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line-soft);font-size:13.5px">'
        + '<span>' + U.escapeHtml(t.name) + '</span><span class="mono" style="font-weight:500">' + U.num(t.qty) + ' un</span></div>';
    }).join('') : U.empty('Sem vendas registradas hoje.');

    var leadStr = k.avgLeadTimeDays != null ? U.dec(k.avgLeadTimeDays, 1) + ' dias' : '—';

    view.innerHTML =
      '<div class="fade">'
      + '<div style="margin-bottom:24px">'
      + '<div style="font-family:var(--font-display);font-weight:700;font-size:26px;letter-spacing:-.02em">' + greeting() + ', ' + U.escapeHtml(firstName()) + '.</div>'
      + '<div style="font-size:15px;color:var(--slate);margin-top:6px">Hoje encontramos <strong style="color:var(--ink)">' + U.num(k.actionRequired) + ' produtos</strong> que precisam de atenção.</div></div>'

      + '<div class="kpi-grid" style="margin-bottom:22px">'
      + kpi('dark', 'Risco de ruptura', U.num(k.critical), 'produtos com cobertura insuficiente')
      + kpi('', 'Saudáveis', k.healthyPct + '%', 'do catálogo com cobertura folgada')
      + kpi('', 'Lead Time médio', leadStr, 'entre pedido e recebimento')
      + kpi('warn', 'Aguardando chegada', U.num(k.pendingOrders), 'pedidos a caminho')
      + '</div>'

      + '<div style="display:grid;grid-template-columns:1.55fr 1fr;gap:16px" class="dash-cols">'
      + '<div class="card card--clip">'
      + '<div class="card__head"><div><div class="card__title">⚠ Ações recomendadas</div><div class="card__sub">ordenadas por urgência de compra</div></div></div>'
      + '<div class="row-list">' + actionsHtml + '</div></div>'

      + '<div style="display:flex;flex-direction:column;gap:16px">'
      + '<div class="card card--pad"><div class="card__title" style="margin-bottom:16px">Produtos por classificação</div>' + barsHtml + '</div>'
      + '<div class="card card--pad"><div class="card__title" style="margin-bottom:6px">Mais vendidos hoje</div>' + topHtml + '</div>'
      + '</div></div></div>';

    view.querySelectorAll('[data-open]').forEach(function (b) {
      b.addEventListener('click', function () { window.location.hash = '#/produtos/' + b.getAttribute('data-open'); });
    });
  }).catch(function (e) {
    view.innerHTML = U.empty('Não foi possível carregar o dashboard: ' + e.message);
  });

  function kpi(variant, label, value, hint) {
    var cls = 'kpi' + (variant ? ' kpi--' + variant : '');
    return '<div class="' + cls + '"><div class="kpi__label">' + label + '</div>'
      + '<div class="kpi__value">' + value + '</div><div class="kpi__hint">' + hint + '</div></div>';
  }
};
