import { TIDECOIN } from '../networks';
import * as bscript from '../script';
import { typeforce as typef } from '../types';
import { Payment, PaymentOpts, Stack } from './index';
import * as lazy from './lazy';
import { equals } from 'uint8arrays';

const OPS = bscript.OPS;

function stacksEqual(a: Uint8Array[], b: Uint8Array[]): boolean {
  if (a.length !== b.length) return false;

  return a.every((x, i) => {
    return equals(x, b[i]);
  });
}

// output: OP_RETURN ...
export function p2data(a: Payment, opts?: PaymentOpts): Payment {
  if (!a.data && !a.output) throw new TypeError('Not enough data');
  opts = Object.assign({ validate: true }, opts || {});

  typef(
    {
      network: typef.maybe(typef.Object),
      output: typef.maybe(typef.UInt8),
      data: typef.maybe(typef.arrayOf(typef.UInt8)),
    },
    a,
  );

  const network = a.network || TIDECOIN;
  const o = { name: 'embed', network } as Payment;

  lazy.prop(o, 'output', () => {
    if (!a.data) return;
    return bscript.compile(([OPS.OP_RETURN] as Stack).concat(a.data));
  });
  lazy.prop(o, 'data', () => {
    if (!a.output) return;
    return bscript.decompile(a.output)!.slice(1);
  });

  // extended validation
  if (opts.validate) {
    if (a.output) {
      const chunks = bscript.decompile(a.output);
      if (chunks![0] !== OPS.OP_RETURN)
        throw new TypeError('Output is invalid');
      if (!chunks!.slice(1).every(typef.UInt8))
        throw new TypeError('Output is invalid');

      if (a.data && !stacksEqual(a.data, o.data as Uint8Array[]))
        throw new TypeError('Data mismatch');
    }
  }

  return Object.assign(o, a);
}
