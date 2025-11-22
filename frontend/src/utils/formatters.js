/**
 * Utilidades compartidas de formateo para fechas y moneda
 */

/**
 * Formatea una fecha a string legible en español
 * @param {Date|string|number} fecha - Fecha a formatear
 * @returns {string} Fecha formateada (ej: "15 de noviembre de 2025")
 */
export const formatDate = (fechaOrObj) => {
  if (!fechaOrObj) return 'Fecha no disponible';

  try {
    // Si recibe un objeto, preferir `fechaString`, luego `fecha`.
    if (typeof fechaOrObj === 'object' && fechaOrObj !== null) {
      // Preferir fechaString (YYYY-MM-DD) — preserva exactamente la selección del usuario
      if (fechaOrObj.fechaString) {
        const parts = String(fechaOrObj.fechaString).split('-').map(n => Number.parseInt(n, 10));
        const [y, m, d] = parts;
        const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
        // Ajuste por zona horaria del cliente: sumar 1 día para corregir desplazo en UI
        date.setUTCDate(date.getUTCDate() + 1);
        if (Number.isNaN(date.getTime())) return 'Fecha inválida';
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      }

      // Si tiene `fecha`, puede ser ISO; parsear usando componentes UTC para evitar shifts
      if (fechaOrObj.fecha) {
        const raw = fechaOrObj.fecha;
        if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          const [y, m, d] = raw.split('-').map(n => Number.parseInt(n, 10));
          const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
          // Ajuste por zona horaria del cliente: sumar 1 día para corregir desplazo en UI
          date.setUTCDate(date.getUTCDate() + 1);
          if (Number.isNaN(date.getTime())) return 'Fecha inválida';
          return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        const tmp = new Date(raw);
        if (!Number.isNaN(tmp.getTime())) {
          const y = tmp.getUTCFullYear();
          const m = tmp.getUTCMonth() + 1;
          const d = tmp.getUTCDate();
          const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
          // Ajuste por zona horaria del cliente: sumar 1 día para corregir desplazo en UI
          date.setUTCDate(date.getUTCDate() + 1);
          return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        }
      }
    }

    // Si recibe un string en formato YYYY-MM-DD, parsearlo como UTC midnight
    if (typeof fechaOrObj === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaOrObj)) {
      const [y, m, d] = fechaOrObj.split('-').map(n => Number.parseInt(n, 10));
      const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
      // Ajuste por zona horaria del cliente: sumar 1 día para corregir desplazo en UI
      date.setUTCDate(date.getUTCDate() + 1);
      if (Number.isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // Fallback: intentar construir Date normal
    const date = new Date(fechaOrObj);
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
