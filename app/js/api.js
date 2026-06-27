// Cliente HTTP do painel do cliente: anexa o token, trata 401 com refresh automatico.
window.Api = (function () {
  var base = window.APP_CONFIG.API_BASE;
  var K_ACCESS = 'estoca_access';
  var K_REFRESH = 'estoca_refresh';
  var K_USER = 'estoca_user';

  function getToken() { return localStorage.getItem(K_ACCESS); }
  function getUser() { try { return JSON.parse(localStorage.getItem(K_USER)); } catch (e) { return null; } }
  function setSession(s) {
    if (s.accessToken) localStorage.setItem(K_ACCESS, s.accessToken);
    if (s.refreshToken) localStorage.setItem(K_REFRESH, s.refreshToken);
    if (s.user) localStorage.setItem(K_USER, JSON.stringify(s.user));
  }
  function clearSession() {
    localStorage.removeItem(K_ACCESS);
    localStorage.removeItem(K_REFRESH);
    localStorage.removeItem(K_USER);
  }

  async function tryRefresh() {
    var token = localStorage.getItem(K_REFRESH);
    if (!token) return false;
    try {
      var r = await fetch(base + '/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      });
      if (!r.ok) return false;
      setSession(await r.json());
      return true;
    } catch (e) { return false; }
  }

  async function request(path, opts, retried) {
    opts = opts || {};
    var headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    var token = getToken();
    if (token) headers.Authorization = 'Bearer ' + token;

    var res = await fetch(base + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    if (res.status === 401 && !retried) {
      var ok = await tryRefresh();
      if (ok) return request(path, opts, true);
      clearSession();
    }

    var data = null;
    try { data = await res.json(); } catch (e) { /* sem corpo */ }
    if (!res.ok) {
      var err = new Error((data && data.message) || ('Erro ' + res.status));
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  return {
    base: base,
    getToken: getToken,
    getUser: getUser,
    setSession: setSession,
    clearSession: clearSession,
    get: function (p) { return request(p); },
    post: function (p, b) { return request(p, { method: 'POST', body: b }); },
    put: function (p, b) { return request(p, { method: 'PUT', body: b }); },
    patch: function (p, b) { return request(p, { method: 'PATCH', body: b }); },
    del: function (p) { return request(p, { method: 'DELETE' }); },
  };
})();
