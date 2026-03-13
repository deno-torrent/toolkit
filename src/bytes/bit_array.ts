import { BytesUtil } from './bytes_util.ts'

/**
 * A bit array is an array data structure that compactly stores bits. It can be used to implement a simple set data structure.
 */
export class BitArray {
  #data: Uint8Array

  private constructor(data: Uint8Array) {
    this.#data = data
  }

  toBigInt(): bigint {
    return BigInt(`0b${this.toString()}`)
  }

  /**
   * create a bit array from a binary string, e.g. 0101 0101
   * @param data the binary string, e.g. 0101 0101
   */
  static fromBinaryString(data: string): BitArray {
    // check the data is a binary string
    if (!BitArray.isBinaryString(data)) {
      throw new Error(`data ${data} is not a binary string`)
    }

    const bytesLength = Math.ceil(data.length / 8)

    // int range is small, so we can use BigInt to convert binary string to number
    const number = BigInt(`0b${data}`)
    const bytes = new Uint8Array(bytesLength)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Number((number >> BigInt(8 * (bytes.length - 1 - i))) & BigInt(0xff))
    }

    return new BitArray(bytes)
  }

  /**
   * create a bit array from a unit8 array
   * @param data
   * @returns
   */
  static fromUnit8Array(data: Uint8Array): BitArray {
    return new BitArray(data)
  }

  /**
   * create a bit array from a number
   * @param data
   * @param length the bit length of the number, if the bit length of the number is less than length, fill the number with 0 from the highest bit
   * @returns
   */
  static fromInt(data: number, length = 0): BitArray {
    // if number is not a integer, throw an error
    if (!Number.isInteger(data)) {
      throw new Error(`data ${data} is not a integer`)
    }

    // if number is not a uint number, throw an error
    if (data < 0) {
      throw new Error(`data ${data} is not a uint number`)
    }

    const binaryString = data.toString(2)
    const safeLength = Math.max(binaryString.length, length)
    return this.fromBinaryString(data.toString(2).padStart(safeLength, '0'))
  }

  /**
   *
   * @param data
   * @param length the bit length of the number, if the bit length of the number is less than length, fill the number with 0 from the highest bit
   * @returns
   */
  static fromBigInt(data: bigint, length = 0): BitArray {
    // if number is not a unit number, throw an error
    if (data < 0n) {
      throw new Error(`data ${data} is not a uint number`)
    }

    const binaryString = data.toString(2)
    const safeLength = Math.max(binaryString.length, length)
    return this.fromBinaryString(data.toString(2).padStart(safeLength, '0'))
  }

  static isBinaryString(data: string): boolean {
    if (data.length === 0) return false

    // if data has any character other than 0 and 1, it is not a binary string
    for (let i = 0; i < data.length; i++) {
      if (data[i] !== '0' && data[i] !== '1') {
        return false
      }
    }
    return true
  }

  /**
   * get the length of the bit array
   */
  get length(): number {
    return this.#data.length * 8
  }

  /**
   * get the bytes of the bit array
   */
  get bytes(): Uint8Array {
    return this.#data
  }

  /**
   * compare this bit array with the other bit array
   * @param other
   * @returns
   */
  greaterThan(other: BitArray): boolean {
    return this.toBigInt() > other.toBigInt()
  }

  greaterThanOrEqual(other: BitArray): boolean {
    return this.greaterThan(other) || this.equals(other)
  }

  /**
   * compare this bit array with the other bit array
   * @param other
   * @returns
   */
  lessThan(other: BitArray): boolean {
    return this.toBigInt() < other.toBigInt()
  }

  lessThanOrEqual(other: BitArray): boolean {
    return this.lessThan(other) || this.equals(other)
  }

  /**
   * compare this bit array with the other bit array
   * @param other
   * @returns
   */
  equals(other: BitArray): boolean {
    return this.toBigInt() == other.toBigInt()
  }

  /**
   * calculate the xor of this bit array and the other bit array
   * @param other the other bit array
   * @returns a new bit array
   */
  xor(other: BitArray): BitArray {
    const data = new Uint8Array(this.#data.length)
    for (let i = 0; i < this.#data.length; i++) {
      data[i] = this.#data[i] ^ other.#data[i]
    }
    return new BitArray(data)
  }

  /**
   * set the bit at the index
   * @param index the index of the bit
   * @param value the value of the bit
   * @param zeroIndex the index of the zero bit, lowest or highest, default is lowest ,if the bit array is 1010 1010, the lowest zero bit is 0, the highest zero bit is 7
   */
  set(index: number, value: boolean, zeroIndex: 'lowest' | 'highest' = 'lowest'): void {
    // out of range check
    if (index < 0 || index >= this.length) {
      throw new Error(`index ${index} out of range`)
    }

    if (zeroIndex === 'lowest') {
      this.setBitFromLowest(index, value)
    } else if (zeroIndex === 'highest') {
      this.setBitFromHighest(index, value)
    }
  }

  setBitFromHighest(index: number, value: boolean): void {
    // calculate the byte index which contains the bit
    const byteIndex = this.getByteIndex(index, 'highest')
    const byte = this.#data[byteIndex]

    // calculate the bit index in the byte
    const bitIndex = this.getBitOffsetInByte(index, 'highest')

    // set the bit
    if (value) {
      this.#data[byteIndex] = byte | (1 << bitIndex)
    } else {
      this.#data[byteIndex] = byte & ~(1 << bitIndex)
    }
  }

  setBitFromLowest(index: number, value: boolean): void {
    // calculate the byte index which contains the bit
    const byteIndex = this.getByteIndex(index, 'lowest')
    const byte = this.#data[byteIndex]

    // calculate the bit index in the byte
    const bitIndex = this.getBitOffsetInByte(index, 'lowest')

    // set the bit
    if (value) {
      this.#data[byteIndex] = byte | (1 << bitIndex)
    } else {
      this.#data[byteIndex] = byte & ~(1 << bitIndex)
    }
  }

  /**
   * get the bit at the index
   * @param index  the index of the bit
   * @param zeroIndex the index of the zero bit, lowest or highest, default is lowest ,if the bit array is 1010 1010, the lowest zero bit is 0, the highest zero bit is 7
   */
  get(index: number, zeroIndex: 'lowest' | 'highest' = 'lowest'): boolean {
    // out of range check
    if (index < 0 || index >= this.length) {
      throw new Error(`index ${index} out of range`)
    }

    if (zeroIndex === 'lowest') {
      return this.getBitFromLowest(index)
    } else {
      return this.getBitFromHighest(index)
    }
  }

  /**
   * get the bit from the highest bit
   * @param index the index of the bit
   * @returns the bit
   */
  getBitFromHighest(index: number): boolean {
    // calculate the byte index which contains the bit
    const byteIndex = this.getByteIndex(index, 'highest')
    const byte = this.#data[byteIndex]

    // calculate the bit index in the byte
    const bitIndex = this.getBitOffsetInByte(index, 'highest')

    // get the bit
    return (byte & (1 << bitIndex)) !== 0
  }

  /**
   * get the bit from the lowest bit
   * @param index the index of the bit
   * @returns the bit
   */
  getBitFromLowest(index: number): boolean {
    // calculate the byte index which contains the bit
    const byteIndex = this.getByteIndex(index, 'lowest')
    const byte = this.#data[byteIndex]

    // calculate the bit index in the byte
    const bitIndex = this.getBitOffsetInByte(index, 'lowest')

    // get the bit
    return (byte & (1 << bitIndex)) !== 0
  }

  /**
   * get the byte index which contains the bit
   * @param bitIndex bit index
   * @param zeroIndex the index of the zero bit, lowest or highest, default is lowest ,if the bit array is 1010 1010, the lowest zero bit is 0, the highest zero bit is 7
   * @returns the byte index
   */
  private getByteIndex(bitIndex: number, zeroIndex: 'lowest' | 'highest') {
    if (zeroIndex === 'lowest') {
      return Math.floor(bitIndex / 8)
    } else {
      return this.#data.length - 1 - Math.floor(bitIndex / 8)
    }
  }

  /**
   * get the bit offset in the byte
   * @param byteIndex the byte index
   * @param zeroIndex
   * @returns the bit offset in the byte
   */
  private getBitOffsetInByte(byteIndex: number, zeroIndex: 'lowest' | 'highest') {
    if (zeroIndex === 'lowest') {
      return byteIndex % 8
    } else {
      return 7 - (byteIndex % 8)
    }
  }

  /**
   * print the bit array as a binary string, e.g. 0101 0101
   * @returns
   */
  toString(): string {
    return this.#data.reduce((prev, curr) => prev + curr.toString(2).padStart(8, '0'), '')
  }

  toIntString(): string {
    return this.toBigInt().toString()
  }

  toHexString(): string {
    return BytesUtil.bytes2HexStr(this.#data)
  }

  /**
   * return a index array include the index of the different bits
   * @param other
   */
  diff(other: BitArray): number[] {
    // if the length of the bit array is not equal, throw an error
    if (this.length !== other.length) {
      throw new Error(`the length of the bit array is not equal, diff failed`)
    }
    const diffIndex: number[] = []
    for (let i = 0; i < this.length; i++) {
      if (this.get(i) !== other.get(i)) {
        diffIndex.push(i)
      }
    }
    return diffIndex
  }
}
