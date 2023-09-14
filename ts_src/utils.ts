export function fromHex(hex: string): Buffer {
    const hexPairs = hex.match(/.{1,2}/g);
    if (!hexPairs) {
        throw new Error('Invalid hex string');
    }

    return Buffer.from(new Uint8Array(hexPairs.map((pair) => parseInt(pair, 16))));
}

export function toHex(buffer: Uint8Array) {
    return [...new Uint8Array(buffer)]
        .map((x) => x.toString(16).padStart(2, '0'))
        .join('');
}
