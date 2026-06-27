// Detalhe do produto: cobertura x entrega, análise (IA), histórico, previsão e ação de pedido.
window.Views = window.Views || {};
window.Views.produto = function (view, id) {
  var U = window.UI;
  view.innerHTML = U.spinner();

  function load() {
    window.Api.get('/api/app/products/' + id).then(render).catch(function (e) {
      view.innerHTML = '<button class="back-link" onclick="location.hash=\'#/produtos\'">← Voltar para produtos</button>'
        + U.empty('Não foi possível carregar o produto: ' + e.message);
    });
  }

  function svgPoints(series) {
    var vals = series.map(function (s) { return s.quantity; });
    var max = Math.max.apply(null, vals.concat([1]));
    var min = Math.min.apply(null, vals);
    var range = Math.max(1, max - min);
    var n = series.length;
    var pts = vals.map(function (v, i) {
      var x = (i / (n - 1)) * 320;
      var y = 78 - ((v - min) / range) * 64;
      return x.toFixed(1) + ',' + y.toFixed(1);
    });
    return { line: pts.join(' '), area: '0,90 ' + pts.join(' ') + ' 320,90' };
  }

  function render(d) {
    if (d.status === 'SETUP_REQUIRED') { view.innerHTML = U.empty('Integração não configurada.'); return; }
    window.Shell.setSync(d.lastSyncAt, true);
    var p = d.product;
    var m = U.sev(p.severity);
    var ordered = !!p.pendingOrder;

    var scale = 18;
    var coverVal = p.coverageDays == null ? scale : p.coverageDays;
    var coverWidth = Math.min(100, (coverVal / scale) * 100).toFixed(0);
    var leadWidth = Math.min(100, (p.leadTimeDays / scale) * 100).toFixed(0);
    var margin = p.marginDays;
    var marginColor = margin == null ? 'var(--green)' : (margin >= 2 ? 'var(--green)' : (margin >= 0 ? 'var(--amber)' : 'var(--red)'));
    var marginWidth = margin == null ? 100 : Math.min(100, (Math.abs(margin) / 8) * 100).toFixed(0);
    var marginStr = margin == null ? '—' : (margin > 0 ? '+' : '') + U.dec(margin, 1) + ' dias';
    var covStr = p.coverageDays == null ? '∞' : U.dec(p.coverageDays, 1);

    var sp = svgPoints(p.salesSeries || []);
    var rec = p.recommendation;
    var recColors = p.severity === 'CRITICAL'
      ? { bg: '#FDECEC', border: '#F6CFCD', fg: 'var(--red)' }
      : p.severity === 'WARNING'
        ? { bg: '#FFFBE9', border: '#F2E6B0', fg: 'var(--amber)' }
        : { bg: '#F4FBF7', border: '#CDEBDD', fg: 'var(--green)' };

    var forecastLabels = ['Hoje', 'Amanhã', 'Depois de amanhã'];
    var forecastHtml = (p.forecast || []).map(function (v, i) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--line-soft)">'
        + '<span style="font-size:13.5px;color:var(--slate)">' + (forecastLabels[i] || ('Dia ' + (i + 1))) + '</span>'
        + '<span style="font-family:var(--font-display);font-weight:700;font-size:18px">' + U.num(v) + '</span></div>';
    }).join('');

    var actionHtml;
    if (ordered) {
      actionHtml = '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">'
        + '<span class="waiting-badge"><span class="waiting-badge__dot"></span>Aguardando chegada…</span>'
        + '<span class="mono" style="font-size:11.5px;color:var(--muted)">Pedido registrado ' + U.dateBR(p.pendingOrder.orderedAt) + '</span></div>';
    } else if (rec.action !== 'NONE') {
      actionHtml = '<button class="btn btn--yellow" id="order-btn" style="font-size:15px;padding:14px 24px">Pedido realizado</button>';
    } else {
      actionHtml = '';
    }

    view.innerHTML =
      '<div class="fade" style="max-width:1000px">'
      + '<button class="back-link" id="back">← Voltar para produtos</button>'
      + '<div class="detail-head"><div>'
      + '<div class="detail-title">' + U.escapeHtml(p.name) + '</div>'
      + '<div class="detail-sub">Fornecedor · <span style="color:var(--ink);font-weight:600">' + U.escapeHtml(p.supplierName || '—') + '</span></div></div>'
      + '<span class="pill" style="background:' + m.bg + ';color:' + m.fg + ';font-size:13px;padding:7px 14px"><span class="pill__dot" style="background:' + m.dot + '"></span>' + m.label + '</span></div>'

      + '<div class="kpi-grid" style="margin-bottom:16px">'
      + metric('Estoque atual', U.num(p.currentStock), 'unidades')
      + metric('Consumo previsto', U.dec(p.dailyDemand, 1), 'unidades / dia')
      + metric('Dias de cobertura', covStr, 'no ritmo atual', m.dot)
      + metric('Lead Time', U.num(p.leadTimeDays) + (p.hasLearnedLead ? '' : ''), p.hasLearnedLead ? 'aprendido dos recebimentos' : 'média do fornecedor')
      + '</div>'

      + '<div class="grid-2" style="grid-template-columns:1.3fr 1fr;margin-bottom:16px">'
      + '<div class="card card--pad"><div class="card__title" style="margin-bottom:18px">Cobertura x entrega</div>'
      + barRow('Dias de cobertura', covStr + ' dias', m.dot, coverWidth)
      + barRow('Lead Time fornecedor', U.num(p.leadTimeDays) + ' dias', '#64748B', leadWidth)
      + barRow('Margem', marginStr, marginColor, marginWidth, true)
      + '</div>'
      + '<div class="ai-panel"><div class="ai-panel__badge"><span class="ai-panel__mark">IA</span><span class="ai-panel__tag">Análise Estoca</span></div>'
      + '<p class="ai-panel__text">' + U.escapeHtml(p.narrative) + '</p></div></div>'

      + '<div class="grid-2" style="grid-template-columns:1.3fr 1fr;margin-bottom:16px">'
      + '<div class="card card--pad"><div class="card__title" style="margin-bottom:4px">Histórico de vendas</div>'
      + '<div style="font-size:12px;color:var(--muted);margin-bottom:16px">unidades / dia · últimos 14 dias</div>'
      + '<svg viewBox="0 0 320 90" preserveAspectRatio="none" style="width:100%;height:90px;overflow:visible">'
      + '<polyline points="' + sp.area + '" fill="#FFF6E0" stroke="none"/>'
      + '<polyline points="' + sp.line + '" fill="none" stroke="#FFD400" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
      + '<div class="card card--pad"><div class="card__title" style="margin-bottom:16px">Previsão de consumo</div>' + forecastHtml + '</div></div>'

      + '<div class="rec-banner" style="background:' + recColors.bg + ';border:1px solid ' + recColors.border + '">'
      + '<div style="flex:1;min-width:260px">'
      + '<div class="rec-banner__label" style="color:' + recColors.fg + '">Recomendação de compra</div>'
      + '<div class="rec-banner__title">' + U.escapeHtml(rec.title) + '</div>'
      + '<div class="rec-banner__reason">' + U.escapeHtml(rec.reason) + '</div></div>'
      + actionHtml + '</div></div>';

    view.querySelector('#back').addEventListener('click', function () { window.location.hash = '#/produtos'; });
    var ob = view.querySelector('#order-btn');
    if (ob) ob.addEventListener('click', function () {
      ob.disabled = true; ob.textContent = 'Registrando…';
      window.Api.post('/api/app/products/' + id + '/order', {}).then(function () {
        U.toast('Pedido registrado. O Estoca vai acompanhar a chegada.');
        load();
      }).catch(function (e) {
        U.toast(e.message || 'Erro ao registrar pedido.', 'error');
        ob.disabled = false; ob.textContent = 'Pedido realizado';
      });
    });
  }

  function metric(label, value, hint, color) {
    return '<div class="kpi"><div class="kpi__label">' + label + '</div>'
      + '<div class="kpi__value" style="font-size:26px' + (color ? ';color:' + color : '') + '">' + value + '</div>'
      + '<div class="kpi__hint">' + hint + '</div></div>';
  }
  function barRow(label, value, color, width, strong) {
    return '<div class="bar"><div class="bar__head">'
      + '<span style="color:var(--slate)">' + label + '</span>'
      + '<span class="mono" style="font-weight:' + (strong ? '600' : '500') + (strong ? ';color:' + color : '') + '">' + value + '</span></div>'
      + '<div class="bar__track bar__track--lg"><div class="bar__fill" style="background:' + color + ';width:' + width + '%"></div></div></div>';
  }

  load();
};
