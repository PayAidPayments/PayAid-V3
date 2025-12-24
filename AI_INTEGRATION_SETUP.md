# 🤖 AI Integration Setup Guide

## ✅ Integrated AI Services

PayAid V3 now supports **3 AI providers** with automatic fallback:

1. **Ollama** (Local or Cloud) - Primary
2. **Groq** (Fast Inference) - Secondary fallback
3. **OpenAI** (GPT) - Tertiary fallback
4. **Rule-based** - Final fallback (always works)

---

## 🔑 API Keys Setup

### 1. Add to `.env` file:

```env
# Ollama (Local or Cloud)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_API_KEY="c224651ca3cd47f3ae6add8ec0d070c8.OWJ6NzpCY4nU31Ml0Axot9w6"
OLLAMA_MODEL="mistral:7b"

# Groq (Fast Inference API)
GROQ_API_KEY="YOUR_GROQ_API_KEY"  # Get from https://console.groq.com/keys
GROQ_MODEL="llama-3.1-70b-versatile"

# OpenAI (Optional - Fallback)
OPENAI_API_KEY=""
```

### 2. Restart your dev server:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

---

## 🚀 How It Works

### Fallback Chain:
1. **Ollama** → Tries first (local or cloud)
2. **Groq** → Falls back if Ollama fails
3. **OpenAI** → Falls back if Groq fails
4. **Rule-based** → Always works (helpful responses)

### Example Flow:
```
User asks: "What invoices are overdue?"
  ↓
Try Ollama → Success? ✅ Use response
  ↓ (if fails)
Try Groq → Success? ✅ Use response
  ↓ (if fails)
Try OpenAI → Success? ✅ Use response
  ↓ (if fails)
Use Rule-based → ✅ Always works
```

---

## 📋 Available Models

### Ollama Models:
- `mistral:7b` (default)
- `llama2`
- `codellama`
- `phi`
- Any model you've pulled locally

### Groq Models:
- `llama-3.1-70b-versatile` (default) - Fast, powerful
- `mixtral-8x7b-32768` - Large context window
- `gemma-7b-it` - Google's model
- `llama-3.1-8b-instant` - Faster, smaller

### OpenAI Models:
- `gpt-3.5-turbo` (default)
- `gpt-4` (if configured)

---

## 🧪 Testing

1. **Go to:** http://localhost:3000/dashboard/ai

2. **Try these queries:**
   - "What invoices are overdue?"
   - "Show me revenue trends"
   - "What tasks need attention?"
   - "Give me business insights"

3. **Check Insights:**
   - Go to: http://localhost:3000/dashboard/ai/insights
   - Click "Regenerate Insights"

---

## 🔍 Troubleshooting

### If AI chat shows errors:

1. **Check API keys in `.env`:**
   ```bash
   # Verify keys are set
   cat .env | grep -E "(OLLAMA|GROQ|OPENAI)"
   ```

2. **Test Ollama (if local):**
   ```bash
   # Check if Ollama is running
   curl http://localhost:11434/api/tags
   ```

3. **Test Groq API:**
   ```bash
   curl https://api.groq.com/openai/v1/models \
     -H "Authorization: Bearer YOUR_GROQ_API_KEY"
   ```

4. **Check server logs:**
   - Look for "Ollama chat error" or "Groq chat error"
   - The system will automatically fallback

---

## 💡 Features

### AI Chat (`/dashboard/ai`):
- ✅ Natural language queries
- ✅ Context-aware responses
- ✅ Business data integration
- ✅ Automatic fallback chain

### AI Insights (`/dashboard/ai/insights`):
- ✅ Revenue analysis
- ✅ Risk warnings
- ✅ Growth recommendations
- ✅ Urgent actions
- ✅ Operational improvements

---

## 📝 Notes

- **Groq** is very fast (often < 1 second response time)
- **Ollama** is free if running locally
- **Rule-based** fallback ensures the system always responds
- All AI interactions are cached for performance
- API keys are server-side only (secure)

---

## ✅ Status

- ✅ Ollama integration (with API key support)
- ✅ Groq integration
- ✅ OpenAI fallback
- ✅ Rule-based fallback
- ✅ Automatic fallback chain
- ✅ Error handling
- ✅ Caching support

**Your AI is now fully configured! 🎉**
