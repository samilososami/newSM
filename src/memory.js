const MEMORY_KEY = "new-steammakers:ai-memory:v1";

let cache = null;

function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}");
  } catch {
    cache = {};
  }
  return cache;
}

function save() {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(cache || {}));
}

export function memoryGet(key, fallback = null) {
  return load()[key] ?? fallback;
}

export function memorySet(key, value) {
  if (value === undefined || value === null || value === "") return;
  load()[key] = String(value);
  save();
}

export function memoryDelete(key) {
  delete load()[key];
  save();
}

export function memoryClear() {
  cache = {};
  save();
}

export function memoryGetAll() {
  return { ...load() };
}

const TOKEN_PATTERN = /\b(\d{8,12}:[A-Za-z0-9_-]{20,})\b/;
const CREDENTIAL_WORDS = "(?:clave|password|contrasena|contrase\\S*a)";

function extractWifiSsid(text) {
  const source = String(text || "");
  const patterns = [
    new RegExp(`\\b(?:mi\\s+)?(?:wifi|wi-fi|ssid|red)\\s*(?:es|se\\s+llama|llamada|llamado|:|=)?\\s*["']?([^"',.;\\n]+?)["']?(?=\\s+(?:con\\s+)?${CREDENTIAL_WORDS}\\b|[.;,\\n]|$)`, "i"),
    /\b(?:wifi|wi-fi|ssid|red)\s*[:=]\s*["']?([^"',.;\n]+?)["']?(?=[.;,\n]|$)/i,
  ];
  for (const pattern of patterns) {
    const ssid = source.match(pattern)?.[1]?.trim();
    if (ssid && !/^(es|se|llama|llamada|llamado)$/i.test(ssid) && !/clave|password|contrase/i.test(ssid)) {
      return ssid;
    }
  }
  return null;
}

function extractWifiPassword(text) {
  const source = String(text || "");
  const patterns = [
    new RegExp(`\\b${CREDENTIAL_WORDS}\\s+(?:wifi|wi-fi)?\\s*(?:es)?\\s*["']?([^"',.;\\s\\n]{1,64})["']?`, "i"),
    new RegExp(`\\b${CREDENTIAL_WORDS}\\s*[:=]\\s*["']?([^"',.;\\s\\n]{1,64})["']?`, "i"),
  ];
  for (const pattern of patterns) {
    const password = source.match(pattern)?.[1]?.trim();
    if (password) return password;
  }
  return null;
}

export function autoExtractMemory(text) {
  const source = String(text || "");
  const changes = [];

  const token = source.match(TOKEN_PATTERN)?.[1];
  if (token) {
    memorySet("telegram_token", token);
    changes.push("token Telegram");
  }

  const ssid = extractWifiSsid(source);
  if (ssid) {
    memorySet("wifi_ssid", ssid);
    changes.push("SSID WiFi");
  }

  const password = extractWifiPassword(source);
  if (password) {
    memorySet("wifi_password", password);
    changes.push("clave WiFi");
  }

  const chatId = source.match(/\b(?:chat\s*id|id\s*telegram|chat)\s*(?:es|:|=)?\s*(-?\d{5,14})\b/i)?.[1];
  if (chatId) {
    memorySet("telegram_chat_id", chatId);
    changes.push("chat ID Telegram");
  }

  return changes;
}

export function buildMemoryContext() {
  const memory = load();
  const labels = {
    telegram_token: "Token Telegram",
    telegram_chat_id: "Chat ID Telegram",
    wifi_ssid: "SSID WiFi",
    wifi_password: "Clave WiFi",
  };
  const lines = Object.entries(memory)
    .filter(([, value]) => value)
    .map(([key, value]) => `${labels[key] || key}: ${value}`);

  if (!lines.length) return "";
  return `MEMORIA PERSISTENTE DEL USUARIO:
${lines.join("\n")}

Usa estos valores cuando el usuario pida WiFi, Telegram u otros proyectos que los necesiten. Si el usuario da un valor nuevo, el valor nuevo tiene prioridad.`;
}
