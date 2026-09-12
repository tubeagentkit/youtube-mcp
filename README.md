# YouTube Transcript MCP

A remote [Model Context Protocol](https://modelcontextprotocol.io) server for YouTube - transcripts, video/channel search, channel browsing, and playlist extraction - hosted at `https://getyoutubetranscript.com/api/mcp`, backed by the [getyoutubetranscript.com](https://getyoutubetranscript.com) API.

No local install, no build step - point any MCP-compatible client at the URL below.

## Install

**Claude Code:**

```sh
claude mcp add --transport http youtube-transcript https://getyoutubetranscript.com/api/mcp --header "Authorization: Bearer YOUR_API_KEY"
```

**Cursor / Windsurf / Cline / most clients** - add to your MCP config:

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "url": "https://getyoutubetranscript.com/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

**VS Code** - add to `settings.json`:

```json
"mcp.servers": {
  "youtube-transcript": {
    "type": "http",
    "url": "https://getyoutubetranscript.com/api/mcp",
    "headers": {
      "Authorization": "Bearer YOUR_API_KEY"
    }
  }
}
```

Get a free API key (100 credits, no card required) at the [dashboard](https://getyoutubetranscript.com/dashboard).

## Tools

| Tool | Cost | Description |
|---|---|---|
| `get_youtube_transcript` | 1 credit | Full transcript + metadata for a video (no per-segment timestamps) |
| `search_youtube` | 1 credit/page | Search YouTube for videos or channels, paginated |
| `get_channel_latest_videos` | **Free** | Channel metadata + recent uploads |
| `search_channel_videos` | 1 credit/page | Search within one channel's videos, paginated |
| `list_channel_videos` | 1 credit/page | Every video a channel has uploaded, paginated |
| `list_playlist_videos` | 1 credit/page | Every video in a playlist, paginated |

## Authentication

API key only for now (`Authorization: Bearer <key>`) - OAuth is a planned follow-up.

## Links

- [getyoutubetranscript.com](https://getyoutubetranscript.com)
- [API docs](https://getyoutubetranscript.com/docs)
- [Dashboard](https://getyoutubetranscript.com/dashboard)
- [Agent Skill version](https://github.com/tubeagentkit/youtube-transcript-skills) (for Claude Code, Cursor, and other Agent Skills-compatible tools)

## License

MIT
