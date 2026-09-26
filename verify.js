#!/usr/bin/env node
// Zero-dependency, zero-auth proof that the remote MCP server at
// https://getyoutubetranscript.com/api/mcp is a real, running MCP
// implementation - not just a manifest.
//
// Run: node verify.js
//
// It performs the actual MCP handshake (`initialize` then `tools/list`)
// over streamable HTTP and prints the live server's response. Both calls
// work without an API key or OAuth token - tool discovery is public,
// only tool *calls* require auth (see README's Authentication section).

const ENDPOINT = "https://getyoutubetranscript.com/api/mcp";

async function rpc(method, params = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  const raw = await res.text();
  // Server responds as an SSE event stream; pull the JSON out of the
  // `data:` line rather than requiring an SSE client library.
  const dataLine = raw.split("\n").find((line) => line.startsWith("data:"));
  const payload = dataLine ? dataLine.slice(5).trim() : raw;
  return JSON.parse(payload);
}

async function main() {
  console.log(`--> initialize (${ENDPOINT})`);
  const init = await rpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "verify-script", version: "1.0.0" },
  });
  console.log(JSON.stringify(init, null, 2));

  console.log("\n--> tools/list");
  const tools = await rpc("tools/list");
  const names = tools.result?.tools?.map((t) => t.name) ?? [];
  console.log(`Live server returned ${names.length} tools:`, names);
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
