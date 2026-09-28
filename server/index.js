#!/usr/bin/env node
// Local (stdio) MCP server for YouTube transcripts, search, channels, and
// playlists. Each tool calls the public getyoutubetranscript.com REST API
// (https://getyoutubetranscript.com/docs) with your API key.
//
// Run: GYT_API_KEY=sk_live_... node server/index.js  (after: npm install --prefix server)

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = (process.env.GYT_API_BASE || "https://getyoutubetranscript.com/api/v1").replace(/\/+$/, "");
const API_KEY = process.env.GYT_API_KEY;
const REQUEST_TIMEOUT_MS = 60_000;

if (!API_KEY) {
  console.error("GYT_API_KEY is not set. Get a free key at https://getyoutubetranscript.com/dashboard");
  process.exit(1);
}

class ApiCallError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/** GET an API path, dropping empty params. Returns the response's `data` field. */
async function apiGet(path, params) {
  const url = new URL(API_BASE + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }

  let res;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    const code = err?.name === "TimeoutError" ? "TIMEOUT" : "NETWORK_ERROR";
    throw new ApiCallError(code, `Could not reach ${API_BASE}: ${err?.message ?? err}`);
  }

  let body;
  try {
    body = await res.json();
  } catch {
    throw new ApiCallError(`HTTP_${res.status}`, `Unexpected non-JSON response (HTTP ${res.status}).`);
  }
  if (!res.ok || body?.success === false) {
    throw new ApiCallError(body?.code ?? `HTTP_${res.status}`, body?.message ?? `Request failed (HTTP ${res.status}).`);
  }
  return body.data;
}

function textResult(text) {
  return { content: [{ type: "text", text }] };
}

function errorResult(code, message) {
  return { content: [{ type: "text", text: `Error (${code}): ${message}` }], isError: true };
}

/** Wraps a tool handler so API failures come back as tool errors instead of crashing the server. */
function tool(handler) {
  return async (args) => {
    try {
      return await handler(args);
    } catch (err) {
      if (err instanceof ApiCallError) return errorResult(err.code, err.message);
      console.error("[youtube-mcp] unexpected error:", err);
      return errorResult("INTERNAL", "Something went wrong processing this request.");
    }
  };
}

const json = (data) => textResult(JSON.stringify(data, null, 2));
const readOnly = { readOnlyHint: true, openWorldHint: true, destructiveHint: false };
const continuationField = z
  .string()
  .optional()
  .describe("Opaque token from a previous response - fetches the next page. Do not construct this yourself.");

const server = new McpServer({ name: "youtube-mcp", version: "1.1.0" });

server.registerTool(
  "get_youtube_transcript",
  {
    title: "Get YouTube Transcript",
    description:
      "Fetch the full transcript for a YouTube video, plus its title/author metadata. Returns the complete spoken text as one block (no per-segment timestamps).",
    inputSchema: {
      video_url: z.string().describe("YouTube URL (full or short) or an 11-character video ID"),
      language: z.string().optional().describe("Language code, e.g. 'en', 'es'. Defaults to 'en'."),
      send_metadata: z.boolean().optional().describe("Include title/author metadata. Defaults to true."),
    },
    annotations: readOnly,
  },
  tool(async ({ video_url, language, send_metadata }) => {
    const data = await apiGet("/transcript", { v: video_url, language });
    if (send_metadata === false) return textResult(data.transcript);
    return textResult(`# Metadata\n\n## Title: ${data.title}\n## Author: ${data.author_name}\n\n# Transcript\n\n${data.transcript}`);
  })
);

server.registerTool(
  "search_youtube",
  {
    title: "Search YouTube",
    description: "Search YouTube for videos or channels. Paginate with `continuation` from a previous response.",
    inputSchema: {
      query: z.string().optional().describe("Search query. Required unless `continuation` is set."),
      search_type: z.enum(["video", "channel"]).optional().describe("'video' (default) or 'channel'."),
      continuation: continuationField,
    },
    annotations: readOnly,
  },
  tool(async ({ query, search_type, continuation }) => {
    if (!continuation && !query) return errorResult("BAD_REQUEST", "Provide either query or continuation.");
    return json(await apiGet("/search", { q: query, type: search_type, page_token: continuation }));
  })
);

server.registerTool(
  "get_channel_latest_videos",
  {
    title: "Get Channel Latest Videos",
    description: "Get a channel's metadata plus its most recent uploads. Free - no credits charged.",
    inputSchema: { channel: z.string().describe("Channel @handle, URL, or UC... id") },
    annotations: readOnly,
  },
  tool(async ({ channel }) => json(await apiGet("/channel/latest", { channel })))
);

server.registerTool(
  "search_channel_videos",
  {
    title: "Search Channel Videos",
    description: "Search within one channel's videos for a query. Paginate with `continuation` from a previous response.",
    inputSchema: {
      channel: z.string().optional().describe("Channel @handle, URL, or UC... id. Required unless `continuation` is set."),
      query: z.string().optional().describe("Query to search within the channel. Required unless `continuation` is set."),
      continuation: continuationField,
    },
    annotations: readOnly,
  },
  tool(async ({ channel, query, continuation }) => {
    if (!continuation && (!channel || !query)) {
      return errorResult("BAD_REQUEST", "Provide either (channel and query) or continuation.");
    }
    return json(await apiGet("/channel/search", continuation ? { continuation } : { channel, q: query }));
  })
);

server.registerTool(
  "list_channel_videos",
  {
    title: "List Channel Videos",
    description: "List every video a channel has uploaded (the /videos tab), paginated with `continuation`.",
    inputSchema: {
      channel: z.string().optional().describe("Channel @handle, URL, or UC... id. Required unless `continuation` is set."),
      continuation: continuationField,
    },
    annotations: readOnly,
  },
  tool(async ({ channel, continuation }) => {
    if (!continuation && !channel) return errorResult("BAD_REQUEST", "Provide either channel or continuation.");
    return json(await apiGet("/channel/videos", continuation ? { continuation } : { channel }));
  })
);

server.registerTool(
  "list_playlist_videos",
  {
    title: "List Playlist Videos",
    description: "Get every video in a YouTube playlist, paginated with `continuation`.",
    inputSchema: {
      playlist: z.string().optional().describe("Playlist URL or id. Required unless `continuation` is set."),
      continuation: continuationField,
    },
    annotations: readOnly,
  },
  tool(async ({ playlist, continuation }) => {
    if (!continuation && !playlist) return errorResult("BAD_REQUEST", "Provide either playlist or continuation.");
    return json(await apiGet("/playlist", continuation ? { continuation } : { list: playlist }));
  })
);

server.registerTool(
  "get_credits",
  {
    title: "Get Credits",
    description: "Check the remaining credit balance for this API key. Free - never charged.",
    inputSchema: {},
    annotations: { ...readOnly, openWorldHint: false },
  },
  tool(async () => json(await apiGet("/credits", {})))
);

await server.connect(new StdioServerTransport());
