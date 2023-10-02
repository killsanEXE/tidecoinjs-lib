import { ripemd160 as _ripemd160 } from '@noble/hashes/ripemd160';
import { sha1 as _sha1 } from '@noble/hashes/sha1';
import { sha256 as _sha256 } from '@noble/hashes/sha256';
import { concatBytes } from '@noble/hashes/utils';

export function ripemd160(buffer: Uint8Array): Uint8Array {
  return _ripemd160(buffer);
}

export function sha1(buffer: Uint8Array): Uint8Array {
  return _sha1(buffer);
}

export function sha256(buffer: Uint8Array): Uint8Array {
  return _sha256(buffer);
}

export function hash160(buffer: Uint8Array): Uint8Array {
  return _ripemd160(_sha256(buffer));
}

export function hash256(buffer: Uint8Array): Uint8Array {
  return _sha256(_sha256(buffer));
}

export const TAGS = [
  'BIP0340/challenge',
  'BIP0340/aux',
  'BIP0340/nonce',
  'KeyAgg list',
  'KeyAgg coefficient',
] as const;
export type TaggedHashPrefix = (typeof TAGS)[number];
type TaggedHashPrefixes = {
  [key in TaggedHashPrefix]: Uint8Array;
};
/** An object mapping tags to their tagged hash prefix of [SHA256(tag) | SHA256(tag)] */
export const TAGGED_HASH_PREFIXES: TaggedHashPrefixes = {
  'BIP0340/challenge': new Uint8Array([
    123, 181, 45, 122, 159, 239, 88, 50, 62, 177, 191, 122, 64, 125, 179, 130,
    210, 243, 242, 216, 27, 177, 34, 79, 73, 254, 81, 143, 109, 72, 211, 124,
    123, 181, 45, 122, 159, 239, 88, 50, 62, 177, 191, 122, 64, 125, 179, 130,
    210, 243, 242, 216, 27, 177, 34, 79, 73, 254, 81, 143, 109, 72, 211, 124,
  ]),
  'BIP0340/aux': new Uint8Array([
    241, 239, 78, 94, 192, 99, 202, 218, 109, 148, 202, 250, 157, 152, 126, 160,
    105, 38, 88, 57, 236, 193, 31, 151, 45, 119, 165, 46, 216, 193, 204, 144,
    241, 239, 78, 94, 192, 99, 202, 218, 109, 148, 202, 250, 157, 152, 126, 160,
    105, 38, 88, 57, 236, 193, 31, 151, 45, 119, 165, 46, 216, 193, 204, 144,
  ]),
  'BIP0340/nonce': new Uint8Array([
    7, 73, 119, 52, 167, 155, 203, 53, 91, 155, 140, 125, 3, 79, 18, 28, 244,
    52, 215, 62, 247, 45, 218, 25, 135, 0, 97, 251, 82, 191, 235, 47, 7, 73,
    119, 52, 167, 155, 203, 53, 91, 155, 140, 125, 3, 79, 18, 28, 244, 52, 215,
    62, 247, 45, 218, 25, 135, 0, 97, 251, 82, 191, 235, 47,
  ]),
  'KeyAgg list': new Uint8Array([
    72, 28, 151, 28, 60, 11, 70, 215, 240, 178, 117, 174, 89, 141, 78, 44, 126,
    215, 49, 156, 89, 74, 92, 110, 199, 158, 160, 212, 153, 2, 148, 240, 72, 28,
    151, 28, 60, 11, 70, 215, 240, 178, 117, 174, 89, 141, 78, 44, 126, 215, 49,
    156, 89, 74, 92, 110, 199, 158, 160, 212, 153, 2, 148, 240,
  ]),
  'KeyAgg coefficient': new Uint8Array([
    191, 201, 4, 3, 77, 28, 136, 232, 200, 14, 34, 229, 61, 36, 86, 109, 100,
    130, 78, 214, 66, 114, 129, 192, 145, 0, 249, 77, 205, 82, 201, 129, 191,
    201, 4, 3, 77, 28, 136, 232, 200, 14, 34, 229, 61, 36, 86, 109, 100, 130,
    78, 214, 66, 114, 129, 192, 145, 0, 249, 77, 205, 82, 201, 129,
  ]),
};

export function taggedHash(
  prefix: TaggedHashPrefix,
  data: Uint8Array,
): Uint8Array {
  return sha256(concatBytes(TAGGED_HASH_PREFIXES[prefix], data));
}
