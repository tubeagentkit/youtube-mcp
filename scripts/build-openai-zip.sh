#!/usr/bin/env bash
# Builds the ZIP uploaded at platform.openai.com/plugins (ChatGPT + Codex plugin directory).
# Only the portable plugin files go in: the manifest, MCP config, skills and assets.
# server/, smithery.yaml, glama.json etc. are for other directories and stay out.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
version="$(node -p "require('$root/plugin.json').version")"
out="$root/dist/youtube-transcript-openai-$version.zip"

node "$root/scripts/check-openai-manifest.mjs"

mkdir -p "$root/dist"
rm -f "$out"
(cd "$root" && zip -qr "$out" plugin.json mcp.json skills assets -x '*.DS_Store')
echo "Built $out"
unzip -l "$out"
