# AI Platforms Configuration Guide

## Supported AI Platforms

PayAid V3 supports multiple AI platforms with automatic fallback mechanisms. Here's what's available and how to configure them:

## 1. **Ollama** (Self-Hosted - Recommended for Local Development)

### Configuration
Add to your `.env` file:
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b
OLLAMA_API_KEY=your_api_key_here  # Optional, for cloud Ollama services
```

### Status
- ✅ **Local Development**: Works if Ollama is running locally
- ❌ **Production**: Fails because `localhost:11434` is not accessible in production (Vercel/serverless)
- **Error**: `ECONNREFUSED 127.0.0.1:11434` (from logs)

### How to Use
1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull mistral:7b`
3. Start Ollama service (usually runs automatically)
4. For production, use a cloud Ollama service or switch to Groq/HuggingFace

---

## 2. **Groq** (Cloud API - Fast Inference)

### Configuration
Add to your `.env` file:
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant  # Default, can be changed
```

### Status
- ⚠️ **Current**: API key appears to be invalid or missing
- **Error**: `401 Unauthorized - Invalid API Key` (from logs)

### How to Get API Key
1. Sign up at: https://console.groq.com
2. Create an API key
3. Add to `.env` file

### Features
- Very fast inference (optimized for speed)
- Free tier available
- Multiple models available

---

## 3. **Hugging Face** (Cloud API - Multiple Models)

### Configuration
Add to your `.env` file:
```env
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
HUGGINGFACE_MODEL=google/gemma-2-2b-it  # Default chat model
HUGGINGFACE_IMAGE_MODEL=ByteDance/SDXL-Lightning  # For image generation
```

### Status
- ✅ **Available**: Client is implemented and ready
- ⚠️ **Not Currently Used**: Not integrated into insights API yet

### How to Get API Key
1. Sign up at: https://huggingface.co
2. Go to Settings > Access Tokens
3. Create a new token
4. Add to `.env` file

### Features
- Access to thousands of open-source models
- Image generation support
- Free tier available
- Router endpoint for optimized routing

---

## 4. **OpenAI** (Cloud API - Fallback)

### Configuration
Add to your `.env` file:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Status
- ✅ **Available**: Used as fallback in Ollama client
- ⚠️ **Not Primary**: Only used if Ollama fails

### Features
- High-quality models (GPT-3.5, GPT-4)
- Reliable and well-supported
- Paid service

---

## 5. **Google Gemini (Nano Banana)** (Cloud API)

### Configuration
Add to your `.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Status
- ✅ **Available**: Client implemented in `lib/ai/nanobanana.ts`
- ⚠️ **Not Currently Used**: Not integrated into insights API

### How to Get API Key
1. Go to: https://aistudio.google.com/app/apikey
2. Create an API key
3. Add to `.env` file

---

## Current Connection Status (From Logs)

Based on the production logs you shared:

| Platform | Status | Issue |
|----------|--------|-------|
| **Ollama** | ❌ Failed | `ECONNREFUSED 127.0.0.1:11434` - localhost not accessible in production |
| **Groq** | ❌ Failed | `401 Unauthorized - Invalid API Key` - API key missing or invalid |
| **HuggingFace** | ⚠️ Not Used | Client available but not integrated into insights flow |
| **OpenAI** | ⚠️ Not Used | Available as fallback but not configured |
| **Rule-Based** | ✅ Working | Fallback system generates insights when AI fails |

---

## Recommended Setup for Production

### Option 1: Use Groq (Fastest & Easiest)
```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
```
- Fast inference
- Free tier available
- No self-hosting required

### Option 2: Use HuggingFace (Most Flexible)
```env
HUGGINGFACE_API_KEY=your_hf_api_key
HUGGINGFACE_MODEL=google/gemma-2-2b-it
```
- Access to many models
- Free tier available
- Good for experimentation

### Option 3: Use OpenAI (Most Reliable)
```env
OPENAI_API_KEY=your_openai_api_key
```
- High quality
- Most reliable
- Paid service

### Option 4: Self-Host Ollama (For Privacy)
- Set up Ollama on a server with public IP
- Update `OLLAMA_BASE_URL` to your server URL
- Most cost-effective for high usage

---

## Integration Status

### Currently Integrated
- ✅ **Ollama**: Primary in insights API
- ✅ **Groq**: Fallback in insights API
- ✅ **Rule-Based**: Final fallback (always works)

### Available but Not Integrated
- ⚠️ **HuggingFace**: Client ready, needs integration
- ⚠️ **OpenAI**: Available as fallback in Ollama client
- ⚠️ **Gemini**: Client ready, needs integration

---

## How to Fix Current Issues

### For Local Development:
1. **Install Ollama locally**:
   ```bash
   # Windows: Download from https://ollama.ai
   # Mac: brew install ollama
   # Linux: curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Pull a model**:
   ```bash
   ollama pull mistral:7b
   ```

3. **Verify it's running**:
   ```bash
   curl http://localhost:11434/api/tags
   ```

### For Production:
**IMPORTANT**: `.env.local` only works locally! For production (Vercel), you MUST set environment variables in the Vercel dashboard.

1. **Get a Groq API key** (recommended):
   - Sign up at https://console.groq.com
   - Create an API key
   - **Add to Vercel**: Go to your Vercel project → Settings → Environment Variables
   - Add `GROQ_API_KEY` with your key value
   - **Redeploy** your application for changes to take effect

2. **OR get a HuggingFace API key**:
   - Sign up at https://huggingface.co
   - Go to Settings > Access Tokens
   - Create a new token
   - **Add to Vercel**: Go to your Vercel project → Settings → Environment Variables
   - Add `HUGGINGFACE_API_KEY` with your token
   - **Redeploy** your application

3. **OR use OpenAI**:
   - Get API key from https://platform.openai.com/api-keys
   - **Add to Vercel**: Go to your Vercel project → Settings → Environment Variables
   - Add `OPENAI_API_KEY` with your key
   - **Redeploy** your application

**Note**: After adding environment variables in Vercel, you must redeploy for them to take effect!

---

## Testing Connection

You can test each platform by checking the console logs:

1. **Ollama**: Look for `🔧 OllamaClient initialized`
2. **Groq**: Look for `🔧 GroqClient initialized`
3. **HuggingFace**: Look for `🔧 HuggingFaceClient initialized`

### Debugging API Key Issues

**Check the logs for environment variable status:**
```
[AI Insights] Environment check: {
  hasGroqKey: true/false,
  groqKeyLength: 56,
  groqKeyPrefix: "gsk_abc...",
  ...
}
```

**If `hasGroqKey: false`:**
- Local: Check `.env.local` exists and has `GROQ_API_KEY=...`
- Production: Check Vercel environment variables are set
- Restart dev server / Redeploy after adding variables

**If `hasGroqKey: true` but still getting 401:**
- Verify key starts with `gsk_` (Groq format)
- Check for extra whitespace or quotes
- Verify key is valid at https://console.groq.com
- Key might be expired - generate a new one

If you see errors like:
- `ECONNREFUSED` = Connection failed (Ollama not running or wrong URL)
- `401 Unauthorized` = Invalid API key or key not loaded
- `403 Forbidden` = API key doesn't have required permissions

---

## Next Steps

1. **For immediate fix**: Add `GROQ_API_KEY` to your `.env` file (local) and Vercel environment variables (production)
2. **For better insights**: Consider integrating HuggingFace as an additional option
3. **For privacy**: Set up self-hosted Ollama on a server

The system will automatically fall back to rule-based insights if all AI services fail, so your app will continue working even without AI configured.
