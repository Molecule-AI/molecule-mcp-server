# molecule-mcp-server

TypeScript MCP server that exposes the Molecule AI agent platform as tools via the Model Context Protocol (MCP).

## Project Overview

This server acts as a bridge between MCP clients (e.g., Claude Desktop, other MCP-compatible hosts) and the Molecule AI platform. It registers platform capabilities as MCP tools so agents can interact with the platform natively.

## Build and Test

```bash
# Install dependencies
npm install

# Build (TypeScript -> JS, output to dist/)
npm run build

# Run tests (Jest, config in jest.config.cjs)
npm test

# Type check without building
npm run lint    # if present
```

Watch mode for development:

```bash
npm run build -- --watch
```

## MCP Tool Conventions

All tools follow these conventions to ensure consistent behavior across the server.

### Naming

- Tool names: `snake_case` (e.g., `list_workspaces`, `create_agent`)
- Resource names: `camelCase` prefixed by type (e.g., `workspace:default`)
- Always use present tense imperatives for actions (list, create, delete, not `listing`)

### Error Codes

Use structured errors with known codes — never throw plain strings:

| Code | Meaning |
|------|---------|
| `TOOL_NOT_FOUND` | Tool/resource name not registered |
| `INVALID_ARGUMENTS` | Arguments failed schema validation |
| `PLATFORM_ERROR` | Upstream platform API error |
| `AUTH_ERROR` | Authentication/authorization failure |
| `RATE_LIMITED` | Platform rate limit hit |
| `INTERNAL_ERROR` | Unexpected server-side failure |

All tool responses wrap errors in the MCP `error` shape — never return error text as a plain string in `content`.

### Streaming Behavior

- If a tool supports streaming, declare it in the tool manifest
- Stream results incrementally via `ContentBlock` chunks — do not buffer and return all at once
- On cancellation, stop emitting and close the stream cleanly (no half-written responses)

### Tool Schema

Every tool must have a JSON Schema (Draft 7) `inputSchema`. Keep it minimal — only expose parameters the server actually uses. Do not mirror the full platform API surface if MCP does not need it.

## Release Process

Releases are automated via GitHub Actions on every tag matching `v*`.

### Cutting a Release

```bash
# Make sure you're on main and all tests pass
git checkout main
git pull

# Bump version in package.json, commit
vim package.json
git add package.json
git commit -m "chore: bump version to x.y.z"

# Tag and push
git tag vx.y.z
git push origin main --tags
```

The workflow:
1. Pushes `v*` tag → triggers `publish.yml` workflow
2. Workflow runs `npm install`, `npm run build`, `npm test`
3. On success: publishes to npm (`npm publish --access public`)
4. Creates a GitHub Release with the tag

**Do not publish manually.** Let the tag push flow handle it.

## Platform Integration

### APIs Connected

The server connects to the Molecule AI platform REST API. See the platform SDK (`../molecule-sdk-python`) for the underlying API client used.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MOLECULE_API_URL` | Yes | Base URL of the Molecule platform API |
| `MOLECULE_API_KEY` | Yes | API key for platform authentication |
| `MCP_SERVER_PORT` | No | Port to run the MCP server on (default: `3000`) |

For local development, copy `.env.example` → `.env` and fill in values.

### Postgres

Platform data lives in Postgres (source of truth). The server reads data via the platform SDK — it does not connect to Postgres directly.

## TypeScript Conventions

### Async Patterns

- Use `async`/`await` throughout — no `.then()` chains except for bridging legacy callback code
- Every handler function is `async`
- Never use `void` async functions unless the MCP spec explicitly requires fire-and-forget

### Error Handling

- Never `console.log` user-facing errors — use structured logging and return MCP errors
- Wrap every tool handler in a `try/catch`; catch errors and re-throw as MCP-structured errors
- Avoid non-Error throws (numbers, strings) — always throw or return `Error` instances

### Typing Standards

- Strict mode is enabled (`"strict": true` in `tsconfig.json`)
- Avoid `any` — use `unknown` and narrow with type guards or Zod validators
- Use `zod` for all external input validation (API args, tool schemas)
- Export types from `src/types/` for shared interfaces

### File Structure

```
src/
  index.ts          # Server entry point
  tools/            # MCP tool implementations
  types/            # Shared TypeScript types
  utils/            # Helpers, validators
```

## Known Issues

**File a GitHub issue first — do not silently patch known problems.**

Before opening an issue, check:
- The [open issues](https://github.com/Molecule-AI/molecule-mcp-server/issues)
- The platform constraints in `docs/development/constraints-and-rules.md`
- Any relevant cron learnings in `.claude/cron-learnings.md`

## Artifact: test.txt

There is a leftover artifact file `test.txt` in the repo root (5 bytes, content: `"test"`). Delete it before any commit:

```bash
rm test.txt
git add test.txt
git commit -m "chore: remove test artifact"
```
