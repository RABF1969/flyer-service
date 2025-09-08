// gerar_flyer.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// === CONFIGURAÇÃO DO LAYOUT ================================================
const CANVAS_W = 1080;
const CANVAS_H = 1350;

const FOTO_SIZE = 535;
const FOTO_X = (CANVAS_W - FOTO_SIZE) / 2;
const FOTO_Y = 260;

const NOME_Y = 910;
const NOME_MAX_FONT = 64;
const NOME_MIN_FONT = 36;
const NOME_COLOR = "#1f2937";

// caminho da fonte local (🔥 coloque sua fonte em assets/fonts/)
const FONT_PATH = path.resolve(__dirname, "assets/fonts/Poppins-Bold.ttf");

// ===========================================================================

async function gerarFlyer({ nome, fotoBufferOrPath, outPath }) {
  // foto pode vir como Buffer ou como path
  let fotoBuffer;
  if (Buffer.isBuffer(fotoBufferOrPath)) {
    fotoBuffer = fotoBufferOrPath;
  } else {
    fotoBuffer = await sharp(fotoBufferOrPath)
      .resize(FOTO_SIZE, FOTO_SIZE, { fit: "cover" })
      .toBuffer();
  }

  // máscara circular
  const mask = Buffer.from(
    `<svg width="${FOTO_SIZE}" height="${FOTO_SIZE}">
       <circle cx="${FOTO_SIZE / 2}" cy="${FOTO_SIZE / 2}" r="${FOTO_SIZE / 2}" fill="white"/>
     </svg>`
  );

  const fotoCircular = await sharp(fotoBuffer)
    .resize(FOTO_SIZE, FOTO_SIZE, { fit: "cover" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  // calcula tamanho da fonte
  const idealByLength = Math.max(
    NOME_MIN_FONT,
    Math.min(NOME_MAX_FONT, Math.floor(700 / Math.max(nome.length, 10)))
  );

  // svg do texto com font-face embutido
  const svgNome = Buffer.from(
    `<svg width="${CANVAS_W}" height="${CANVAS_H}">
      <style>
        @font-face {
          font-family: 'PoppinsCustom';
          src: url('file://${FONT_PATH}');
        }
        .nome {
          font-family: 'PoppinsCustom';
          font-weight: bold;
          fill: ${NOME_COLOR};
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
      </style>
      <text x="${CANVAS_W / 2}" y="${NOME_Y}" font-size="${idealByLength}" class="nome"
        text-anchor="middle" dominant-baseline="middle">
        ${escapeXml(nome)}
      </text>
    </svg>`
  );

  // compor
  const base = path.resolve(__dirname, "assets/flyer_base.png");
  const finalBuffer = await sharp(base)
    .composite([
      { input: fotoCircular, left: Math.round(FOTO_X), top: Math.round(FOTO_Y) },
      { input: svgNome, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  if (outPath) {
    fs.writeFileSync(outPath, finalBuffer);
  }

  return finalBuffer;
}

function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = { gerarFlyer };
