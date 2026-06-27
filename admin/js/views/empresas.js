window.Views = window.Views || {};

// ---------- Lista de clientes ----------
window.Views.empresas = async function (view) {
  view.innerHTML = '<div class="loading">Carregando clientes…</div>';
  var U = window.UI;

  var stats, companies;
  try {
    var r = await Promise.all([
      window.Api.get('/api/admin/companies/stats'),
      window.Api.get('/api/admin/companies?limit=100'),
    ]);
    stats = r[0].data; companies = r[1].data;
  } catch (err) {
    view.innerHTML = '<div class="empty">Erro ao carregar: ' + U.escapeHtml(err.message) + '</div>';
    return;
  }

  var COLS = '1.8fr 1fr 1.1fr 0.7fr 1fr';
  function card(label, value, cls) {
    return '<div class="card ' + (cls || '') + '"><div class="kpi__label">' + label + '</div><div class="kpi__value">' + value + '</div></div>';
  }

  function rows() {
    if (!companies.length) return '<div class="empty">Nenhum cliente ainda. Converta um lead para criar o primeiro.</div>';
    return companies.map(function (c) {
      return '<div class="trow trow--click" data-id="' + c.id + '" style="grid-template-columns:' + COLS + '">'
        + '<span class="cell-co"><span class="cell-co__badge">' + U.initials(c.name) + '</span>'
        + '<span style="min-width:0"><span class="cell-co__name">' + U.escapeHtml(c.name) + '</span>'
        + '<div class="cell-co__meta">' + U.escapeHtml(c.city || '—') + '</div></span></span>'
        + '<span class="cell-muted">' + U.escapeHtml(c.plan || '—') + '</span>'
        + '<span>' + U.erpPill(c.integrationStatus) + '</span>'
        + '<span class="cell-muted mono">' + U.num(c.storeCount) + '</span>'
        + '<span>' + U.pill(U.maps.COMPANY, c.status) + '</span>'
        + '</div>';
    }).join('');
  }

  view.innerHTML =
    '<div class="cards">'
    + card('Clientes ativos', U.num(stats.active))
    + card('Integrações ativas', U.num(stats.activeIntegrations))
    + card('Em onboarding', U.num(stats.onboarding), 'kpi--accent')
    + card('Total de clientes', U.num(stats.total))
    + '</div>'
    + '<div class="panel"><div class="panel__head"><div><div class="panel__title">Clientes</div>'
    + '<div class="panel__sub">supermercados e atacarejos integrados · criados pela conversão de leads</div></div></div>'
    + '<div class="thead" style="grid-template-columns:' + COLS + '"><span>Cliente</span><span>Plano</span><span>Integração ERP</span><span>Lojas</span><span>Status</span></div>'
    + rows() + '</div>';

  view.querySelectorAll('[data-id]').forEach(function (row) {
    row.addEventListener('click', function () { window.location.hash = '#/empresas/' + row.getAttribute('data-id'); });
  });
};

// ---------- Detalhe do cliente ----------
window.Views.empresaDetalhe = async function (view, id) {
  view.innerHTML = '<div class="loading">Carregando empresa…</div>';
  var U = window.UI;

  async function load() {
    var d = (await window.Api.get('/api/admin/companies/' + id)).data;
    render(d);
  }

  function render(d) {
    var integ = d.integration || { status: 'PENDING' };
    var usersRows = d.users.length
      ? d.users.map(function (u) {
        return '<div class="trow" style="grid-template-columns:1.6fr 1fr 0.8fr 0.6fr">'
          + '<span class="cell-strong">' + U.escapeHtml(u.name) + '<div class="cell-co__meta">' + U.escapeHtml(u.email) + '</div></span>'
          + '<span class="cell-muted mono">' + U.escapeHtml(u.role) + '</span>'
          + '<span>' + (u.active ? U.pill({ A: ['Ativo', 'green'] }, 'A') : U.pill({ I: ['Inativo', 'slate'] }, 'I')) + '</span>'
          + '<span class="right"><button class="btn btn--ghost btn--sm" data-deluser="' + u.id + '">Desativar</button></span>'
          + '</div>';
      }).join('')
      : '<div class="empty">Nenhum usuário.</div>';

    view.innerHTML =
      '<div class="back-link" id="back">← Voltar para clientes</div>'
      + '<div class="topbar__title" style="margin-bottom:4px">' + U.escapeHtml(d.name) + '</div>'
      + '<p class="panel__sub" style="margin-bottom:20px">' + U.escapeHtml(d.city || 'Sem cidade') + ' · ' + U.pill(U.maps.COMPANY, d.status) + '</p>'

      + '<div class="detail-grid">'
      // Dados + assinatura
      + '<div class="card"><div class="panel__title" style="margin-bottom:12px">Dados & assinatura</div>'
      + kv('CNPJ', d.cnpj || '—') + kv('Lojas', U.num(d.storeCount))
      + kv('Plano', d.subscription && d.subscription.plan ? d.subscription.plan.name : '—')
      + kv('Mensalidade', d.subscription && d.subscription.plan ? U.money(d.subscription.plan.priceMonthly) : '—')
      + kv('Assinatura', d.subscription ? d.subscription.status : '—')
      + '</div>'
      // Integração
      + '<div class="card"><div class="panel__title" style="margin-bottom:4px">Integração ERP</div>'
      + '<p class="panel__sub" style="margin-bottom:12px">Status: ' + U.erpPill(integ.status) + '</p>'
      + '<div class="field"><label class="label">URL da API do ERP</label><input class="input" id="erp-url" placeholder="http://localhost:4000" value="' + U.escapeHtml(integ.erpApiUrl || '') + '"></div>'
      + '<div class="field"><label class="label">API Key</label><input class="input" id="erp-key" type="password" placeholder="' + (integ.erpApiUrl ? '•••••• (deixe vazio p/ manter)' : 'cole a chave do ERP') + '"></div>'
      + (integ.lastError ? '<p class="login__error" style="margin-top:12px">' + U.escapeHtml(integ.lastError) + '</p>' : '')
      + '<p class="kpi__hint" style="margin-top:10px">Última sincronização: ' + U.dateTimeBR(integ.lastSyncAt) + '</p>'
      + '<div style="display:flex;gap:10px;margin-top:14px">'
      + '<button class="btn btn--ghost" id="erp-save" style="flex:1">Salvar</button>'
      + '<button class="btn btn--yellow" id="erp-test" style="flex:1">Testar conexão</button></div>'
      + '</div></div>'

      // Usuários
      + '<div class="panel"><div class="panel__head"><div><div class="panel__title">Usuários da empresa</div>'
      + '<div class="panel__sub">acessos ao painel do cliente</div></div>'
      + '<button class="btn btn--yellow" id="add-user"><span style="font-size:16px;line-height:1">+</span> Adicionar usuário</button></div>'
      + '<div class="thead" style="grid-template-columns:1.6fr 1fr 0.8fr 0.6fr"><span>Nome</span><span>Papel</span><span>Status</span><span class="right">Ação</span></div>'
      + usersRows + '</div>';

    view.querySelector('#back').addEventListener('click', function () { window.location.hash = '#/empresas'; });
    view.querySelector('#erp-save').addEventListener('click', saveIntegration);
    view.querySelector('#erp-test').addEventListener('click', testIntegration);
    view.querySelector('#add-user').addEventListener('click', addUser);
    view.querySelectorAll('[data-deluser]').forEach(function (b) {
      b.addEventListener('click', async function () {
        try { await window.Api.del('/api/admin/companies/' + id + '/users/' + b.getAttribute('data-deluser')); U.toast('Usuário desativado.'); load(); }
        catch (e) { U.toast(e.message, 'error'); }
      });
    });
  }

  function kv(k, v) { return '<div class="kv"><span class="kv__k">' + k + '</span><span class="kv__v">' + v + '</span></div>'; }

  async function saveIntegration() {
    var url = view.querySelector('#erp-url').value.trim();
    var key = view.querySelector('#erp-key').value.trim();
    if (!url) { U.toast('Informe a URL do ERP.', 'error'); return; }
    var body = { erpApiUrl: url };
    if (key) body.apiKey = key;
    try { await window.Api.put('/api/admin/companies/' + id + '/integration', body); U.toast('Integração salva.'); load(); }
    catch (e) { U.toast(e.message, 'error'); }
  }

  async function testIntegration() {
    var btn = view.querySelector('#erp-test');
    btn.disabled = true; btn.textContent = 'Testando…';
    try {
      var res = (await window.Api.post('/api/admin/companies/' + id + '/integration/test', {})).data;
      if (res.status === 'CONNECTED') U.toast('Conectado! ' + (res.productsAvailable || 0) + ' produtos disponíveis.');
      else U.toast('Falha: ' + (res.message || 'erro'), 'error');
      load();
    } catch (e) { U.toast(e.message, 'error'); btn.disabled = false; btn.textContent = 'Testar conexão'; }
  }

  function addUser() {
    U.modal({
      title: 'Adicionar usuário', sub: 'Acesso ao painel do cliente.', submitLabel: 'Criar usuário',
      fields: [
        { name: 'name', label: 'Nome', required: true, placeholder: 'Ex: João Comprador' },
        { name: 'email', label: 'E-mail', type: 'email', required: true, placeholder: 'email@empresa.com' },
        { name: 'role', label: 'Papel', type: 'select', options: [
          { value: 'BUYER', label: 'Comprador' }, { value: 'COMPANY_ADMIN', label: 'Administrador da empresa' },
        ] },
      ],
      onSubmit: async function (values, close) {
        var res = (await window.Api.post('/api/admin/companies/' + id + '/users', values)).data;
        close();
        if (res.temporaryPassword) U.toast('Usuário criado. Senha: ' + res.temporaryPassword);
        else U.toast('Usuário criado.');
        load();
      },
    });
  }

  try { await load(); }
  catch (err) { view.innerHTML = '<div class="empty">Erro ao carregar: ' + U.escapeHtml(err.message) + '</div>'; }
};
