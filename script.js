const STORAGE_KEY = 'stockflow-products-v1';

const { applyMovementToProduct, calculateStatus, filterProducts, getCategoryOptions, summarizeStats } =
  window.StockflowCore;

const demoProducts = [
  { id: 'p1', name: 'Agua Mineral 500ml', sku: 'AG-500', category: 'Bebidas', stock: 240, minimum: 80 },
  { id: 'p2', name: 'Yerba Tradicional 1kg', sku: 'YB-1K', category: 'Alimentos', stock: 35, minimum: 40 },
  { id: 'p3', name: 'Detergente Limón 750ml', sku: 'DT-750', category: 'Limpieza', stock: 10, minimum: 30 },
  { id: 'p4', name: 'Arroz Largo Fino 1kg', sku: 'AR-1K', category: 'Alimentos', stock: 122, minimum: 50 },
];

const state = {
  products: loadProducts(),
  filters: { text: '', category: 'Todas', status: 'Todos' },
};

const els = {
  inventoryBody: document.querySelector('#inventory-body'),
  categoryFilter: document.querySelector('#category-filter'),
  statusFilter: document.querySelector('#status-filter'),
  searchInput: document.querySelector('#search-input'),
  movementProduct: document.querySelector('#movement-product'),
  productForm: document.querySelector('#product-form'),
  movementForm: document.querySelector('#movement-form'),
  productPanel: document.querySelector('#product-panel'),
  openAddProduct: document.querySelector('#open-add-product'),
  closeAddProduct: document.querySelector('#close-add-product'),
  resetData: document.querySelector('#reset-data'),
  statProducts: document.querySelector('#stat-products'),
  statUnits: document.querySelector('#stat-units'),
  statLow: document.querySelector('#stat-low'),
  statCritical: document.querySelector('#stat-critical'),
};

init();

function init() {
  bindEvents();
  renderAll();
}

function bindEvents() {
  els.searchInput.addEventListener('input', (event) => {
    state.filters.text = event.target.value.trim().toLowerCase();
    renderTable();
  });

  els.categoryFilter.addEventListener('change', (event) => {
    state.filters.category = event.target.value;
    renderTable();
  });

  els.statusFilter.addEventListener('change', (event) => {
    state.filters.status = event.target.value;
    renderTable();
  });

  els.productForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const product = {
      id: crypto.randomUUID(),
      name: formData.get('name').toString().trim(),
      sku: formData.get('sku').toString().trim().toUpperCase(),
      category: formData.get('category').toString().trim(),
      stock: Number(formData.get('stock')),
      minimum: Number(formData.get('minimum')),
    };

    if (!product.name || !product.sku || !product.category) {
      return;
    }

    if (state.products.some((item) => item.sku === product.sku)) {
      alert('El SKU ya existe. Usá uno distinto.');
      return;
    }

    state.products.unshift(product);
    saveProducts();
    event.currentTarget.reset();
    event.currentTarget.stock.value = 0;
    event.currentTarget.minimum.value = 10;
    renderAll();
  });

  els.movementForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const id = formData.get('productId').toString();
    const type = formData.get('type').toString();
    const amount = Number(formData.get('amount'));
    applyMovement(id, type, amount);
    saveProducts();
    renderAll();
  });

  els.openAddProduct.addEventListener('click', () => {
    els.productPanel.classList.remove('hidden');
  });

  els.closeAddProduct.addEventListener('click', () => {
    els.productPanel.classList.add('hidden');
  });

  els.resetData.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    state.products = structuredClone(demoProducts);
    renderAll();
  });
}

function renderAll() {
  renderCategoryFilter();
  renderMovementSelect();
  renderTable();
  renderStats();
}

function renderCategoryFilter() {
  const categories = getCategoryOptions(state.products);
  const previous = state.filters.category;

  els.categoryFilter.innerHTML = categories
    .map((category) => `<option value="${category}">${category}</option>`)
    .join('');

  if (categories.includes(previous)) {
    els.categoryFilter.value = previous;
  } else {
    state.filters.category = 'Todas';
    els.categoryFilter.value = 'Todas';
  }
}

function renderMovementSelect() {
  els.movementProduct.innerHTML = state.products
    .map((item) => `<option value="${item.id}">${item.name} (${item.sku})</option>`)
    .join('');
}

function renderTable() {
  const filtered = filterProducts(state.products, state.filters);

  els.inventoryBody.innerHTML = filtered
    .map((item) => {
      const status = calculateStatus(item);
      return `
        <tr>
          <td>${item.name}</td>
          <td>${item.sku}</td>
          <td>${item.category}</td>
          <td>${item.stock}</td>
          <td>${item.minimum}</td>
          <td><span class="chip ${status.level}">${status.label}</span></td>
          <td>
            <div class="inline-actions">
              <button class="btn btn-xs" data-action="in" data-id="${item.id}">+1</button>
              <button class="btn btn-xs" data-action="out" data-id="${item.id}">-1</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  els.inventoryBody.querySelectorAll('button[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      const id = button.dataset.id;
      applyMovement(id, action === 'in' ? 'entrada' : 'salida', 1);
      saveProducts();
      renderAll();
    });
  });
}

function renderStats() {
  const summary = summarizeStats(state.products);
  els.statProducts.textContent = String(summary.totalProducts);
  els.statUnits.textContent = summary.totalUnits.toLocaleString('es-AR');
  els.statLow.textContent = String(summary.lowStock);
  els.statCritical.textContent = String(summary.critical);
}

function applyMovement(id, type, amount) {
  const target = state.products.find((item) => item.id === id);
  if (!target) return;
  applyMovementToProduct(target, type, amount);
}

function loadProducts() {
  const persisted = localStorage.getItem(STORAGE_KEY);
  if (!persisted) {
    return structuredClone(demoProducts);
  }

  try {
    const parsed = JSON.parse(persisted);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return structuredClone(demoProducts);
    }
    return parsed;
  } catch {
    return structuredClone(demoProducts);
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.products));
}
