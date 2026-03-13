/**
 * HashUtil — cryptographic hash helpers backed by the Web Crypto API
 * (`globalThis.crypto.subtle`). No external dependencies.
 *
 * All functions accept either a `Uint8Array` of raw bytes or a plain `string`
 * (UTF-8 encoded) and return a `Uint8Array` digest.
 *
 * @example
 * ```ts
 * import { HashUtil } from './hash_util.ts';
 *
 * const digest = await HashUtil.sha1('hello');
 * console.log(HashUtil.toHex(digest)); // aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d
 * ```
 * @module
 */

/** Accepted input types for all hash functions. */
type HashInput = Uint8Array | string

/** Converts a string or Uint8Array into a plain `ArrayBuffer` (UTF-8 for strings). */
function toBuffer(input: HashInput): ArrayBuffer {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input
  // Copy into a fresh ArrayBuffer to satisfy SubtleCrypto's strict BufferSource typing.
  const ab = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(ab).set(bytes)
  return ab
}

/**
 * Computes the SHA-1 digest of `data`.
 *
 * > **Note:** SHA-1 is considered cryptographically weak. Prefer SHA-256 for
 * > security-sensitive use cases. SHA-1 remains common in non-security
 * > contexts such as BitTorrent info-hashes.
 *
 * @param data - Raw bytes or a UTF-8 string.
 * @returns 20-byte SHA-1 digest.
 */
async function sha1(data: HashInput): Promise<Uint8Array> {
  const buffer = await crypto.subtle.digest('SHA-1', toBuffer(data))
  return new Uint8Array(buffer)
}

/**
 * Computes the SHA-256 digest of `data`.
 *
 * @param data - Raw bytes or a UTF-8 string.
 * @returns 32-byte SHA-256 digest.
 */
async function sha256(data: HashInput): Promise<Uint8Array> {
  const buffer = await crypto.subtle.digest('SHA-256', toBuffer(data))
  return new Uint8Array(buffer)
}

/**
 * Computes the SHA-512 digest of `data`.
 *
 * @param data - Raw bytes or a UTF-8 string.
 * @returns 64-byte SHA-512 digest.
 */
async function sha512(data: HashInput): Promise<Uint8Array> {
  const buffer = await crypto.subtle.digest('SHA-512', toBuffer(data))
  return new Uint8Array(buffer)
}

/**
 * Computes the MD5 digest of `data`.
 *
 * > **Note:** MD5 is cryptographically broken. Only use it for checksums and
 * > legacy compatibility, never for security.
 *
 * Implemented in pure TypeScript because the Web Crypto API does not expose
 * MD5. The implementation follows RFC 1321.
 *
 * @param data - Raw bytes or a UTF-8 string.
 * @returns 16-byte MD5 digest.
 */
function md5(data: HashInput): Uint8Array {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  // Per-round shift amounts (RFC 1321 §3.4)
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ]
  // Precomputed table K[i] = floor(abs(sin(i+1)) * 2^32) (RFC 1321 §3.4)
  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
    0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
    0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
    0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
    0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
    0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
    0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
    0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
    0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ]

  // Pre-processing: adding padding bits (RFC 1321 §3.1-3.2)
  const msgLen = bytes.length
  const bitLen = msgLen * 8
  // Pad to 448 bits mod 512, then append 64-bit little-endian length.
  const padLen = ((55 - msgLen) % 64 + 64) % 64 + 1
  const padded = new Uint8Array(msgLen + padLen + 8)
  padded.set(bytes)
  padded[msgLen] = 0x80
  const view = new DataView(padded.buffer)
  view.setUint32(msgLen + padLen, bitLen >>> 0, true)
  view.setUint32(msgLen + padLen + 4, Math.floor(bitLen / 2 ** 32), true)

  // Initial hash state (RFC 1321 §3.3)
  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  // Process each 512-bit (64-byte) chunk
  for (let i = 0; i < padded.length; i += 64) {
    const M: number[] = []
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(i + j * 4, true)
    }

    let A = a0, B = b0, C = c0, D = d0

    for (let j = 0; j < 64; j++) {
      let F: number, g: number
      if (j < 16) {
        F = (B & C) | (~B & D)
        g = j
      } else if (j < 32) {
        F = (D & B) | (~D & C)
        g = (5 * j + 1) % 16
      } else if (j < 48) {
        F = B ^ C ^ D
        g = (3 * j + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * j) % 16
      }
      F = (F + A + K[j] + M[g]) | 0
      A = D
      D = C
      C = B
      B = (B + ((F << S[j]) | (F >>> (32 - S[j])))) | 0
    }

    a0 = (a0 + A) | 0
    b0 = (b0 + B) | 0
    c0 = (c0 + C) | 0
    d0 = (d0 + D) | 0
  }

  // Output (RFC 1321 §3.5) — little-endian
  const result = new Uint8Array(16)
  const out = new DataView(result.buffer)
  out.setUint32(0, a0, true)
  out.setUint32(4, b0, true)
  out.setUint32(8, c0, true)
  out.setUint32(12, d0, true)
  return result
}

/**
 * Encodes a digest `Uint8Array` to a lowercase hex string.
 *
 * @param digest - Raw digest bytes.
 * @returns Lowercase hexadecimal string.
 */
function toHex(digest: Uint8Array): string {
  return Array.from(digest).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Utility object grouping all hash helpers.
 */
const HashUtil = {
  sha1,
  sha256,
  sha512,
  md5,
  toHex,
}

export { HashUtil }
