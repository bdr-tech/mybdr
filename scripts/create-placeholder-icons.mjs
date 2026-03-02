/**
 * placeholder 아이콘 생성 스크립트
 * 최종 디자인 완료 전 PWA 설정 검증용 임시 아이콘을 생성합니다.
 * 실행: node scripts/create-placeholder-icons.mjs
 *
 * ⚠️  최종 아이콘은 Aria 디자인 완료 후 동일 경로로 교체하세요.
 */

import { createWriteStream, mkdirSync } from "fs";
import { deflateSync } from "zlib";

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (~c) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf), 0);
  return Buffer.concat([len, t, data, crc]);
}

/**
 * 단색 PNG 생성 (RGB)
 * @param {number} size - 픽셀 크기 (정사각형)
 * @param {number} r - Red
 * @param {number} g - Green
 * @param {number} b - Blue
 * @returns {Buffer} PNG 바이너리
 */
function createSolidPNG(size, r, g, b) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // pixel data: filter byte(0) + RGB per row
  const rowSize = 1 + size * 3;
  const raw = Buffer.alloc(size * rowSize);
  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const off = y * rowSize + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }

  const compressed = deflateSync(raw, { level: 6 });

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG signature
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// #0066FF = 0, 102, 255
const [R, G, B] = [0, 102, 255];

mkdirSync("public/icons", { recursive: true });

const icons = [
  { name: "icon-192x192.png",    size: 192 },
  { name: "icon-512x512.png",    size: 512 },
  { name: "maskable-192x192.png",size: 192 },
  { name: "maskable-512x512.png",size: 512 },
  { name: "apple-touch-icon.png",size: 180 },
];

for (const { name, size } of icons) {
  const png = createSolidPNG(size, R, G, B);
  const ws = createWriteStream(`public/icons/${name}`);
  ws.write(png);
  ws.end();
  console.log(`✅ public/icons/${name} (${size}x${size}px, #0066FF placeholder)`);
}

console.log("\n⚠️  이 파일들은 임시 placeholder입니다.");
console.log("   최종 아이콘은 Aria 디자인 완료 후 동일 경로로 교체하세요.");
