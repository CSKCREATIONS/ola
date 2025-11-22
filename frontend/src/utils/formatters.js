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

  // Helpers to keep the main flow simple
  const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());
  const toLocale = (d) => d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const buildUTCDateFromParts = (y, m, d) => {
    const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    // Ajuste por zona horaria del cliente: sumar 1 día para corregir desplazo en UI
    date.setUTCDate(date.getUTCDate() + 1);
    return date;
  };
  const parseYYYYMMDDString = (str) => {
    if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
    const [y, m, d] = str.split('-').map(n => Number.parseInt(n, 10));
    const date = buildUTCDateFromParts(y, m, d);
    return isValidDate(date) ? date : null;
  };
  const parseObjectDate = (obj) => {
    // Siempre devuelve un objeto con la misma forma:
    // { date: Date|null, invalid: boolean }
    if (obj == null || typeof obj !== 'object') return { date: null, invalid: false };
    if (obj.fechaString) {
      // Preferir fechaString tal cual (YYYY-MM-DD)
      const date = parseYYYYMMDDString(String(obj.fechaString));
      return date === null ? { date: null, invalid: true } : { date, invalid: false };
    }
    if (obj.fecha) {
      const raw = obj.fecha;
      if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const date = parseYYYYMMDDString(raw);
        return date === null ? { date: null, invalid: true } : { date, invalid: false };
      }
      const tmp = new Date(raw);
      if (isValidDate(tmp)) {
        const y = tmp.getUTCFullYear();
        const m = tmp.getUTCMonth() + 1;
        const d = tmp.getUTCDate();
        return { date: buildUTCDateFromParts(y, m, d), invalid: false };
      }
    }
    return { date: null, invalid: false };
  };

  try {
    // Caso objeto: delegar a helper y respetar decisiones previas
    if (typeof fechaOrObj === 'object' && fechaOrObj !== null) {
      const parsed = parseObjectDate(fechaOrObj);
      if (parsed.invalid) return 'Fecha inválida';
      if (parsed.date instanceof Date) return toLocale(parsed.date);
      // si el objeto no proporcionó fecha válida, continuar con otros intentos
    }

    // Si es string YYYY-MM-DD, parseo seguro como UTC
    if (typeof fechaOrObj === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaOrObj)) {
      const date = parseYYYYMMDDString(fechaOrObj);
      if (date === null) return 'Fecha inválida';
      return toLocale(date);
    }

    // Fallback: intentar construir Date normal
    const date = new Date(fechaOrObj);
    if (!isValidDate(date)) return 'Fecha inválida';

    return toLocale(date);
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
