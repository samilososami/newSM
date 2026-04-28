export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

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
    return res.status(502).json({
      error: "sami_id_exchange_failed",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
