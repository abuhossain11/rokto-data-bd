import fs from 'fs';
import zlib from 'zlib';

// Minimal pure-JS PNG generator for solid-color / themed PNGs
function createPNG(width, height, r, g, b, a = 255) {
  const rowLength = width * 4 + 1;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      // Draw a circular badge in the middle
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const radius = width * 0.44;

      if (dist <= radius) {
        // Red gradient
        const t = (y / height);
        rawData[pixelOffset] = Math.round(220 * (1 - t * 0.3));     // R: 220 -> 154
        rawData[pixelOffset + 1] = Math.round(38 * (1 - t * 0.5));  // G: 38 -> 19
        rawData[pixelOffset + 2] = Math.round(38 * (1 - t * 0.5));  // B: 38 -> 19
        rawData[pixelOffset + 3] = 255;

        // White cross in center
        const crossW = width * 0.08;
        const crossH = height * 0.35;
        const inVert = Math.abs(x - cx) < crossW && Math.abs(y - cy) < crossH;
        const inHoriz = Math.abs(y - cy) < crossW && Math.abs(x - cx) < crossH;
        if (inVert || inHoriz) {
          rawData[pixelOffset] = 255;
          rawData[pixelOffset + 1] = 255;
          rawData[pixelOffset + 2] = 255;
          rawData[pixelOffset + 3] = 255;
        }
      } else {
        // Transparent outer or white border
        rawData[pixelOffset] = 255;
        rawData[pixelOffset + 1] = 255;
        rawData[pixelOffset + 2] = 255;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(4 + 4 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

fs.writeFileSync('./public/pwa-192x192.png', createPNG(192, 192, 220, 38, 38));
fs.writeFileSync('./public/pwa-512x512.png', createPNG(512, 512, 220, 38, 38));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createPNG(512, 512, 220, 38, 38));
fs.writeFileSync('./public/apple-touch-icon.png', createPNG(180, 180, 220, 38, 38));
fs.writeFileSync('./public/favicon.ico', createPNG(64, 64, 220, 38, 38));

console.log('PWA PNG Icons generated successfully.');
