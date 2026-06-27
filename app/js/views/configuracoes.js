// Configurações: empresa, integração ERP e usuários (somente leitura).
window.Views = window.Views || {};
window.Views.configuracoes = function (view) {
  var U = window.UI;
  view.innerHTML = U.spinner();

  var INTEG = {
    CONNECTED: { bg: 'var(--green-bg)', fg: 'var(--green)', text: 'Conectado' },
    PENDING: { bg: 'var(--amber-bg)', fg: 'var(--amber)', text: 'Pendente' },
    ERROR: { bg: 'var(--red-bg)', fg: 'var(--red)', text: 'Desconectado' },
  };

  window.Api.get('/api/app/settings').then(function (d) {
    var c = d.company || {};
    var i = d.integration || {};
    var st = INTEG[i.status] || INTEG.PENDING;
    window.Shell.setSync(i.lastSyncAt, i.status === 'CONNECTED');

    var usersHtml = (d.users || []).map(function (u) {
      return '<div style="display:flex;align-items:center;gap:12px;padding:14px 22px;border-bottom:1px solid var(--line-soft)">'
        + '<span class="thumb" style="border-radius:50%">' + U.escapeHtml(U.initials(u.name)) + '</span>'
        + '<div style="flex:1"><div style="font-weight:600;font-size:14px">' + U.escapeHtml(u.name) + '</div>'
        + '<div style="font-size:12px;color:var(--muted)">' + U.escapeHtml(u.email) + '</div></div>'
        + '<span class="mono" style="font-size:11.5px;color:var(--muted-2)">' + U.escapeHtml((u.roleLabel || u.role || '').toUpperCase()) + '</span></div>';
    }).join('') || U.empty('Nenhum usuário cadastrado.');

    view.innerHTML =
      '<div class="fade" style="max-width:760px;display:flex;flex-direction:column;gap:16px">'

      + '<div class="card card--pad" style="padding:24px"><div class="card__title" style="margin-bottom:16px">Empresa</div>'
      + kv('Razão social', U.escapeHtml(c.name || '—'))
      + kv('CNPJ', '<span class="mono">' + U.escapeHtml(c.cnpj || '—') + '</span>')
      + kv('Cidade', U.escapeHtml(c.city || '—'))
      + kv('Lojas integradas', U.num(c.storeCount || 1), true)
      + '</div>'

      + '<div class="card card--pad" style="padding:24px">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
      + '<div class="card__title">Integração ERP</div>'
      + '<span class="pill" style="background:' + st.bg + ';color:' + st.fg + '"><span class="pill__dot" style="background:' + st.fg + '"></span>' + st.text + '</span></div>'
      + kv('URL da API', '<span class="mono" style="font-size:12.5px">' + U.escapeHtml(i.erpApiUrl || '—') + '</span>')
      + kv('API Key', '<span class="mono">' + U.escapeHtml(i.apiKeyMasked || '—') + '</span>')
      + kv('Última sincronização', U.dateTimeBR(i.lastSyncAt), true)
      + '</div>'

      + '<div class="card card--clip">'
      + '<div class="card__head" style="display:block"><div class="card__title">Usuários</div></div>'
      + usersHtml + '</div></div>';
  }).catch(function (e) {
    view.innerHTML = U.empty('Não foi possível carregar as configurações: ' + e.message);
  });

  function kv(k, v, last) {
    return '<div class="kv"' + (last ? ' style="border-bottom:none"' : '') + '><span class="kv__k">' + k + '</span><span class="kv__v">' + v + '</span></div>';
  }
};
