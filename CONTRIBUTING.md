# Contributing

Thanks for helping improve AgentBridge.

## Development

```bash
bun install
bun run dev
```

Useful checks:

```bash
bun run --filter @agentbridge/web typecheck
REACT_COMPILER=0 PWA_ENABLED=1 bun run --filter @agentbridge/web build
bun run --workspaces test
```

## Pull Requests

- Keep changes focused.
- Do not include personal access keys, tailnet names, machine URLs, or local conversation contents.
- Prefer draft PRs for larger UI or protocol changes.
- Mention the agent provider tested, such as Codex, OpenCode, or both.

## Compatibility

The project is transitioning from Farfield naming to AgentBridge naming. Keep legacy `FARFIELD_*` environment variables and `X-Farfield-Access-Key` compatibility unless there is a clear migration plan.
