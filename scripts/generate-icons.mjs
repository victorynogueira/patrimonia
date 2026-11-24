import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function icon(size) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(size * stride);
  const radius = size * 0.22;
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      const dx = Math.max(radius - x, x - (size - 1 - radius), 0);
      const dy = Math.max(radius - y, y - (size - 1 - radius), 0);
      const inside = dx * dx + dy * dy <= radius * radius;
      const i = y * stride + 1 + x * 4;
      if (!inside) { raw[i + 3] = 0; continue; }
      const t = (x + y) / (2 * size);
      const r = Math.round(99 - 40 * t);
      const g = Math.round(102 - 46 * t);
      const b = Math.round(241 - 55 * t);
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = 255;

      const nx = x / size, ny = y / size;
      const bar = nx > 0.29 && nx < 0.385 && ny > 0.24 && ny < 0.76;
      const outer = (nx - 0.465) ** 2 + (ny - 0.4) ** 2 < 0.155 ** 2;
      const inner = (nx - 0.465) ** 2 + (ny - 0.4) ** 2 > 0.075 ** 2;
      if (bar || (outer && inner && nx > 0.4)) { raw[i] = 255; raw[i + 1] = 255; raw[i + 2] = 255; }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
for (const [file, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["maskable-512.png", 512], ["apple-touch-icon.png", 180]]) {
  writeFileSync(`public/icons/${file}`, icon(size));
  console.log(`gerado public/icons/${file}`);
}
