import * as bcrypto from '../crypto';
import { bitcoin as BITCOIN_NETWORK } from '../networks';
import * as bscript from '../script';
import { Payment, PaymentOpts } from './index';
import * as lazy from './lazy';
import { bech32 } from 'bech32';
const OPS = bscript.OPS;

const EMPTY_BUFFER = Buffer.alloc(0);

// witness: {signature} {pubKey}
// input: <>
// output: OP_0 {pubKeyHash}
export function p2wpkh(a: Payment, opts?: PaymentOpts): Payment {
  if (!a.address && !a.hash && !a.output && !a.pubkey && !a.witness)
    throw new TypeError('Not enough data');
  opts = Object.assign({ validate: true }, opts || {});

  const _address = lazy.value(() => {
    const result = bech32.decode(a.address!);
    const version = result.words.shift();
    const data = bech32.fromWords(result.words);
    return {
      version,
      prefix: result.prefix,
      data: Buffer.from(data),
    };
  });

  const network = a.network || BITCOIN_NETWORK;
  const o: Payment = { name: 'p2wpkh', network };

  lazy.prop(o, 'address', () => {
    if (!o.hash) return;

    const words = bech32.toWords(o.hash);
    words.unshift(0x00);
    return bech32.encode(network.bech32, words);
  });
  lazy.prop(o, 'hash', () => {
    if (a.output) return a.output.slice(2, 22);
    if (a.address) return _address().data;
    if (a.pubkey || o.pubkey) return bcrypto.hash160(a.pubkey! || o.pubkey!);
  });
  lazy.prop(o, 'output', () => {
    if (!o.hash) return;
    return bscript.compile([OPS.OP_0, o.hash]);
  });
  lazy.prop(o, 'pubkey', () => {
    if (a.pubkey) return a.pubkey;
    if (!a.witness) return;
    return a.witness[1];
  });
  lazy.prop(o, 'signature', () => {
    if (!a.witness) return;
    return a.witness[0];
  });
  lazy.prop(o, 'input', () => {
    if (!o.witness) return;
    return EMPTY_BUFFER;
  });
  lazy.prop(o, 'witness', () => {
    if (!a.pubkey) return;
    if (!a.signature) return;
    return [a.signature, a.pubkey];
  });

  return Object.assign(o, a);
}
