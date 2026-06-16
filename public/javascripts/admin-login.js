(function() {
  var form = document.getElementById('loginForm');
  var errorEl = document.getElementById('loginError');

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }

  form.addEventListener('submit', async function(event) {
    event.preventDefault();
    errorEl.classList.add('hidden');

    var email = form.email.value.trim();
    var password = form.password.value;
    var submitBtn = form.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    try {
      await AdminAuth.signIn(email, password);
      window.location.href = '/admin/products/page';
    } catch (err) {
      showError(err.message || 'Unable to sign in.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
})();
