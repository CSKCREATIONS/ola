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

export function isValidEmail(email) {
  // Avoid complex regexes that may lead to catastrophic backtracking.
  // Use a simple deterministic validation: type, length limits, single '@', and basic domain checks.
  if (typeof email !== 'string') return false;
  // RFC limits: local part up to 64, whole address up to 320 - enforce a safe cap
  if (email.length === 0 || email.length > 320) return false;
  // No whitespace allowed
  if (/\s/.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false; // must contain exactly one @
  const [local, domain] = parts;
  if (!local || local.length > 64) return false;
  // Domain must include at least one dot and not start or end with a dot
  if (!domain || domain.length > 255) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  // Use includes for clarity when checking presence of a dot in domain
  if (!domain.includes('.')) return false;
  // Basic allowed chars checks (conservative): letters, digits, - and . in domain
  if (!/^[A-Za-z0-9.-]+$/.test(domain)) return false;
  // Local part: avoid dangerous patterns; allow most common chars but keep it simple
  // Accept: letters, digits and these punctuation: !#$%&'*+/=?^_`{|}~.-
  // Note: escape the forward slash inside the class and place '-' last so it does not need escaping
  if (!/^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(local)) return false;
  return true;
}
