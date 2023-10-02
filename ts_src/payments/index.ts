import { Network } from '../networks';
import { p2data as embed } from './embed';
import { p2ms } from './p2ms';
import { p2pk } from './p2pk';
import { p2pkh } from './p2pkh';
import { p2sh } from './p2sh';
import { p2wpkh } from './p2wpkh';
import { p2wsh } from './p2wsh';

export interface Payment {
  name?: string;
  network?: Network;
  output?: Uint8Array;
  data?: Uint8Array[];
  m?: number;
  n?: number;
  pubkeys?: Uint8Array[];
  input?: Uint8Array;
  signatures?: Uint8Array[];
  internalPubkey?: Uint8Array;
  pubkey?: Uint8Array;
  signature?: Uint8Array;
  address?: string;
  hash?: Uint8Array;
  redeem?: Payment;
  redeemVersion?: number;
  witness?: Uint8Array[];
}

export type PaymentCreator = (a: Payment, opts?: PaymentOpts) => Payment;

export type PaymentFunction = () => Payment;

export interface PaymentOpts {
  validate?: boolean;
  allowIncomplete?: boolean;
}

export type StackElement = Uint8Array | number;
export type Stack = StackElement[];
export type StackFunction = () => Stack;

export { embed, p2ms, p2pk, p2pkh, p2sh, p2wpkh, p2wsh };

// TODO
// witness commitment
