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
const NOME_COLOR = "#1f2937";
const NOME_FONT = "Poppins, Inter, Arial, Helvetica, sans-serif";

async function gerarFlyer({ nome, fotoBufferOrPath, outPath }) {
  if (!nome) throw new Error("Nome é obrigatório.");
  if (!fotoBufferOrPath) throw new Error("É necessário fornecer fotoBuffer ou fotoPath");

  // detecta se veio buffer ou caminho
  let fotoInput;
  if (Buffer.isBuffer(fotoBufferOrPath)) {
    fotoInput = fotoBufferOrPath;
  } else if (typeof fotoBufferOrPath === "string") {
    fotoInput = path.resolve(fotoBufferOrPath);
  } else {
    throw new Error("fotoBufferOrPath deve ser Buffer ou caminho de arquivo");
  }

  const fotoBuffer = await sharp(fotoInput)
    .resize(FOTO_SIZE, FOTO_SIZE, { fit: "cover" })
    .toBuffer();

  const mask = Buffer.from(
    `<svg width="${FOTO_SIZE}" height="${FOTO_SIZE}">
       <circle cx="${FOTO_SIZE / 2}" cy="${FOTO_SIZE / 2}" r="${FOTO_SIZE / 2}" fill="white"/>
     </svg>`
  );

  const fotoCircular = await sharp(fotoBuffer)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const svgNome = Buffer.from(
    `<svg width="${CANVAS_W}" height="${CANVAS_H}">
      <style>
        .nome {
          font-family: ${NOME_FONT};
          font-weight: 700;
          fill: ${NOME_COLOR};
          text-shadow: 2px 2px 4px rgba(0,0,0,0.6);
        }
      </style>
      <text x="${CANVAS_W / 2}" y="${NOME_Y}" font-size="64"
        text-anchor="middle" dominant-baseline="middle" class="nome">
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
    if (!fs.existsSync(path.dirname(outPath))) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
    }
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
