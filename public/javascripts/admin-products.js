(function() {
  var state = {
    page: 1,
    limit: 20,
    totalPages: 0,
    search: ''
  };

  var tokenInput = document.getElementById('tokenInput');
  var searchInput = document.getElementById('searchInput');
  var limitSelect = document.getElementById('limitSelect');
  var applyBtn = document.getElementById('applyBtn');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var pageInfo = document.getElementById('pageInfo');
  var statusText = document.getElementById('statusText');
  var productsBody = document.getElementById('productsBody');

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

  async function loadProducts() {
    var token = tokenInput.value.trim();
    if (!token) {
      setStatus('Paste a Bearer token to load admin products.', true);
      productsBody.innerHTML = '<tr><td colspan="4">Token required.</td></tr>';
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

  limitSelect.value = String(state.limit);
  updatePagination();
})();
