# toolkit

[![JSR](https://jsr.io/badges/@sloaix/toolkit)](https://jsr.io/@sloaix/toolkit)
[![CI](https://github.com/sloaix/toolkit/actions/workflows/test.yml/badge.svg)](https://github.com/sloaix/toolkit/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[English](#english) | [中文](#中文)

---

## English

### Overview

`toolkit` is a pure-Deno utility library with **zero external dependencies**.
It provides low-level building blocks for bytes manipulation, encoding/decoding,
cryptographic hashing, I/O streaming, and network helpers — commonly needed when
building BitTorrent clients or other binary-protocol applications in Deno.

### Features

| Module | Exports | Description |
| --- | --- | --- |
| `bytes` | `BitArray`, `BytesUtil` | Bit-level array and byte helpers (XOR, chunking, conversion) |
| `encoding` | `EncodeUtil` | Base32 / Base64 / Hex encode-decode + format validators |
| `hash` | `HashUtil` | SHA-1, SHA-256, SHA-512 (Web Crypto API) + pure-TS MD5 |
| `io` | `SimpleBuffer`, `MultiFileReader` | Growable byte buffer and multi-file sequential reader |
| `net` | `NetUtil` | IPv4, port, domain validators and converters |

### Import

```ts
// From JSR (recommended for Deno 2)
import { BitArray, BytesUtil, EncodeUtil, HashUtil, MultiFileReader, NetUtil, SimpleBuffer } from 'jsr:@sloaix/toolkit'

// Or import individual sub-modules
import { HashUtil } from 'jsr:@sloaix/toolkit/src/hash/hash_util'
```

### Usage Examples

#### BitArray

```ts
import { BitArray } from 'jsr:@sloaix/toolkit'

const bits = BitArray.fromInt(0b10101010)
console.log(bits.toString())          // "10101010"
console.log(bits.get(7, 'highest'))   // false  (MSB → index 0)
console.log(bits.toHexString())       // "aa"

const a = BitArray.fromInt(0b10101010)
const b = BitArray.fromInt(0b01010101)
console.log(a.xor(b).toString())      // "11111111"
console.log(a.greaterThan(b))         // true
```

#### BytesUtil

```ts
import { BytesUtil } from 'jsr:@sloaix/toolkit'

// XOR two byte arrays
BytesUtil.xor(Uint8Array.from([0xaa, 0xbb]), Uint8Array.from([0x55, 0x44]))
// → Uint8Array [0xff, 0xff]

// Chunk a buffer into fixed-size pieces
BytesUtil.chunkBytes(new Uint8Array(8), 3)
// → [Uint8Array(3), Uint8Array(3), Uint8Array(2)]

// Round-trip conversions
BytesUtil.bytes2BinStr(new Uint8Array([0xaa]))  // "10101010"
BytesUtil.bytes2Int(new Uint8Array([0, 255]))    // 255
```

#### EncodeUtil

```ts
import { EncodeUtil } from 'jsr:@sloaix/toolkit'

EncodeUtil.isHexStr('deadbeef')                         // true
EncodeUtil.isSha1HexStr('da39a3ee5e6b4b0d3255bfef95601890afd80709') // true
EncodeUtil.encodeBase64(new TextEncoder().encode('hi')) // "aGk="
EncodeUtil.decodeBase64('aGk=')                         // Uint8Array [104, 105]
```

#### HashUtil

```ts
import { HashUtil } from 'jsr:@sloaix/toolkit'

const sha1 = await HashUtil.sha1('hello')
console.log(HashUtil.toHex(sha1))
// aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d

const sha256 = await HashUtil.sha256(new Uint8Array([1, 2, 3]))
console.log(HashUtil.toHex(sha256))
// 039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81

console.log(HashUtil.toHex(HashUtil.md5('hello')))
// 5d41402abc4b2a76b9719d911017c592
```

#### SimpleBuffer

```ts
import { SimpleBuffer } from 'jsr:@sloaix/toolkit'

const buf = new SimpleBuffer()
buf.write(new Uint8Array([1, 2, 3, 4, 5]))
console.log(buf.readByte())    // 1
console.log(buf.readBytes(2))  // Uint8Array [2, 3]
console.log(buf.length)        // 2
buf.reset()
```

#### MultiFileReader

```ts
import { MultiFileReader } from 'jsr:@sloaix/toolkit'

const reader = new MultiFileReader(['part1.bin', 'part2.bin', 'part3.bin'])

// Low-level: read into a buffer
const p = new Uint8Array(512)
let n: number | null
while ((n = await reader.read(p)) !== null) {
  process(p.subarray(0, n))
}

// Or: high-level — read fixed-size chunks across file boundaries
reader.reset()
let chunk: Uint8Array | null
while ((chunk = await reader.readChunk(16384)) !== null) {
  process(chunk)
}

reader.close()
```

#### NetUtil

```ts
import { NetUtil } from 'jsr:@sloaix/toolkit'

NetUtil.isIPv4Str('192.168.1.1')        // true
NetUtil.isWellKnownPort(80)             // true
NetUtil.ipv4Str2Bytes('10.0.0.1')       // Uint8Array [10, 0, 0, 1]
NetUtil.bytes2IPv4Str(new Uint8Array([127, 0, 0, 1]))  // "127.0.0.1"

const macs = await NetUtil.getMacAddr()
console.log(macs)  // e.g. ["aa:bb:cc:dd:ee:ff"]
```

### API Reference

#### `BitArray`

| Method / Property | Description |
| --- | --- |
| `BitArray.fromInt(n, len?)` | Create from a non-negative integer |
| `BitArray.fromBigInt(n, len?)` | Create from a non-negative `bigint` |
| `BitArray.fromBinaryString(s)` | Create from a binary string (`"0101..."`) |
| `BitArray.fromUnit8Array(arr)` | Create from a `Uint8Array` |
| `.length` | Total number of bits |
| `.bytes` | Underlying `Uint8Array` |
| `.get(i, dir?)` | Get bit at index (default dir: `'lowest'`) |
| `.set(i, v, dir?)` | Set bit at index |
| `.xor(other)` | Bitwise XOR, returns a new `BitArray` |
| `.equals(other)` | Equality check |
| `.greaterThan(other)` / `.lessThan(other)` | Comparison |
| `.diff(other)` | Returns indices where bits differ |
| `.toString()` | Binary string representation |
| `.toHexString()` | Hex string representation |
| `.toBigInt()` | `bigint` value |

#### `HashUtil`

| Method | Returns | Notes |
| --- | --- | --- |
| `sha1(data)` | `Promise<Uint8Array>` | 20 bytes, Web Crypto |
| `sha256(data)` | `Promise<Uint8Array>` | 32 bytes, Web Crypto |
| `sha512(data)` | `Promise<Uint8Array>` | 64 bytes, Web Crypto |
| `md5(data)` | `Uint8Array` | 16 bytes, pure TS (RFC 1321) |
| `toHex(digest)` | `string` | Lowercase hex encoding |

### Running Tests

```sh
deno task test
```

### License

[MIT](LICENSE) © sloaix

---

## 中文

### 概述

`toolkit` 是一个**零外部依赖**的纯 Deno 工具库。
提供字节处理、编解码、哈希计算、I/O 流读取和网络工具等基础模块，
适合构建 BitTorrent 客户端或其他二进制协议的 Deno 应用。

### 功能模块

| 模块 | 导出 | 说明 |
| --- | --- | --- |
| `bytes` | `BitArray`, `BytesUtil` | 位数组与字节工具（XOR、分块、进制转换） |
| `encoding` | `EncodeUtil` | Base32 / Base64 / Hex 编解码 + 格式校验 |
| `hash` | `HashUtil` | SHA-1、SHA-256、SHA-512（Web Crypto）+ 纯 TS 实现的 MD5 |
| `io` | `SimpleBuffer`, `MultiFileReader` | 可增长字节缓冲区 + 多文件顺序读取器 |
| `net` | `NetUtil` | IPv4、端口、域名校验与转换 |

### 导入方式

```ts
// 从 JSR 导入（Deno 2 推荐方式）
import { BitArray, BytesUtil, EncodeUtil, HashUtil, MultiFileReader, NetUtil, SimpleBuffer } from 'jsr:@sloaix/toolkit'
```

### 使用示例

#### BitArray — 位数组

```ts
import { BitArray } from 'jsr:@sloaix/toolkit'

const bits = BitArray.fromInt(0b10101010)
console.log(bits.toString())         // "10101010"
console.log(bits.get(7, 'highest'))  // false（从最高位 index 0 数起）

const a = BitArray.fromInt(0b10101010)
const b = BitArray.fromInt(0b01010101)
console.log(a.xor(b).toString())     // "11111111"
```

#### HashUtil — 哈希工具

```ts
import { HashUtil } from 'jsr:@sloaix/toolkit'

const digest = await HashUtil.sha1('hello')
console.log(HashUtil.toHex(digest))
// aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d

// 同步 MD5（纯 TS 实现）
console.log(HashUtil.toHex(HashUtil.md5('hello')))
// 5d41402abc4b2a76b9719d911017c592
```

#### MultiFileReader — 多文件顺序读取

```ts
import { MultiFileReader } from 'jsr:@sloaix/toolkit'

// 将多个文件视为一个连续字节流
const reader = new MultiFileReader(['part1.bin', 'part2.bin'])

let chunk: Uint8Array | null
while ((chunk = await reader.readChunk(16384)) !== null) {
  // 处理 chunk，自动跨文件边界读取
}

reader.close()
```

#### NetUtil — 网络工具

```ts
import { NetUtil } from 'jsr:@sloaix/toolkit'

NetUtil.isIPv4Str('192.168.1.1')  // true
NetUtil.isWellKnownPort(80)       // true
NetUtil.ipv4Str2Bytes('10.0.0.1') // Uint8Array [10, 0, 0, 1]
await NetUtil.getMacAddr()        // ["aa:bb:cc:dd:ee:ff"]
```

### API 文档

#### `BitArray` — 位数组 API

| 方法 / 属性 | 说明 |
| --- | --- |
| `BitArray.fromInt(n, len?)` | 从非负整数创建 |
| `BitArray.fromBigInt(n, len?)` | 从非负 `bigint` 创建 |
| `BitArray.fromBinaryString(s)` | 从二进制字符串创建 |
| `BitArray.fromUnit8Array(arr)` | 从 `Uint8Array` 创建 |
| `.get(i, dir?)` | 读取索引 `i` 处的位（方向默认 `'lowest'`） |
| `.set(i, v, dir?)` | 设置索引 `i` 处的位 |
| `.xor(other)` | 位异或，返回新的 `BitArray` |
| `.diff(other)` | 返回差异位的索引数组 |

#### `HashUtil` — 哈希 API

| 方法 | 返回值 | 说明 |
| --- | --- | --- |
| `sha1(data)` | `Promise<Uint8Array>` | 20 字节，基于 Web Crypto API |
| `sha256(data)` | `Promise<Uint8Array>` | 32 字节，基于 Web Crypto API |
| `sha512(data)` | `Promise<Uint8Array>` | 64 字节，基于 Web Crypto API |
| `md5(data)` | `Uint8Array` | 16 字节，纯 TypeScript 实现（RFC 1321） |
| `toHex(digest)` | `string` | 十六进制小写字符串 |

#### `SimpleBuffer`

| 方法 / 属性 | 说明 |
| --- | --- |
| `.write(data)` | 追加字节 |
| `.readBytes(len)` | 从头部消费 `len` 个字节 |
| `.readByte()` | 消费一个字节 |
| `.length` | 当前可读字节数 |
| `.hasNext()` | 是否还有未读字节 |
| `.reset()` | 清空缓冲区 |

#### `NetUtil`

| 方法 | 说明 |
| --- | --- |
| `isIPv4Str(ip)` | 校验是否为合法 IPv4 字符串 |
| `isIPv4Bytes(bytes)` | 校验是否为 IPv4 字节数组（4 字节） |
| `ipv4Str2Bytes(ip)` | IPv4 字符串转 `Uint8Array` |
| `bytes2IPv4Str(bytes)` | `Uint8Array` 转 IPv4 字符串 |
| `isNetPort(port)` | 校验端口范围 [0, 65535] |
| `isWellKnownPort(port)` | 知名端口 [0, 1023] |
| `isRegisteredPort(port)` | 注册端口 [1024, 49151] |
| `isDynamicPort(port)` | 动态端口 [49152, 65535] |
| `isDomain(domain)` | 校验域名格式 |
| `getMacAddr()` | 获取本机 MAC 地址列表 |

### 运行测试

```sh
deno task test
```

### 许可证

[MIT](LICENSE) © sloaix
