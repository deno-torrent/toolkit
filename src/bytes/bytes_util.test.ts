import { assertEquals } from '@std/assert'
import { BytesUtil } from '../../mod.ts'

Deno.test('test Unit8Array xor', () => {
  assertEquals(BytesUtil.xor(Uint8Array.from([1, 2, 3]), Uint8Array.from([1, 2, 3])), Uint8Array.from([0, 0, 0]))
  assertEquals(BytesUtil.xor(Uint8Array.from([1, 2, 3]), Uint8Array.from([1, 2, 4])), Uint8Array.from([0, 0, 7]))
  assertEquals(BytesUtil.xor(Uint8Array.from([1, 2, 3]), Uint8Array.from([1, 2, 3, 4])), Uint8Array.from([0, 0, 0]))
  assertEquals(BytesUtil.xor(Uint8Array.from([1, 2, 3, 4]), Uint8Array.from([1, 2, 3])), Uint8Array.from([0, 0, 0]))
  assertEquals(BytesUtil.xor(Uint8Array.from([1, 2, 3]), Uint8Array.from([1, 2, 3, 4])), Uint8Array.from([0, 0, 0]))
  assertEquals(BytesUtil.xor(Uint8Array.from([1, 2, 3, 4]), Uint8Array.from([1, 2, 3])), Uint8Array.from([0, 0, 0]))
  assertEquals(
    BytesUtil.xor(Uint8Array.from([1, 2, 3, 4]), Uint8Array.from([1, 2, 3, 4])),
    Uint8Array.from([0, 0, 0, 0])
  )
  assertEquals(
    BytesUtil.xor(Uint8Array.from([1, 2, 3, 4]), Uint8Array.from([1, 2, 3, 5])),
    Uint8Array.from([0, 0, 0, 1])
  )
})

Deno.test('test distance', () => {
  assertEquals(Uint8Array.from([1, 1, 1, 1]) > Uint8Array.from([1, 1, 1, 2]), false)
  assertEquals(Uint8Array.from([1, 1, 1, 1]) > Uint8Array.from([1, 1, 1]), true)
})
