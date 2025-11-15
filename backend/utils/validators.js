// Backend-side validators (CommonJS)
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  if (email.length === 0 || email.length > 320) return false;
  if (/\s/.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64) return false;
  if (!domain || domain.length > 255) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  if (!domain.includes('.')) return false;
  if (!/^[A-Za-z0-9.-]+$/.test(domain)) return false;
  if (!/^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(local)) return false;
  return true;
}

module.exports = { isValidEmail };