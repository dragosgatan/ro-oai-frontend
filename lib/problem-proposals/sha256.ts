const INITIAL_STATE = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);

const ROUND_CONSTANTS = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotateRight(value: number, bits: number): number {
    return (value >>> bits) | (value << (32 - bits));
}

function toHex(bytes: Uint8Array): string {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export class IncrementalSha256 {
    private readonly state = new Uint32Array(INITIAL_STATE);
    private readonly buffer = new Uint8Array(64);
    private readonly words = new Uint32Array(64);
    private bufferLength = 0;
    private bytesHashed = 0;
    private finished = false;

    update(input: Uint8Array): this {
        if (this.finished) throw new Error('SHA-256 digest has already been finalized');
        this.bytesHashed += input.length;
        let offset = 0;

        if (this.bufferLength > 0) {
            const needed = Math.min(64 - this.bufferLength, input.length);
            this.buffer.set(input.subarray(0, needed), this.bufferLength);
            this.bufferLength += needed;
            offset += needed;
            if (this.bufferLength === 64) {
                this.transform(this.buffer);
                this.bufferLength = 0;
            }
        }

        while (offset + 64 <= input.length) {
            this.transform(input.subarray(offset, offset + 64));
            offset += 64;
        }

        if (offset < input.length) {
            this.buffer.set(input.subarray(offset), 0);
            this.bufferLength = input.length - offset;
        }
        return this;
    }

    digest(): Uint8Array {
        if (this.finished) throw new Error('SHA-256 digest has already been finalized');
        this.finished = true;
        const bytesHashed = this.bytesHashed;

        this.buffer[this.bufferLength++] = 0x80;
        if (this.bufferLength > 56) {
            this.buffer.fill(0, this.bufferLength, 64);
            this.transform(this.buffer);
            this.bufferLength = 0;
        }
        this.buffer.fill(0, this.bufferLength, 56);

        const bitHigh = Math.floor(bytesHashed / 0x20000000);
        const bitLow = (bytesHashed << 3) >>> 0;
        this.buffer[56] = (bitHigh >>> 24) & 0xff;
        this.buffer[57] = (bitHigh >>> 16) & 0xff;
        this.buffer[58] = (bitHigh >>> 8) & 0xff;
        this.buffer[59] = bitHigh & 0xff;
        this.buffer[60] = (bitLow >>> 24) & 0xff;
        this.buffer[61] = (bitLow >>> 16) & 0xff;
        this.buffer[62] = (bitLow >>> 8) & 0xff;
        this.buffer[63] = bitLow & 0xff;
        this.transform(this.buffer);

        const output = new Uint8Array(32);
        for (let index = 0; index < this.state.length; index += 1) {
            const value = this.state[index]!;
            output[index * 4] = (value >>> 24) & 0xff;
            output[index * 4 + 1] = (value >>> 16) & 0xff;
            output[index * 4 + 2] = (value >>> 8) & 0xff;
            output[index * 4 + 3] = value & 0xff;
        }
        return output;
    }

    hexDigest(): string {
        return toHex(this.digest());
    }

    private transform(chunk: Uint8Array) {
        const words = this.words;
        for (let index = 0; index < 16; index += 1) {
            const offset = index * 4;
            words[index] =
                ((chunk[offset]! << 24) |
                    (chunk[offset + 1]! << 16) |
                    (chunk[offset + 2]! << 8) |
                    chunk[offset + 3]!) >>>
                0;
        }
        for (let index = 16; index < 64; index += 1) {
            const word15 = words[index - 15]!;
            const word2 = words[index - 2]!;
            const sigma0 = rotateRight(word15, 7) ^ rotateRight(word15, 18) ^ (word15 >>> 3);
            const sigma1 = rotateRight(word2, 17) ^ rotateRight(word2, 19) ^ (word2 >>> 10);
            words[index] = (words[index - 16]! + sigma0 + words[index - 7]! + sigma1) >>> 0;
        }

        let a = this.state[0]!;
        let b = this.state[1]!;
        let c = this.state[2]!;
        let d = this.state[3]!;
        let e = this.state[4]!;
        let f = this.state[5]!;
        let g = this.state[6]!;
        let h = this.state[7]!;

        for (let index = 0; index < 64; index += 1) {
            const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
            const choose = (e & f) ^ (~e & g);
            const temporary1 = (h + sum1 + choose + ROUND_CONSTANTS[index]! + words[index]!) >>> 0;
            const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
            const majority = (a & b) ^ (a & c) ^ (b & c);
            const temporary2 = (sum0 + majority) >>> 0;

            h = g;
            g = f;
            f = e;
            e = (d + temporary1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (temporary1 + temporary2) >>> 0;
        }

        this.state[0] = (this.state[0]! + a) >>> 0;
        this.state[1] = (this.state[1]! + b) >>> 0;
        this.state[2] = (this.state[2]! + c) >>> 0;
        this.state[3] = (this.state[3]! + d) >>> 0;
        this.state[4] = (this.state[4]! + e) >>> 0;
        this.state[5] = (this.state[5]! + f) >>> 0;
        this.state[6] = (this.state[6]! + g) >>> 0;
        this.state[7] = (this.state[7]! + h) >>> 0;
    }
}

export async function sha256Blob(
    blob: Blob,
    {
        chunkSize = 2 * 1024 * 1024,
        onProgress,
        signal,
    }: {
        chunkSize?: number;
        onProgress?: (completedBytes: number, totalBytes: number) => void;
        signal?: AbortSignal;
    } = {},
): Promise<string> {
    const hasher = new IncrementalSha256();
    const safeChunkSize = Math.max(64 * 1024, chunkSize);
    for (let offset = 0; offset < blob.size; offset += safeChunkSize) {
        if (signal?.aborted) throw new DOMException('Hashing was cancelled', 'AbortError');
        const chunk = new Uint8Array(
            await blob.slice(offset, Math.min(blob.size, offset + safeChunkSize)).arrayBuffer(),
        );
        hasher.update(chunk);
        onProgress?.(Math.min(blob.size, offset + chunk.length), blob.size);
        // Yield between chunks so large datasets do not lock mobile Safari's main thread.
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    return hasher.hexDigest();
}

export function sha256Text(value: string): string {
    return new IncrementalSha256().update(new TextEncoder().encode(value)).hexDigest();
}
