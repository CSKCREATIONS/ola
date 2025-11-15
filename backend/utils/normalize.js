// Utility helpers to normalize product objects and calculate totals
function parseNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeProducto(prod = {}) {
  const cantidad = parseNumber(prod.cantidad ?? prod.quantity ?? prod.cant ?? 0, 0);
  const valorUnitario = parseNumber(prod.valorUnitario ?? prod.precioUnitario ?? prod.price ?? prod.unitPrice ?? 0, 0);
  const descuento = parseNumber(prod.descuento ?? prod.discount ?? 0, 0);
  const subtotal = cantidad * valorUnitario * (1 - descuento / 100);
  const valorTotal = parseNumber(prod.valorTotal ?? subtotal, subtotal);

  return {
    nombre: prod.producto || prod.name || prod.nombre || '',
    descripcion: prod.descripcion || prod.description || prod.desc || '',
    cantidad,
    valorUnitario: parseNumber(valorUnitario, 0),
    descuento: parseNumber(descuento, 0),
    subtotal: parseNumber(subtotal, 0),
    valorTotal: parseNumber(valorTotal, parseNumber(subtotal, 0)),
    productoId: prod.productoId || prod._id || prod.id || ''
  };
}

function calcularTotales(productos = []) {
  if (!Array.isArray(productos) || productos.length === 0) return { subtotal: 0, descuentos: 0, total: 0 };
  let subtotal = 0;
  let descuentos = 0;
  for (const p of productos) {
    const np = normalizeProducto(p);
    subtotal += np.subtotal;
    descuentos += np.descuento ? (np.cantidad * np.valorUnitario * (np.descuento / 100)) : 0;
  }
  const total = subtotal - descuentos;
  return { subtotal: Number(subtotal), descuentos: Number(descuentos), total: Number(total) };
}

module.exports = { parseNumber, normalizeProducto, calcularTotales };
