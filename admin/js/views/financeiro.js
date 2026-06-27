window.Views = window.Views || {};

window.Views.financeiro = async function (view) {
  view.innerHTML = '<div class="loading">Carregando financeiro…</div>';
  var U = window.UI;

  var sum, invoices;
  try {
    var r = await Promise.all([
      window.Api.get('/api/admin/billing/summary'),
      window.Api.get('/api/admin/billing/invoices?limit=100'),
    ]);
    sum = r[0].data; invoices = r[1].data;
  } catch (err) {
    view.innerHTML = '<div class="empty">Erro ao carregar: ' + U.escapeHtml(err.message) + '</div>';
    return;
  }

  function card(label, value, hint, extra) {
    return '<div class="card"><div class="kpi__label">' + label + (extra || '') + '</div>'
      + '<div class="kpi__value">' + value + '</div>'
      + (hint ? '<div class="kpi__hint">' + hint + '</div>' : '') + '</div>';
  }

  // Receita por plano (barras).
  var maxPlan = Math.max.apply(null, sum.revenueByPlan.map(function (p) { return p.value; }).concat([1]));
  var planBars = sum.revenueByPlan.length
    ? sum.revenueByPlan.map(function (p) {
      var pct = Math.round((p.value / maxPlan) * 100);
      return '<div class="bar-row"><div class="bar-row__head"><span style="font-weight:600">' + U.escapeHtml(p.plan) + '</span>'
        + '<span class="mono cell-muted">' + U.money(p.value) + '</span></div>'
        + '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div></div>';
    }).join('')
    : '<div class="empty">Sem assinaturas ativas.</div>';

  // Receita mensal (mini chart).
  var maxMonth = Math.max.apply(null, sum.monthlyRevenue.map(function (m) { return m.value; }).concat([1]));
  var barW = 42, gap = 26, chartH = 150;
  var monthBars = sum.monthlyRevenue.map(function (m, i) {
    var h = Math.max(4, Math.round((m.value / maxMonth) * (chartH - 20)));
    var x = 10 + i * (barW + gap);
    var last = i === sum.monthlyRevenue.length - 1;
    var label = m.month.slice(5);
    return '<rect x="' + x + '" y="' + (chartH - h) + '" width="' + barW + '" height="' + h + '" rx="5" fill="' + (last ? '#FFD400' : '#E8EDF3') + '"></rect>'
      + '<text x="' + (x + barW / 2) + '" y="' + (chartH + 14) + '" font-family="JetBrains Mono,monospace" font-size="10" fill="#94A3B8" text-anchor="middle">' + label + '</text>';
  }).join('');
  var chartW = 10 + sum.monthlyRevenue.length * (barW + gap);

  // Faturas.
  var ICOLS = '1.6fr 1fr 1fr 1fr 1fr';
  var invRows = invoices.length
    ? invoices.map(function (inv) {
      var action = inv.status === 'PAID'
        ? ''
        : '<button class="btn btn--ghost btn--sm" data-pay="' + inv.id + '">Marcar pago</button>';
      return '<div class="trow" style="grid-template-columns:' + ICOLS + '">'
        + '<span class="cell-strong">' + U.escapeHtml(inv.company || '—') + '</span>'
        + '<span class="cell-muted">' + U.escapeHtml(inv.plan || '—') + '</span>'
        + '<span class="mono">' + U.money(inv.amount) + '</span>'
        + '<span class="cell-muted mono" style="font-size:12.5px">' + U.dateBR(inv.dueDate) + '</span>'
        + '<span class="right" style="display:flex;gap:8px;justify-content:flex-end;align-items:center">' + U.pill(U.maps.INVOICE, inv.status) + action + '</span>'
        + '</div>';
    }).join('')
    : '<div class="empty">Nenhuma fatura.</div>';

  view.innerHTML =
    '<div class="cards">'
    + card('MRR', U.moneyShort(sum.mrr), 'receita recorrente mensal')
    + card('Receita no ano', U.moneyShort(sum.revenueThisYear), 'acumulado em ' + new Date().getFullYear())
    + card('Clientes pagantes', U.num(sum.payingClients), 'assinaturas ativas')
    + card('Inadimplência', sum.defaultRate + '%', U.num(sum.overdueCount) + ' fatura(s) vencida(s)')
    + '</div>'

    + '<div class="grid-2">'
    + '<div class="card"><div class="panel__title" style="margin-bottom:2px">Receita mensal</div>'
    + '<div class="panel__sub" style="margin-bottom:16px">últimos 8 meses</div>'
    + '<svg viewBox="0 0 ' + chartW + ' ' + (chartH + 20) + '" width="100%" style="display:block">' + monthBars + '</svg></div>'
    + '<div class="card"><div class="panel__title" style="margin-bottom:2px">Receita por plano</div>'
    + '<div class="panel__sub" style="margin-bottom:18px">distribuição do MRR</div>' + planBars + '</div>'
    + '</div>'

    + '<div class="panel"><div class="panel__head"><div><div class="panel__title">Faturas</div>'
    + '<div class="panel__sub">mensalidades dos clientes</div></div></div>'
    + '<div class="thead" style="grid-template-columns:' + ICOLS + '"><span>Cliente</span><span>Plano</span><span>Valor</span><span>Vencimento</span><span class="right">Status</span></div>'
    + invRows + '</div>';

  view.querySelectorAll('[data-pay]').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      try { await window.Api.patch('/api/admin/billing/invoices/' + btn.getAttribute('data-pay') + '/pay'); U.toast('Fatura marcada como paga.'); window.Views.financeiro(view); }
      catch (e) { U.toast(e.message, 'error'); }
    });
  });
};
