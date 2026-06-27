// Bootstrap do painel do cliente: sessao, shell (sidebar + topbar) e roteamento por hash.
(function () {
  var ICONS = {
    dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
    produtos: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
    fornecedores: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
    configuracoes: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2.4" fill="currentColor"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2.4" fill="currentColor"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="8" cy="18" r="2.4" fill="currentColor"/></svg>',
  };
  var NAV = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'produtos', label: 'Produtos' },
    { key: 'fornecedores', label: 'Fornecedores' },
    { key: 'configuracoes', label: 'Configurações' },
  ];
  var META = {
    dashboard: ['Dashboard', 'O que você precisa decidir hoje'],
    produtos: ['Produtos', 'Cobertura e recomendação por item'],
    produto: ['Produto', 'Análise de cobertura e demanda'],
    fornecedores: ['Fornecedores', 'Lead Time aprendido a cada entrega'],
    fornecedor: ['Fornecedor', 'Histórico de pedidos e pontualidade'],
    configuracoes: ['Configurações', 'Empresa, integração ERP e usuários'],
  };

  // Shell helpers expostos para as views.
  window.Shell = {
    setMeta: function (key) {
      var meta = META[key] || META.dashboard;
      var t = document.getElementById('bar-title'); var s = document.getElementById('bar-sub');
      if (t) t.textContent = meta[0];
      if (s) s.textContent = meta[1];
    },
    setSync: function (date, connected) {
      var wrap = document.getElementById('sync-ind');
      if (!wrap) return;
      var ok = connected !== false;
      wrap.innerHTML = '<span class="sync__dot" style="background:' + (ok ? 'var(--green)' : 'var(--muted)') + '"></span>'
        + (ok ? 'ERP sincronizado · ' + window.UI.ago(date) : 'ERP não conectado');
    },
  };

  function boot() {
    var root = document.getElementById('app');
    if (!window.Auth.isAuthed() || !window.Auth.isCompanyUser()) {
      window.Views.login(root, boot);
      return;
    }
    renderShell(root);
    window.removeEventListener('hashchange', route);
    window.addEventListener('hashchange', route);
    if (!window.location.hash) window.location.hash = '#/dashboard';
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
      + '<div style="display:flex;flex-direction:column;line-height:1"><span class="brand__name">Estoca</span><span class="brand__tag">Painel de decisão</span></div></div>'
      + '<div class="nav__group">Operação</div><nav class="nav">' + navHtml + '</nav>'
      + '<div class="sidebar__user"><span class="avatar">' + window.UI.initials(user.name) + '</span>'
      + '<div style="min-width:0"><div class="sidebar__user-name">' + window.UI.escapeHtml(user.name || 'Usuário') + '</div>'
      + '<div class="sidebar__user-role" id="side-company">—</div></div>'
      + '<button class="sidebar__logout" id="logout" title="Sair">Sair</button></div>'
      + '</aside>'
      + '<main class="main">'
      + '<header class="topbar"><div><h1 class="topbar__title" id="bar-title">—</h1><p class="topbar__sub" id="bar-sub"></p></div>'
      + '<div class="sync" id="sync-ind"><span class="sync__dot"></span>carregando…</div></header>'
      + '<div class="content"><div id="view"></div></div>'
      + '</main></div>';

    root.querySelectorAll('[data-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () { window.location.hash = '#/' + btn.getAttribute('data-nav'); });
    });
    root.querySelector('#logout').addEventListener('click', window.Auth.logout);
  }

  function setActive(section) {
    document.querySelectorAll('[data-nav]').forEach(function (b) {
      var key = b.getAttribute('data-nav');
      var active = key === section
        || (key === 'produtos' && section === 'produto')
        || (key === 'fornecedores' && section === 'fornecedor');
      b.classList.toggle('active', active);
    });
  }

  function route() {
    var hash = window.location.hash.replace(/^#\/?/, '');
    var parts = hash.split('/').filter(Boolean);
    var section = parts[0] || 'dashboard';
    var view = document.getElementById('view');
    if (!view) { boot(); return; }

    if (section === 'dashboard') { setActive('dashboard'); window.Shell.setMeta('dashboard'); window.Views.dashboard(view); }
    else if (section === 'produtos') {
      if (parts[1]) { setActive('produto'); window.Shell.setMeta('produto'); window.Views.produto(view, parts[1]); }
      else { setActive('produtos'); window.Shell.setMeta('produtos'); window.Views.produtos(view); }
    } else if (section === 'fornecedores') {
      if (parts[1]) { setActive('fornecedor'); window.Shell.setMeta('fornecedor'); window.Views.fornecedor(view, parts[1]); }
      else { setActive('fornecedores'); window.Shell.setMeta('fornecedores'); window.Views.fornecedores(view); }
    } else if (section === 'configuracoes') { setActive('configuracoes'); window.Shell.setMeta('configuracoes'); window.Views.configuracoes(view); }
    else { window.location.hash = '#/dashboard'; }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
