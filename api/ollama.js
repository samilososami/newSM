function normalizeOllamaEndpoint(value) {
  const endpoint = String(value || "https://ollama.com/v1").trim().replace(/\/+$/, "");
  return endpoint.replace(/\/api\/v1$/i, "/v1");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Ollama-Endpoint");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const endpoint = normalizeOllamaEndpoint(req.headers["x-ollama-endpoint"]);
  const targetUrl = `${endpoint}/chat/completions`;

  try {
    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
      body: JSON.stringify(req.body),
    });

    if (req.body?.stream && upstream.body) {
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
      } catch {
        return res.end();
      }
    }

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.send(text);
  } catch (err) {
    return res.status(502).json({
      error: "ollama_proxy_fetch_failed",
      detail: err instanceof Error ? err.message : String(err),
      target: targetUrl,
    });
  }
}
