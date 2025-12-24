# Hugging Face Integration Guide

## Overview

There are **two main ways** to use Hugging Face in PayAid V3:

1. **Hugging Face Inference API** (Cloud-based) - For text generation/chat
2. **Self-Hosted Hugging Face** (Docker) - For image generation (already set up)

---

## Method 1: Hugging Face Inference API (Cloud-based) ⭐ Recommended for Chat

### What It Is
- Cloud-based API that provides access to thousands of open-source models
- No setup required - just an API key
- Free tier available with usage-based pricing
- Perfect for text generation, chat, and NLP tasks

### Setup Steps

#### 1. Get API Key
1. Visit: https://huggingface.co/settings/tokens
2. Create a new token (read access is enough)
3. Copy the token

#### 2. Add to `.env` file
```env
HUGGINGFACE_API_KEY="hf_your_token_here"
HUGGINGFACE_MODEL="google/gemma-2-2b-it"
```

**Important:** The router endpoint (`router.huggingface.co`) only supports certain models. Use one of the recommended models below.

#### 3. Recommended Models for Chat

**Free & Fast (Router Endpoint Compatible):**
- `google/gemma-2-2b-it` (default) - ✅ Tested and working
- `Qwen/Qwen2.5-7B-Instruct-1M` - Good for long conversations
- `Qwen/Qwen2.5-Coder-32B-Instruct` - Optimized for code generation

**Better Quality:**
- `Qwen/Qwen3-4B-Thinking-2507` - Strong reasoning abilities
- `deepseek-ai/DeepSeek-R1` - Focused on reasoning
- `zai-org/GLM-4.5` - Versatile text generation

**Note:** Some older models like `mistralai/Mistral-7B-Instruct-v0.2` may not be supported by the router endpoint. If you need a specific model, check if it's available at https://huggingface.co/models and look for "Inference API Providers" in the Deploy section.

### How It Works

The fallback chain is now:
```
Groq → Ollama → Hugging Face → OpenAI → Rule-based
```

When Groq and Ollama fail, it will automatically try Hugging Face Inference API.

### Advantages
- ✅ No setup required
- ✅ Access to thousands of models
- ✅ Free tier available
- ✅ No GPU needed
- ✅ Works immediately

### Disadvantages
- ⚠️ First request may take time (model loading)
- ⚠️ Rate limits on free tier
- ⚠️ Some models require paid tier

---

## Method 2: Self-Hosted Hugging Face (Docker) - Already Set Up

### What It Is
- Runs Hugging Face models on your own infrastructure
- Currently used for **image generation** only
- Requires Docker and GPU (optional but recommended)

### Current Setup
- **Location**: `docker-compose.ai-services.yml`
- **Services**: Image generation, text-to-speech, etc.
- **Status**: Already configured for image generation

### How to Use
```bash
# Start services
docker-compose -f docker-compose.ai-services.yml up -d

# Check status
docker-compose -f docker-compose.ai-services.yml ps
```

### Advantages
- ✅ Complete privacy (data stays local)
- ✅ No API costs
- ✅ Full control over models
- ✅ No rate limits

### Disadvantages
- ⚠️ Requires setup and maintenance
- ⚠️ Needs GPU for good performance
- ⚠️ Higher infrastructure costs

---

## Comparison

| Feature | Inference API | Self-Hosted |
|---------|--------------|-------------|
| **Setup Time** | 2 minutes | 30-60 minutes |
| **Cost** | Free tier + usage | Infrastructure costs |
| **Privacy** | Data sent to HF | Data stays local |
| **Maintenance** | None | You maintain |
| **GPU Required** | No | Recommended |
| **Best For** | Quick start, testing | Production, privacy |

---

## Usage Examples

### Using Inference API (Chat)

1. **Set environment variables:**
   ```env
   HUGGINGFACE_API_KEY="hf_your_token"
   HUGGINGFACE_MODEL="mistralai/Mistral-7B-Instruct-v0.2"
   ```

2. **It will automatically be used** when:
   - Groq fails
   - Ollama is not available
   - You want to test different models

3. **Test it:**
   - Go to your chat interface
   - Ask a question
   - Check the response - it will show `service: 'huggingface'` if used

### Using Self-Hosted (Image Generation)

1. **Start Docker services:**
   ```bash
   docker-compose -f docker-compose.ai-services.yml up -d
   ```

2. **Set environment variable:**
   ```env
   USE_AI_GATEWAY=true
   ```

3. **Use image generation:**
   - Go to: `/dashboard/marketing/social/create-image`
   - Generate images using self-hosted models

---

## Troubleshooting

### Inference API Issues

**Problem:** "Model is loading"
- **Solution:** Wait 30-60 seconds and try again. First request loads the model.

**Problem:** "API key not configured"
- **Solution:** Add `HUGGINGFACE_API_KEY` to your `.env` file

**Problem:** Rate limit errors
- **Solution:** Upgrade to paid tier or use a different model

### Self-Hosted Issues

**Problem:** Services won't start
- **Solution:** Check Docker is running and ports are available

**Problem:** Slow responses
- **Solution:** Use GPU acceleration or switch to Inference API

**Problem:** Out of memory
- **Solution:** Use smaller models or increase Docker memory limits

---

## Recommended Setup

For **most users**, I recommend:

1. **Start with Inference API** (Method 1)
   - Quick setup
   - Free tier available
   - Good for testing

2. **Add Self-Hosted later** (if needed)
   - For image generation (already set up)
   - For privacy-sensitive use cases
   - For production with high volume

---

## Next Steps

1. ✅ Get Hugging Face API key
2. ✅ Add to `.env` file
3. ✅ Test chat functionality
4. ✅ (Optional) Try different models

The integration is complete and ready to use! 🚀
