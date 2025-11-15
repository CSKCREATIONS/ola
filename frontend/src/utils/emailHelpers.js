// Shared helpers for email templates and small utils
import { calcularTotales } from './calculations';

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    // avoid throwing in UI code, fallback to empty object
    console.debug('getStoredUser parse failed', e);
    return {};
  }
}

export function formatDateIso(value) {
  try {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('es-ES');
  } catch (e) {
    console.debug('formatDateIso parse failed', e);
    return 'N/A';
  }
}

export function calculateTotal(datos) {
  if (!datos) return 0;
  // Si el objeto ya trae un total explícito, preferirlo
  if (Number.isFinite(Number(datos.total)) && (!Array.isArray(datos.productos) || datos.productos.length === 0)) {
    return Number.parseFloat(datos.total) || 0;
  }

  // Si tiene productos, delegar al helper compartido para asegurar consistencia
  if (Array.isArray(datos.productos) && datos.productos.length > 0) {
    return Number(calcularTotales(datos.productos).total) || 0;
  }

  return Number.parseFloat(datos.total) || 0;
}

export function sumarTotalesLista(lista = []) {
  if (!Array.isArray(lista) || lista.length === 0) return 0;
  return lista.reduce((acc, item) => acc + (calculateTotal(item) || 0), 0);
}

export function buildSignature(usuario) {
  const name = usuario?.firstName || usuario?.nombre || 'Equipo de atención al cliente';
  const surname = usuario?.surname ? ` ${usuario.surname}` : '';
  const email = usuario?.email ? `\n📧 Correo: ${usuario.email}` : '';
  const phone = usuario?.telefono ? `\n📞 Teléfono: ${usuario.telefono}` : '';
  return `${name}${surname}${email}${phone}`;
}

export function getCompanyName() {
  return process.env.REACT_APP_COMPANY_NAME || process.env.COMPANY_NAME || 'JLA Global Company';
}
