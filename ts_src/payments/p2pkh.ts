import * as bcrypto from '../crypto';
import { TIDECOIN } from '../networks';
import * as bscript from '../script';
import { toHex } from '../utils';
import { Payment, PaymentOpts, StackFunction } from './index';
import * as lazy from './lazy';
import * as bs58check from 'bs58check';
const OPS = bscript.OPS;

// input: {signature} {pubkey}
// output: OP_DUP OP_HASH160 {hash160(pubkey)} OP_EQUALVERIFY OP_CHECKSIG
export function p2pkh(a: Payment, opts?: PaymentOpts): Payment {
  if (!a.pubkey) return {};
  a.pubkey = Buffer.from('07' + toHex(a.pubkey), 'hex');
  return p2pkh_old(a, opts);
}

function p2pkh_old(a: Payment, opts?: PaymentOpts): Payment {
  if (!a.address && !a.hash && !a.output && !a.pubkey && !a.input)
    throw new TypeError('Not enough data');
  opts = Object.assign({ validate: true }, opts || {});

  const _address = lazy.value(() => {
    const payload = Buffer.from(bs58check.decode(a.address!));
    const version = payload.readUInt8(0);
    const hash = payload.slice(1);
    return { version, hash };
  });
  const _chunks = lazy.value(() => {
    return bscript.decompile(a.input!);
  }) as StackFunction;

  const network = a.network || TIDECOIN;
  const o: Payment = { name: 'p2pkh', network };

  lazy.prop(o, 'address', () => {
    if (!o.hash) return;

    const payload = Buffer.allocUnsafe(21);
    payload.writeUInt8(network.pubKeyHash, 0);
    o.hash.copy(payload, 1);
    return bs58check.encode(payload);
  });
  lazy.prop(o, 'hash', () => {
    if (a.output) return a.output.slice(3, 23);
    if (a.address) return _address().hash;
    if (a.pubkey || o.pubkey) return bcrypto.hash160(a.pubkey! || o.pubkey!);
  });
  lazy.prop(o, 'output', () => {
    if (!o.hash) return;
    return bscript.compile([
      OPS.OP_DUP,
      OPS.OP_HASH160,
      o.hash,
      OPS.OP_EQUALVERIFY,
      OPS.OP_CHECKSIG,
    ]);
  });
  lazy.prop(o, 'pubkey', () => {
    if (!a.input) return;
    return _chunks()[1] as Buffer;
  });
  lazy.prop(o, 'signature', () => {
    if (!a.input) return;
    return _chunks()[0] as Buffer;
  });
  lazy.prop(o, 'input', () => {
    if (!a.pubkey) return;
    if (!a.signature) return;
    return bscript.compile([a.signature, a.pubkey]);
  });
  lazy.prop(o, 'witness', () => {
    if (!o.input) return;
    return [];
  });

  return Object.assign(o, a);
}
