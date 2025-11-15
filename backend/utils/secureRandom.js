import crypto from 'node:crypto';

function randomBytes(len) {
  return crypto.randomBytes(len);
}

function randomInt(max) {
  if (!Number.isInteger(max) || max <= 0) return 0;
  // crypto.randomInt is available in modern Node; fallback to crypto.randomBytes
  if (crypto.randomInt) return crypto.randomInt(max);
  // fallback implementation using randomBytes
  const range = max;
  const maxValid = 256 - (256 % range);
  let rnd = 0;
  do {
    rnd = randomBytes(1)[0];
  } while (rnd >= maxValid);
  return rnd % range;
}

function randomString(length = 8, alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  if (length <= 0) return '';
  const out = [];
  const charsLen = alphabet.length;
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    out.push(alphabet[bytes[i] % charsLen]);
  }
  return out.join('');
}

function uid(prefix = '') {
  const time = Date.now().toString(36);
  const rand = randomString(8);
  return `${prefix}${time}-${rand}`;
}

export { randomBytes, randomInt, randomString, uid };
