// gerar_flyer.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// === CONFIGURAÇÃO DO LAYOUT ==================================
const CANVAS_W = 1080;
const CANVAS_H = 1350;

// círculo da foto
const FOTO_SIZE = 535;
const FOTO_X = (CANVAS_W - FOTO_SIZE) / 2;
const FOTO_Y = 260;

// nome
const NOME_Y = 910;
const NOME_MAX_FONT = 64;
const NOME_MIN_FONT = 36;
const NOME_COLOR = "#1f2937";
const NOME_FONT = "Poppins, Inter, Arial, Helvetica, sans-serif";
// =============================================================

async function gerarFlyer({ nome, fotoBufferOrPath, outPath }) {
  let fotoBuffer;

  if (Buffer.isBuffer(fotoBufferOrPath)) {
    // já veio pronto (fetch remoto)
    fotoBuffer = fotoBufferOrPath;
  } else if (typeof fotoBufferOrPath === "string") {
    // veio caminho do arquivo (teste local)
    fotoBuffer = await sharp(fotoBufferOrPath)
      .resize(FOTO_SIZE, FOTO_SIZE, { fit: "cover" })
      .toBuffer();
  } else {
    throw new Error("fotoBufferOrPath inválido.");
  }

  // cria máscara circular
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

  // calcula fonte pelo tamanho do nome
  const idealByLength = Math.max(
    NOME_MIN_FONT,
    Math.min(NOME_MAX_FONT, Math.floor(700 / Math.max(nome.length, 10)))
  );

  // SVG do nome
  const svgNome = Buffer.from(
    `<svg width="${CANVAS_W}" height="${CANVAS_H}">
      <style>
        .nome {
          font-family: ${NOME_FONT};
          font-weight: 700;
          fill: ${NOME_COLOR};
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
      </style>
      <text x="${CANVAS_W / 2}" y="${NOME_Y}" font-size="${idealByLength}" class="nome"
        text-anchor="middle" dominant-baseline="middle">
        ${escapeXml(nome)}
      </text>
    </svg>`
  );

  // junta no flyer base
  const base = path.resolve(__dirname, "assets/flyer_base.png");
  const finalBuffer = await sharp(base)
    .composite([
      { input: fotoCircular, left: Math.round(FOTO_X), top: Math.round(FOTO_Y) },
      { input: svgNome, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  // salva no disco (se for teste local)
  if (outPath) {
    if (!fs.existsSync(path.dirname(outPath))) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
    }
    fs.writeFileSync(outPath, finalBuffer);
  }

  return finalBuffer;
}

// escape de caracteres especiais
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = { gerarFlyer };

// === Teste local =============================================
// rode: node gerar_flyer.js
if (require.main === module) {
  (async () => {
    try {
      const out = await gerarFlyer({
        nome: "Maria Clara",
        fotoBufferOrPath: path.resolve(__dirname, "assets/fotos/exemplo.jpg"),
        outPath: path.resolve(__dirname, "out/flyer_final.png"),
      });
      console.log("✅ Flyer gerado:", out.length, "bytes");
    } catch (err) {
      console.error("❌ Erro no teste local:", err);
    }
  })();
}
