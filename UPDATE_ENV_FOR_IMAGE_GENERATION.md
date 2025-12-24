# 📝 Update .env File for Image Generation

## 🔧 Manual Update Required

Since `.env` is protected, please update it manually:

---

## ✅ Step 1: Add Image Model to .env

**Open:** `.env` file in your editor

**Find this line:**
```env
HUGGINGFACE_API_KEY="YOUR_HUGGINGFACE_API_KEY"  # Get from https://huggingface.co/settings/tokens
HUGGINGFACE_MODEL="google/gemma-2-2b-it"
```

**Add this line after it:**
```env
HUGGINGFACE_IMAGE_MODEL="black-forest-labs/FLUX.1-dev"
```

**Final result should look like:**
```env
HUGGINGFACE_API_KEY="YOUR_HUGGINGFACE_API_KEY"  # Get from https://huggingface.co/settings/tokens
HUGGINGFACE_MODEL="google/gemma-2-2b-it"
HUGGINGFACE_IMAGE_MODEL="black-forest-labs/FLUX.1-dev"
```

---

## ✅ Step 2: Restart Dev Server

**IMPORTANT:** Environment variables are only loaded when the server starts.

1. **Stop current server:**
   - Go to terminal where `npm run dev` is running
   - Press `Ctrl+C`

2. **Start server again:**
   ```powershell
   npm run dev
   ```

3. **Wait for:**
   ```
   Ready on http://localhost:3000
   ```

---

## ✅ Step 3: Verify API Key

1. **Visit:** https://huggingface.co/settings/tokens
2. **Check:**
   - Your token exists and is active
   - Token is active (not expired)
   - Token has "Read" permissions

3. **If token is invalid:**
   - Create a new token
   - Update `.env`: `HUGGINGFACE_API_KEY="hf_your_new_token"`
   - Restart dev server

---

## ✅ Step 4: Test Image Generation

1. **Go to:** `/dashboard/marketing/social/create-image`
2. **Select:** "Hugging Face (Free - Cloud)" or "Auto (Recommended)"
3. **Enter prompt:** "A business man sitting at his store counter with a beagle beside him and huge indoor plant in the background."
4. **Click:** "Generate Image"

---

## 🔍 Check Server Logs

**After clicking "Generate Image", check your terminal for:**

**Success:**
```
🎨 Hugging Face image generation request: { model: 'black-forest-labs/FLUX.1-dev', ... }
📤 Hugging Face API request: { url: 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev', ... }
✅ Hugging Face image generated successfully
```

**If Error:**
```
❌ Hugging Face API error response: {
  status: [number],
  statusText: [text],
  errorData: [details]
}
```

**Share the error details if it still fails!**

---

## 📋 Summary

**What to do:**
1. ✅ Add `HUGGINGFACE_IMAGE_MODEL="black-forest-labs/FLUX.1-dev"` to `.env`
2. ✅ Restart dev server (`Ctrl+C` then `npm run dev`)
3. ✅ Verify API key at https://huggingface.co/settings/tokens
4. ✅ Try generating an image
5. ✅ Check server logs for detailed error messages

---

**After updating .env and restarting, image generation should work!** 🎨
