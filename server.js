// server.js
const express = require("express");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { gerarFlyer } = require("./gerar_flyer");

const app = express();

// rota básica de saúde
app.get("/", (_req, res) => {
  res.type("text/html").send("🚀 Flyer Service rodando!");
});

app.get("/health", (_req, res) => res.json({ ok: true }));

/**
 * GET /api/generate?nome=Maria%20Clara&foto_url=https://.../foto.png
 * Parametros obrigatórios:
 *   - nome
 *   - foto_url
 * Opcional:
 *   - download=1 (força download do arquivo)
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

    // baixa a foto remota
    const response = await fetch(fotoUrl, { timeout: 15000 });
    if (!response.ok) {
      return res.status(400).json({ error: "Não foi possível baixar a foto." });
    }
    const fotoBuffer = Buffer.from(await response.arrayBuffer());

    // gera flyer
    const buffer = await gerarFlyer({
      nome,
      fotoBufferOrPath: fotoBuffer,
      outPath: null, // não salvar em disco aqui
    });

    // cabeçalhos
    const filename = `${nome.replace(/\s+/g, "_")}_flyer.png`;
    if (req.query.download) {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    } else {
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    }
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");

    return res.send(buffer);
  } catch (err) {
    console.error("❌ Erro em /api/generate:", err);
    return res.status(500).json({ error: "Falha ao gerar flyer." });
  }
});

// porta (container expõe via Traefik)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Flyer Service ouvindo em :${PORT}`);
});
