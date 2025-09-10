// gerar_flyer.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// === CONFIGURAÇÃO DO LAYOUT ==================================
const CANVAS_W = 1080;
const CANVAS_H = 1350;

// círculo da foto
const FOTO_SIZE = 545;
const FOTO_X = (CANVAS_W - FOTO_SIZE) / 2;
const FOTO_Y = 254;

// posição do nome
const NOME_Y = 910;
const NOME_MAX_FONT = 64;
const NOME_MIN_FONT = 36;
const NOME_COLOR = "#1f2937"; // cinza escuro

// =============================================================

async function gerarFlyer({ nome, fotoBufferOrPath, outPath = null }) {
  if (!nome) throw new Error("É necessário fornecer um nome.");
  if (!fotoBufferOrPath)
    throw new Error("É necessário fornecer fotoBuffer ou fotoPath");

  // carrega foto
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

  // calcula tamanho da fonte dinamicamente
  const idealByLength = Math.max(
    NOME_MIN_FONT,
    Math.min(NOME_MAX_FONT, Math.floor(700 / Math.max(nome.length, 10)))
  );

  // carrega a fonte como base64
  const fontPath = path.join(__dirname, "assets", "fonts", "Poppins-Bold.ttf");
  const fontData = fs.readFileSync(fontPath).toString("base64");

  // SVG do nome com a fonte embutida
  const svgNome = Buffer.from(
    `<svg width="${CANVAS_W}" height="${CANVAS_H}">
      <style>
        @font-face {
          font-family: 'PoppinsBold';
          src: url('data:font/ttf;base64,${fontData}') format('truetype');
          font-weight: bold;
        }
        .nome {
          font-family: 'PoppinsBold';
          font-weight: bold;
          fill: ${NOME_COLOR};
        }
      </style>
      <text x="${CANVAS_W / 2}" y="${NOME_Y}" font-size="${idealByLength}" class="nome"
  text-anchor="middle" dominant-baseline="middle">
  <![CDATA[${nome}]]>
</text>

    </svg>`
  );

  // caminho do flyer base
  const base = path.join(__dirname, "assets", "fotos", "flyer_base.png");
  console.log("🛠️ Caminho do flyer_base:", base);

  // checa se o arquivo existe
  if (!fs.existsSync(base)) {
    throw new Error(`⚠️ Arquivo flyer_base.png não encontrado em: ${base}`);
  }

  // compõe flyer final
  let finalBuffer = await sharp(base)
    .composite([
      { input: fotoCircular, left: Math.round(FOTO_X), top: Math.round(FOTO_Y) },
      { input: svgNome, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  // salva em disco se pedir
  if (outPath) {
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
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

// === TESTE LOCAL =============================================
if (require.main === module) {
  (async () => {
    try {
      const out = path.resolve(__dirname, "out/flyer_teste.png");
      await gerarFlyer({
        nome: "José Antônio Ávila",   // 👈 coloca acento aqui para testar
        fotoBufferOrPath: path.resolve(__dirname, "testes/exemplo.jpg"),
        outPath: out,
      });
      console.log("✅ Flyer gerado em:", out);
    } catch (err) {
      console.error("❌ Erro ao gerar flyer:", err);
    }
  })();
}

