window.Views = window.Views || {};

window.Views.leads = async function (view) {
  view.innerHTML = '<div class="loading">Carregando leads…</div>';

  var stats, leads;
  try {
    var results = await Promise.all([
      window.Api.get('/api/admin/leads/stats'),
      window.Api.get('/api/admin/leads?limit=100'),
    ]);
    stats = results[0].data;
    leads = results[1].data;
  } catch (err) {
    view.innerHTML = '<div class="empty">Erro ao carregar: ' + window.UI.escapeHtml(err.message) + '</div>';
    return;
  }

  var U = window.UI;
  var COLS = '1.4fr 1fr 1.6fr 0.9fr 1fr 1fr';

  function kpis() {
    return ''
      + card('Total de leads', U.num(stats.total))
      + card('Novos na semana', U.num(stats.newThisWeek))
      + card('Em negociação', U.num(stats.negotiating))
      + card('Convertidos no mês', U.num(stats.convertedThisMonth), 'kpi--dark');
  }
  function card(label, value, cls) {
    return '<div class="card ' + (cls || '') + '"><div class="kpi__label">' + label + '</div><div class="kpi__value">' + value + '</div></div>';
  }

  function rows() {
    if (!leads.length) return '<div class="empty">Nenhum lead ainda. Os contatos do site aparecem aqui.</div>';
    return leads.map(function (l) {
      var converted = l.status === 'WON';
      var actions = converted
        ? '<span class="cell-muted mono" style="font-size:12px">cliente</span>'
        : '<button class="btn btn--ghost btn--sm" data-convert="' + l.id + '">Converter</button>';
      return '<div class="trow" style="grid-template-columns:' + COLS + '">'
        + '<span class="cell-strong">' + U.escapeHtml(l.contactName) + (l.companyName ? '<div class="cell-co__meta">' + U.escapeHtml(l.companyName) + '</div>' : '') + '</span>'
        + '<span class="cell-muted mono" style="font-size:12.5px">' + U.escapeHtml(l.phone || '—') + '</span>'
        + '<span class="cell-muted" style="overflow:hidden;text-overflow:ellipsis">' + U.escapeHtml(l.email || '—') + '</span>'
        + '<span class="cell-muted">' + U.escapeHtml(l.source || '—') + '</span>'
        + '<span>' + U.pill(U.maps.LEAD, l.status) + '</span>'
        + '<span class="right">' + actions + '</span>'
        + '</div>';
    }).join('');
  }

  view.innerHTML =
    '<div class="cards">' + kpis() + '</div>'
    + '<div class="panel">'
    + '<div class="panel__head"><div><div class="panel__title">Leads</div><div class="panel__sub">contatos captados pela equipe e pelo site</div></div>'
    + '<button class="btn btn--yellow" id="new-lead"><span style="font-size:16px;line-height:1">+</span> Novo lead</button></div>'
    + '<div class="thead" style="grid-template-columns:' + COLS + '"><span>Nome</span><span>Telefone</span><span>E-mail</span><span>Origem</span><span>Status</span><span class="right">Ação</span></div>'
    + '<div id="lead-rows">' + rows() + '</div></div>';

  view.querySelector('#new-lead').addEventListener('click', openNewLead);
  view.querySelectorAll('[data-convert]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lead = leads.find(function (l) { return String(l.id) === btn.getAttribute('data-convert'); });
      openConvert(lead);
    });
  });

  function openNewLead() {
    U.modal({
      title: 'Novo lead', sub: 'Registre um novo contato comercial.', submitLabel: 'Salvar lead',
      fields: [
        { name: 'contactName', label: 'Nome do contato', placeholder: 'Ex: Carla Menezes', required: true },
        { name: 'companyName', label: 'Empresa (opcional)', placeholder: 'Ex: Rede Primavera' },
        { name: 'email', label: 'E-mail', type: 'email', placeholder: 'email@empresa.com' },
        { name: 'phone', label: 'Telefone', placeholder: '(00) 00000-0000' },
        { name: 'source', label: 'Origem', type: 'select', options: [
          { value: 'Site', label: 'Site' }, { value: 'Indicação', label: 'Indicação' },
          { value: 'Feira', label: 'Feira' }, { value: 'LinkedIn', label: 'LinkedIn' }, { value: 'Outro', label: 'Outro' },
        ] },
        { name: 'status', label: 'Status', type: 'select', options: [
          { value: 'NEW', label: 'Novo' }, { value: 'CONTACTED', label: 'Contatado' },
          { value: 'NEGOTIATING', label: 'Negociação' }, { value: 'WON', label: 'Ganho' }, { value: 'LOST', label: 'Perdido' },
        ] },
      ],
      onSubmit: async function (values, close) {
        var body = { contactName: values.contactName, source: values.source, status: values.status };
        if (values.companyName) body.companyName = values.companyName;
        if (values.email) body.email = values.email;
        if (values.phone) body.phone = values.phone;
        await window.Api.post('/api/admin/leads', body);
        close();
        U.toast('Lead salvo com sucesso.');
        window.Views.leads(view);
      },
    });
  }

  async function openConvert(lead) {
    var plans = (await window.Api.get('/api/admin/billing/plans')).data;
    U.modal({
      title: 'Converter em cliente', sub: 'Cria empresa, usuário admin, assinatura e integração.', submitLabel: 'Converter',
      fields: [
        { name: 'companyName', label: 'Nome da empresa', placeholder: 'Ex: Mercado Central', required: true, value: lead.companyName || '' },
        { name: 'planId', label: 'Plano', type: 'select', required: true, options: plans.map(function (p) { return { value: p.id, label: p.name + ' — ' + U.money(p.priceMonthly) }; }) },
        { name: 'city', label: 'Cidade (opcional)', placeholder: 'Ex: Campo Grande · MS' },
        { name: 'storeCount', label: 'Nº de lojas', type: 'number', value: '1' },
      ],
      onSubmit: async function (values, close) {
        var body = { planId: Number(values.planId), companyName: values.companyName };
        if (values.city) body.city = values.city;
        if (values.storeCount) body.storeCount = Number(values.storeCount);
        var res = await window.Api.post('/api/admin/leads/' + lead.id + '/convert', body);
        close();
        showConversionResult(res.data);
        window.Views.leads(view);
      },
    });
  }

  function showConversionResult(data) {
    var overlay = U.el(
      '<div class="overlay"><div class="modal">'
      + '<div class="modal__head"><div><h3 class="modal__title">Cliente criado 🎉</h3>'
      + '<p class="modal__sub">' + U.escapeHtml(data.company.name) + ' agora existe no sistema.</p></div>'
      + '<button class="modal__close" type="button">×</button></div>'
      + '<div class="modal__body">'
      + '<div class="kv"><span class="kv__k">Admin da empresa</span><span class="kv__v">' + U.escapeHtml(data.user.email) + '</span></div>'
      + '<div class="kv"><span class="kv__k">Senha temporária</span><span class="kv__v mono">' + U.escapeHtml(data.temporaryPassword) + '</span></div>'
      + '<div class="kv"><span class="kv__k">Plano</span><span class="kv__v">' + U.escapeHtml(data.subscription.planName) + '</span></div>'
      + '<div class="kv"><span class="kv__k">Primeira fatura</span><span class="kv__v">' + U.money(data.invoice.amount) + '</span></div>'
      + '<p class="login__hint" style="margin-top:14px">Repasse a senha ao cliente. O próximo passo é cadastrar a integração do ERP em Clientes.</p>'
      + '<div class="modal__actions"><button class="btn btn--yellow" data-ok style="flex:1">Entendi</button></div>'
      + '</div></div></div>'
    );
    function close() { overlay.remove(); }
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('.modal__close').addEventListener('click', close);
    overlay.querySelector('[data-ok]').addEventListener('click', close);
    document.body.appendChild(overlay);
  }
};
