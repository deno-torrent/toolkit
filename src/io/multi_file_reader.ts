/**
 * MultiFileReader — reads multiple files as a single contiguous byte stream.
 *
 * @example
 * ```ts
 * const reader = new MultiFileReader(['a.bin', 'b.bin', 'c.bin']);
 * let chunk: Uint8Array | null;
 * while ((chunk = await reader.readChunk(512)) !== null) {
 *   // process chunk…
 * }
 * reader.close();
 * ```
 * @module
 */

import { SimpleBuffer } from './simple_buffer.ts'

/**
 * Presents an ordered list of files as a single readable byte stream.
 *
 * File handles are opened lazily and closed as soon as their EOF is reached,
 * so only one handle is open at a time.
 *
 * ### Read primitives
 * | Method | Description |
 * |---|---|
 * | {@link MultiFileReader.read} | Low-level; fills a caller-supplied buffer, may cross to the next file transparently. |
 * | {@link MultiFileReader.readChunk} | High-level; returns exactly `length` bytes, crossing file boundaries as needed. |
 */
export class MultiFileReader {
  readonly #files: string[]
  #fileIndex = 0
  #currentFile: Deno.FsFile | null = null
  #eof = false
  /** Accumulator used by readChunk across multiple read() calls. */
  readonly #accumulator = new SimpleBuffer()

  /**
   * @param files - Ordered list of file paths to read through.
   * @throws {RangeError} If `files` is empty.
   */
  constructor(files: string[]) {
    if (files.length === 0) throw new RangeError('files must not be empty')
    this.#files = [...files]
  }

  // ---------------------------------------------------------------------------
  // Low-level read
  // ---------------------------------------------------------------------------

  /**
   * Reads bytes into `p`, advancing through files transparently at each EOF.
   *
   * Follows the `Deno.Reader` contract: returns the number of bytes placed
   * into `p`, or `null` when every file has been fully consumed.
   *
   * @param p - Destination buffer.
   * @returns Number of bytes written into `p`, or `null` at end-of-stream.
   */
  async read(p: Uint8Array): Promise<number | null> {
    if (this.#eof) return null
    if (p.length === 0) return 0

    // Open current file lazily.
    if (this.#currentFile === null) {
      this.#currentFile = await Deno.open(this.#files[this.#fileIndex], { read: true })
    }

    const n = await this.#currentFile.read(p)

    if (n === null) {
      // Current file exhausted — close it and advance to the next.
      this.#currentFile.close()
      this.#currentFile = null
      this.#fileIndex++

      if (this.#fileIndex >= this.#files.length) {
        this.#eof = true
        return null
      }

      return this.read(p)
    }

    return n
  }

  // ---------------------------------------------------------------------------
  // High-level chunk read
  // ---------------------------------------------------------------------------

  /**
   * Collects exactly `length` bytes, spanning file boundaries as needed.
   *
   * If the remaining bytes across all files sum to less than `length`, the
   * partial data already accumulated is returned. Returns `null` only when the
   * entire stream was already exhausted before this call.
   *
   * @param length - Desired chunk size in bytes (must be a positive integer).
   * @returns A `Uint8Array` of at most `length` bytes, or `null` at EOS.
   * @throws {RangeError} If `length` is not a positive integer.
   */
  async readChunk(length: number): Promise<Uint8Array | null> {
    if (!Number.isInteger(length) || length <= 0) {
      throw new RangeError(`length must be a positive integer, got ${length}`)
    }

    if (this.#eof && !this.#accumulator.hasNext()) return null

    const tmp = new Uint8Array(length)

    while (this.#accumulator.length < length) {
      const n = await this.read(tmp)

      if (n === null) {
        // Stream ended — return whatever accumulated bytes remain.
        return this.#accumulator.hasNext()
          ? this.#accumulator.readBytes(this.#accumulator.length)
          : null
      }

      this.#accumulator.write(tmp.subarray(0, n))
    }

    return this.#accumulator.readBytes(length)
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Closes any currently open file handle.
   *
   * Should be called when you stop reading before the stream is naturally
   * exhausted, to avoid leaking OS file descriptors.
   */
  close(): void {
    if (this.#currentFile !== null) {
      try {
        this.#currentFile.close()
      } catch {
        // Already closed — ignore.
      }
      this.#currentFile = null
    }
  }

  /**
   * Resets the reader back to the beginning of the first file.
   *
   * The currently open file handle (if any) is closed and the internal
   * accumulator is cleared.
   */
  reset(): void {
    this.close()
    this.#fileIndex = 0
    this.#eof = false
    this.#accumulator.reset()
  }
}
