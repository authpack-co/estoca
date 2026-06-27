// Sessao e autenticacao do painel do cliente (usuarios de empresa).
window.Auth = {
  isAuthed: function () { return !!window.Api.getToken(); },
  user: function () { return window.Api.getUser(); },
  isCompanyUser: function () {
    var u = window.Api.getUser();
    return !!u && (u.role === 'COMPANY_ADMIN' || u.role === 'BUYER');
  },
  login: async function (email, password) {
    var session = await window.Api.post('/api/auth/login', { email: email, password: password });
    window.Api.setSession(session);
    return session;
  },
  logout: function () {
    window.Api.clearSession();
    window.location.hash = '';
    window.location.reload();
  },
};
