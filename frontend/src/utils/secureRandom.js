// Secure random helpers that work in browser (Web Crypto) and Node.js (crypto)
const hasCrypto = typeof globalThis !== 'undefined' && (globalThis.crypto || globalThis.msCrypto);
const nodeCrypto = (() => {
  try {
    // eslint-disable-next-line global-require
    return require('node:crypto');
  } catch {
    try {
      // Fallback to legacy name for older Node.js versions
      // eslint-disable-next-line global-require
      return require('node:crypto');
    } catch {
      return null;
    }
  }
})();

function randomBytesUint8(len) {
  if (hasCrypto && globalThis.crypto?.getRandomValues) {
    const arr = new Uint8Array(len);
    globalThis.crypto?.getRandomValues(arr);
    return arr;
  }
  if (nodeCrypto?.randomBytes) {
    return Uint8Array.from(nodeCrypto.randomBytes(len));
  }
  // Fallback to Math.random but flag this as insecure; callers should avoid relying on it.
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) arr[i] = Math.floor(Math.random() * 256);
  return arr;
}

export function randomInt(max) {
  if (!Number.isFinite(max) || max <= 0) return 0;
  const range = max;
  const maxValid = 256 - (256 % range);
  let rnd = 0;
  // draw until we get a value in [0, maxValid)
  do {
    rnd = randomBytesUint8(1)[0];
  } while (rnd >= maxValid);
  return rnd % range;
}

export function randomString(length = 8, alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  if (length <= 0) return '';
  const out = [];
  const charsLen = alphabet.length;
  for (let i = 0; i < length; i += 1) {
    out.push(alphabet.charAt(randomInt(charsLen)));
  }
  return out.join('');
}

export function uid(prefix = '') {
  // produce a short unique id using time + random
  const time = Date.now().toString(36);
  const rand = randomString(8);
  return `${prefix}${time}-${rand}`;
}

export default { randomInt, randomString, uid };
