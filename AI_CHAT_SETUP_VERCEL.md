# 🤖 AI Chat Setup for Vercel

## 🎯 Issue

The AI chat feature is showing: "I'm having trouble connecting to the AI service right now"

**Root Cause:** No AI API keys are configured in Vercel environment variables.

## ✅ Solution: Add AI API Keys to Vercel

### Option 1: Groq API (Recommended - Fastest & Free)

1. **Get Groq API Key:**
   - Go to: https://console.groq.com/keys
   - Sign up (free)
   - Create a new API key
   - Copy the key (starts with `gsk_`)

2. **Add to Vercel:**
   ```powershell
   # Add GROQ_API_KEY
   echo "YOUR_GROQ_API_KEY_HERE" | vercel env add GROQ_API_KEY production
   echo "YOUR_GROQ_API_KEY_HERE" | vercel env add GROQ_API_KEY preview
   
   # Add GROQ_MODEL (optional, has default)
   echo "llama-3.1-8b-instant" | vercel env add GROQ_MODEL production
   echo "llama-3.1-8b-instant" | vercel env add GROQ_MODEL preview
   ```

3. **Or via Vercel Dashboard:**
   - Go to: https://vercel.com/dashboard
   - Select project: **payaid-v3**
   - Settings → Environment Variables
   - Add:
     - **Key:** `GROQ_API_KEY`
     - **Value:** Your Groq API key
     - **Environment:** ✅ Production, ✅ Preview
   - Add:
     - **Key:** `GROQ_MODEL`
     - **Value:** `llama-3.1-8b-instant`
     - **Environment:** ✅ Production, ✅ Preview

---

### Option 2: Hugging Face API (Free Tier Available)

1. **Get Hugging Face API Key:**
   - Go to: https://huggingface.co/settings/tokens
   - Sign up (free)
   - Create a new token
   - Copy the token (starts with `hf_`)

2. **Add to Vercel:**
   ```powershell
   # Add HUGGINGFACE_API_KEY
   echo "YOUR_HF_API_KEY_HERE" | vercel env add HUGGINGFACE_API_KEY production
   echo "YOUR_HF_API_KEY_HERE" | vercel env add HUGGINGFACE_API_KEY preview
   
   # Add models (optional, have defaults)
   echo "google/gemma-2-2b-it" | vercel env add HUGGINGFACE_MODEL production
   echo "ByteDance/SDXL-Lightning" | vercel env add HUGGINGFACE_IMAGE_MODEL production
   ```

---

### Option 3: OpenAI API (Paid)

1. **Get OpenAI API Key:**
   - Go to: https://platform.openai.com/api-keys
   - Sign up and add payment method
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Add to Vercel:**
   ```powershell
   echo "YOUR_OPENAI_API_KEY_HERE" | vercel env add OPENAI_API_KEY production
   echo "YOUR_OPENAI_API_KEY_HERE" | vercel env add OPENAI_API_KEY preview
   ```

---

## 🚀 After Adding API Keys

1. **Redeploy:**
   ```powershell
   vercel --prod --yes
   ```

2. **Or wait for auto-redeploy:**
   - Vercel will automatically trigger a new deployment when environment variables change

3. **Test:**
   - Go to: https://payaid-v3.vercel.app/dashboard/ai/chat
   - Try: "Create a professional LinkedIn post about our business"
   - Should work now! ✅

---

## 📊 Service Priority

The chat service tries AI providers in this order:

1. **Groq** (fastest, recommended)
2. **Ollama** (not available on Vercel - local only)
3. **Hugging Face** (free tier available)
4. **OpenAI** (paid)
5. **Rule-based fallback** (shows error message)

**Recommendation:** Use **Groq** (free, fast, reliable)

---

## ✅ Quick Setup (2 minutes)

**Minimum required for AI chat to work:**

1. Get Groq API key: https://console.groq.com/keys
2. Add to Vercel:
   - Key: `GROQ_API_KEY`
   - Value: Your key
   - Environments: Production, Preview
3. Wait for redeploy (or manually trigger)
4. Test chat feature

---

## 🔍 Verify Configuration

After adding keys, check logs:

```powershell
vercel logs payaid-v3.vercel.app --follow
```

Look for:
- ✅ `🔑 Environment check: { hasGroqKey: true, ... }`
- ✅ `✅ Using Groq AI - Response length: ...`

---

**Status:** ⚠️ Requires API key configuration  
**Time Required:** 2-5 minutes  
**Cost:** Free (Groq or Hugging Face free tier)

