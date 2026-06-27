// Bootstrap do painel: sessao, shell (sidebar + topbar) e roteamento por hash.
(function () {
  var ICONS = {
    leads: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 7l7 4.5L17 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="2"></rect></svg>',
    empresas: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="6.5" r="3" fill="currentColor"></circle><path d="M1.5 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path><circle cx="15" cy="6.5" r="2.4" fill="currentColor" opacity="0.55"></circle><path d="M14 12c2.5 0 4.5 2 4.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.55"></path></svg>',
    financeiro: '<svg width="18" height="18" viewBox="0 0 20 20" fill="none"><rect x="2" y="11" width="3.5" height="7" rx="1" fill="currentColor"></rect><rect x="8.25" y="6" width="3.5" height="12" rx="1" fill="currentColor"></rect><rect x="14.5" y="2" width="3.5" height="16" rx="1" fill="currentColor"></rect></svg>',
  };
  var NAV = [
    { key: 'leads', label: 'Leads' },
    { key: 'empresas', label: 'Clientes' },
    { key: 'financeiro', label: 'Financeiro' },
  ];
  var META = {
    leads: ['Leads', 'Pipeline de contatos e oportunidades comerciais'],
    empresas: ['Clientes', 'Clientes integrados e controle das integrações ERP'],
    financeiro: ['Financeiro', 'Receita, faturas e saúde financeira da operação'],
  };

  function boot() {
    var root = document.getElementById('app');
    if (!window.Auth.isAuthed() || !window.Auth.isAdmin()) {
      window.Views.login(root, boot);
      return;
    }
    renderShell(root);
    window.removeEventListener('hashchange', route);
    window.addEventListener('hashchange', route);
    if (!window.location.hash) window.location.hash = '#/leads';
    else route();
  }

  function renderShell(root) {
    var user = window.Auth.user() || {};
    var navHtml = NAV.map(function (n) {
      return '<button class="nav__item" data-nav="' + n.key + '">' + ICONS[n.key] + '<span>' + n.label + '</span></button>';
    }).join('');

    root.innerHTML =
      '<div class="layout">'
      + '<aside class="sidebar">'
      + '<div class="brand"><span class="brand__mark"><span class="brand__mark-inner"></span></span>'
      + '<div style="display:flex;flex-direction:column;line-height:1"><span class="brand__name">Estoca</span><span class="brand__tag">Admin</span></div></div>'
      + '<div class="nav__group">Gestão</div><nav class="nav">' + navHtml + '</nav>'
      + '<div class="sidebar__user"><span class="avatar">' + window.UI.initials(user.name) + '</span>'
      + '<div style="min-width:0"><div class="sidebar__user-name">' + window.UI.escapeHtml(user.name || 'Admin') + '</div>'
      + '<div class="sidebar__user-role">Administrador</div></div>'
      + '<button class="sidebar__logout" id="logout" title="Sair">Sair</button></div>'
      + '</aside>'
      + '<main class="main">'
      + '<header class="topbar"><div><h1 class="topbar__title" id="bar-title">—</h1><p class="topbar__sub" id="bar-sub"></p></div>'
      + '<div class="search"><svg width="15" height="15" viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="#94A3B8" stroke-width="2"></circle><line x1="12.5" y1="12.5" x2="17" y2="17" stroke="#94A3B8" stroke-width="2.2" stroke-linecap="round"></line></svg><input placeholder="Buscar…"></div></header>'
      + '<div class="content"><div id="view"></div></div>'
      + '</main></div>';

    root.querySelectorAll('[data-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () { window.location.hash = '#/' + btn.getAttribute('data-nav'); });
    });
    root.querySelector('#logout').addEventListener('click', window.Auth.logout);
  }

  function setActive(section) {
    document.querySelectorAll('[data-nav]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-nav') === section);
    });
    var meta = META[section] || META.leads;
    var t = document.getElementById('bar-title'); var s = document.getElementById('bar-sub');
    if (t) t.textContent = meta[0];
    if (s) s.textContent = meta[1];
  }

  function route() {
    var hash = window.location.hash.replace(/^#\/?/, '');
    var parts = hash.split('/').filter(Boolean);
    var section = parts[0] || 'leads';
    var view = document.getElementById('view');
    if (!view) { boot(); return; }

    if (section === 'leads') { setActive('leads'); window.Views.leads(view); }
    else if (section === 'empresas') {
      setActive('empresas');
      if (parts[1]) window.Views.empresaDetalhe(view, parts[1]);
      else window.Views.empresas(view);
    } else if (section === 'financeiro') { setActive('financeiro'); window.Views.financeiro(view); }
    else { window.location.hash = '#/leads'; }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
