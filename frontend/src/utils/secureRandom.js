/* global globalThis */
// Secure random helpers that work in browser (Web Crypto) and Node.js (crypto)
const hasCrypto = typeof globalThis !== 'undefined' && (globalThis.crypto || globalThis.msCrypto);
const nodeCrypto = (() => {
  // Avoid bundlers statically resolving 'crypto' by using eval('require') at runtime.
  // This block only attempts to run in Node-like environments where `require` is available.
  try {
    if (globalThis?.window === undefined && typeof require === 'function') {
      // eslint-disable-next-line no-eval
      const req = eval('require');
      return req('crypto');
    }
  } catch (e) {
    // Not available in this environment or require failed; log for debugging and continue.
    if (typeof console !== 'undefined' && typeof console.debug === 'function') {
      console.debug('secureRandom: crypto require failed or unavailable', e);
    } else if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn('secureRandom: crypto require failed or unavailable');
    }
  }
  return null;
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
  const range = Math.floor(max);

  // If range fits within a single byte, use the fast path.
  if (range <= 256) {
    const maxValid = 256 - (256 % range) || 256;
    let rnd = 0;
    // draw until we get a value in [0, maxValid)
    do {
      rnd = randomBytesUint8(1)[0];
    } while (rnd >= maxValid);
    return rnd % range;
  }

  // For larger ranges, use multiple bytes and rejection sampling.
  // Determine how many bytes are needed to cover the range.
  const bits = Math.ceil(Math.log2(range));
  const bytes = Math.max(1, Math.ceil(bits / 8));
  const maxRange = 2 ** (bytes * 8);
  const maxValid = maxRange - (maxRange % range);

  let rnd = 0;
  do {
    const buf = randomBytesUint8(bytes);
    rnd = 0;
    for (let i = 0; i < bytes; i++) {
      rnd = (rnd << 8) + buf[i];
    }
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
