# Security Policy

AgentBridge controls local AI coding-agent sessions on the machine where the server runs. Treat the server URL and access key like credentials.

## Supported Setup

- Run the server on `127.0.0.1`.
- Use Tailscale or another private VPN for remote access.
- Set `AGENTBRIDGE_ACCESS_KEY` before connecting from another device.
- Store one different access key per Mac when possible.

## Not Supported

- Exposing the server directly to the public internet.
- Sharing a server URL or access key in public issues, logs, screenshots, or chat transcripts.
- Treating the static frontend as an authentication boundary. It is only a client.

## Reporting

Open a private report if GitHub security advisories are enabled for the repository. If not, open a minimal public issue that describes the impact without including secrets, machine names, tailnet names, or working exploit details.
