import * as bcrypto from '../crypto';
import { bitcoin as BITCOIN_NETWORK } from '../networks';
import * as bscript from '../script';
import {
  Payment,
  PaymentFunction,
  PaymentOpts,
  Stack,
  StackFunction,
} from './index';
import * as lazy from './lazy';
import * as bs58check from 'bs58check';
const OPS = bscript.OPS;

// input: [redeemScriptSig ...] {redeemScript}
// witness: <?>
// output: OP_HASH160 {hash160(redeemScript)} OP_EQUAL
export function p2sh(a: Payment, opts?: PaymentOpts): Payment {
  if (!a.address && !a.hash && !a.output && !a.redeem && !a.input)
    throw new TypeError('Not enough data');
  opts = Object.assign({ validate: true }, opts || {});

  let network = a.network;
  if (!network) {
    network = (a.redeem && a.redeem.network) || BITCOIN_NETWORK;
  }

  const o: Payment = { network };

  const _address = lazy.value(() => {
    const payload = Buffer.from(bs58check.decode(a.address!));
    const version = payload.readUInt8(0);
    const hash = payload.slice(1);
    return { version, hash };
  });
  const _chunks = lazy.value(() => {
    return bscript.decompile(a.input!);
  }) as StackFunction;
  const _redeem = lazy.value((): Payment => {
    const chunks = _chunks();
    const lastChunk = chunks[chunks.length - 1];
    return {
      network,
      output:
        lastChunk === OPS.OP_FALSE ? Buffer.from([]) : (lastChunk as Buffer),
      input: bscript.compile(chunks.slice(0, -1)),
      witness: a.witness || [],
    };
  }) as PaymentFunction;

  // output dependents
  lazy.prop(o, 'address', () => {
    if (!o.hash) return;

    const payload = Buffer.allocUnsafe(21);
    payload.writeUInt8(o.network!.scriptHash, 0);
    o.hash.copy(payload, 1);
    return bs58check.encode(payload);
  });
  lazy.prop(o, 'hash', () => {
    // in order of least effort
    if (a.output) return a.output.slice(2, 22);
    if (a.address) return _address().hash;
    if (o.redeem && o.redeem.output) return bcrypto.hash160(o.redeem.output);
  });
  lazy.prop(o, 'output', () => {
    if (!o.hash) return;
    return bscript.compile([OPS.OP_HASH160, o.hash, OPS.OP_EQUAL]);
  });

  // input dependents
  lazy.prop(o, 'redeem', () => {
    if (!a.input) return;
    return _redeem();
  });
  lazy.prop(o, 'input', () => {
    if (!a.redeem || !a.redeem.input || !a.redeem.output) return;
    return bscript.compile(
      ([] as Stack).concat(
        bscript.decompile(a.redeem.input) as Stack,
        a.redeem.output,
      ),
    );
  });
  lazy.prop(o, 'witness', () => {
    if (o.redeem && o.redeem.witness) return o.redeem.witness;
    if (o.input) return [];
  });
  lazy.prop(o, 'name', () => {
    const nameParts = ['p2sh'];
    if (o.redeem !== undefined && o.redeem.name !== undefined)
      nameParts.push(o.redeem.name!);
    return nameParts.join('-');
  });

  return Object.assign(o, a);
}
