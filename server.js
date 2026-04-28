import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(express.json({ limit: "2mb" }));

// ── CORS for Vite dev (localhost:5173) ─────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Ollama-Endpoint");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ── Proxy endpoint ─────────────────────────────────────────────────────────
function normalizeOllamaEndpoint(value) {
  const endpoint = String(value || "https://ollama.com/v1").trim().replace(/\/+$/, "");
  return endpoint.replace(/\/api\/v1$/i, "/v1");
}

app.post(["/api/ollama", "/proxy/ollama/chat/completions"], async (req, res) => {
  const rawEndpoint = req.headers["x-ollama-endpoint"] || "https://ollama.com/v1";
  const endpoint = normalizeOllamaEndpoint(rawEndpoint);
  const targetUrl = `${endpoint}/chat/completions`;

  console.log(`[proxy] → ${targetUrl}  model=${req.body?.model ?? "?"}`);

  try {
    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers["authorization"]
          ? { Authorization: req.headers["authorization"] }
          : {}),
      },
      body: JSON.stringify(req.body),
    });

    if (req.body?.stream && upstream.body) {
      console.log(`[proxy] stream ${upstream.status}`);
      res.status(upstream.status);
      res.setHeader("Content-Type", upstream.headers.get("content-type") || "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      const reader = upstream.body.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        return res.end();
      } catch (streamErr) {
        console.error("[proxy] stream error:", streamErr.message);
        return res.end();
      }
    }

    const text = await upstream.text();
    console.log(`[proxy] ← ${upstream.status}`);

    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    res.send(text);
  } catch (err) {
    console.error("[proxy] fetch error:", err.message);
    res.status(502).json({ error: "proxy_fetch_failed", detail: err.message });
  }
});

app.post("/api/sami-token", async (req, res) => {
  const clientId = process.env.SAMI_CLIENT_ID || "newsm";
  const clientSecret = process.env.SAMI_CLIENT_SECRET;
  const { code, redirect_uri } = req.body || {};

  if (!clientSecret) {
    return res.status(503).json({ error: "Sami ID no está configurado en este despliegue." });
  }
  if (!code || !redirect_uri) {
    return res.status(400).json({ error: "code y redirect_uri son obligatorios." });
  }

  try {
    const tokenRes = await fetch("https://auth.samilososami.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri,
      }),
    });
    const token = await tokenRes.json();
    if (!tokenRes.ok) return res.status(tokenRes.status).json(token);

    const meRes = await fetch("https://auth.samilososami.com/api/me", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const user = await meRes.json();
    if (!meRes.ok) return res.status(meRes.status).json(user);

    return res.json({ access_token: token.access_token, expires_in: token.expires_in, user });
  } catch (err) {
    return res.status(502).json({ error: "sami_id_exchange_failed", detail: err.message });
  }
});

// ── Serve built frontend (production) ────────────────────────────────────
const distPath = join(__dirname, "dist");
app.use(express.static(distPath));
app.use((_req, res) => res.sendFile(join(distPath, "index.html")));

// ── Start ─────────────────────────────────────────────────────────────────
createServer(app).listen(PORT, () => {
  console.log(`NEW STEAMMAKERS proxy + server  →  http://localhost:${PORT}`);
});
