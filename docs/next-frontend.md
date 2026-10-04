# Next.js frontend and Oracle signaling server

PairDrop now has a Next.js App Router frontend at the repository root. The existing Node/Express/WebSocket implementation in `server/` remains the signaling and WebRTC relay backend.

## Local development

Run the frontend and signaling server in separate terminals (use different ports):

```bash
PORT=3001 npm run start
NEXT_PUBLIC_SIGNALING_SERVER=localhost:3001 npm run dev
```

The frontend calls `/config` through the Next route at `app/config/route.ts`. With no signaling server configured, it connects to the current host. To point the frontend at an Oracle backend, set `NEXT_PUBLIC_SIGNALING_SERVER` to the backend host and path without a protocol, for example:

```bash
NEXT_PUBLIC_SIGNALING_SERVER=pairdrop.example.com npm run build
npm run frontend:start
```

The browser derives `ws://` or `wss://` from the page protocol and connects to the backend's `/server` WebSocket endpoint.

## Deploying

- Deploy the root Next.js application to Vercel with `npm run build` as the build command and `npm run frontend:start` for self-hosted production runs.
- Run the signaling backend on Oracle with Node 18.18+ using `BACKEND_ONLY=true npm run start:prod` (or `npm run start` for a basic process). `BACKEND_ONLY=true` keeps the Oracle process focused on `/server`, `/config`, and `/health` while the Next app owns the user interface.
- Configure `NEXT_PUBLIC_SIGNALING_SERVER` in Vercel to the public Oracle hostname. Configure TLS and proxy WebSocket upgrades on the Oracle host so `wss://<host>/server` reaches the Node process.
- When the backend is separate from the frontend, set `ALLOWED_ORIGINS` on Oracle to a comma-separated list such as `https://sharebka.vercel.app,https://sharebka.com`. This restricts backend GET endpoints and WebSocket handshakes to those browser origins; leave it unset only for local development.

### Reverse proxy and room isolation

The signaling server uses the socket's address by default. Set `TRUST_PROXY=true` only when every request reaches Node through a proxy that overwrites `X-Forwarded-For`; set `TRUST_CF_CONNECTING_IP=true` as well when Cloudflare supplies the client address. Do not expose a proxy-trusting Node port directly to the internet, otherwise a client can spoof IP rooms.

For a Cloudflare Tunnel or Nginx deployment, forward WebSocket upgrades to `/server` and keep the public URL path unchanged. If the proxy cannot preserve client IPs, use PairDrop public rooms or paired room secrets instead of relying on local IP discovery.

The bundled coturn compose profile uses Linux host networking so Docker does not create one port-forward rule for every UDP relay port. Open the coturn listening and relay ranges in the Oracle security list and host firewall; use a narrower `min-port`/`max-port` range when the expected TURN concurrency is bounded.

The original `public/` assets and runtime modules are still used by the browser runtime, while the page shell, metadata, `/config` endpoint, and asset loading are managed by Next.js.
