"""YouTube Transcript (GetYouTubeTranscript) - Gradio app and MCP server.

Each tool takes your own GetYouTubeTranscript API key (create one at
https://getyoutubetranscript.com/developers; new accounts get 100 credits),
so this Space never spends anyone else's credits. Launched with
mcp_server=True, so MCP clients can call the same functions as tools.
"""

import json
import urllib.error
import urllib.parse
import urllib.request

import gradio as gr

API = "https://getyoutubetranscript.com/api/v1"


def _get(path: str, params: dict, api_key: str) -> dict:
    if not api_key or not api_key.strip():
        raise gr.Error("Add your GetYouTubeTranscript API key (getyoutubetranscript.com/developers).")
    query = urllib.parse.urlencode({k: v for k, v in params.items() if v not in (None, "")})
    req = urllib.request.Request(
        f"{API}{path}?{query}",
        headers={"x-api-key": api_key.strip(), "Accept": "application/json", "User-Agent": "gyt-hf-space/1.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as err:
        try:
            message = json.load(err).get("message")
        except Exception:
            message = None
        raise gr.Error(message or f"HTTP {err.code}")


def get_transcript(video: str, api_key: str, language: str = "", timestamps: bool = False) -> str:
    """Get the full transcript of a YouTube video.

    Args:
        video: YouTube video URL (full or short) or the 11-character video ID.
        api_key: Your GetYouTubeTranscript API key (getyoutubetranscript.com/developers).
        language: Optional caption language code such as en or es. Leave empty for the default track.
        timestamps: If true, return one line per caption with its start time.

    Returns:
        The transcript text, with a header naming the video and the caption language returned.
    """
    data = _get("/transcript", {"v": video, "language": language, "timestamps": "true" if timestamps else ""}, api_key)["data"]
    header = f'"{data["title"]}" by {data["author_name"]} (captions: {data["language_code"]}, {data.get("caption_type") or "unknown"})'
    if timestamps and data.get("segments"):
        lines = [f"[{int(s['start']) // 60}:{int(s['start']) % 60:02d}] {s['text']}" for s in data["segments"]]
        return header + "\n\n" + "\n".join(lines)
    return header + "\n\n" + data["transcript"]


def search_youtube(query: str, api_key: str, limit: int = 10) -> str:
    """Search YouTube videos.

    Args:
        query: What to search for.
        api_key: Your GetYouTubeTranscript API key (getyoutubetranscript.com/developers).
        limit: Maximum number of results (1 to 20).

    Returns:
        One line per video: title, channel and watch URL.
    """
    data = _get("/search", {"q": query, "type": "video", "limit": int(limit)}, api_key)["data"]
    out = []
    for item in data.get("video_results", []):
        channel = (item.get("channel") or {}).get("name", "")
        out.append(f"{item.get('title', '')} - {channel} - {item.get('link', '')}")
    return "\n".join(out) or "No results."


with gr.Blocks(title="YouTube Transcript (GetYouTubeTranscript)") as demo:
    gr.Markdown(
        "# YouTube Transcript\n"
        "Get any YouTube video's transcript, or search YouTube, with your "
        "[GetYouTubeTranscript](https://getyoutubetranscript.com) API key. "
        "This Space is also an MCP server: add `/gradio_api/mcp/` to its URL in your MCP client."
    )
    key = gr.Textbox(label="GetYouTubeTranscript API key", type="password", placeholder="sk_live_...")
    with gr.Tab("Transcript"):
        video = gr.Textbox(label="YouTube URL or video ID")
        language = gr.Textbox(label="Caption language (optional)", placeholder="en")
        stamps = gr.Checkbox(label="Timestamps")
        out1 = gr.Textbox(label="Transcript", lines=20)
        gr.Button("Get transcript").click(get_transcript, [video, key, language, stamps], out1)
    with gr.Tab("Search"):
        q = gr.Textbox(label="Search YouTube")
        limit = gr.Slider(1, 20, value=10, step=1, label="Results")
        out2 = gr.Textbox(label="Results", lines=12)
        gr.Button("Search").click(search_youtube, [q, key, limit], out2)

if __name__ == "__main__":
    demo.launch(mcp_server=True)
