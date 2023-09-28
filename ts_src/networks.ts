export interface Network {
  messagePrefix: string;
  bech32: string;
  bip32: Bip32;
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
}

interface Bip32 {
  public: number;
  private: number;
}

export const TIDECOIN: Network = {
  messagePrefix: '\x19Tidecoin Signed Message:\n',
  bech32: 'tbc',
  bip32: {
    public: 0x0768acde,
    private: 0x0768feb1,
  },
  pubKeyHash: 0x21,
  scriptHash: 0x41,
  wif: 0xb0,
};
