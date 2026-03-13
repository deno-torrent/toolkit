import { decodeHex, encodeHex } from '@std/encoding/hex'

/**
 * array1 xor array2, if array1.length !== array2.length, min(array1.length, array2.length) will be used
 * @param array1 Uint8Array
 * @param array2 Uint8Array
 * @returns Uint8Array
 */
function xorBytes(array1: Uint8Array, array2: Uint8Array) {
  const length = Math.min(array1.length, array2.length)
  const result = new Uint8Array(length)

  for (let i = 0; i < length; i++) {
    result[i] = array1[i] ^ array2[i]
  }

  return result
}

/**
 * xor two numbers or two Uint8Arrays
 * @param a
 * @param b
 * @returns
 */
function xor(a: number, b: number): Uint8Array
function xor(a: Uint8Array, b: Uint8Array): Uint8Array
function xor(a: number | Uint8Array, b: number | Uint8Array): Uint8Array {
  if (typeof a === 'number' && typeof b === 'number') {
    return Uint8Array.from([a ^ b])
  } else if (a instanceof Uint8Array && b instanceof Uint8Array) {
    return xorBytes(a, b)
  }
  throw new Error('a and b must be the same type')
}

/**
 * convert Uint8Array to binary string
 * @param value Uint8Array
 * @returns string
 */
function bytes2BinStr(value: Uint8Array): string {
  return value.reduce((str, byte) => str + byte.toString(2).padStart(8, '0'), '')
}

/**
 * convert binary string to Uint8Array
 * @param value such as '00000001'
 * @returns
 */
function binStr2Bytes(value: string): Uint8Array {
  const length = value.length / 8
  const result = new Uint8Array(length)

  for (let i = 0; i < length; i++) {
    result[i] = parseInt(value.slice(i * 8, (i + 1) * 8), 2)
  }

  return result
}

/**
 * convert Uint8Array to number
 * @param value
 * @returns
 */
function bytes2Int(value: Uint8Array): number {
  return parseInt(encodeHex(value), 16)
}

/**
 * convert number to Uint8Array
 * @param value
 * @returns
 */
function int2Bytes(value: number): Uint8Array {
  return Uint8Array.from([value])
}

/**
 * convert Uint8Array to hex string
 * @deprecated Use `encodeHex` from `@std/encoding/hex` directly.
 * @param value
 * @returns
 */
function bytes2HexStr(value: Uint8Array): string {
  return encodeHex(value)
}

/**
 * convert hex string to Uint8Array
 * @deprecated use std/encoding/hex.ts decodeHex instead
 * @param value
 * @returns
 */
function hexStr2Bytes(value: string): Uint8Array {
  return decodeHex(value)
}

/**
 * convert Uint8Array to Unit8Array []
 * e.g. chunkLenth is 4, Uint8Array [1,2,3,4,5,6,7,8] => [Uint8Array [1,2,3,4], Uint8Array [5,6,7,8]]
 *
 * @param data  Uint8Array
 */
function chunkBytes(data: Uint8Array, chunkLength: number): Uint8Array[] {
  if (chunkLength <= 0) {
    throw new Error('chunkLength must be greater than 0')
  }

  // if data.length <= chunkLength, return [data]
  if (data.length <= chunkLength) {
    return [data]
  }

  const result: Uint8Array[] = []
  const chunkCount = Math.ceil(data.length / chunkLength)
  for (let i = 0; i < chunkCount; i++) {
    const start = i * chunkLength
    const end = (i + 1) * chunkLength
    const chunk = data.slice(start, end)
    result.push(chunk)
  }

  return result
}

const BytesUtil = {
  xor,
  bytes2BinStr,
  binStr2Bytes,
  bytes2Int,
  int2Bytes,
  bytes2HexStr,
  hexStr2Bytes,
  chunkBytes
}

export { BytesUtil }
