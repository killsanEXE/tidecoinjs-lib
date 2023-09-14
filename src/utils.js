'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.toHex = exports.fromHex = void 0;
function fromHex(hex) {
  const hexPairs = hex.match(/.{1,2}/g);
  if (!hexPairs) {
    throw new Error('Invalid hex string');
  }
  return Buffer.from(new Uint8Array(hexPairs.map(pair => parseInt(pair, 16))));
}
exports.fromHex = fromHex;
function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}
exports.toHex = toHex;
