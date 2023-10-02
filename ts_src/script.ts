import { concatBytes } from '@noble/hashes/utils';
import * as bip66 from './bip66';
import { OPS, REVERSE_OPS } from './ops';
import { Stack } from './payments';
import * as pushdata from './push_data';
import * as scriptNumber from './script_number';
import * as scriptSignature from './script_signature';
import * as types from './types';
import { fromHex, toHex } from './utils';
const { typeforce } = types;

const OP_INT_BASE = OPS.OP_RESERVED; // OP_1 - 1
export { OPS };

function isOPInt(value: number): boolean {
  return (
    types.Number(value) &&
    (value === OPS.OP_0 ||
      (value >= OPS.OP_1 && value <= OPS.OP_16) ||
      value === OPS.OP_1NEGATE)
  );
}

function isPushOnlyChunk(value: number | Uint8Array): boolean {
  return types.Buffer(value) || isOPInt(value as number);
}

export function isPushOnly(value: Stack): boolean {
  return types.Array(value) && value.every(isPushOnlyChunk);
}

export function countNonPushOnlyOPs(value: Stack): number {
  return value.length - value.filter(isPushOnlyChunk).length;
}

function asMinimalOP(buffer: Uint8Array): number | void {
  if (buffer.length === 0) return OPS.OP_0;
  if (buffer.length !== 1) return;
  if (buffer[0] >= 1 && buffer[0] <= 16) return OP_INT_BASE + buffer[0];
  if (buffer[0] === 0x81) return OPS.OP_1NEGATE;
}

function chunksIsBuffer(buf: Uint8Array | Stack): buf is Uint8Array {
  return Buffer.isBuffer(buf);
}

function chunksIsArray(buf: Uint8Array | Stack): buf is Stack {
  return types.Array(buf);
}

function singleChunkIsBuffer(buf: number | Uint8Array): buf is Uint8Array {
  return Buffer.isBuffer(buf);
}

export function compile(chunks: Uint8Array | Stack): Uint8Array {
  // TODO: remove me
  if (chunksIsBuffer(chunks)) return chunks;

  typeforce(types.Array, chunks);

  let payload: Uint8Array[] = [];

  chunks.forEach(chunk => {
    if (singleChunkIsBuffer(chunk)) {
      const opcode = asMinimalOP(chunk);
      if (opcode !== undefined) {
        payload.push(new Uint8Array([opcode]));
        return;
      }

      payload = payload.concat(...pushdata.encode(chunk.length));
      payload.push(chunk);
    } else {
      payload.push(new Uint8Array([chunk]));
    }
  });

  const buf = concatBytes(...payload);

  return buf;
}

export function decompile(
  buffer: Uint8Array | Array<number | Uint8Array>,
): Array<number | Uint8Array> | null {
  // TODO: remove me
  if (chunksIsArray(buffer)) return buffer;

  typeforce(types.UInt8, buffer);

  const chunks: Array<number | Uint8Array> = [];
  let i = 0;

  while (i < buffer.length) {
    const opcode = buffer[i];

    // data chunk
    if (opcode > OPS.OP_0 && opcode <= OPS.OP_PUSHDATA4) {
      const d = pushdata.decode(buffer, i);

      // did reading a pushDataInt fail?
      if (d === null) return null;
      i += d.size;

      // attempt to read too much data?
      if (i + d.number > buffer.length) return null;

      const data = buffer.slice(i, i + d.number);
      i += d.number;

      // decompile minimally
      const op = asMinimalOP(data);
      if (op !== undefined) {
        chunks.push(op);
      } else {
        chunks.push(data);
      }

      // opcode
    } else {
      chunks.push(opcode);

      i += 1;
    }
  }

  return chunks;
}

export function toASM(chunks: Uint8Array | Array<number | Uint8Array>): string {
  if (chunksIsBuffer(chunks)) {
    chunks = decompile(chunks) as Stack;
  }

  return chunks
    .map(chunk => {
      // data?
      if (singleChunkIsBuffer(chunk)) {
        const op = asMinimalOP(chunk);
        if (op === undefined) return toHex(chunk);
        chunk = op as number;
      }

      // opcode!
      return REVERSE_OPS[chunk];
    })
    .join(' ');
}

export function fromASM(asm: string): Uint8Array {
  typeforce(types.String, asm);

  return compile(
    asm.split(' ').map(chunkStr => {
      // opcode?
      if (OPS[chunkStr] !== undefined) return OPS[chunkStr];
      typeforce(types.Hex, chunkStr);

      // data!
      return fromHex(chunkStr);
    }),
  );
}

export function toStack(
  chunks: Uint8Array | Array<number | Uint8Array>,
): Uint8Array[] {
  chunks = decompile(chunks) as Stack;
  typeforce(isPushOnly, chunks);

  return chunks.map(op => {
    if (singleChunkIsBuffer(op)) return op;
    if (op === OPS.OP_0) return new Uint8Array(0);

    return scriptNumber.encode(op - OP_INT_BASE);
  });
}

export function isDefinedHashType(hashType: number): boolean {
  const hashTypeMod = hashType & ~0x80;

  // return hashTypeMod > SIGHASH_ALL && hashTypeMod < SIGHASH_SINGLE
  return hashTypeMod > 0x00 && hashTypeMod < 0x04;
}

export function isCanonicalScriptSignature(buffer: Uint8Array): boolean {
  //return true;
  if (!Buffer.isBuffer(buffer)) return false;
  if (!isDefinedHashType(buffer[buffer.length - 1])) return false;
  // ! remove this return
  return true;

  return bip66.check(buffer.slice(0, -1));
}

export const number = scriptNumber;
export const signature = scriptSignature;
