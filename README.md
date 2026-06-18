# AgentBridge

Private remote control for local AI coding agents.

AgentBridge lets you read conversations, send messages, switch models, inspect active work, and manage threads from a phone, tablet, or another computer. It is designed for a self-hosted workflow: the server runs on your machine next to the coding agent, and the web client connects directly to that server.

AgentBridge currently supports Codex and OpenCode.

Hosted static frontend:

```text
https://agentbridge-8q9.pages.dev
```

## Project Status

AgentBridge is an independent open-source fork of [Farfield](https://github.com/achimala/farfield). The original project was created by [Anshu Chimala](https://github.com/achimala) and is licensed under MIT. This fork keeps that license and attribution while continuing development around private multi-device access.

This project is not affiliated with, endorsed by, or sponsored by OpenAI, Codex, OpenCode, Tailscale, or the original Farfield project.

## Features

- Thread browser grouped by project and worktree
- Chat view with model, reasoning, and plan-mode controls
- Live activity updates and turn interruption
- Archived and hidden thread views
- Multi-Mac connection profiles stored locally in the browser
- Optional per-server access key
- PWA-ready frontend for phone home-screen installs
- Tailscale-friendly HTTPS remote access

## Security Model

AgentBridge does not route your conversations through a hosted relay. The browser talks directly to the AgentBridge server URL you configure.

Important constraints:

- The server can read and control local coding-agent sessions on the machine where it runs.
- Do not expose the server directly to the public internet.
- Put remote access behind a private network such as Tailscale.
- Set `AGENTBRIDGE_ACCESS_KEY` when the server is reachable from another device.
- Connection profiles and access keys are stored in the current browser's `localStorage`; they are not bundled into the static web app.

## Quick Start From Source

Requirements:

- Node.js 20+
- Bun 1.2+
- Codex or OpenCode installed locally

Clone and install:

```bash
git clone https://github.com/KAMIENDER/agentbridge.git
cd agentbridge
bun install
```

Run the local development app:

```bash
bun run dev
```

This starts:

- backend on `127.0.0.1:4311`
- frontend on `127.0.0.1:4312`

Open:

```text
http://127.0.0.1:4312
```

## Server Only

Run just the server:

```bash
bun run server
```

Pick agent providers:

```bash
bun run server -- --agents=codex
bun run server -- --agents=opencode
bun run server -- --agents=codex,opencode
bun run server -- --agents=all
```

## Production Mode

Build once and run the server and frontend preview:

```bash
bun run build
bun run start
```

Use a custom backend origin for the frontend proxy:

```bash
AGENTBRIDGE_API_ORIGIN=http://127.0.0.1:4311 bun run start
```

`FARFIELD_API_ORIGIN` is still accepted as a legacy alias during the fork transition.

## Remote Access With Tailscale

Install Tailscale on your Mac and phone, then log both devices into the same tailnet.

Start the AgentBridge server on the Mac:

```bash
AGENTBRIDGE_ACCESS_KEY='replace-with-a-long-random-secret' \
HOST=127.0.0.1 \
PORT=4311 \
bun run --filter @agentbridge/server dev
```

Expose the local server only inside your tailnet:

```bash
tailscale serve --https=443 http://127.0.0.1:4311
tailscale serve status
```

Tailscale will give you a URL like:

```text
https://<machine>.<tailnet>.ts.net
```

Open the AgentBridge web client on your phone, go to **Settings**, and save:

- server URL: `https://<machine>.<tailnet>.ts.net`
- access key: the value from `AGENTBRIDGE_ACCESS_KEY`

Repeat this for each Mac. The **Profiles** tab lets one browser switch between saved Macs.

Legacy compatibility:

- `FARFIELD_ACCESS_KEY` and `FARFIELD_AUTH_KEY` are still accepted.
- `X-Farfield-Access-Key` is still accepted by the server.

## Useful Commands

```bash
bun run --filter @agentbridge/web typecheck
REACT_COMPILER=0 PWA_ENABLED=1 bun run --filter @agentbridge/web build
bun run --workspaces test
```

Frontend build flags:

- `REACT_COMPILER=0` disables React Compiler for the build.
- `REACT_PROFILING=1` enables the React profiling build.
- `PWA_ENABLED=0` disables service-worker generation.
- `DISABLE_RATE_LIMITS=1` hides quota/rate-limit UI for compatible backends that do not expose those endpoints.

## Roadmap

- A stable custom domain for the hosted static frontend
- Published npm packages under the `@agentbridge` scope
- Clear setup scripts for macOS launchd
- Better onboarding for multiple Macs and mobile PWA installs
- Hardening around access-key setup and profile export/import

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md). Please do not publish secrets, access keys, tailnet names, or machine URLs in issues.

## License

MIT. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).
