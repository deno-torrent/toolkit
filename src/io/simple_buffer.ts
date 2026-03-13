/**
 * SimpleBuffer — a lightweight, synchronous, growable byte buffer backed by
 * native `Uint8Array`. No external dependencies.
 *
 * @example
 * ```ts
 * const buf = new SimpleBuffer();
 * buf.write(new Uint8Array([1, 2, 3, 4]));
 * console.log(buf.readByte());   // 1
 * console.log(buf.readBytes(2)); // Uint8Array [2, 3]
 * ```
 * @module
 */

/**
 * A lightweight, synchronous, growable byte buffer.
 *
 * Bytes are appended with {@link SimpleBuffer.write} and consumed from the
 * front with {@link SimpleBuffer.readByte} / {@link SimpleBuffer.readBytes}.
 */
export class SimpleBuffer {
  /** Internal storage; live data lives in `[#readPos, #writePos)`. */
  #buf: Uint8Array = new Uint8Array(64)
  #readPos = 0
  #writePos = 0

  // ---------------------------------------------------------------------------
  // Write
  // ---------------------------------------------------------------------------

  /**
   * Appends `data` to the end of the buffer.
   *
   * @param data - Bytes to append.
   */
  write(data: Uint8Array): void {
    this.#grow(data.length)
    this.#buf.set(data, this.#writePos)
    this.#writePos += data.length
  }

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  /**
   * Reads and consumes exactly `len` bytes from the front of the buffer.
   *
   * @param len - Number of bytes to consume.
   * @returns A new `Uint8Array` containing the bytes.
   * @throws {RangeError} When `len` is negative or greater than {@link length}.
   */
  readBytes(len: number): Uint8Array {
    if (len < 0) throw new RangeError(`len must be non-negative, got ${len}`)
    if (len === 0) return new Uint8Array(0)
    if (len > this.length) {
      throw new RangeError(
        `Cannot read ${len} bytes — buffer only has ${this.length}`,
      )
    }
    const result = this.#buf.slice(this.#readPos, this.#readPos + len)
    this.#readPos += len
    return result
  }

  /**
   * Reads and consumes a single byte from the front of the buffer.
   *
   * @returns Byte value in the range [0, 255].
   * @throws {RangeError} When the buffer is empty.
   */
  readByte(): number {
    if (this.length === 0) throw new RangeError('Cannot read from an empty buffer')
    return this.readBytes(1)[0]
  }

  // ---------------------------------------------------------------------------
  // Inspection
  // ---------------------------------------------------------------------------

  /**
   * Number of unread bytes currently held in the buffer.
   */
  get length(): number {
    return this.#writePos - this.#readPos
  }

  /**
   * `true` when at least one unread byte is available.
   */
  hasNext(): boolean {
    return this.length > 0
  }

  /**
   * Resets the buffer to an empty state, discarding all data.
   */
  reset(): void {
    this.#readPos = 0
    this.#writePos = 0
    this.#buf = new Uint8Array(64)
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Ensures space for `extra` more bytes, compacting or expanding as needed. */
  #grow(extra: number): void {
    const free = this.#buf.length - this.#writePos
    if (free >= extra) return

    // Compact first — shift live bytes to the front.
    if (this.#readPos > 0) {
      this.#buf.copyWithin(0, this.#readPos, this.#writePos)
      this.#writePos -= this.#readPos
      this.#readPos = 0
      if (this.#buf.length - this.#writePos >= extra) return
    }

    // Still not enough — allocate a larger buffer.
    const needed = this.#writePos + extra
    let newSize = Math.max(this.#buf.length * 2, 64)
    while (newSize < needed) newSize *= 2

    const next = new Uint8Array(newSize)
    next.set(this.#buf.subarray(0, this.#writePos))
    this.#buf = next
  }
}
