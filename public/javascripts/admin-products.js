(function() {
  var state = {
    page: 1,
    limit: 20,
    totalPages: 0,
    search: ''
  };

  var searchInput = document.getElementById('searchInput');
  var limitSelect = document.getElementById('limitSelect');
  var applyBtn = document.getElementById('applyBtn');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var pageInfo = document.getElementById('pageInfo');
  var statusText = document.getElementById('statusText');
  var productsBody = document.getElementById('productsBody');
  var userEmail = document.getElementById('userEmail');
  var logoutBtn = document.getElementById('logoutBtn');

  if (!AdminAuth.requireAuth('/admin/login')) {
    return;
  }

  userEmail.textContent = AdminAuth.getUserEmail() || '';

  function setStatus(message, isError) {
    statusText.textContent = message;
    statusText.className = isError ? 'status-text error' : 'status-text';
  }

  function renderRows(items) {
    if (!items || items.length === 0) {
      productsBody.innerHTML = '<tr><td colspan="4">No products found.</td></tr>';
      return;
    }

    var rows = items.map(function(product) {
      var safeName = product.name || '-';
      var safeCost = typeof product.cost === 'number' ? product.cost.toFixed(2) : '-';
      var safeImage = product.img_url
        ? '<a href="' + product.img_url + '" target="_blank" rel="noreferrer">View image</a>'
        : '-';

      return (
        '<tr>' +
        '<td>' + product.product_id + '</td>' +
        '<td>' + safeName + '</td>' +
        '<td>' + safeCost + '</td>' +
        '<td>' + safeImage + '</td>' +
        '</tr>'
      );
    });

    productsBody.innerHTML = rows.join('');
  }

  function updatePagination() {
    pageInfo.textContent = 'Page ' + state.page + ' of ' + (state.totalPages || 1);
    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.totalPages === 0 || state.page >= state.totalPages;
  }

  function handleAuthError(response, payload) {
    if (response.status === 401) {
      AdminAuth.clearSession();
      window.location.href = '/admin/login';
      return true;
    }

    if (response.status === 403) {
      return false;
    }

    return false;
  }

  async function tryGrantAdminAccess() {
    var result = await AdminAuth.bootstrapAdmin();
    return result.granted === true;
  }

  async function loadProducts(retryAfterGrant) {
    var token = AdminAuth.getAccessToken();
    if (!token) {
      window.location.href = '/admin/login';
      return;
    }

    setStatus('Loading products...', false);

    var params = new URLSearchParams({
      page: String(state.page),
      limit: String(state.limit)
    });

    if (state.search) {
      params.set('search', state.search);
    }

    try {
      var response = await fetch('/admin/products?' + params.toString(), {
        headers: {
          Authorization: 'Bearer ' + token
        }
      });

      var payload = await response.json();
      if (!response.ok) {
        if (response.status === 403 && !retryAfterGrant) {
          var granted = await tryGrantAdminAccess();
          if (granted) {
            return loadProducts(true);
          }

          setStatus(
            (payload && payload.error) ||
              'Admin access required. Check ADMIN_EMAILS or AUTO_GRANT_ADMIN on the server.',
            true
          );
          productsBody.innerHTML = '<tr><td colspan="4">Access denied.</td></tr>';
          return;
        }

        if (handleAuthError(response, payload)) {
          productsBody.innerHTML = '<tr><td colspan="4">Access denied.</td></tr>';
          return;
        }

        throw new Error(payload.error || 'Failed to load products');
      }

      state.totalPages = payload.totalPages || 0;
      renderRows(payload.items || []);
      updatePagination();

      setStatus('Loaded ' + (payload.items || []).length + ' products (total: ' + (payload.total || 0) + ').', false);
    } catch (err) {
      setStatus(err.message || 'Failed to load products.', true);
      productsBody.innerHTML = '<tr><td colspan="4">Unable to load products.</td></tr>';
    }
  }

  applyBtn.addEventListener('click', function() {
    state.page = 1;
    state.limit = Number(limitSelect.value) || 20;
    state.search = searchInput.value.trim();
    loadProducts();
  });

  prevBtn.addEventListener('click', function() {
    if (state.page > 1) {
      state.page -= 1;
      loadProducts();
    }
  });

  nextBtn.addEventListener('click', function() {
    if (state.totalPages === 0 || state.page >= state.totalPages) {
      return;
    }

    state.page += 1;
    loadProducts();
  });

  logoutBtn.addEventListener('click', function() {
    AdminAuth.signOut();
  });

  limitSelect.value = String(state.limit);
  updatePagination();
  loadProducts();
})();
