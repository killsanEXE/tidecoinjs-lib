import * as types from './types';
const { typeforce } = types;

interface ScriptSignature {
  signature: Buffer;
  hashType: number;
}

// BIP62: 1 byte hashType flag (only 0x01, 0x02, 0x03, 0x81, 0x82 and 0x83 are allowed)
export function decode(buffer: Buffer): ScriptSignature {
  const hashType = buffer.readUInt8(buffer.length - 1);
  const hashTypeMod = hashType & ~0x80;
  if (hashTypeMod <= 0 || hashTypeMod >= 4)
    throw new Error('Invalid hashType ' + hashType);

  const signature = buffer.slice(0, -1);
  return { signature, hashType };
}

export function encode(signature: Buffer, hashType: number): Buffer {
  typeforce(
    {
      signature: types.Buffer,
      hashType: types.UInt8,
    },
    { signature, hashType },
  );

  const hashTypeMod = hashType & ~0x80;
  if (hashTypeMod <= 0 || hashTypeMod >= 4)
    throw new Error('Invalid hashType ' + hashType);

  const hashTypeBuffer = Buffer.allocUnsafe(1);
  hashTypeBuffer.writeUInt8(hashType, 0);

  return Buffer.concat([signature, hashTypeBuffer]);
}
