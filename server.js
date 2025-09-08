// gerar_flyer.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const CANVAS_W = 1080;
const CANVAS_H = 1350;
const FOTO_SIZE = 535;
const FOTO_X = (CANVAS_W - FOTO_SIZE) / 2;
const FOTO_Y = 260;

const NOME_Y = 910;
const NOME_FONT = "Poppins, Inter, Arial, Helvetica, sans-serif";
const NOME_COLOR = "#1f2937";

async function gerarFlyer({ nome, fotoBuffer, fotoPath, outPath }) {
  let fotoBufferFinal;

  if (fotoBuffer) {
    fotoBufferFinal = await sharp(fotoBuffer)
      .resize(FOTO_SIZE, FOTO_SIZE, { fit: "cover" })
      .toBuffer();
  } else if (fotoPath) {
    fotoBufferFinal = await sharp(fotoPath)
      .resize(FOTO_SIZE, FOTO_SIZE, { fit: "cover" })
      .toBuffer();
  } else {
    throw new Error("É necessário fornecer fotoBuffer ou fotoPath");
  }

  const mask = Buffer.from(
    `<svg width="${FOTO_SIZE}" height="${FOTO_SIZE}">
       <circle cx="${FOTO_SIZE / 2}" cy="${FOTO_SIZE / 2}" r="${FOTO_SIZE / 2}" fill="white"/>
     </svg>`
  );

  const fotoCircular = await sharp(fotoBufferFinal)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const svgNome = Buffer.from(
    `<svg width="${CANVAS_W}" height="${CANVAS_H}">
      <style>
        .nome {
          font-family: ${NOME_FONT};
          font-weight: 700;
          font-size: 64px;
          fill: ${NOME_COLOR};
          text-shadow: 2px 2px 4px rgba(0,0,0,0.4);
        }
      </style>
      <text x="${CANVAS_W / 2}" y="${NOME_Y}" class="nome"
        text-anchor="middle" dominant-baseline="middle">
        ${escapeXml(nome)}
      </text>
    </svg>`
  );

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
    return outPath;
  }
  return finalBuffer;
}

function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = { gerarFlyer };
