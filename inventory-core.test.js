const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateStatus,
  applyMovementToProduct,
  summarizeStats,
  filterProducts,
  getCategoryOptions,
} = require('./inventory-core.js');

const products = [
  { id: '1', name: 'Yerba', sku: 'YB-1K', category: 'Alimentos', stock: 20, minimum: 40 },
  { id: '2', name: 'Agua', sku: 'AG-500', category: 'Bebidas', stock: 100, minimum: 50 },
  { id: '3', name: 'Detergente', sku: 'DT-750', category: 'Limpieza', stock: 0, minimum: 30 },
];

test('calculateStatus clasifica estados correctamente', () => {
  assert.deepEqual(calculateStatus(products[0]), { label: 'Crítico', level: 'danger' });
  assert.deepEqual(calculateStatus(products[1]), { label: 'Stock alto', level: 'ok' });
  assert.deepEqual(calculateStatus({ stock: 30, minimum: 40 }), { label: 'Stock bajo', level: 'warn' });
});

test('applyMovementToProduct aplica entrada y salida con piso cero', () => {
  const p = { stock: 5 };
  applyMovementToProduct(p, 'entrada', 4);
  assert.equal(p.stock, 9);
  applyMovementToProduct(p, 'salida', 20);
  assert.equal(p.stock, 0);
});

test('summarizeStats devuelve métricas agregadas', () => {
  const summary = summarizeStats(products);
  assert.equal(summary.totalProducts, 3);
  assert.equal(summary.totalUnits, 120);
  assert.equal(summary.lowStock, 1);
  assert.equal(summary.critical, 2);
});

test('filterProducts respeta texto, categoría y estado', () => {
  const byText = filterProducts(products, { text: 'ag-500', category: 'Todas', status: 'Todos' });
  assert.equal(byText.length, 1);
  assert.equal(byText[0].sku, 'AG-500');

  const byCategory = filterProducts(products, {
    text: '',
    category: 'Limpieza',
    status: 'Todos',
  });
  assert.equal(byCategory.length, 1);

  const byStatus = filterProducts(products, {
    text: '',
    category: 'Todas',
    status: 'Crítico',
  });
  assert.equal(byStatus.length, 2);
});

test('getCategoryOptions incluye Todas + categorías únicas', () => {
  const categories = getCategoryOptions(products);
  assert.deepEqual(categories, ['Todas', 'Alimentos', 'Bebidas', 'Limpieza']);
});
