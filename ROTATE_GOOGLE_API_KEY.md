# Rotate Google AI Studio API Key - URGENT

## ⚠️ CRITICAL: API Key Exposed

**Exposed Key:** `AIzaSyCBViUq8bVuLVGN2gmpVqldYu-bbFybMiM`  
**Status:** Still valid and active  
**Action Required:** Revoke immediately

---

## 🔴 Step 1: Revoke Exposed API Key (DO THIS FIRST)

### **Option A: Revoke via Google AI Studio Dashboard**

1. **Go to Google AI Studio:**
   - Visit: https://aistudio.google.com/app/apikey
   - Sign in with your Google account

2. **Find the Exposed Key:**
   - Look for API key: `AIzaSyCBViUq8bVuLVGN2gmpVqldYu-bbFybMiM`
   - Or check all your API keys

3. **Revoke/Delete the Key:**
   - Click on the API key
   - Click **"Delete"** or **"Revoke"** button
   - Confirm deletion

### **Option B: Revoke via Google Cloud Console**

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/apis/credentials
   - Select your project

2. **Find the API Key:**
   - Look for: `AIzaSyCBViUq8bVuLVGN2gmpVqldYu-bbFybMiM`
   - Or search in the API keys list

3. **Revoke the Key:**
   - Click on the key
   - Click **"Delete"** or **"Restrict key"** → **"Delete"**
   - Confirm deletion

---

## ✅ Step 2: Create New API Key

1. **Go to Google AI Studio:**
   - Visit: https://aistudio.google.com/app/apikey

2. **Create New API Key:**
   - Click **"Create API Key"**
   - Select your Google Cloud project (or create new)
   - Copy the new API key

3. **Secure the New Key:**
   - ✅ Add API key restrictions (if available)
   - ✅ Limit to specific APIs (Generative Language API)
   - ✅ Add IP restrictions if possible
   - ✅ Set usage quotas

---

## 🔧 Step 3: Update Environment Variables

1. **Update `.env` file:**
   ```env
   GOOGLE_AI_STUDIO_API_KEY="YOUR-NEW-API-KEY-HERE"
   ```

2. **Restart your application:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

3. **Test the new key:**
   - Go to Marketing > Social Media > Create Image
   - Try generating an image
   - Verify it works with the new key

---

## 📋 Step 4: Mark GitGuardian Incident as Resolved

**After revoking the old key:**

1. **Go to GitGuardian Dashboard:**
   - Visit: https://dashboard.gitguardian.com
   - Navigate to incident with API key: `AIzaSyCBViUq8bVuLVGN2gmpVqldYu-bbFybMiM`

2. **Mark as Resolved:**
   - Click **"Resolve"** or **"Mark as Resolved"**
   - Select reason: **"Secret rotated/revoked"**
   - Add note: "API key revoked and replaced with new key. Old key no longer valid."

3. **Verify:**
   - GitGuardian should now allow you to mark it as resolved
   - The incident should show as "Resolved"

---

## 🔒 Step 5: Prevent Future Exposure

### **1. Never Commit API Keys**
- ✅ Already using `.env` file (good!)
- ✅ `.env` is in `.gitignore` (verified)
- ✅ Documentation uses placeholders (fixed)

### **2. Use Environment Variables**
- ✅ All keys in `.env` file
- ✅ Never hardcode in source files
- ✅ Use placeholders in documentation

### **3. Add Pre-commit Hooks**
```bash
# Install GitGuardian pre-commit hook
pip install ggshield
ggshield install -m local
```

### **4. Code Review Checklist**
- [ ] No API keys in commits
- [ ] No secrets in documentation
- [ ] All credentials in `.env`
- [ ] `.env` is gitignored

---

## ✅ Verification Checklist

After completing all steps:

- [ ] Old API key revoked/deleted
- [ ] New API key created
- [ ] `.env` file updated with new key
- [ ] Application restarted
- [ ] New key tested and working
- [ ] GitGuardian incident marked as resolved
- [ ] Team notified of key rotation

---

## 🆘 If You Can't Find the Key to Revoke

If you can't find the exposed key in your dashboard:

1. **Check All Projects:**
   - The key might be in a different Google Cloud project
   - Check all projects you have access to

2. **Check API Key Restrictions:**
   - Some keys might be restricted to specific APIs
   - Look in Google Cloud Console → APIs & Services → Credentials

3. **Contact Google Support:**
   - If you can't find it, contact Google Cloud support
   - They can help locate and revoke the key

4. **Alternative: Restrict Instead of Delete:**
   - If you can't delete, restrict the key:
     - Add IP restrictions (only your server IPs)
     - Limit to specific APIs only
     - Set usage quotas to 0

---

## 📝 Important Notes

1. **Immediate Action Required:**
   - The exposed key is still valid and can be used by anyone
   - Revoke it as soon as possible

2. **Application Downtime:**
   - There may be brief downtime while rotating keys
   - Plan for a few minutes of service interruption

3. **Update All Environments:**
   - Update `.env` in development
   - Update environment variables in production (Vercel, etc.)
   - Update any CI/CD pipeline secrets

4. **Team Communication:**
   - Notify your team about the key rotation
   - Share the new key securely (use a password manager)

---

**Status:** ⚠️ URGENT - API key still valid, needs immediate revocation  
**Last Updated:** December 2024

