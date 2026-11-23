# GetYouTubeTranscript with Strands Agents

Give a [Strands Agents](https://strandsagents.com) agent YouTube tools through GetYouTubeTranscript's hosted MCP server: full transcripts in any caption language a video has (with optional timestamps and translation), YouTube search, and channel, playlist and video data. Nothing runs locally; the agent connects to `https://getyoutubetranscript.com/api/mcp` over Streamable HTTP.

## Setup

1. Create an API key at [getyoutubetranscript.com/developers](https://getyoutubetranscript.com/developers). A new account gets 100 credits, no card required.
2. Install Strands (this guide is written against `strands-agents` 1.65.0, whose `MCPClient` accepts `url` and `headers`):

```bash
pip install "strands-agents>=1.65.0"
export GETYOUTUBETRANSCRIPT_API_KEY=sk_live_...
```

## Connect the tools

`MCPClient` builds the Streamable HTTP transport from the `url`, and `headers` carries the key on every request:

```python
import os

from strands import Agent
from strands.tools.mcp import MCPClient

youtube = MCPClient(
    url="https://getyoutubetranscript.com/api/mcp",
    headers={"Authorization": f"Bearer {os.environ['GETYOUTUBETRANSCRIPT_API_KEY']}"},
)

with youtube:
    agent = Agent(tools=youtube.list_tools_sync())
    agent("Summarize https://www.youtube.com/watch?v=dQw4w9WgXcQ in five bullet points.")
```

`Agent()` uses Strands' default model provider; pass `model=` to use another one. The tools stay available only inside the `with` block.

Listing the tools works without a key, but every tool call needs one: without the `Authorization` header a call answers `invalid_token`.

## Tools

| Tool | What it does |
| --- | --- |
| `get_youtube_transcript` | Full transcript of a video, optionally with timestamps, in a chosen caption language, optionally machine-translated |
| `get_transcript_languages` | Caption languages a video has |
| `search_youtube` | Search YouTube videos or channels |
| `get_channel_latest_videos` | A channel's details and latest uploads |
| `list_channel_videos`, `list_channel_playlists`, `list_channel_posts`, `search_channel_videos`, `get_channel_banner` | Channel data |
| `list_playlist_videos` | Videos in a playlist |
| `get_related_videos`, `get_video_dislikes` | Videos suggested next to a video, and like/dislike estimates |
| `get_video_details`, `get_video_comments` | A video's views, likes, upload date and tags, and its top comments |
| `get_credits` | Your remaining credits |

## Cost and limits

Most calls cost 1 credit; failed calls (no captions, a private or removed video) and `get_credits` are free. Transcripts come from the captions a video already has, so a video with captions turned off returns no transcript. Pricing: [getyoutubetranscript.com/pricing](https://getyoutubetranscript.com/pricing).

## Links

- MCP server and other clients: [README](../../README.md)
- REST API reference: [getyoutubetranscript.com/docs](https://getyoutubetranscript.com/docs)
- Strands MCP transports: [strandsagents.com docs](https://strandsagents.com/docs/user-guide/sdk/tools/mcp-transports/)
