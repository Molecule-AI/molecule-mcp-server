# Molecule AI MCP Server

MCP server that exposes Molecule AI platform operations as tools for AI coding agents (Claude Code, Cursor, Codex, OpenCode).

## Tools Available

The server registers **87 tools** across 12 categories. The previous README listed 20 — this section is regenerated from `src/tools/*.ts` to match the actual surface.

| Category | Source file | Count |
|----------|-------------|-------|
| Workspaces | `src/tools/workspaces.ts` | 8 |
| Agents | `src/tools/agents.ts` | 6 |
| Secrets | `src/tools/secrets.ts` | 6 |
| Files | `src/tools/files.ts` | 7 |
| Memory | `src/tools/memory.ts` | 9 |
| Plugins | `src/tools/plugins.ts` | 7 |
| Channels | `src/tools/channels.ts` | 8 |
| Delegation & Activity | `src/tools/delegation.ts` | 8 |
| Schedules | `src/tools/schedules.ts` | 6 |
| Approvals | `src/tools/approvals.ts` | 4 |
| Discovery & Org | `src/tools/discovery.ts` | 14 |
| Remote Agents | `src/tools/remote_agents.ts` | 4 |
| **Total** | | **87** |

### Workspaces

| Tool | Description | Key params |
|------|-------------|------------|
| `list_workspaces` | List all workspaces with their status, skills, and hierarchy | _(none)_ |
| `create_workspace` | Create a new workspace node on the canvas | `name`, `role?`, `template?`, `tier?`, `parent_id?`, `runtime?`, `workspace_dir?`, `workspace_access?` |
| `get_workspace` | Get detailed information about a specific workspace | `workspace_id` |
| `delete_workspace` | Delete a workspace (cascades to children) | `workspace_id` |
| `restart_workspace` | Restart an offline or failed workspace | `workspace_id` |
| `update_workspace` | Update workspace fields (name, role, tier, parent_id, position) | `workspace_id`, `name?`, `role?`, `tier?`, `parent_id?` |
| `pause_workspace` | Pause a workspace (stops container, preserves config) | `workspace_id` |
| `resume_workspace` | Resume a paused workspace | `workspace_id` |

### Agents

| Tool | Description | Key params |
|------|-------------|------------|
| `chat_with_agent` | Send a message to a workspace agent and get a response | `workspace_id`, `message` |
| `assign_agent` | Assign an AI model to a workspace | `workspace_id`, `model` |
| `replace_agent` | Replace the model on an existing workspace agent | `workspace_id`, `model` |
| `remove_agent` | Remove the agent from a workspace | `workspace_id` |
| `move_agent` | Move an agent from one workspace to another | `workspace_id`, `target_workspace_id` |
| `get_model` | Get current model configuration for a workspace | `workspace_id` |

### Secrets

| Tool | Description | Key params |
|------|-------------|------------|
| `set_secret` | Set an API key or environment variable for a workspace | `workspace_id`, `key`, `value` |
| `list_secrets` | List secret keys for a workspace (values never exposed) | `workspace_id` |
| `delete_secret` | Delete a secret from a workspace | `workspace_id`, `key` |
| `list_global_secrets` | List global secret keys (values never exposed) | _(none)_ |
| `set_global_secret` | Set a global secret (available to all workspaces) | `key`, `value` |
| `delete_global_secret` | Delete a global secret | `key` |

### Files

| Tool | Description | Key params |
|------|-------------|------------|
| `list_files` | List workspace config files (skills, prompts, config.yaml) | `workspace_id` |
| `read_file` | Read a workspace config file | `workspace_id`, `path` |
| `write_file` | Write or create a workspace config file | `workspace_id`, `path`, `content` |
| `delete_file` | Delete a workspace file or folder | `workspace_id`, `path` |
| `replace_all_files` | Replace all workspace config files at once | `workspace_id`, `files` (path → content map) |
| `get_config` | Get workspace runtime config as JSON | `workspace_id` |
| `update_config` | Update workspace runtime config | `workspace_id`, `config` |

### Memory

| Tool | Description | Key params |
|------|-------------|------------|
| `commit_memory` | Store a fact in workspace memory (LOCAL, TEAM, or GLOBAL scope) | `workspace_id`, `content`, `scope` |
| `search_memory` | Search workspace memories | `workspace_id`, `query?`, `scope?` |
| `delete_memory` | Delete a specific memory entry | `workspace_id`, `memory_id` |
| `session_search` | Search a workspace's recent session activity and memory (FTS) | `workspace_id`, `q?`, `limit?` |
| `get_shared_context` | Get the shared-context blob for a workspace (persistent cross-turn context) | `workspace_id` |
| `memory_set` | Set a key-value memory entry with optional TTL (distinct from `commit_memory` which uses HMA scopes) | `workspace_id`, `key`, `value`, `ttl_seconds?` |
| `memory_get` | Read a single K/V memory entry | `workspace_id`, `key` |
| `memory_list` | List all K/V memory entries for a workspace | `workspace_id` |
| `memory_delete_kv` | Delete a single K/V memory entry | `workspace_id`, `key` |

### Plugins

| Tool | Description | Key params |
|------|-------------|------------|
| `list_plugin_registry` | List all available plugins from the registry | _(none)_ |
| `list_installed_plugins` | List plugins installed in a workspace | `workspace_id` |
| `install_plugin` | Install a plugin into a workspace from any registered source (auto-restarts) | `workspace_id`, `source` (e.g. `local://name`, `github://owner/repo[#ref]`) |
| `uninstall_plugin` | Remove a plugin from a workspace (auto-restarts) | `workspace_id`, `name` |
| `list_plugin_sources` | List registered plugin install-source schemes (e.g. local, github) | _(none)_ |
| `list_available_plugins` | List plugins from the registry filtered to ones supported by this workspace's runtime | `workspace_id` |
| `check_plugin_compatibility` | Preflight check: which installed plugins would break if this workspace switched runtime to `<runtime>`? | `workspace_id`, `runtime` |

### Channels

| Tool | Description | Key params |
|------|-------------|------------|
| `list_channel_adapters` | List available social channel adapters (Telegram, Slack, etc.) | _(none)_ |
| `list_channels` | List social channels connected to a workspace | `workspace_id` |
| `add_channel` | Connect a social channel to a workspace; messages on the channel forward to the agent | `workspace_id`, `channel_type`, `config` (JSON string), `allowed_users?` |
| `update_channel` | Update a social channel's config, enabled state, or allowed users (triggers hot reload) | `workspace_id`, `channel_id`, `config?`, `enabled?`, `allowed_users?` |
| `remove_channel` | Remove a social channel from a workspace | `workspace_id`, `channel_id` |
| `send_channel_message` | Send an outbound message from a workspace to its connected social channel | `workspace_id`, `channel_id`, `text` |
| `test_channel` | Send a test message to verify a social channel connection works | `workspace_id`, `channel_id` |
| `discover_channel_chats` | Auto-detect chat IDs / channels for a given bot token (e.g. Telegram) before creating a channel | `type`, `config` |

### Delegation & Activity

| Tool | Description | Key params |
|------|-------------|------------|
| `async_delegate` | Delegate a task to another workspace (non-blocking); returns a delegation_id immediately | `workspace_id`, `target_id`, `task` |
| `check_delegations` | Check status of delegated tasks for a workspace (pending/completed/failed + results) | `workspace_id` |
| `record_delegation` | Register an agent-initiated delegation with the platform's activity log | `workspace_id`, `target_id`, `task`, `delegation_id` |
| `update_delegation_status` | Mirror an agent-initiated delegation's status to activity_logs | `workspace_id`, `delegation_id`, `status`, `error?`, `response_preview?` |
| `report_activity` | Write an arbitrary activity log row from an agent (a2a events, tool calls, errors) | `workspace_id`, `activity_type`, `method?`, `summary?`, `status?`, `error_detail?`, `request_body?`, `response_body?`, `duration_ms?` |
| `list_activity` | List activity logs for a workspace (A2A communications, tasks, errors) | `workspace_id`, `type?`, `limit?` |
| `notify_user` | Push a notification from the agent to the canvas via WebSocket (toast / chat bubble) | `workspace_id`, `type` |
| `list_traces` | List recent LLM traces from Langfuse for a workspace | `workspace_id` |

### Schedules

| Tool | Description | Key params |
|------|-------------|------------|
| `list_schedules` | List cron schedules for a workspace | `workspace_id` |
| `create_schedule` | Create a cron schedule that fires a prompt on a recurring timer | `workspace_id`, `name`, `cron_expr`, `prompt`, `timezone?`, `enabled?` |
| `update_schedule` | Update fields on an existing schedule | `workspace_id`, `schedule_id`, `name?`, `cron_expr?`, `prompt?`, `timezone?`, `enabled?` |
| `delete_schedule` | Delete a schedule | `workspace_id`, `schedule_id` |
| `run_schedule` | Fire a schedule manually, bypassing its cron expression | `workspace_id`, `schedule_id` |
| `get_schedule_history` | Get past runs of a schedule (status, start/end, output preview) | `workspace_id`, `schedule_id` |

### Approvals

| Tool | Description | Key params |
|------|-------------|------------|
| `list_pending_approvals` | List all pending approval requests across workspaces | _(none)_ |
| `decide_approval` | Approve or deny a pending approval request | `workspace_id`, `approval_id`, `decision` (`approved` \| `denied`) |
| `create_approval` | Create an approval request for a workspace | `workspace_id`, `action`, `reason?` |
| `get_workspace_approvals` | List approval requests for a specific workspace | `workspace_id` |

### Discovery & Org

| Tool | Description | Key params |
|------|-------------|------------|
| `list_peers` | List reachable peer workspaces (siblings, children, parent) | `workspace_id` |
| `discover_workspace` | Resolve a workspace URL by ID (for A2A communication) | `workspace_id` |
| `check_access` | Check if two workspaces can communicate | `caller_id`, `target_id` |
| `list_events` | List structure events (global or per workspace) | `workspace_id?` |
| `list_templates` | List available workspace templates | _(none)_ |
| `list_org_templates` | List available org templates | _(none)_ |
| `import_org` | Import an org template to create an entire workspace hierarchy | `dir` |
| `import_template` | Import agent files as a new workspace template | `name`, `files` (path → content map) |
| `export_bundle` | Export a workspace as a portable `.bundle.json` | `workspace_id` |
| `import_bundle` | Import a workspace from a bundle JSON object | `bundle` |
| `get_canvas_viewport` | Get the current canvas viewport (x, y, zoom) persisted per-user | _(none)_ |
| `set_canvas_viewport` | Persist the canvas viewport (x, y, zoom) | `x`, `y`, `zoom` |
| `expand_team` | Expand a workspace into a team of sub-workspaces | `workspace_id` |
| `collapse_team` | Collapse a team back to a single workspace | `workspace_id` |

### Remote Agents (Phase 30)

Tools that surface workspaces with `runtime='external'` — agents that run on machines outside this platform's Docker network and join via HTTP.

| Tool | Description | Key params |
|------|-------------|------------|
| `list_remote_agents` | Filter the workspace list to remote agents only — id / name / status / url / `last_heartbeat_at` / uptime | _(none)_ |
| `get_remote_agent_state` | Lightweight `{status, paused, deleted, runtime, last_heartbeat_at}` projection — faster than `get_workspace` when you only need lifecycle | `workspace_id` |
| `get_remote_agent_setup_command` | Emit a `WORKSPACE_ID=… PLATFORM_URL=… python3 …` bash one-liner an operator can paste into a remote shell. Pass `platform_url_override` if the MCP server's `PLATFORM_URL` is localhost. | `workspace_id`, `platform_url_override?` |
| `check_remote_agent_freshness` | Compare `last_heartbeat_at` against a threshold (default 90 s) — returns `{fresh, seconds_since_heartbeat, threshold_seconds}` | `workspace_id`, `threshold_seconds?` |

## Setup

### Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "molecule": {
      "command": "node",
      "args": ["./mcp-server/dist/index.js"],
      "env": {
        "MOLECULE_URL": "http://localhost:8080"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "molecule": {
      "command": "node",
      "args": ["./mcp-server/dist/index.js"],
      "env": {
        "MOLECULE_URL": "http://localhost:8080"
      }
    }
  }
}
```

### Codex / OpenCode

```bash
# Run directly
MOLECULE_URL=http://localhost:8080 node mcp-server/dist/index.js
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MOLECULE_URL` | `http://localhost:8080` | Platform API URL |

## Examples

```
You: "Create an SEO agent workspace using the seo-agent template"
Agent: [calls create_workspace with template="seo-agent"]

You: "Set the OpenRouter API key for the SEO workspace"
Agent: [calls set_secret with key="OPENROUTER_API_KEY"]

You: "Ask the SEO agent to audit my homepage"
Agent: [calls chat_with_agent with message="Audit https://example.com for SEO"]

You: "What skills does the coding agent have?"
Agent: [calls get_workspace, reads agent_card.skills]

You: "Run the daily digest schedule now and show me the last 3 runs"
Agent: [calls run_schedule, then get_schedule_history]

You: "Connect the marketing workspace to our Telegram bot"
Agent: [calls discover_channel_chats, then add_channel with channel_type="telegram"]

You: "Are any of the remote agents stale?"
Agent: [calls list_remote_agents, then check_remote_agent_freshness for each]
```
