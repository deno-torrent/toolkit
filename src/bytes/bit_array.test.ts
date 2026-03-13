import { assertEquals, assertThrows } from '@std/assert'

import { BitArray, BytesUtil } from '../../mod.ts'

Deno.test('test bit array', () => {
  const bitArray = BitArray.fromInt(0b10101010)
  assertEquals(bitArray.length, 8)
  assertEquals(bitArray.bytes, new Uint8Array([0b10101010]))
  assertEquals(bitArray.toString(), '10101010')
})

Deno.test('test bit array get and set', () => {
  const bitArray = BitArray.fromInt(0b10101010)

  // defualt direction is lowest,from right to left
  assertEquals(bitArray.get(0), false)
  assertEquals(bitArray.get(1), true)
  assertEquals(bitArray.get(2), false)
  assertEquals(bitArray.get(3), true)
  assertEquals(bitArray.get(4), false)
  assertEquals(bitArray.get(5), true)
  assertEquals(bitArray.get(6), false)
  assertEquals(bitArray.get(7), true)
  assertThrows(() => bitArray.get(8)) // out of range

  // test highest, from left to right
  assertEquals(bitArray.get(0, 'highest'), true)
  assertEquals(bitArray.get(1, 'highest'), false)
  assertEquals(bitArray.get(2, 'highest'), true)
  assertEquals(bitArray.get(3, 'highest'), false)
  assertEquals(bitArray.get(4, 'highest'), true)
  assertEquals(bitArray.get(5, 'highest'), false)
  assertEquals(bitArray.get(6, 'highest'), true)
  assertEquals(bitArray.get(7, 'highest'), false)
  assertThrows(() => bitArray.get(8, 'highest')) // out of range
})

Deno.test('test bit array xor', () => {
  const bitArray1 = BitArray.fromInt(0b10101010)
  const bitArray2 = BitArray.fromInt(0b01010101)
  const bitArray3 = bitArray1.xor(bitArray2)
  const bitArray4 = bitArray2.xor(bitArray1)
  assertEquals(bitArray3.bytes, new Uint8Array([0b11111111]))
  assertEquals(bitArray4.bytes, new Uint8Array([0b11111111]))
})

Deno.test('test bit array compare', () => {
  const bitArray1 = BitArray.fromInt(0b10101010)
  const bitArray2 = BitArray.fromInt(0b01010101)
  const bitArray3 = BitArray.fromInt(0b10101010)
  assertEquals(bitArray1.greaterThan(bitArray2), true)
  assertEquals(bitArray2.greaterThan(bitArray1), false)

  assertEquals(bitArray1.lessThan(bitArray2), false)
  assertEquals(bitArray2.lessThan(bitArray1), true)

  assertEquals(bitArray1.equals(bitArray2), false)
  assertEquals(bitArray2.equals(bitArray1), false)
  assertEquals(bitArray1.equals(bitArray3), true)
  assertEquals(bitArray2.equals(bitArray3), false)
})

Deno.test('test bit array create', () => {
  const bitArray1 = BitArray.fromInt(0b10101010)
  const bitArray2 = BitArray.fromUnit8Array(new Uint8Array([0b10101010]))
  const bitArray3 = BitArray.fromBinaryString('10101010')
  assertEquals(bitArray1.equals(bitArray2), true)
  assertEquals(bitArray1.equals(bitArray3), true)
  assertEquals(bitArray2.equals(bitArray3), true)
  assertThrows(() => BitArray.fromBinaryString('101010102')) // invalid binary string, 2 is not a binary number
})

Deno.test('test bit array create from bigint', () => {
  const bitArray1 = BitArray.fromInt(0b10101010)
  const bitArray2 = BitArray.fromBigInt(0b10101010n)
  assertEquals(bitArray1.equals(bitArray2), true)

  const bitArray3 = BitArray.fromBinaryString('1010101010101010101010101010101010101010101010101010101010101010')
  const bitArray4 = BitArray.fromBigInt(0b1010101010101010101010101010101010101010101010101010101010101010n)
  assertEquals(bitArray3.equals(bitArray4), true)
})

Deno.test('test chunkUnit8Array', () => {
  assertThrows(() => BytesUtil.chunkBytes(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]), -1))
  assertThrows(() => BytesUtil.chunkBytes(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]), 0))

  assertEquals(BytesUtil.chunkBytes(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]), 1), [
    Uint8Array.from([1]),
    Uint8Array.from([2]),
    Uint8Array.from([3]),
    Uint8Array.from([4]),
    Uint8Array.from([5]),
    Uint8Array.from([6]),
    Uint8Array.from([7]),
    Uint8Array.from([8])
  ])

  assertEquals(BytesUtil.chunkBytes(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]), 2), [
    Uint8Array.from([1, 2]),
    Uint8Array.from([3, 4]),
    Uint8Array.from([5, 6]),
    Uint8Array.from([7, 8])
  ])

  assertEquals(BytesUtil.chunkBytes(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]), 3), [
    Uint8Array.from([1, 2, 3]),
    Uint8Array.from([4, 5, 6]),
    Uint8Array.from([7, 8])
  ])

  assertEquals(BytesUtil.chunkBytes(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]), 4), [
    Uint8Array.from([1, 2, 3, 4]),
    Uint8Array.from([5, 6, 7, 8])
  ])

  assertEquals(BytesUtil.chunkBytes(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]), 5), [
    Uint8Array.from([1, 2, 3, 4, 5]),
    Uint8Array.from([6, 7, 8])
  ])

  assertEquals(BytesUtil.chunkBytes(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]), 6), [
    Uint8Array.from([1, 2, 3, 4, 5, 6]),
    Uint8Array.from([7, 8])
  ])

  assertEquals(BytesUtil.chunkBytes(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]), 7), [
    Uint8Array.from([1, 2, 3, 4, 5, 6, 7]),
    Uint8Array.from([8])
  ])

  assertEquals(BytesUtil.chunkBytes(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]), 8), [
    Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8])
  ])

  assertEquals(BytesUtil.chunkBytes(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]), 9), [
    Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8])
  ])
})
