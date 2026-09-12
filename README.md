# YouTube Transcript + Search MCP 🎬

[![License](https://img.shields.io/badge/License-MIT-4CAF50?style=for-the-badge)](./LICENSE)
[![Website](https://img.shields.io/badge/Website-getyoutubetranscript.com-FF3B00?style=for-the-badge)](https://getyoutubetranscript.com)

> A remote MCP server for YouTube — transcripts, video/channel search, channel browsing, in-channel search, and playlist extraction. API-key **or** OAuth 2.1 sign-in. Free tier, no card required.

Six tools, one hosted endpoint, no local install — for Claude, ChatGPT, Cursor, VS Code, Windsurf, and 15+ other MCP-compatible clients.

```
https://getyoutubetranscript.com/api/mcp
```

---

## Why this MCP

|  | This MCP | Typical single-purpose YouTube MCP |
|---|---|---|
| Hosting | ✅ Remote (no local install, no build step) | ❌ Local stdio process to manage |
| Tools | ✅ 6 (transcript, search, channel latest/search/videos, playlist) | ❌ Usually 1 (transcript only) |
| YouTube search (video *and* channel) | ✅ Yes | ❌ No |
| Full channel upload history, paginated | ✅ Yes | ❌ No |
| In-channel search | ✅ Yes | ❌ No |
| Auth | ✅ API key **and** OAuth 2.1 (DCR + CIMD) | ❌ Usually neither |
| Agent-friendly errors | ✅ Stable error codes, human-readable messages | ❌ Bare HTTP codes |

---

## Quick Install

> **Requirements:** a free [getyoutubetranscript.com](https://getyoutubetranscript.com) account ([sign up](https://getyoutubetranscript.com) — 100 credits, no card) and an API key from your [dashboard](https://getyoutubetranscript.com/dashboard) — **or** just connect via OAuth and skip the key entirely (see [Authentication](#authentication) below).

<details>
<summary><b>Claude Code (CLI)</b></summary>

```sh
claude mcp add --transport http youtube-transcript https://getyoutubetranscript.com/api/mcp --header "Authorization: Bearer YOUR_API_KEY"
```

</details>

<details>
<summary><b>Claude Desktop / Claude Web (OAuth)</b></summary>

1. Settings → **Connectors** → **Add custom connector**
2. Name: `YouTube Transcript` · URL: `https://getyoutubetranscript.com/api/mcp`
3. Click **Add**, then **Connect** and sign in via browser — no API key needed.

</details>

<details>
<summary><b>Cursor</b></summary>

`Settings` → `Features` → `MCP` → `Add New MCP Server` — Type: `SSE`/`HTTP`, URL: `https://getyoutubetranscript.com/api/mcp`.

Or edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "url": "https://getyoutubetranscript.com/api/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>VS Code</b></summary>

```json
"mcp.servers": {
  "youtube-transcript": {
    "type": "http",
    "url": "https://getyoutubetranscript.com/api/mcp",
    "headers": { "Authorization": "Bearer YOUR_API_KEY" }
  }
}
```

</details>

<details>
<summary><b>ChatGPT</b></summary>

Enable Developer Mode, then `Settings` → `Connected Apps` → `Add` → URL `https://getyoutubetranscript.com/api/mcp`. Leave Client ID/Secret blank for Dynamic Client Registration, or use OAuth sign-in directly.

</details>

<details>
<summary><b>Windsurf</b></summary>

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "serverUrl": "https://getyoutubetranscript.com/api/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>Cline</b></summary>

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "url": "https://getyoutubetranscript.com/api/mcp",
      "type": "streamableHttp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>Zed</b></summary>

```json
{
  "context_servers": {
    "youtube-transcript": {
      "source": "remote",
      "url": "https://getyoutubetranscript.com/api/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>Roo Code</b></summary>

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "type": "streamable-http",
      "url": "https://getyoutubetranscript.com/api/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>Amp</b></summary>

```sh
amp mcp add youtube-transcript https://getyoutubetranscript.com/api/mcp --header "Authorization: Bearer YOUR_API_KEY"
```

</details>

<details>
<summary><b>Augment Code</b></summary>

```json
"augment.advanced": {
  "mcpServers": [
    {
      "name": "youtube-transcript",
      "url": "https://getyoutubetranscript.com/api/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  ]
}
```

</details>

<details>
<summary><b>Kilo Code</b></summary>

In `.kilocode/mcp.json`:

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "type": "streamable-http",
      "url": "https://getyoutubetranscript.com/api/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>JetBrains AI Assistant</b></summary>

`Settings` → `Tools` → `AI Assistant` → `MCP`:

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "url": "https://getyoutubetranscript.com/api/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

</details>

### 30-second example

```txt
Summarize this video for me: https://youtu.be/dQw4w9WgXcQ
```

The agent calls `get_youtube_transcript` and summarizes the result. If you connected via OAuth, there's no key to configure at all — just approve the connection once.

---

## Authentication

### API Key

Universal, works with every MCP client. Get one free (100 credits, no card) at the [dashboard](https://getyoutubetranscript.com/dashboard), then send it as a Bearer token:

```json
"headers": { "Authorization": "Bearer sk_live_your_key_here" }
```

### OAuth 2.1

No manual key management — sign in via browser, the server handles the rest.

- **Dynamic Client Registration (DCR):** supported for clients that self-register at connect time (Claude Desktop/Web, ChatGPT, and most others).
- **Client ID Metadata Documents (CIMD):** supported per the current MCP spec (2026-07-28) for clients that host their own metadata document — the more modern alternative to DCR, no shared secret required.
- First connection opens a consent screen showing exactly what access is being granted; approve once and you're connected.

Both methods issue a token scoped and audience-bound to this specific MCP server — it can't be replayed against any other API.

---

## Available Tools

All six tools are exposed automatically once you connect. **1 credit = 1 successful request.** Failed or rate-limited calls never consume credits.

### 1. `get_youtube_transcript`

Fetch the full transcript for a YouTube video, plus its title/author/thumbnail metadata.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `video_url` | string | **required** | YouTube URL (full or short) or an 11-character video ID |
| `language` | string | optional | Language code, e.g. `en`, `es`. Defaults to `en` |
| `send_metadata` | boolean | optional | Include title/author/thumbnail. Defaults to `true` |

**Cost:** 1 credit. Note: this returns the full transcript as one text block — there's no per-segment timestamp breakdown.

### 2. `search_youtube`

Search YouTube for videos or channels, paginated.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | required unless `continuation` set | Search query |
| `search_type` | `"video"` \| `"channel"` | optional | Defaults to `"video"` |
| `continuation` | string | optional | Opaque token from a previous response — fetches the next page |

**Cost:** 1 credit/page.

### 3. `get_channel_latest_videos` <sub>· **FREE**</sub>

Get a channel's metadata plus its most recent uploads.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `channel` | string | **required** | `@handle`, channel URL, or `UC…` channel ID |

**Cost:** Free.

### 4. `search_channel_videos`

Search within one specific channel's videos.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `channel` | string | required unless `continuation` set | `@handle`, channel URL, or `UC…` ID |
| `query` | string | required unless `continuation` set | Query to search within the channel |
| `continuation` | string | optional | Opaque token — fetches the next page |

**Cost:** 1 credit/page.

### 5. `list_channel_videos`

List every video a channel has ever uploaded (the full `/videos` tab, not just recent ones).

| Parameter | Type | Required | Description |
|---|---|---|---|
| `channel` | string | required unless `continuation` set | `@handle`, channel URL, or `UC…` ID |
| `continuation` | string | optional | Opaque token — fetches the next page |

**Cost:** 1 credit/page.

### 6. `list_playlist_videos`

Get every video in a YouTube playlist.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `playlist` | string | required unless `continuation` set | Playlist URL or ID |
| `continuation` | string | optional | Opaque token — fetches the next page |

**Cost:** 1 credit/page.

---

## Use Cases & Prompts

| Use Case | Example Prompt |
|---|---|
| 📝 **Summarize a video** | "Summarize the key points from this video: [URL]" |
| 🔍 **Research a topic** | "Search YouTube for the 5 most-watched videos on neural radiance fields; summarize each." |
| 🧠 **Study notes** | "Create study notes from this MIT lecture series playlist: [PLAYLIST URL]" |
| 📡 **Monitor a creator** | "Each morning, list new uploads from @hubermanlab and tell me which to watch." |
| 🏛️ **Build a content database** | "Pull every video from @veritasium and store title + transcript." |
| 🎯 **Channel research** | "Search inside @MKBHD for any video about [topic] and summarize the takeaways." |
| ✍️ **Repurpose content** | "Turn this video into a 1,500-word blog post: [URL]" |

---

## Pricing & Rate Limits

| Plan | Price | Credits | Rate Limit |
|---|---|---|---|
| **Free** | $0 | 100 credits on signup | 60 req/min |
| **Monthly** | $5/month | 1,000 credits/month | 200 req/min |
| **Annual** | $4.50/mo ($54/yr) | 1,000 credits/month | 300 req/min |

- **1 credit** = 1 successful request. Failed/rate-limited requests don't consume credits.
- `get_channel_latest_videos` is always free.
- [Manage billing →](https://getyoutubetranscript.com/dashboard)

---

## Troubleshooting

<details>
<summary><b>Authentication errors (401)</b></summary>

- If using an API key: confirm it starts with `sk_live_` and has no extra whitespace
- If using OAuth: try disconnecting and reconnecting the connector
- Confirm the key/connection is still active in your [dashboard](https://getyoutubetranscript.com/dashboard)
</details>

<details>
<summary><b>No credits (402)</b></summary>

Check your balance and top up or upgrade at the [dashboard](https://getyoutubetranscript.com/dashboard).
</details>

<details>
<summary><b>Video not available (404)</b></summary>

- The video may not have captions enabled
- It may be private, age-restricted, or region-locked
- Confirm it plays in a real browser first
</details>

<details>
<summary><b>Rate limiting (429)</b></summary>

Back off and retry after a short delay — don't hammer it in a tight loop.
</details>

<details>
<summary><b>OAuth connection issues</b></summary>

- Clear cookies for getyoutubetranscript.com and retry
- Ensure popup/redirect blockers aren't interfering with the consent screen
- If your client supports both DCR and CIMD, try the other registration method
</details>

---

## Also available as a REST API

Building an app instead of an agent? The same backend is a plain JSON REST API — see the [Agent Skill repo](https://github.com/tubeagentkit/youtube-transcript-skills) for the full endpoint reference, or the [dashboard](https://getyoutubetranscript.com/dashboard) to get a key directly.

Base URL: `https://getyoutubetranscript.com/api/v1`

---

## Connect

- 🌐 **Website:** [getyoutubetranscript.com](https://getyoutubetranscript.com)
- 🔑 **Dashboard:** [getyoutubetranscript.com/dashboard](https://getyoutubetranscript.com/dashboard)
- 🧩 **Agent Skill version:** [tubeagentkit/youtube-transcript-skills](https://github.com/tubeagentkit/youtube-transcript-skills)

## Disclosure

getyoutubetranscript.com is an independent product and is not affiliated with or endorsed by YouTube or Google.

## License

MIT — see [LICENSE](./LICENSE).
