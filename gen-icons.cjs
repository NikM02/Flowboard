const sharp = require("sharp");

const SRC = "/Users/nkm/Downloads/crown-7101074_1280.png";

async function main() {
  const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;

  // luminance per pixel
  const lum = new Uint8Array(W * H);
  for (let i = 0, p = 0; i < W * H; i++, p += 3) {
    lum[i] = (0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2]) | 0;
  }

  // flood fill background (cream, lum>=128) from borders -> crown = everything else
  const bg = new Uint8Array(W * H);
  const q = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    if (bg[i]) return;
    if (lum[i] < 128) { bg[i] = 2; return; } // hard foreground boundary (not bg)
    bg[i] = 1;
    q.push(i);
  };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (q.length) {
    const i = q.pop();
    const x = i % W, y = (i / W) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  const crown = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) crown[i] = 255 - bg[i] * 255;

  // tight bbox of crown (alpha > 12) with small padding
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = crown[y * W + x];
    if (a > 12) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  const pad = 8;
  const left = Math.max(0, minX - pad), top = Math.max(0, minY - pad);
  const width = Math.min(W, maxX - minX + 1 + pad * 2);
  const height = Math.min(H, maxY - minY + 1 + pad * 2);
  console.log("crown bbox", { left, top, width, height });

  // RGBA white + crown alpha
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const s = (top + y) * W + (left + x);
    const d = (y * width + x) * 4;
    rgba[d] = 255; rgba[d + 1] = 255; rgba[d + 2] = 255;
    rgba[d + 3] = crown[s];
  }

  const bgSvg = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" rx="${size * 0.22}" fill="#000000"/>
  </svg>`;

  const tasks = [];
  for (const [size, file] of [[512, "public/favicon-512.png"], [192, "public/icon-192.png"], [180, "public/apple-touch-icon.png"], [128, "public/King.png"], [32, "public/favicon-32.png"]]) {
    const scale = Math.min((size * 0.76) / width, (size * 0.76) / height);
    const dw = Math.round(width * scale), dh = Math.round(height * scale);
    // supersample 3x then downscale for smooth edges (no blur/linear)
    const crownImg = await sharp(rgba, { raw: { width, height, channels: 4 } })
      .resize(dw * 3, dh * 3, { fit: "fill", kernel: "lanczos3" })
      .resize(dw, dh, { fit: "fill", kernel: "lanczos3" })
      .png().toBuffer();
    const ox = Math.round((size - dw) / 2), oy = Math.round((size - dh) / 2);
    await sharp(Buffer.from(bgSvg(size))).png()
      .composite([{ input: crownImg, left: ox, top: oy }]).png().toFile(file);
    console.log("wrote", file, size, "crown px", dw + "x" + dh, "at", ox, oy);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });