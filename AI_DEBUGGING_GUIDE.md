# AI Service Debugging Guide

## Issue: AI Services Not Working Despite API Keys Being Set

### Step 1: Restart the Dev Server
**IMPORTANT**: Next.js requires a server restart to load `.env` file changes.

1. Stop the current dev server (Ctrl+C in the terminal)
2. Restart: `npm run dev`

### Step 2: Test API Connections
I've created a test endpoint to verify your API keys work:

**Visit:** `http://localhost:3000/api/ai/test` (or whatever port your server is on)

This will show:
- ✅ If Groq API key is configured and working
- ✅ If Ollama is configured and accessible
- ❌ Any specific error messages

### Step 3: Check Server Logs
When you ask a question in the AI chat, check your server console. You should see:

```
🔑 Environment check: { hasGroqKey: true, ... }
🔄 Attempting Groq API call...
📤 Groq request: { model: '...', ... }
```

If you see errors, they'll tell you exactly what's wrong.

### Step 4: Common Issues

#### Groq Issues:
- **Invalid API Key**: Check if the key starts with `gsk_`
- **Rate Limits**: Groq has rate limits on free tier
- **Network Issues**: Check if you can reach `api.groq.com`

#### Ollama Issues:
- **Local Ollama Not Running**: If using local Ollama, run `ollama serve` in a separate terminal
- **Wrong Base URL**: Check `OLLAMA_BASE_URL` in `.env`
- **Model Not Pulled**: Run `ollama pull mistral:7b` if using local Ollama
- **Cloud Ollama**: If using cloud Ollama, verify the API key format

### Step 5: Verify .env File
Make sure your `.env` file has:
```env
GROQ_API_KEY="gsk_..."
GROQ_MODEL="llama-3.1-70b-versatile"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_API_KEY="..."
OLLAMA_MODEL="mistral:7b"
```

**Note**: No quotes needed around values in `.env` files, but they won't hurt.

### Step 6: Test the Test Endpoint
After restarting, visit: `http://localhost:3000/api/ai/test`

This will show you exactly what's working and what's not.

---

## Current Status

The rule-based fallback is working great and showing real business data! Once we fix the API connections, you'll get even better AI-powered responses.
