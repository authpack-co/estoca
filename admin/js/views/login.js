window.Views = window.Views || {};

window.Views.login = function (root, onSuccess) {
  root.innerHTML = '';
  var card = window.UI.el(
    '<div class="login"><div class="login__card">'
    + '<div class="login__brand"><span class="brand__mark"><span class="brand__mark-inner"></span></span>'
    + '<span class="brand__name">Estoca</span></div>'
    + '<div class="login__title">Painel administrativo</div>'
    + '<div class="login__sub">Acesse com sua conta de administrador</div>'
    + '<div class="login__error" id="login-error" style="display:none"></div>'
    + '<form id="login-form">'
    + '<div class="field"><label class="label">E-mail</label><input class="input" name="email" type="email" placeholder="admin@estoca.com" required></div>'
    + '<div class="field"><label class="label">Senha</label><input class="input" name="password" type="password" placeholder="••••••••" required></div>'
    + '<button type="submit" class="btn btn--yellow btn--block" style="margin-top:18px">Entrar</button>'
    + '</form>'
    + '<div class="login__hint">Demo: admin@estoca.com / admin123</div>'
    + '</div></div>'
  );
  root.appendChild(card);

  var form = card.querySelector('#login-form');
  var errorBox = card.querySelector('#login-error');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errorBox.style.display = 'none';
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Entrando…';
    try {
      var session = await window.Auth.login(form.elements.email.value.trim(), form.elements.password.value);
      if (session.user && session.user.role !== 'PLATFORM_ADMIN') {
        throw new Error('Esta conta nao tem acesso ao painel administrativo.');
      }
      onSuccess();
    } catch (err) {
      errorBox.textContent = err.message || 'Falha no login.';
      errorBox.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  });
};
