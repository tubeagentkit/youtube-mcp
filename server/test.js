// Live integration test: starts index.js over stdio as a real MCP client would,
// lists tools, and calls the free ones against the production API.
// Run: GYT_API_KEY=sk_live_... npm test --prefix server

import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [new URL("./index.js", import.meta.url).pathname],
  env: { ...process.env },
});
const client = new Client({ name: "youtube-mcp-test", version: "1.0.0" });
await client.connect(transport);

const { tools } = await client.listTools();
const names = tools.map((t) => t.name).sort();
console.log("tools:", names.join(", "));
assert.deepEqual(names, [
  "get_channel_latest_videos",
  "get_credits",
  "get_youtube_transcript",
  "list_channel_videos",
  "list_playlist_videos",
  "search_channel_videos",
  "search_youtube",
]);

const transcriptTool = tools.find((t) => t.name === "get_youtube_transcript");
assert.ok(transcriptTool.inputSchema.properties.timestamps, "get_youtube_transcript should accept timestamps");
console.log("timestamps input ok");

const credits = await client.callTool({ name: "get_credits", arguments: {} });
assert.equal(credits.isError, undefined, credits.content[0].text);
console.log("get_credits ok");

const latest = await client.callTool({ name: "get_channel_latest_videos", arguments: { channel: "@veritasium" } });
assert.equal(latest.isError, undefined, latest.content[0].text);
console.log("get_channel_latest_videos ok");

const bad = await client.callTool({ name: "search_youtube", arguments: {} });
assert.equal(bad.isError, true);
console.log("input validation ok");

await client.close();
console.log("all checks passed");
