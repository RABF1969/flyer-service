const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// === CONFIGURAÇÃO DO LAYOUT ================================================
// tamanho do flyer base
const CANVAS_W = 1080;
const CANVAS_H = 1350; // se o seu PNG for 1080x1080, mude para 1080

// círculo da foto
const FOTO_SIZE = 535; // diâmetro da foto
const FOTO_X = (CANVAS_W - FOTO_SIZE) / 2;
const FOTO_Y = 260; // distância do topo

// texto do nome
const NOME_Y = 910;
const NOME_MAX_FONT = 64;
const NOME_MIN_FONT = 36;
const NOME_COLOR = "#1f2937"; // cinza escuro (tailwind gray-800)
const NOME_FONT = "Poppins, Inter, Arial, Helvetica, sans-serif";

// ===========================================================================

async function gerarFlyer({ nome, fotoPath, outPath }) {
  // 1) carrega e recorta a foto em círculo
  const fotoBuffer = await sharp(fotoPath)
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

  // 2) calcula tamanho de fonte proporcional ao nome
  const idealByLength = Math.max(
    NOME_MIN_FONT,
    Math.min(NOME_MAX_FONT, Math.floor(700 / Math.max(nome.length, 10)))
  );

  // 3) cria SVG com o nome centralizado + sombra
  const svgNome = Buffer.from(
    `<svg width="${CANVAS_W}" height="${CANVAS_H}">
      <style>
        .nome {
          font-family: ${NOME_FONT};
          font-weight: 700;
          fill: ${NOME_COLOR};
          text-shadow: 2px 2px 4px rgba(0,0,0,0.4);
        }
      </style>
      <text x="${CANVAS_W / 2}" y="${NOME_Y}" font-size="${idealByLength}" class="nome"
        text-anchor="middle" dominant-baseline="middle">
        ${escapeXml(nome)}
      </text>
    </svg>`
  );

  // 4) carrega flyer base e compõe com foto + texto
  const base = path.resolve(__dirname, "assets/flyer_base.png");
  const finalBuffer = await sharp(base)
    .composite([
      { input: fotoCircular, left: Math.round(FOTO_X), top: Math.round(FOTO_Y) },
      { input: svgNome, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  // 5) salva saída
  if (!fs.existsSync(path.resolve(__dirname, "out"))) {
    fs.mkdirSync(path.resolve(__dirname, "out"));
  }
  fs.writeFileSync(outPath, finalBuffer);
  return outPath;
}

// utilzinho pra escapar caracteres especiais
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = gerarFlyer;
