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
      var data = await AdminAuth.signUp(email, password);

      if (data.session) {
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
