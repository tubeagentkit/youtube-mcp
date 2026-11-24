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
  "get_channel_banner",
  "get_channel_latest_videos",
  "get_credits",
  "get_related_videos",
  "get_transcript_job",
  "get_transcript_languages",
  "get_video_comments",
  "get_video_details",
  "get_video_dislikes",
  "get_youtube_transcript",
  "list_channel_playlists",
  "list_channel_posts",
  "list_channel_videos",
  "list_playlist_videos",
  "search_channel_videos",
  "search_youtube",
]);

const transcriptTool = tools.find((t) => t.name === "get_youtube_transcript");
assert.ok(transcriptTool.inputSchema.properties.timestamps, "get_youtube_transcript should accept timestamps");
console.log("timestamps input ok");
assert.ok(transcriptTool.inputSchema.properties.translate, "get_youtube_transcript should accept translate");
console.log("translate input ok");
assert.deepEqual(transcriptTool.inputSchema.properties.mode.enum, ["native", "generate", "auto"]);
console.log("mode input ok");

const jobTool = tools.find((t) => t.name === "get_transcript_job");
assert.deepEqual(jobTool.inputSchema.required, ["job_id"], "get_transcript_job needs only a job_id");
console.log("get_transcript_job schema ok");

const languagesTool = tools.find((t) => t.name === "get_transcript_languages");
assert.deepEqual(languagesTool.inputSchema.required, ["video_url"], "get_transcript_languages needs only a video");
console.log("get_transcript_languages schema ok");

const channelVideosTool = tools.find((t) => t.name === "list_channel_videos");
assert.deepEqual(channelVideosTool.inputSchema.properties.tab.enum, ["videos", "shorts", "streams"]);
assert.deepEqual(channelVideosTool.inputSchema.properties.sort.enum, ["latest", "popular", "oldest"]);
console.log("list_channel_videos tab and sort ok");

const credits = await client.callTool({ name: "get_credits", arguments: {} });
assert.equal(credits.isError, undefined, credits.content[0].text);
console.log("get_credits ok");

const latest = await client.callTool({ name: "get_channel_latest_videos", arguments: { channel: "@veritasium" } });
assert.equal(latest.isError, undefined, latest.content[0].text);
console.log("get_channel_latest_videos ok");

// Free: polling a job is never charged, and an unknown id is a clean tool error.
const missingJob = await client.callTool({ name: "get_transcript_job", arguments: { job_id: "00000000-0000-4000-8000-000000000000" } });
assert.equal(missingJob.isError, true);
assert.match(missingJob.content[0].text, /JOB_NOT_FOUND/);
console.log("get_transcript_job unknown id ok");

// Free: rejected before any request is made.
const aiTranslate = await client.callTool({ name: "get_youtube_transcript", arguments: { video_url: "dQw4w9WgXcQ", mode: "auto", translate: "es" } });
assert.equal(aiTranslate.isError, true);
console.log("mode with translate rejected ok");

if (process.env.GYT_RUN_PAID_TESTS === "1") {
  // 1 credit. A video with only auto-generated captions, to check the provenance header.
  const transcript = await client.callTool({ name: "get_youtube_transcript", arguments: { video_url: "ZXsQAXx_ao0" } });
  assert.equal(transcript.isError, undefined, transcript.content[0].text);
  assert.match(transcript.content[0].text, /## Language: en\n## Captions: auto-generated/);
  console.log("get_youtube_transcript metadata ok");

  // 1 credit. Machine translation keeps the timestamps and names the target language.
  const translated = await client.callTool({
    name: "get_youtube_transcript",
    arguments: { video_url: "dQw4w9WgXcQ", timestamps: true, translate: "es" },
  });
  assert.equal(translated.isError, undefined, translated.content[0].text);
  assert.match(translated.content[0].text, /## Translated to: es \(machine translation\)/);
  assert.match(translated.content[0].text, /^\[0:\d\d\] /m);
  console.log("get_youtube_transcript translate ok");

  // 3 credits per minute of video, or 0 when this account already made this AI transcript in the last 24 hours.
  // A long video may answer with a job_id instead; then poll get_transcript_job.
  const ai = await client.callTool({ name: "get_youtube_transcript", arguments: { video_url: "dQw4w9WgXcQ", mode: "generate", timestamps: true } });
  assert.equal(ai.isError, undefined, ai.content[0].text);
  const jobId = ai.content[0].text.match(/job_id: (\S+)/)?.[1];
  let aiText = ai.content[0].text;
  for (let i = 0; jobId && i < 60 && !aiText.includes("# Transcript"); i++) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const polled = await client.callTool({ name: "get_transcript_job", arguments: { job_id: jobId, timestamps: true } });
    assert.equal(polled.isError, undefined, polled.content[0].text);
    aiText = polled.content[0].text;
  }
  assert.match(aiText, /## Source: AI speech-to-text transcript/);
  assert.match(aiText, /## Credits charged by this call: \d+/);
  assert.match(aiText, /^\[0:\d\d\] /m);
  console.log("get_youtube_transcript mode=generate ok");

  // 1 credit.
  const languages = await client.callTool({ name: "get_transcript_languages", arguments: { video_url: "ZXsQAXx_ao0" } });
  assert.equal(languages.isError, undefined, languages.content[0].text);
  assert.ok(JSON.parse(languages.content[0].text).languages.length > 0, "expected at least one caption language");
  console.log("get_transcript_languages ok");

  // 1 credit each.
  const shorts = await client.callTool({ name: "list_channel_videos", arguments: { channel: "@veritasium", tab: "shorts", sort: "popular" } });
  assert.equal(shorts.isError, undefined, shorts.content[0].text);
  assert.ok(JSON.parse(shorts.content[0].text).videos.length > 0, "expected Shorts");
  console.log("list_channel_videos shorts ok");

  for (const [name, args, key] of [
    ["list_channel_playlists", { channel: "@veritasium" }, "playlists"],
    ["list_channel_posts", { channel: "@veritasium" }, "posts"],
    ["get_related_videos", { video_url: "ZXsQAXx_ao0" }, "related"],
    ["get_video_dislikes", { video_url: "dQw4w9WgXcQ" }, "dislikes"],
    ["get_video_details", { video_url: "dQw4w9WgXcQ" }, "views"],
    ["get_video_comments", { video_url: "dQw4w9WgXcQ" }, "comments"],
    ["get_channel_banner", { channel: "@veritasium" }, "has_banner"],
  ]) {
    const result = await client.callTool({ name, arguments: args });
    assert.equal(result.isError, undefined, result.content[0].text);
    assert.ok(key in JSON.parse(result.content[0].text), `${name} should return ${key}`);
    console.log(`${name} ok`);
  }
}

const bad = await client.callTool({ name: "search_youtube", arguments: {} });
assert.equal(bad.isError, true);
const badPage = await client.callTool({ name: "list_channel_posts", arguments: {} });
assert.equal(badPage.isError, true);
console.log("input validation ok");

await client.close();
console.log("all checks passed");
