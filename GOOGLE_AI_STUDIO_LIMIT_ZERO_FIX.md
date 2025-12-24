# ⚠️ Google AI Studio "limit: 0" Error - Troubleshooting Guide

## 🎯 Understanding "limit: 0" Error

**Error:** `Quota exceeded for metric: ..., limit: 0`

**What it means:**
- **"limit: 0"** usually indicates that **free tier is not enabled** or **API key is not properly configured**
- This is different from quota exhaustion (which would show a limit > 0)
- Even with no usage, you need free tier to be explicitly enabled

---

## 🔍 Why "limit: 0" Happens

### **Common Causes:**

1. **Free Tier Not Enabled:**
   - Free tier may need to be explicitly enabled in Google Cloud Console
   - Some accounts require enabling free tier before use

2. **API Key Not Linked to Project:**
   - API key might not be associated with a Google Cloud project
   - Project might not have billing enabled (even for free tier)

3. **API Key Permissions:**
   - API key might not have the right permissions
   - Generative Language API might not be enabled

4. **Account/Project Issues:**
   - New account might need activation
   - Project might need free tier activation

---

## 🔧 Troubleshooting Steps

### **Step 1: Check API Key Configuration** ✅

1. **Visit:** https://aistudio.google.com/app/apikey
2. **Check:**
   - API key exists and is active
   - API key is linked to a project
   - Project name is visible

3. **If no project:**
   - Create a new API key
   - Make sure it's linked to a project

---

### **Step 2: Enable Generative Language API** ✅

1. **Visit:** https://console.cloud.google.com/apis/library
2. **Search for:** "Generative Language API"
3. **Enable the API** if not already enabled
4. **Wait a few minutes** for activation

---

### **Step 3: Check Free Tier Status** ✅

1. **Visit:** https://console.cloud.google.com/billing
2. **Check:**
   - Billing account is active (even for free tier)
   - Free tier credits are available
   - No billing issues

**Note:** Some Google Cloud services require billing to be enabled even for free tier usage.

---

### **Step 4: Verify API Key in PayAid** ✅

1. **Go to:** Settings > AI Integrations
2. **Check:**
   - API key is correctly entered
   - No extra spaces or characters
   - Key matches the one from Google AI Studio

3. **Try:**
   - Remove and re-add the API key
   - Create a new API key and try that

---

### **Step 5: Check Usage Dashboard** ✅

1. **Visit:** https://ai.dev/usage?tab=rate-limit
2. **Check:**
   - Project is selected correctly
   - Usage data is visible (or "No data" if truly unused)
   - Rate limits are shown

3. **If "No data available":**
   - This might indicate API key isn't properly linked
   - Try creating a new API key

---

## 🎯 Solutions

### **Option 1: Create New API Key** 🔑 **RECOMMENDED**

**Best for:** API key configuration issues

1. **Visit:** https://aistudio.google.com/app/apikey
2. **Create a new API key:**
   - Click "Create API Key"
   - Select or create a project
   - Copy the new key
3. **Update in PayAid:**
   - Go to Settings > AI Integrations
   - Remove old key
   - Add new key
   - Save
4. **Try generating an image again**

---

### **Option 2: Enable Billing (Free Tier)** 💳

**Best for:** Free tier not activated

1. **Visit:** https://console.cloud.google.com/billing
2. **Enable billing** (even for free tier)
3. **Wait for activation** (usually instant)
4. **Try again**

**Note:** Enabling billing doesn't charge you - it just enables free tier usage.

---

### **Option 3: Use "Auto" Provider** 🔄 **IMMEDIATE SOLUTION**

**Best for:** Need to generate images now

1. **Select "Auto (Recommended)"** in provider dropdown
2. **System will:**
   - Try Google AI Studio first
   - **Automatically fallback to Hugging Face** if Google fails
   - No configuration needed

**Benefits:**
- ✅ Works immediately
- ✅ No waiting for Google AI Studio setup
- ✅ Automatic fallback
- ✅ Free tier available (Hugging Face)

---

### **Option 4: Use Hugging Face Directly** 🎨

**Best for:** Google AI Studio setup is complex

1. **Select "Hugging Face (Free - Cloud)"** in provider dropdown
2. **Uses Hugging Face free tier** directly
3. **No Google AI Studio setup needed**

---

## 📋 Updated Error Message

**Now shows:**
```
⚠️ Google AI Studio API Error

Free tier quota not available. Your API key may not have free tier enabled.

The "limit: 0" error suggests your free tier may not be enabled. Try these steps:

1. Check if your API key is linked to a Google Cloud project
2. Verify free tier is enabled in Google Cloud Console
3. Check API key permissions at https://aistudio.google.com/app/apikey
4. Try creating a new API key if the current one doesn't work
5. Use "Auto" provider to automatically fallback to Hugging Face (free tier available)

Note: Even with no usage, free tier must be explicitly enabled in some cases.
```

---

## 🎯 Best Practice

### **Recommended Approach:**

1. **Try "Auto" Provider First:**
   - ✅ Works immediately
   - ✅ Automatic fallback
   - ✅ No configuration issues

2. **Fix Google AI Studio Later:**
   - Create new API key
   - Enable billing (free tier)
   - Enable Generative Language API
   - Test again

3. **Use Hugging Face as Backup:**
   - Always available
   - Free tier works
   - No setup issues

---

## 📋 Summary

**Your Situation:**
- ⚠️ "limit: 0" error
- ⚠️ No usage data (suggests API key issue)
- ⚠️ Free tier may not be enabled

**Immediate Solution:**
- ✅ **Use "Auto" provider** - works immediately with automatic fallback

**Long-term Fix:**
- ✅ Create new API key
- ✅ Enable billing (free tier)
- ✅ Enable Generative Language API
- ✅ Verify in usage dashboard

---

**The "Auto" provider is your best friend - it works immediately while you fix Google AI Studio setup!** 🎨
