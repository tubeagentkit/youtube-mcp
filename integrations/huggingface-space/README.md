---
title: YouTube Transcript (GetYouTubeTranscript)
emoji: 📝
colorFrom: red
colorTo: gray
sdk: gradio
app_file: app.py
pinned: false
license: mit
short_description: YouTube transcripts and search, as an app and MCP server
tags:
  - mcp-server
  - youtube
  - transcript
---

Get any YouTube video's transcript (any caption language the video has, optionally with timestamps) or search YouTube, using your own [GetYouTubeTranscript](https://getyoutubetranscript.com) API key. New accounts get 100 credits.

**MCP server:** this Space runs with `mcp_server=True`. Point an MCP client at `https://<this-space>.hf.space/gradio_api/mcp/` and pass your API key in the tool arguments. For the full 13-tool hosted MCP server (with OAuth), use `https://getyoutubetranscript.com/api/mcp`.
