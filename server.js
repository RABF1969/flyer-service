const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const gerarFlyer = require("./gerar_flyer"); // importa a função que criamos

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(bodyParser.json());
app.use("/out", express.static(path.join(__dirname, "out"))); // serve os flyers gerados

// Rota de teste
app.get("/", (req, res) => {
  res.send("🚀 Flyer Service rodando!");
});

/**
 * POST /gerar-flyer
 * body esperado:
 * {
 *   "nome": "Maria Clara",
 *   "foto": "exemplo.jpg"
 * }
 */
app.post("/gerar-flyer", async (req, res) => {
  try {
    const { nome, foto } = req.body;

    if (!nome || !foto) {
      return res.status(400).json({ error: "Nome e foto são obrigatórios" });
    }

    const fotoPath = path.resolve(__dirname, "assets/fotos", foto);
    const outPath = path.resolve(
      __dirname,
      "out",
      `${nome.replace(/\s+/g, "_")}.png`
    );

    const file = await gerarFlyer({ nome, fotoPath, outPath });

    res.json({
      success: true,
      flyer: `/out/${path.basename(file)}`, // link público do flyer
    });
  } catch (err) {
    console.error("❌ Erro ao gerar flyer:", err);
    res.status(500).json({ error: "Erro interno ao gerar flyer" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Flyer Service rodando na porta ${PORT}`);
});
