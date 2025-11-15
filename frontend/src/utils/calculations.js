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
