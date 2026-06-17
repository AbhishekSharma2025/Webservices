(function() {
  var form = document.getElementById('signupForm');
  var errorEl = document.getElementById('signupError');
  var successEl = document.getElementById('signupSuccess');

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    successEl.classList.add('hidden');
  }

  function showSuccess(message) {
    successEl.textContent = message;
    successEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
  }

  async function createAccount(email, password) {
    var serverResponse = await fetch('/admin/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    var serverPayload = await serverResponse.json();
    if (serverResponse.ok) {
      return { source: 'server', data: serverPayload };
    }

    if (serverResponse.status !== 503) {
      throw new Error(serverPayload.error || 'Unable to create account.');
    }

    var redirectTo = await AdminAuth.getRedirectUrl('/admin/login');
    var data = await AdminAuth.signUp(email, password, redirectTo);
    return { source: 'client', data: data };
  }

  form.addEventListener('submit', async function(event) {
    event.preventDefault();
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');

    var email = form.email.value.trim();
    var password = form.password.value;
    var confirmPassword = form.confirmPassword.value;
    var submitBtn = form.querySelector('button[type="submit"]');

    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
      var result = await createAccount(email, password);

      if (result.source === 'server') {
        await AdminAuth.signIn(email, password);
        await AdminAuth.completeAuthFlow();
        window.location.href = '/admin/products/page';
        return;
      }

      if (result.data.session) {
        await AdminAuth.completeAuthFlow();
        window.location.href = '/admin/products/page';
        return;
      }

      showSuccess('Account created. Check your email to confirm, then sign in.');
      form.reset();
    } catch (err) {
      showError(err.message || 'Unable to create account.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
})();
