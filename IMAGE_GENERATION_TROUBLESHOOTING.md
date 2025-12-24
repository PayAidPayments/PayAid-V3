# 🔍 Image Generation Troubleshooting Guide

## ⚠️ Current Issue

**Error:** "Hugging Face Inference API error" (generic message)

**Status:** 
- ✅ Token is valid and has correct permissions
- ✅ API endpoint is correct
- ✅ Error handling is improved
- ❌ **Need actual error details from server logs**

---

## 🔍 Step 1: Check Server Logs

**The actual error is in your terminal where `npm run dev` is running.**

### **What to Look For:**

After clicking "Generate Image", check your terminal for:

```
❌ Hugging Face API error response: {
  status: [NUMBER],
  statusText: '[TEXT]',
  errorData: { ... },
  errorText: '[FULL ERROR]'
}
```

### **Common Status Codes:**

- **503** = Model is loading (wait and retry)
- **404** = Model not found (wrong model name)
- **401** = Authentication failed (token issue)
- **400** = Bad request (request format issue)
- **429** = Rate limit exceeded (wait a bit)

---

## 🔧 Step 2: Quick Fixes Based on Error

### **If Status is 503 (Model Loading):**

**This is normal!** Models need to "wake up" if unused.

1. **Wait 30-60 seconds**
2. **Try again**
3. The error message will show estimated wait time

---

### **If Status is 404 (Model Not Found):**

**The model name might be wrong.**

1. **Check `.env` file:**
   ```env
   HUGGINGFACE_IMAGE_MODEL="black-forest-labs/FLUX.1-dev"
   ```

2. **Try a different model:**
   ```env
   # Option 1:
   HUGGINGFACE_IMAGE_MODEL="stabilityai/stable-diffusion-xl-base-1.0"
   
   # Option 2:
   HUGGINGFACE_IMAGE_MODEL="ByteDance/SDXL-Lightning"
   ```

3. **Restart dev server** after changing model

---

### **If Status is 401 (Unauthorized):**

**Token might be invalid (unlikely since it's working for chat).**

1. Visit: https://huggingface.co/settings/tokens
2. Verify token is active
3. Check token has "Make calls to Inference Providers" permission

---

### **If Status is 400 (Bad Request):**

**Request format might be wrong.**

1. Check server logs for specific field that's wrong
2. The code should handle this automatically now
3. Share the error details if it persists

---

## 📋 Step 3: Verify Configuration

### **Check .env File:**

Make sure you have:
```env
HUGGINGFACE_API_KEY="YOUR_HUGGINGFACE_API_KEY"  # Get from https://huggingface.co/settings/tokens
HUGGINGFACE_IMAGE_MODEL="black-forest-labs/FLUX.1-dev"
```

### **Verify Server Restarted:**

Environment variables only load at server startup. Make sure you:
1. Stopped the server (`Ctrl+C`)
2. Started it again (`npm run dev`)

---

## 🎯 What We Need From You

**To fix this, please share:**

1. **The full error log from your terminal** - Look for the `❌ Hugging Face API error response:` section
2. **The HTTP status code** - (503, 404, 401, etc.)
3. **The error message** - The actual text from Hugging Face API

**Example of what we need:**
```
❌ Hugging Face API error response: {
  status: 503,
  statusText: 'Service Unavailable',
  errorData: { error: 'Model is loading', estimated_time: 45 },
  errorText: '{"error":"Model is currently loading","estimated_time":45}'
}
```

---

## 🚀 Quick Test

**Try this to see the error:**

1. **Open terminal** where `npm run dev` is running
2. **Go to:** `/dashboard/marketing/social/create-image`
3. **Select:** "Hugging Face (Free - Cloud)"
4. **Enter prompt:** "A simple test image"
5. **Click:** "Generate Image"
6. **Watch terminal** - You'll see the detailed error

---

## 📋 Summary

**Status:**
- ✅ Token is valid
- ✅ Code is fixed
- ⚠️ **Need actual error from server logs**

**Action:**
1. **Check server terminal logs** when you try to generate
2. **Copy the full error message** (the `❌ Hugging Face API error response:` section)
3. **Share it** so we can fix the specific issue

---

**The error details are in your server logs - please check and share!** 🔍
