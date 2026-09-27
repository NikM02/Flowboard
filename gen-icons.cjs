const sharp = require("sharp");

const CROWN = "M256 392 L164 196 L218 322 L256 120 L294 322 L348 196 Z";

function svg() {
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#161616"/>
      <stop offset="100%" stop-color="#0a0a0a"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="58%" r="55%">
      <stop offset="0%" stop-color="#f5c842" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#f5c842" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffefad"/>
      <stop offset="45%" stop-color="#f7c948"/>
      <stop offset="100%" stop-color="#d99a12"/>
    </linearGradient>
    <linearGradient id="jewel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#ffe9ad"/>
    </linearGradient>
    <clipPath id="cp"><path d="${CROWN}"/></clipPath>
  </defs>

  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="256" cy="298" r="210" fill="url(#glow)"/>

  <g transform="translate(0 6)">
    <path d="${CROWN}" fill="#b97808" fill-opacity="0.45" stroke="#b97808" stroke-opacity="0.45" stroke-width="34" stroke-linejoin="round"/>
  </g>

  <path d="${CROWN}" fill="url(#gold)" stroke="url(#gold)" stroke-width="34" stroke-linejoin="round"/>
  <clipPath id="cp2"><path d="M256 392 L164 196 L218 322 L256 120 L294 322 L348 196 Z" stroke-width="34" stroke-linejoin="round"/></clipPath>

  <rect x="146" y="376" width="220" height="30" rx="15" fill="url(#gold)"/>

  <polygon points="282,234 256,270 230,234 256,198" fill="url(#jewel)"/>
  <circle cx="248" cy="224" r="6" fill="#ffffff" fill-opacity="0.9"/>

  <g clip-path="url(#cp)" opacity="0.9">
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <rect x="100" y="100" width="312" height="150" fill="url(#sheen)"/>
  </g>
</svg>`;
}

async function gen() {
  const sizes = [
    [512, "public/favicon-512.png"],
    [192, "public/icon-192.png"],
    [180, "public/apple-touch-icon.png"],
    [128, "public/King.png"],
    [32, "public/favicon-32.png"],
  ];
  for (const [size, file] of sizes) {
    await sharp(Buffer.from(svg()), { density: 384 }).resize(size, size).png().toFile(file);
    console.log("wrote", file, size);
  }
}
gen().catch((e) => { console.error(e); process.exit(1); });