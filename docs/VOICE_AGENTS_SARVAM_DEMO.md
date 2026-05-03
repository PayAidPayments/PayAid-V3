# Voice Demo: Free (Groq) vs Optional Sarvam

The Voice Agents **Demo** works **without any paid subscription**. For similar fast results at **zero cost**, use the free path below. Sarvam is optional (paid) and only used when you set its API key.

---

## Free path (recommended, no cost)

1. **Get a free Groq API key** at [console.groq.com/keys](https://console.groq.com/keys) (no payment required).
2. In `.env` add:
   ```bash
   GROQ_API_KEY=gsk_your_key_here
   ```
3. Restart the app. The demo uses **Groq** for the reply (short, voice-optimized) and your existing TTS (VEXYL, Coqui, or Bhashini if configured).

**Why this is fast:** Groq’s free tier is low-latency. The demo also asks for shorter replies (512 tokens) so the first response returns in a few seconds instead of minutes. Without `GROQ_API_KEY`, the app will not use Ollama for the demo (to avoid long waits) and will show a message asking you to set Groq.

**TTS (free options):** Use self-hosted **VEXYL** or **Coqui** for best quality at no per-call cost; or Bhashini/IndicParler if configured.

---

## Optional: Sarvam (paid, Samvaad-like)

If you have a [Sarvam AI](https://www.sarvam.ai/) subscription, you can set `SARVAM_API_KEY` so the demo uses Sarvam Chat + Bulbul TTS (similar to [Experience Samvaad](https://www.sarvam.ai/) demos). This is **not required**; the free Groq path above is sufficient for good latency.

- **When `SARVAM_API_KEY` is set:** Demo uses Sarvam for LLM + TTS. On failure, it falls back to Groq + your TTS.
- **When not set:** Demo uses Groq (free) + your TTS. You must set `GROQ_API_KEY` for the demo to run.

## APIs used (Sarvam path)

- **Chat:** `https://api.sarvam.ai/v1/chat/completions` (model: `sarvam-30b-16k`).
- **TTS:** `https://api.sarvam.ai/text-to-speech` (Bulbul v3, WAV).

See [Sarvam API Docs](https://docs.sarvam.ai/) and [Pricing](https://docs.sarvam.ai/api-reference-docs/pricing.mdx) for limits and costs.
