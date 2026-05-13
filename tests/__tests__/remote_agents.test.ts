/**
 * Unit tests for src/tools/remote_agents.ts
 *
 * Tests handleGetRemoteAgentSetupCommand which generates a Python bootstrap
 * command for remote agents. Key edge cases:
 * - localhost warning when PLATFORM_URL is localhost and no override given
 * - platform_url_override bypasses localhost warning
 * - non-external runtime returns error
 * - workspace not found returns error
 */

import { toMcpResult } from "../../src/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Factory so each fetch call gets a fresh Response (bodies can only be read once). */
function makeFetchResponse(body: unknown, init: ResponseInit = {}): Response {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return new Response(text, {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: init.headers as HeadersInit,
  });
}

type RemoteAgentsHandler = {
  handleGetRemoteAgentSetupCommand: (
    params: { workspace_id: string; platform_url_override?: string }
  ) => Promise<ReturnType<typeof toMcpResult>>;
};

/**
 * Dynamically import the remote_agents module with a mocked platformGet.
 * Must be called inside jest.isolateModules() with MOLECULE_API_URL set.
 */
async function loadHandlerWithMock(
  mockPlatformGet: jest.Mock,
): Promise<RemoteAgentsHandler> {
  let handler!: RemoteAgentsHandler;
  await new Promise<void>((resolve) => {
    jest.isolateModules(() => {
      jest.mock("../../src/api", () => ({
        ...jest.requireActual("../../src/api"),
        platformGet: mockPlatformGet,
      }));
      const mod = require("../../src/tools/remote_agents") as RemoteAgentsHandler;
      handler = mod;
      resolve();
    });
  });
  return handler;
}

// ---------------------------------------------------------------------------
// handleGetRemoteAgentSetupCommand tests
// ---------------------------------------------------------------------------

describe("handleGetRemoteAgentSetupCommand", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("returns a setup command with correct RemoteAgentClient API call", async () => {
    const mockGet = jest.fn().mockResolvedValue({
      id: "ws-abc123",
      name: "test-agent",
      runtime: "external",
    });

    const handler = await loadHandlerWithMock(mockGet);
    const result = await handler.handleGetRemoteAgentSetupCommand({
      workspace_id: "ws-abc123",
    });

    expect(result.content[0].text).toContain("ws-abc123");
    expect(result.content[0].text).toContain("molecule_agent import RemoteAgentClient");
    // Must use constructor + load_token pattern, NOT the non-existent register_from_env()
    expect(result.content[0].text).not.toContain("register_from_env()");
    expect(result.content[0].text).toContain("load_token()");
    expect(result.content[0].text).toContain("pull_secrets()");
    expect(result.content[0].text).toContain("run_heartbeat_loop()");
  });

  it("returns a localhost warning when PLATFORM_URL is localhost and no override given", async () => {
    // Set localhost as the platform URL before loading the module
    process.env.MOLECULE_API_URL = "http://localhost:8080";

    const mockGet = jest.fn().mockResolvedValue({
      id: "ws-abc123",
      name: "test-agent",
      runtime: "external",
    });

    const handler = await loadHandlerWithMock(mockGet);
    const result = await handler.handleGetRemoteAgentSetupCommand({
      workspace_id: "ws-abc123",
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.warnings).toBeDefined();
    expect(parsed.warnings[0]).toContain("localhost");
    expect(parsed.warnings[0]).toContain("platform_url_override");

    delete process.env.MOLECULE_API_URL;
  });

  it("platform_url_override bypasses the localhost warning", async () => {
    // Even with localhost as the base URL, passing an override suppresses the warning
    process.env.MOLECULE_API_URL = "http://localhost:8080";

    const mockGet = jest.fn().mockResolvedValue({
      id: "ws-abc123",
      name: "test-agent",
      runtime: "external",
    });

    const handler = await loadHandlerWithMock(mockGet);
    const result = await handler.handleGetRemoteAgentSetupCommand({
      workspace_id: "ws-abc123",
      platform_url_override: "https://platform.example.com",
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.warnings).toBeUndefined();
    expect(parsed.platform_url).toBe("https://platform.example.com");

    delete process.env.MOLECULE_API_URL;
  });

  it("returns error when workspace runtime is not 'external'", async () => {
    const mockGet = jest.fn().mockResolvedValue({
      id: "ws-abc123",
      name: "docker-agent",
      runtime: "docker",
    });

    const handler = await loadHandlerWithMock(mockGet);
    const result = await handler.handleGetRemoteAgentSetupCommand({
      workspace_id: "ws-abc123",
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toContain("not external");
    expect(parsed.error).toContain("runtime='external'");
    expect(parsed.actual_runtime).toBe("docker");
  });

  it("returns error when workspace is not found", async () => {
    const mockGet = jest.fn().mockResolvedValue({
      error: "not found",
      detail: "workspace ws-missing does not exist",
    });

    const handler = await loadHandlerWithMock(mockGet);
    const result = await handler.handleGetRemoteAgentSetupCommand({
      workspace_id: "ws-missing",
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBeDefined();
  });
});
