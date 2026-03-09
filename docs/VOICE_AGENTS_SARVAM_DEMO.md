# Sarvam-Powered Voice Demo (Samvaad-like Latency)

The Voice Agents **Demo** page can use [Sarvam AI](https://www.sarvam.ai/) for **LLM + TTS** when `SARVAM_API_KEY` is set. This gives much faster, more reliable responses (similar to [Experience Samvaad](https://www.sarvam.ai/) demos) compared to the default Groq/Ollama + VEXYL/Coqui pipeline.

## Why use Sarvam for the demo?

- **Low latency** – Sarvam’s chat and Bulbul TTS are tuned for Indian languages and typically respond in a few seconds instead of 1–2+ minutes.
- **Same stack as Samvaad** – Same provider as Sarvam’s conversational agents (sub‑500ms class when used end‑to‑end).
- **No local GPU** – No need for Ollama or Coqui; works with just an API key.

## Setup

1. Get an API key from [Sarvam AI](https://www.sarvam.ai/) (API / Developer section).
2. In `.env`:
   ```bash
   SARVAM_API_KEY=your_sarvam_api_subscription_key
   ```
3. Restart the Next.js app. The **Voice Agents → Demo** flow will use Sarvam for that request when the key is present.

## Behaviour

- **When `SARVAM_API_KEY` is set:** Demo uses **Sarvam Chat** (e.g. `sarvam-30b-16k`) for the reply and **Sarvam Bulbul TTS** for speech. If either call fails, the app falls back to the default LLM + TTS path.
- **When `SARVAM_API_KEY` is not set:** Demo uses the existing path (Groq or Ollama for LLM; VEXYL/Coqui/Bhashini for TTS). Ensure `GROQ_API_KEY` is set for faster default responses; without it, Ollama is used and can be very slow.

## APIs used

- **Chat:** `https://api.sarvam.ai/v1/chat/completions` (model: `sarvam-30b-16k`).
- **TTS:** `https://api.sarvam.ai/text-to-speech` (Bulbul v3, WAV).

See [Sarvam API Docs](https://docs.sarvam.ai/) and [Pricing](https://docs.sarvam.ai/api-reference-docs/pricing.mdx) for limits and costs.
