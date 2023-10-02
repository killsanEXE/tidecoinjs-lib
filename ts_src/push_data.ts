import { OPS } from './ops';
import { readUint16LE, readUint32LE, readUint8 } from './utils';

export function encodingLength(i: number): number {
  return i < OPS.OP_PUSHDATA1 ? 1 : i <= 0xff ? 2 : i <= 0xffff ? 3 : 5;
}

export function encode(num: number): Uint8Array[] {
  const result = [];
  const size = encodingLength(num);

  // ~6 bit
  if (size === 1) {
    result.push(new Uint8Array([num]));

    // 8 bit
  } else if (size === 2) {
    result.push(new Uint8Array([OPS.OP_PUSHDATA1, num]));

    // 16 bit
  } else if (size === 3) {
    result.push(new Uint8Array([OPS.OP_PUSHDATA2, num]));

    // 32 bit
  } else {
    result.push(new Uint8Array([OPS.OP_PUSHDATA4, num]));
  }

  return result;
}

export function decode(
  buffer: Uint8Array,
  offset: number,
): {
  opcode: number;
  number: number;
  size: number;
} | null {
  const opcode = readUint8(buffer, offset);
  let num: number;
  let size: number;

  // ~6 bit
  if (opcode < OPS.OP_PUSHDATA1) {
    num = opcode;
    size = 1;

    // 8 bit
  } else if (opcode === OPS.OP_PUSHDATA1) {
    if (offset + 2 > buffer.length) return null;
    num = readUint8(buffer, offset + 1);
    size = 2;

    // 16 bit
  } else if (opcode === OPS.OP_PUSHDATA2) {
    if (offset + 3 > buffer.length) return null;
    num = readUint16LE(buffer, offset + 1);
    size = 3;

    // 32 bit
  } else {
    if (offset + 5 > buffer.length) return null;
    if (opcode !== OPS.OP_PUSHDATA4) throw new Error('Unexpected opcode');

    num = readUint32LE(buffer, offset + 1);
    size = 5;
  }

  return {
    opcode,
    number: num,
    size,
  };
}
