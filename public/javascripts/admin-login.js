(function() {
  var form = document.getElementById('loginForm');
  var errorEl = document.getElementById('loginError');

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
  }

  AdminAuth.handleEmailCallback()
    .then(function(confirmed) {
      if (!confirmed) {
        return;
      }

      return AdminAuth.completeAuthFlow();
    })
    .then(function(result) {
      if (result) {
        window.location.href = '/admin/products/page';
      }
    })
    .catch(function(err) {
      showError(err.message || 'Email confirmation failed.');
    });

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
      await AdminAuth.completeAuthFlow();
      window.location.href = '/admin/products/page';
    } catch (err) {
      showError(err.message || 'Unable to sign in.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
})();
