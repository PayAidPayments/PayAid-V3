# Hugging Face Image Generation Integration ✅

## Overview

Hugging Face Inference API now supports **image generation** in addition to text/chat! This means you can use the same API key for both chat and image generation.

## ✅ What's Added

1. **Image Generation Support** in `lib/ai/huggingface.ts`
   - `textToImage()` method
   - Supports style, size, and quality parameters
   - Uses Hugging Face Inference API (cloud-based)

2. **Integration in Image Generation Route**
   - Added to fallback chain in `app/api/ai/generate-image/route.ts`
   - Works automatically when other services aren't available

3. **Environment Configuration**
   - `HUGGINGFACE_API_KEY` - Same key used for chat and images
   - `HUGGINGFACE_IMAGE_MODEL` - Optional, defaults to `ByteDance/SDXL-Lightning`

## 🚀 Quick Setup

### Step 1: Add Image Model (Optional)

If you already have `HUGGINGFACE_API_KEY` set up for chat, you're almost done! Just optionally add:

```env
HUGGINGFACE_IMAGE_MODEL="ByteDance/SDXL-Lightning"
```

### Step 2: That's It!

The same API key works for both chat and image generation. No additional setup needed!

## 📋 Supported Models

### Recommended (Free Tier):

1. **ByteDance/SDXL-Lightning** (Default)
   - Fast generation
   - Good quality
   - Free tier friendly

2. **black-forest-labs/FLUX.1-Krea-dev**
   - High quality images
   - Realistic generation
   - May have rate limits on free tier

3. **ByteDance/Hyper-SD**
   - High performance
   - Fast inference
   - Good for production

## 🎨 How It Works

### Fallback Chain for Images:

```
Self-Hosted → Google AI Studio → Hugging Face Inference API → Error
```

1. **Self-Hosted** (if `USE_AI_GATEWAY=true`)
2. **Google AI Studio** (if tenant has API key)
3. **Hugging Face Inference API** (if `HUGGINGFACE_API_KEY` is set) ✅ **NEW!**
4. **Error** (if none configured)

### Features Supported:

- ✅ Custom prompts
- ✅ Style selection (realistic, artistic, cartoon, minimalist, vintage, modern)
- ✅ Size options (square, portrait, landscape)
- ✅ Automatic style enhancement
- ✅ Error handling with helpful messages

## 🧪 Testing

1. **Go to:** http://localhost:3000/dashboard/marketing/social/create-image

2. **Generate an image:**
   - Enter a prompt: "A modern business professional working on a laptop"
   - Select a style (optional)
   - Choose size (optional)
   - Click "Generate Image"

3. **Check the response:**
   - Look for `service: 'huggingface-inference'` in the response
   - Image should be generated successfully

## 💡 Benefits

### Compared to Self-Hosted:
- ✅ No Docker setup required
- ✅ No model downloads (30-60 minutes)
- ✅ No GPU required
- ✅ Works immediately
- ✅ No infrastructure costs

### Compared to Google AI Studio:
- ✅ Uses same API key as chat
- ✅ No separate setup needed
- ✅ Good fallback option
- ✅ Multiple model options

## ⚙️ Configuration

### Full `.env` Setup:

```env
# Chat and Image Generation (same key!)
HUGGINGFACE_API_KEY="hf_your_token_here"

# Chat Model (optional)
HUGGINGFACE_MODEL="google/gemma-2-2b-it"

# Image Model (optional, defaults to ByteDance/SDXL-Lightning)
HUGGINGFACE_IMAGE_MODEL="ByteDance/SDXL-Lightning"
```

## 🔄 Current Status

- ✅ Chat integration working
- ✅ Image generation integration working
- ✅ Same API key for both
- ✅ Automatic fallback chain
- ✅ Error handling

## 📚 More Information

- Hugging Face Models: https://huggingface.co/models
- Image Generation Docs: https://huggingface.co/docs/api-inference/en/tasks/text-to-image
- API Token: https://huggingface.co/settings/tokens

---

**Note:** The first request to a model may take 30-60 seconds while the model loads. Subsequent requests will be faster.
