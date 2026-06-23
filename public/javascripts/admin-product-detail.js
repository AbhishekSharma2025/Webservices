(function() {
  var productId = Number(document.getElementById('productId').value);
  var form = document.getElementById('productForm');
  var statusText = document.getElementById('statusText');
  var formError = document.getElementById('formError');
  var nameInput = document.getElementById('name');
  var costInput = document.getElementById('cost');
  var currentImageText = document.getElementById('currentImageText');
  var currentImageWrap = document.getElementById('currentImageWrap');
  var saveBtn = document.getElementById('saveBtn');
  var userEmail = document.getElementById('userEmail');
  var logoutBtn = document.getElementById('logoutBtn');

  if (!AdminAuth.requireAuth('/admin/login')) {
    return;
  }

  if (!productId) {
    window.location.href = '/admin/products/page';
    return;
  }

  userEmail.textContent = AdminAuth.getUserEmail() || '';

  function setStatus(message, isError) {
    statusText.textContent = message;
    statusText.className = isError ? 'status-text error' : 'status-text';
  }

  function showFormError(message) {
    formError.textContent = message;
    formError.classList.remove('hidden');
  }

  function clearFormError() {
    formError.classList.add('hidden');
  }

  function renderImage(imgUrl) {
    if (!imgUrl) {
      currentImageText.textContent = 'No image';
      currentImageWrap.innerHTML = '<span id="currentImageText">No image</span>';
      return;
    }

    currentImageWrap.innerHTML =
      '<a href="' + imgUrl + '" target="_blank" rel="noreferrer">' +
      '<img src="' + imgUrl + '" alt="Product image" class="product-thumb img-thumbnail">' +
      '</a>';
  }

  function fillForm(product) {
    nameInput.value = product.name || '';
    costInput.value = typeof product.cost === 'number' ? product.cost : '';
    renderImage(product.img_url);
  }

  async function loadProduct() {
    setStatus('Loading product...', false);

    try {
      var response = await fetch('/products/' + productId);
      var payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load product');
      }

      fillForm(payload.product);
      setStatus('Product #' + productId + ' loaded.', false);
    } catch (err) {
      setStatus(err.message || 'Failed to load product.', true);
      saveBtn.disabled = true;
    }
  }

  form.addEventListener('submit', async function(event) {
    event.preventDefault();
    clearFormError();

    var formData = new FormData();
    formData.append('name', nameInput.value.trim());
    formData.append('cost', costInput.value);

    var imageInput = document.getElementById('image');
    if (imageInput.files && imageInput.files[0]) {
      formData.append('image', imageInput.files[0]);
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    setStatus('Saving changes...', false);

    try {
      var response = await fetch('/products/' + productId, {
        method: 'PUT',
        body: formData
      });

      var payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update product');
      }

      fillForm(payload.product);
      imageInput.value = '';
      setStatus('Product updated successfully.', false);
    } catch (err) {
      showFormError(err.message || 'Failed to update product.');
      setStatus('Update failed.', true);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    }
  });

  logoutBtn.addEventListener('click', function() {
    AdminAuth.signOut();
  });

  loadProduct();
})();
