module.exports.runtime = {
  handler: async function ({ video, language, timestamps }) {
    try {
      const apiKey = this.runtimeArgs["GETYOUTUBETRANSCRIPT_API_KEY"];
      if (!apiKey) return "GetYouTubeTranscript API key is not set. Add it in this skill's settings (https://getyoutubetranscript.com/developers).";
      if (!video || !String(video).trim()) return "No YouTube video URL or ID was given.";

      const wantTimestamps = String(timestamps || "").toLowerCase() === "true";
      const params = new URLSearchParams({ v: String(video).trim() });
      if (language && String(language).trim()) params.set("language", String(language).trim());
      if (wantTimestamps) params.set("timestamps", "true");

      this.introspect(`Fetching the transcript for ${video}...`);
      const response = await fetch(`https://getyoutubetranscript.com/api/v1/transcript?${params}`, {
        headers: { "x-api-key": apiKey, Accept: "application/json" },
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body || !body.success) {
        const reason = (body && (body.error?.message || body.error || body.message)) || `HTTP ${response.status}`;
        return `Could not get a transcript for ${video}: ${typeof reason === "string" ? reason : JSON.stringify(reason)}`;
      }

      const data = body.data;
      const header = `Transcript of "${data.title}" by ${data.author_name} (caption language: ${data.language_code}, ${data.caption_type || "unknown"} captions, ${data.word_count} words)`;
      if (wantTimestamps && Array.isArray(data.segments)) {
        const lines = data.segments.map((s) => {
          const t = Math.floor(s.start);
          const stamp = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
          return `[${stamp}] ${s.text}`;
        });
        return `${header}\nLink to a moment: https://www.youtube.com/watch?v=${data.video_id}&t=<seconds>s\n\n${lines.join("\n")}`;
      }
      return `${header}\n\n${data.transcript}`;
    } catch (error) {
      return `GetYouTubeTranscript skill failed: ${error.message}`;
    }
  },
};
