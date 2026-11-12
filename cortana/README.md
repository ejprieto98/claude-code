# Cortana — ElevenLabs voice agent

Web client for the Cortana agent (`agent_5101m774rf25fjtvs1xx8sh99e5y`).

| Path | What it is |
| --- | --- |
| `public/index.html` | Full voice UI: WebRTC voice, live transcript, text chat |
| `public/widget.html` | Two-line embeddable ElevenLabs widget for any site |
| `server.mjs` | Node server with no dependencies: serves `public/` and `/api/conversation-token` |

## Run locally

```bash
cd cortana
node server.mjs                              # public agent
ELEVENLABS_API_KEY=xi-... node server.mjs    # private agent (WebRTC token)
```

Open http://localhost:3000. Browsers allow the microphone only on `localhost` or HTTPS.

## How auth works

The page calls `GET /api/conversation-token` first. If the server has
`ELEVENLABS_API_KEY`, it fetches a short-lived WebRTC token from ElevenLabs and
returns it. The key itself never reaches the browser. If no key is set, or the
page is hosted statically, the page falls back to connecting with the public
agent ID. That works only while the agent has authentication **off** in the
ElevenLabs dashboard.

## Deploy

- **Static (GitHub Pages, Netlify, Vercel static, S3):** publish `public/`. Requires a public agent.
- **Node host (Render, Railway, Fly.io, a VPS):** start with `node server.mjs`, set
  `ELEVENLABS_API_KEY` as a secret, and serve it over HTTPS. Health check: `/healthz`.
- **Embed on an existing site:** copy the two lines from `public/widget.html`.

## Recommended for production

- Turn on authentication for the agent and use token mode.
- Add your domain to the agent's allowlist in the ElevenLabs dashboard.
