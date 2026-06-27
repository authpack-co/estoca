// Tela de login do painel do cliente.
window.Views = window.Views || {};
window.Views.login = function (root, onDone) {
  var U = window.UI;
  root.innerHTML =
    '<div class="login-wrap"><div class="login-card fade">'
    + '<div class="login-brand"><span class="brand__mark" style="background:var(--yellow)"><span class="brand__mark-inner"></span></span>'
    + '<div><div class="brand__name" style="color:var(--ink)">Estoca</div>'
    + '<div style="font-family:var(--font-mono);font-size:9.5px;letter-spacing:.12em;color:var(--muted);text-transform:uppercase;margin-top:3px">Painel de decisão</div></div></div>'
    + '<h2 style="font-family:var(--font-display);font-size:20px;margin-bottom:6px">Bem-vindo de volta</h2>'
    + '<p style="font-size:13.5px;color:var(--muted-2);margin-bottom:22px">Entre para ver suas recomendações de compra.</p>'
    + '<form id="login-form">'
    + '<div class="field"><label class="label">E-mail</label><input class="input" name="email" type="email" placeholder="voce@empresa.com" required></div>'
    + '<div class="field"><label class="label">Senha</label><input class="input" name="password" type="password" placeholder="••••••" required></div>'
    + '<button class="btn btn--yellow btn--block" type="submit" style="margin-top:20px">Entrar</button>'
    + '</form>'
    + '<p id="login-err" style="display:none;color:var(--red);font-size:13px;margin-top:14px;text-align:center"></p>'
    + '</div></div>';

  var form = root.querySelector('#login-form');
  var err = root.querySelector('#login-err');
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    err.style.display = 'none';
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Entrando…';
    try {
      await window.Auth.login(form.elements.email.value.trim(), form.elements.password.value);
      if (!window.Auth.isCompanyUser()) {
        window.Api.clearSession();
        throw new Error('Esta conta não é de um usuário de empresa.');
      }
      onDone();
    } catch (e2) {
      err.textContent = e2.message || 'Não foi possível entrar.';
      err.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  });
};
