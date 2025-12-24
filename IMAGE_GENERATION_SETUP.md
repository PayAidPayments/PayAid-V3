# Image Generation Setup Guide

## Current Status

The image generation feature supports **FREE options only**:

1. **Google AI Studio** (Recommended) - Free, high quality
2. **Hugging Face Inference API** (New!) - Free, cloud-based, no setup required
3. **Self-Hosted (Hugging Face)** - Free, requires Docker setup

---

## Quick Setup

### Option 1: Google AI Studio (Recommended - Free)

1. **Connect Google Account:**
   - Go to: Settings > AI Integrations
   - Click "Connect Google Account"
   - Authorize the application
   - Your Google AI Studio account will be connected

2. **That's it!** No API keys needed, completely free.

**Pricing:** Free (no cost)

---

### Option 2: Hugging Face Inference API (Cloud-based - Free)

1. **Get API Key:**
   - Visit: https://huggingface.co/settings/tokens
   - Create a new token (read access is enough)
   - Copy the token

2. **Add to `.env` file:**
   ```env
   HUGGINGFACE_API_KEY="hf_your_token_here"
   HUGGINGFACE_IMAGE_MODEL="ByteDance/SDXL-Lightning"
   ```

3. **That's it!** No Docker setup needed, works immediately.

**Pricing:** Free tier available

**Recommended Models:**
- `ByteDance/SDXL-Lightning` (default) - Fast, good quality
- `black-forest-labs/FLUX.1-Krea-dev` - High quality
- `ByteDance/Hyper-SD` - High performance

---

### Option 3: Self-Hosted (Hugging Face - Free)

1. **Set environment variable:**
   ```env
   USE_AI_GATEWAY=true
   ```

2. **Start Docker services:**
   ```bash
   docker-compose -f docker-compose.ai-services.yml up -d
   ```

3. **Wait for models to download:**
   - First time: 30-60 minutes
   - Models will be downloaded automatically
   - Check status: `docker-compose -f docker-compose.ai-services.yml ps`

4. **Check service health:**
   ```bash
   curl http://localhost:8000/health
   ```

**Pricing:** Free (runs on your own infrastructure)

---

## How It Works

### Fallback Chain:
1. **Self-Hosted** → Tries first (if `USE_AI_GATEWAY=true` and services running)
2. **Google AI Studio** → Falls back (if tenant has API key configured)
3. **Hugging Face Inference API** → Falls back (if `HUGGINGFACE_API_KEY` is set)
4. **Error Message** → If none are configured

### Supported Features:
- ✅ Custom prompts
- ✅ Style selection (realistic, artistic, cartoon, minimalist, vintage, modern)
- ✅ Size options (square, portrait, landscape)
- ✅ Automatic style enhancement
- ✅ Error handling with helpful messages

---

## Testing

1. **Go to:** http://localhost:3000/dashboard/marketing/social/create-image

2. **Try generating an image:**
   - Enter a prompt: "A modern business professional working on a laptop"
   - Select style: "Realistic"
   - Select size: "Square (1024x1024)"
   - Select provider: "Google AI Studio" or "Self-Hosted"
   - Click "Generate Image"

3. **Expected Result:**
   - Image should generate in 10-30 seconds
   - You can download the image
   - Image URL is provided

---

## Troubleshooting

### Error: "Image generation service not configured"
**Solution:** 
- Connect Google AI Studio in Settings > AI Integrations, OR
- Set `USE_AI_GATEWAY=true` in .env and start Docker services

### Error: "Google AI Studio is not connected"
**Solution:** Go to Settings > AI Integrations and connect your Google account

### Error: "Self-hosted AI service unavailable"
**Solution:** 
- Check if Docker services are running: `docker-compose -f docker-compose.ai-services.yml ps`
- Check service logs: `docker logs payaid-text-to-image`
- Ensure models are downloaded (can take 30-60 minutes on first run)

---

## Best Practices

1. **Be Specific:** Include details about style, colors, composition
2. **Use Style Options:** Leverage the style dropdown for better results
3. **Test Prompts:** Try different prompts to get the best results
4. **Google AI Studio:** Best for quick testing and production use
5. **Self-Hosted:** Best for privacy and unlimited usage

---

## Example Prompts

### Good Prompts:
- ✅ "A modern business professional working on a laptop in a bright office, professional photography style"
- ✅ "A minimalist logo design for a tech startup, clean and modern"
- ✅ "A vintage-style poster advertising a restaurant, retro aesthetic"

### Less Effective:
- ❌ "Business person" (too vague)
- ❌ "Logo" (not specific enough)
- ❌ "Image" (not descriptive)

---

## Summary

✅ **Image generation is fully implemented**
✅ **Supports Google AI Studio (Free) and Self-Hosted (Free)**
✅ **Automatic fallback between services**
✅ **Clear error messages with setup instructions**
✅ **No paid services required**

**Next Step:** Connect Google AI Studio in Settings > AI Integrations, or set up self-hosted services!
