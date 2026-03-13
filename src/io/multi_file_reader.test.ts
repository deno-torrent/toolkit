import { assertEquals, assertRejects } from '@std/assert'
import { MultiFileReader } from '../../mod.ts'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Creates a temp file with the given bytes and returns its path. */
async function tmpFile(bytes: Uint8Array): Promise<string> {
  const f = await Deno.makeTempFile()
  await Deno.writeFile(f, bytes)
  return f
}

/** Collects all bytes from a MultiFileReader.read() loop. */
async function readAll(reader: MultiFileReader): Promise<Uint8Array> {
  const chunks: Uint8Array[] = []
  const p = new Uint8Array(16)
  let n: number | null
  while ((n = await reader.read(p)) !== null) {
    chunks.push(p.slice(0, n))
  }
  const total = chunks.reduce((s, c) => s + c.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    result.set(c, offset)
    offset += c.length
  }
  return result
}

// ── Constructor ───────────────────────────────────────────────────────────────

Deno.test('MultiFileReader - throws on empty file list', () => {
  let threw = false
  try {
    new MultiFileReader([])
  } catch (e) {
    threw = e instanceof RangeError
  }
  assertEquals(threw, true)
})

// ── read() ────────────────────────────────────────────────────────────────────

Deno.test('MultiFileReader.read - single file', async () => {
  const path = await tmpFile(new Uint8Array([1, 2, 3, 4, 5]))
  try {
    const reader = new MultiFileReader([path])
    const data = await readAll(reader)
    assertEquals(data, new Uint8Array([1, 2, 3, 4, 5]))
  } finally {
    await Deno.remove(path)
  }
})

Deno.test('MultiFileReader.read - multiple files concatenated', async () => {
  const f1 = await tmpFile(new Uint8Array([1, 2, 3]))
  const f2 = await tmpFile(new Uint8Array([4, 5]))
  const f3 = await tmpFile(new Uint8Array([6]))
  try {
    const reader = new MultiFileReader([f1, f2, f3])
    const data = await readAll(reader)
    assertEquals(data, new Uint8Array([1, 2, 3, 4, 5, 6]))
  } finally {
    await Deno.remove(f1)
    await Deno.remove(f2)
    await Deno.remove(f3)
  }
})

Deno.test('MultiFileReader.read - returns null at EOS twice', async () => {
  const path = await tmpFile(new Uint8Array([42]))
  try {
    const reader = new MultiFileReader([path])
    await readAll(reader)
    const p = new Uint8Array(1)
    assertEquals(await reader.read(p), null)
    assertEquals(await reader.read(p), null)
  } finally {
    await Deno.remove(path)
  }
})

Deno.test('MultiFileReader.read - zero-length p returns 0', async () => {
  const path = await tmpFile(new Uint8Array([1]))
  try {
    const reader = new MultiFileReader([path])
    assertEquals(await reader.read(new Uint8Array(0)), 0)
  } finally {
    await Deno.remove(path)
  }
})

// ── readChunk() ───────────────────────────────────────────────────────────────

Deno.test('MultiFileReader.readChunk - exact chunk spanning files', async () => {
  const f1 = await tmpFile(new Uint8Array([1, 2, 3]))  // 3 bytes
  const f2 = await tmpFile(new Uint8Array([4, 5]))     // 2 bytes
  try {
    const reader = new MultiFileReader([f1, f2])
    assertEquals(await reader.readChunk(3), new Uint8Array([1, 2, 3]))
    assertEquals(await reader.readChunk(2), new Uint8Array([4, 5]))
    assertEquals(await reader.readChunk(1), null)
  } finally {
    await Deno.remove(f1)
    await Deno.remove(f2)
  }
})

Deno.test('MultiFileReader.readChunk - chunk larger than remaining data', async () => {
  const path = await tmpFile(new Uint8Array([10, 20, 30]))
  try {
    const reader = new MultiFileReader([path])
    // Ask for 10 but only 3 available — returns partial
    const chunk = await reader.readChunk(10)
    assertEquals(chunk, new Uint8Array([10, 20, 30]))
    assertEquals(await reader.readChunk(1), null)
  } finally {
    await Deno.remove(path)
  }
})

Deno.test('MultiFileReader.readChunk - returns null on exhausted stream', async () => {
  const path = await tmpFile(new Uint8Array([1]))
  try {
    const reader = new MultiFileReader([path])
    await reader.readChunk(1)
    assertEquals(await reader.readChunk(1), null)
  } finally {
    await Deno.remove(path)
  }
})

Deno.test('MultiFileReader.readChunk - throws on non-positive length', async () => {
  const path = await tmpFile(new Uint8Array([1]))
  try {
    const reader = new MultiFileReader([path])
    await assertRejects(() => reader.readChunk(0), RangeError)
    await assertRejects(() => reader.readChunk(-1), RangeError)
  } finally {
    await Deno.remove(path)
  }
})

// ── reset() ───────────────────────────────────────────────────────────────────

Deno.test('MultiFileReader.reset - re-reads from beginning', async () => {
  const path = await tmpFile(new Uint8Array([7, 8, 9]))
  const reader = new MultiFileReader([path])
  try {
    assertEquals(await reader.readChunk(3), new Uint8Array([7, 8, 9]))
    assertEquals(await reader.readChunk(1), null)
    reader.reset()
    assertEquals(await reader.readChunk(3), new Uint8Array([7, 8, 9]))
  } finally {
    reader.close()
    await Deno.remove(path)
  }
})

// ── close() ───────────────────────────────────────────────────────────────────

Deno.test('MultiFileReader.close - can call multiple times safely', async () => {
  const path = await tmpFile(new Uint8Array([1, 2]))
  try {
    const reader = new MultiFileReader([path])
    const p = new Uint8Array(1)
    await reader.read(p)  // opens the file
    reader.close()
    reader.close()        // second close must not throw
  } finally {
    await Deno.remove(path)
  }
})
