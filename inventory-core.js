(function (globalScope) {
  function calculateStatus(product) {
    if (product.stock <= Math.floor(product.minimum * 0.5)) {
      return { label: 'Crítico', level: 'danger' };
    }
    if (product.stock <= product.minimum) {
      return { label: 'Stock bajo', level: 'warn' };
    }
    return { label: 'Stock alto', level: 'ok' };
  }

  function applyMovementToProduct(product, type, amount) {
    const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
    if (type === 'entrada') {
      product.stock += safeAmount;
      return;
    }
    product.stock = Math.max(0, product.stock - safeAmount);
  }

  function summarizeStats(products) {
    const lowStock = products.filter((item) => item.stock <= item.minimum && item.stock > 0).length;
    const critical = products.filter(
      (item) => item.stock === 0 || item.stock <= Math.floor(item.minimum * 0.5),
    ).length;
    const totalUnits = products.reduce((sum, item) => sum + item.stock, 0);

    return {
      totalProducts: products.length,
      totalUnits,
      lowStock,
      critical,
    };
  }

  function filterProducts(products, filters) {
    const normalizedText = filters.text.trim().toLowerCase();
    return products.filter((item) => {
      const matchesText =
        item.name.toLowerCase().includes(normalizedText) ||
        item.sku.toLowerCase().includes(normalizedText);

      const matchesCategory = filters.category === 'Todas' || item.category === filters.category;
      const matchesStatus =
        filters.status === 'Todos' || calculateStatus(item).label === filters.status;

      return matchesText && matchesCategory && matchesStatus;
    });
  }

  function getCategoryOptions(products) {
    return ['Todas', ...new Set(products.map((item) => item.category))];
  }

  const api = {
    applyMovementToProduct,
    calculateStatus,
    filterProducts,
    getCategoryOptions,
    summarizeStats,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.StockflowCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
