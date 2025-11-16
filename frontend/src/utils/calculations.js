/**
 * Utilidades compartidas de cálculos para productos, cotizaciones y pedidos
 */

import { roundMoney } from './formatters';

/**
 * Calcula el subtotal de un producto aplicando cantidad, precio unitario y descuento
 * @param {object} producto - Objeto producto con cantidad, valorUnitario/precioUnitario, descuento
 * @returns {number} Subtotal calculado
 */
export const calcularSubtotalProducto = (producto) => {
  if (!producto) return 0;
  
  const cantidad = Number(producto.cantidad) || 0;
  const precioUnitario = Number(producto.valorUnitario || producto.precioUnitario) || 0;
  const descuento = Number(producto.descuento) || 0;
  
  // Fórmula: cantidad * precio * (1 - descuento/100)
  const subtotal = cantidad * precioUnitario * (1 - descuento / 100);
  
  return roundMoney(subtotal);
};

/**
 * Calcula el subtotal sin descuentos de un producto
 * @param {object} producto - Objeto producto con cantidad y valorUnitario/precioUnitario
 * @returns {number} Subtotal sin descuentos
 */
export const calcularSubtotalSinDescuento = (producto) => {
  if (!producto) return 0;
  
  const cantidad = Number(producto.cantidad) || 0;
  const precioUnitario = Number(producto.valorUnitario || producto.precioUnitario) || 0;
  
  return roundMoney(cantidad * precioUnitario);
};

/**
 * Calcula el monto total de descuentos aplicados a un producto
 * @param {object} producto - Objeto producto
 * @returns {number} Total de descuentos
 */
export const calcularDescuentoProducto = (producto) => {
  if (!producto) return 0;
  
  const cantidad = Number(producto.cantidad) || 0;
  const precioUnitario = Number(producto.valorUnitario || producto.precioUnitario) || 0;
  const descuento = Number(producto.descuento) || 0;
  
  return roundMoney(cantidad * precioUnitario * (descuento / 100));
};

/**
 * Calcula totales de una lista de productos (subtotal, descuentos, total)
 * @param {Array} productos - Array de productos
 * @returns {object} Objeto con subtotal, descuentos y total
 */
export const calcularTotales = (productos = []) => {
  if (!Array.isArray(productos) || productos.length === 0) {
    return { subtotal: 0, descuentos: 0, total: 0 };
  }
  
  const subtotal = productos.reduce((acc, p) => acc + calcularSubtotalSinDescuento(p), 0);
  const descuentos = productos.reduce((acc, p) => acc + calcularDescuentoProducto(p), 0);
  const total = subtotal - descuentos;
  
  return {
    subtotal: roundMoney(subtotal),
    descuentos: roundMoney(descuentos),
    total: roundMoney(total)
  };
};

/**
 * Valida que un producto tenga los campos mínimos necesarios
 * @param {object} producto - Objeto producto
 * @returns {boolean} true si es válido
 */
export const validarProducto = (producto) => {
  if (!producto) return false;
  
  const tieneProducto = Boolean(producto.producto || producto.productoId || producto.product);
  const tieneCantidad = Number(producto.cantidad) > 0;
  const tienePrecio = Number(producto.valorUnitario || producto.precioUnitario) > 0;
  
  return tieneProducto && tieneCantidad && tienePrecio;
};

/**
 * Suma una propiedad numérica de los elementos de un arreglo.
 * Centraliza el uso de `reduce` para evitar repetición en componentes.
 * @param {Array} arr - arreglo de objetos
 * @param {string} prop - propiedad a sumar (por defecto 'total')
 * @returns {number} suma redondeada
 */
export const sumarProp = (arr = [], prop = 'total') => {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const sum = arr.reduce((acc, item) => acc + (Number(item?.[prop]) || 0), 0);
  return roundMoney(sum);
};

/**
 * Cuenta el total de productos asociados a una lista de proveedores.
 * @param {Array} proveedores - arreglo de proveedores cuyo campo `productos` es un arreglo
 * @returns {number} suma de longitudes
 */
export const contarProductosEnProveedores = (proveedores = []) => {
  if (!Array.isArray(proveedores) || proveedores.length === 0) return 0;
  return proveedores.reduce((acc, p) => acc + (Array.isArray(p?.productos) ? p.productos.length : 0), 0);
};

/**
 * Suma las longitudes de los arrays presentes como valores en un objeto.
 * Útil para estructuras como un map de cotizaciones por email.
 * @param {Object} map - objeto cuyas values son arreglos
 * @returns {number} suma de longitudes
 */
export const contarLongitudesObjetoValues = (map = {}) => {
  if (!map || typeof map !== 'object') return 0;
  return Object.values(map).reduce((acc, v) => acc + (Array.isArray(v) ? v.length : 0), 0);
};

/**
 * Calcula métricas del inventario: valor total, stock total y valor promedio por producto.
 * @param {Array} productos - lista de productos con `price` y `stock`
 * @returns {object} { totalValue, totalStock, avgValuePerProduct }
 */
export const calcularInventario = (productos = []) => {
  if (!Array.isArray(productos) || productos.length === 0) {
    return { totalValue: 0, totalStock: 0, avgValuePerProduct: 0 };
  }

  let totalValue = 0;
  let totalStock = 0;

  for (const p of productos) {
    const price = Number.parseFloat(p?.price) || 0;
    const stock = Number.parseInt(p?.stock) || 0;
    totalValue += price * stock;
    totalStock += stock;
  }

  const avg = productos.length > 0 ? totalValue / productos.length : 0;

  return {
    totalValue: roundMoney(totalValue),
    totalStock: totalStock,
    avgValuePerProduct: roundMoney(avg)
  };
};

/**
 * Normaliza un objeto pedido a una forma consistente usada por el frontend.
 * Soporta objetos provenientes de Strapi ({ id, attributes }) y de Mongo ({ _id, ... }).
 * También desanida `cliente` y `productos` cuando vienen en forma poblada de Strapi.
 * @param {object} raw - pedido crudo
 * @returns {object} pedido normalizado
 */
export const normalizePedido = (raw) => {
  if (!raw) return null;

  // Si es Strapi-like: { id, attributes }
  const base = raw.attributes ? { ...raw.attributes, _id: raw.id } : { ...raw };

  // Normalizar cliente (Strapi nested: cliente.data)
  if (base.cliente?.data) {
    const c = base.cliente.data;
    base.cliente = { _id: c.id, ...(c.attributes) };
  }

  // Normalizar productos (pueden venir como array de objetos con producto.data)
  if (Array.isArray(base.productos)) {
    base.productos = base.productos.map((p) => {
      if (!p) return p;
      const cloned = { ...p };
      // si el item tiene producto.data (Strapi)
      if (cloned.producto?.data) {
        const prod = cloned.producto.data;
        cloned.producto = prod.attributes ? { _id: prod.id, ...prod.attributes } : { _id: prod.id };
      }
      // si el item tiene product (mongoose populated)
      if (cloned.product?.attributes) {
        const prod = cloned.product;
        cloned.product = prod.attributes ? { _id: prod.id || prod._id, ...prod.attributes } : { _id: prod.id || prod._id };
      }

      // asegurarnos de que existan campos numericos coherentes
      cloned.cantidad = Number(cloned.cantidad) || Number(cloned.qty) || 0;
      cloned.valorUnitario = Number(cloned.valorUnitario || cloned.precioUnitario || cloned.price || cloned.producto?.precioUnitario || cloned.product?.precioUnitario) || 0;
      cloned.precioUnitario = cloned.valorUnitario;
      cloned.total = Number(cloned.total) || roundMoney(cloned.cantidad * cloned.precioUnitario) || 0;

      return cloned;
    });
  }

  // Asegurar campos base numéricos
  base.total = Number(base.total) || (Array.isArray(base.productos) ? base.productos.reduce((s, it) => s + (Number(it.total) || 0), 0) : 0);
  base.numeroPedido = base.numeroPedido || base.numero || base.codigoPedido || null;

  return base;
};

/**
 * Normaliza un arreglo de pedidos
 * @param {Array} arr
 * @returns {Array}
 */
export const normalizePedidosArray = (arr = []) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizePedido).filter(Boolean);
};
