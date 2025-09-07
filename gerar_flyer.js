// src/gerar_flyer.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// ======= LAYOUT =======
const CANVAS_W = 1080;
const CANVAS_H = 1350;

const FOTO_SIZE = 535;
const FOTO_X = Math.round((CANVAS_W - FOTO_SIZE) / 2);
const FOTO_Y = 260;

const NOME_Y = 910;
const NOME_MAX_FONT = 64;
const NOME_MIN_FONT = 36;
const NOME_COLOR = "#1f2937";
const NOME_FONT = "Poppins, Inter, Arial, Helvetica, sans-serif";

// util para SVG seguro
function escapeXml(unsafe = "") {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function gerarFlyer({ nome, fotoBufferOrPath, outPath }) {
  // 1) carregar a foto (de buffer ou caminho)
  let fotoSharp = sharp(
    Buffer.isBuffer(fotoBufferOrPath)
      ? fotoBufferOrPath
      : fs.readFileSync(fotoBufferOrPath)
  ).resize(FOTO_SIZE, FOTO_SIZE, { fit: "cover" });

  const fotoBuffer = await fotoSharp.toBuffer();

  // máscara circular
  const mask = Buffer.from(
    `<svg width="${FOTO_SIZE}" height="${FOTO_SIZE}">
       <circle cx="${FOTO_SIZE / 2}" cy="${FOTO_SIZE / 2}" r="${FOTO_SIZE / 2}" fill="white"/>
     </svg>`
  );

  const fotoCircular = await sharp(fotoBuffer)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  // tamanho de fonte com fallback pelo comprimento
  const idealFont = Math.max(
    NOME_MIN_FONT,
    Math.min(NOME_MAX_FONT, Math.floor(700 / Math.max(String(nome).length, 10)))
  );

  // SVG com o nome + leve sombra para legibilidade
  const svgNome = Buffer.from(
    `<svg width="${CANVAS_W}" height="${CANVAS_H}">
      <style>
        .nome {
          font-family: ${NOME_FONT};
          font-weight: 700;
          fill: ${NOME_COLOR};
          text-shadow: 0 2px 4px rgba(0,0,0,0.25);
        }
      </style>
      <text x="${CANVAS_W / 2}" y="${NOME_Y}" font-size="${idealFont}" class="nome"
        text-anchor="middle" dominant-baseline="middle">
        ${escapeXml(nome)}
      </text>
    </svg>`
  );

  // base
  const base = path.resolve(__dirname, "../assets/flyer_base.png");

  const finalBuffer = await sharp(base)
    .composite([
      { input: fotoCircular, left: FOTO_X, top: FOTO_Y },
      { input: svgNome, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  if (outPath) {
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, finalBuffer);
  }

  return finalBuffer;
}

module.exports = { gerarFlyer };
