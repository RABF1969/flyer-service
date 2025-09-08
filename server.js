// server.js
const express = require("express");
const fetch = require("node-fetch");
const { gerarFlyer } = require("./gerar_flyer");

const app = express();

// Rota de teste (health check)
app.get("/", (_req, res) => {
  res.send("🚀 Flyer Service rodando!");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/**
 * GET /api/generate?nome=Maria%20Clara&foto_url=https://.../foto.jpg
 * Exemplo:
 *   https://flyer.seuservidor.com/api/generate?nome=Maria%20Clara&foto_url=https://.../foto.png
 */
app.get("/api/generate", async (req, res) => {
  try {
    const nome = (req.query.nome || "").toString().trim();
    const fotoUrl = (req.query.foto_url || "").toString().trim();

    if (!nome) {
      return res.status(400).json({ error: "Parametro 'nome' é obrigatório." });
    }
    if (!fotoUrl) {
      return res.status(400).json({ error: "Parametro 'foto_url' é obrigatório." });
    }

    // baixa a foto
    const response = await fetch(fotoUrl);
    if (!response.ok) {
      return res.status(400).json({ error: "Não foi possível baixar a foto." });
    }
    const fotoBuffer = Buffer.from(await response.arrayBuffer());

    // gera flyer em memória
    const buffer = await gerarFlyer({
      nome,
      fotoBufferOrPath: fotoBuffer,
      outPath: null
    });

    // devolve como imagem PNG
    const filename = `${nome.replace(/\s+/g, "_")}_flyer.png`;
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");

    return res.send(buffer);
  } catch (err) {
    console.error("❌ Erro em /api/generate:", err);
    return res.status(500).json({ error: "Falha ao gerar flyer." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Flyer Service ouvindo em :${PORT}`);
});
