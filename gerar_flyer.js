// gerar_flyer.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

/* ============================
   LAYOUT / AJUSTES VISUAIS
   ============================ */
const CANVAS_W = 1080;
const CANVAS_H = 1350; // se sua base for 1080x1080, troque para 1080

// Foto circular (centralizada). Ajuste fino aqui se precisar:
const FOTO_SIZE = 535;                          // diâmetro do círculo
const FOTO_X = Math.round((CANVAS_W - FOTO_SIZE) / 2);
const FOTO_Y = 260;                             // distância do topo ao círculo

// Texto do nome (sem faixa). Ajuste vertical e tamanho máximo:
const NOME_Y = 880;                             // posição vertical do nome
const NOME_MAX_FONT = 68;                       // tamanho máx
const NOME_MIN_FONT = 36;                       // tamanho min
const NOME_COLOR = "#1f2937";                   // gray-800
const NOME_OUTLINE = "rgba(0, 0, 0, 0.25)";     // contorno/sombra
const NOME_OUTLINE_WIDTH = 2;                   // espessura do contorno

// Fonte TTF embutida no SVG (Data URI)
const FONT_PATH = path.resolve(__dirname, "assets/fonts/Poppins-Bold.ttf");
let FONT_DATA_BASE64 = null;
try {
  FONT_DATA_BASE64 = fs.readFileSync(FONT_PATH).toString("base64");
} catch (e) {
  console.warn(
    "⚠️  Fonte TTF não encontrada em",
    FONT_PATH,
    "\n    O SVG ainda funcionará, mas pode cair em Arial/Helvetica."
  );
}

/* ============================
   FUNÇÃO PRINCIPAL
   ============================ */
/**
 * Gera um flyer a partir de uma foto (buffer ou caminho) e um nome.
 * @param {Object} params
 * @param {string} params.nome - Nome a ser renderizado
 * @param {Buffer|string} params.fotoBufferOrPath - Buffer da foto OU caminho do arquivo
 * @param {string|null} [params.outPath] - Caminho para salvar (opcional). Se omitido, retorna apenas Buffer
 * @returns {Promise<Buffer>}
 */
async function gerarFlyer({ nome, fotoBufferOrPath, outPath = null }) {
  if (!nome) {
    throw new Error("É necessário fornecer o nome.");
  }
  if (!fotoBufferOrPath) {
    throw new Error("É necessário fornecer fotoBuffer ou fotoPath");
  }

  // 1) Resolve foto (buffer)
  let fotoBuffer;
  if (Buffer.isBuffer(fotoBufferOrPath)) {
    fotoBuffer = fotoBufferOrPath;
  } else if (typeof fotoBufferOrPath === "string") {
    // caminho local
    fotoBuffer = fs.readFileSync(fotoBufferOrPath);
  } else {
    throw new Error("fotoBufferOrPath inválido (não é Buffer nem string de caminho).");
  }

  // 2) Redimensiona e recorta circular
  const resized = await sharp(fotoBuffer)
    .resize(FOTO_SIZE, FOTO_SIZE, { fit: "cover" })
    .toBuffer();

  const maskSVG = Buffer.from(
    `<svg width="${FOTO_SIZE}" height="${FOTO_SIZE}">
       <circle cx="${FOTO_SIZE / 2}" cy="${FOTO_SIZE / 2}" r="${FOTO_SIZE / 2}" fill="white"/>
     </svg>`
  );

  const fotoCircular = await sharp(resized)
    .composite([{ input: maskSVG, blend: "dest-in" }])
    .png()
    .toBuffer();

  // 3) Calcula um tamanho de fonte aproximado pelo comprimento do nome
  const idealFont = Math.max(
    NOME_MIN_FONT,
    Math.min(NOME_MAX_FONT, Math.floor(700 / Math.max(nome.length, 10)))
  );

  // 4) Monta SVG com fonte embutida (+ contorno tipo “stroke” para dar definição)
  const fontFace = FONT_DATA_BASE64
    ? `
      @font-face {
        font-family: 'PoppinsEmbed';
        src: url('data:font/ttf;base64,${FONT_DATA_BASE64}') format('truetype');
        font-weight: 700;
        font-style: normal;
      }`
    : "";

  const svgNome = Buffer.from(
    `<svg width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          ${fontFace}
          .nome {
            font-family: ${FONT_DATA_BASE64 ? "PoppinsEmbed" : "Poppins"}, Arial, Helvetica, sans-serif;
            font-weight: 700;
            fill: ${NOME_COLOR};
            /* leve contorno para destacar sobre fundos claros */
            paint-order: stroke;
            stroke: ${NOME_OUTLINE};
            stroke-width: ${NOME_OUTLINE_WIDTH}px;
          }
        </style>
      </defs>
      <text x="${CANVAS_W / 2}" y="${NOME_Y}" font-size="${idealFont}" class="nome"
        text-anchor="middle" dominant-baseline="middle">${escapeXml(nome)}</text>
    </svg>`
  );

  // 5) Composição final sobre a base
  const basePath = path.resolve(__dirname, "assets/flyer_base.png");
  const finalBuffer = await sharp(basePath)
    .composite([
      { input: fotoCircular, left: FOTO_X, top: FOTO_Y },
      { input: svgNome, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  if (outPath) {
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outPath, finalBuffer);
  }
  return finalBuffer;
}

/* ============================
   HELPERS
   ============================ */
function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ============================
   CLI TESTE (node gerar_flyer.js)
   ============================ */
if (require.main === module) {
  (async () => {
    try {
      const out = path.resolve(__dirname, "out/flyer_final.png");
      console.log("🧪 Gerando flyer de teste...");
      await gerarFlyer({
        nome: "Maria Clara",
        fotoBufferOrPath: path.resolve(__dirname, "assets/fotos/exemplo.jpg"),
        outPath: out,
      });
      console.log("✅ Flyer gerado em:", out);
    } catch (err) {
      console.error("❌ Erro no teste:", err);
      process.exit(1);
    }
  })();
}

module.exports = { gerarFlyer };
