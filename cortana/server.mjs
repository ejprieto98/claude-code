// Zero-dependency server for Cortana.
// Serves ./public and issues short-lived WebRTC conversation tokens so the
// ElevenLabs API key never reaches the browser.
//
//   ELEVENLABS_API_KEY=... node server.mjs   (PORT defaults to 3000)

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const AGENT_ID = process.env.ELEVENLABS_AGENT_ID || "agent_5101m774rf25fjtvs1xx8sh99e5y";
const API_KEY = process.env.ELEVENLABS_API_KEY;
const PORT = Number(process.env.PORT) || 3000;
const ROOT = fileURLToPath(new URL("./public/", import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" };

const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
};

async function conversationToken(res) {
  if (!API_KEY) return json(res, 404, { error: "No API key configured; client will use the public agent ID." });
  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(AGENT_ID)}`,
      { headers: { "xi-api-key": API_KEY } },
    );
    if (!r.ok) return json(res, 502, { error: `ElevenLabs returned ${r.status}` });
    const { token } = await r.json();
    return json(res, 200, { token });
  } catch (err) {
    return json(res, 502, { error: "Token request failed" });
  }
}

const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  if (pathname === "/api/conversation-token" && req.method === "GET") return conversationToken(res);
  if (pathname === "/healthz") return json(res, 200, { ok: true });

  const rel = normalize(decodeURIComponent(pathname === "/" ? "/index.html" : pathname)).replace(/^([/\\]|\.\.[/\\])+/, "");
  const file = join(ROOT, rel);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  try {
    const data = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Cortana running at http://localhost:${PORT} (${API_KEY ? "token mode" : "public agent mode"})`);
});
