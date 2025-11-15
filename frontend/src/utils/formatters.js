/**
 * Utilidades compartidas de formateo para fechas y moneda
 */

/**
 * Formatea una fecha a string legible en español
 * @param {Date|string|number} fecha - Fecha a formatear
 * @returns {string} Fecha formateada (ej: "15 de noviembre de 2025")
 */
export const formatDate = (fecha) => {
  if (!fecha) return 'Fecha no disponible';
  
  try {
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return 'Fecha inválida';
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Error formateando fecha:', error);
    return 'Fecha inválida';
  }
};

/**
 * Formatea una fecha a formato ISO corto (YYYY-MM-DD)
 * @param {Date|string|number} fecha - Fecha a formatear
 * @returns {string} Fecha en formato ISO
 */
export const formatDateISO = (fecha) => {
  if (!fecha) return '';
  
  try {
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Error formateando fecha ISO:', error);
    return '';
  }
};

/**
 * Formatea un número como moneda colombiana
 * @param {number} valor - Valor a formatear
 * @param {object} options - Opciones de formateo
 * @param {number} options.decimals - Número de decimales (default: 2)
 * @param {boolean} options.withSymbol - Incluir símbolo $ (default: true)
 * @returns {string} Valor formateado como moneda
 */
export const formatCurrency = (valor, options = {}) => {
  const {
    decimals = 2,
    withSymbol = true
  } = options;
  
  const num = Number(valor);
  if (Number.isNaN(num)) return withSymbol ? '$0.00' : '0.00';
  
  const formatted = num.toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  return withSymbol ? `$${formatted}` : formatted;
};

/**
 * Redondea un valor monetario a 2 decimales
 * @param {number} value - Valor a redondear
 * @returns {number} Valor redondeado
 */
export const roundMoney = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
};
