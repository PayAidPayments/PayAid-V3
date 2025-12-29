# API Key Encryption Fix

## 🐛 Issue

Users were getting encryption errors when trying to save Google AI Studio API keys:
```
❌ Encryption failed - ENCRYPTION_KEY must be a 64-character hexadecimal string
```

## ✅ Fixes Applied

### 1. Added Simple Input Field
**File:** `app/dashboard/settings/ai/page.tsx`
- Added a direct input field for pasting API keys
- Users can now paste keys directly without using the wizard
- Shows encryption message: "🔒 Your key will be encrypted before storing"
- Added "Use Setup Wizard" button as alternative option

### 2. Improved Error Handling
**File:** `app/api/settings/tenant/route.ts`
- Added API key format validation (must start with "AIza")
- Better error messages for encryption failures
- Trims API key before encryption to remove whitespace
- Specific error message for ENCRYPTION_KEY format issues

### 3. Enhanced User Experience
- Clear instructions on how to get API key
- Direct paste option (no wizard required)
- Better error messages with actionable hints
- Shows encryption status before saving

## 🔒 Security Features

1. **Per-Tenant Keys**: Each tenant has their own API key stored in the database
2. **Encryption**: Keys are encrypted using AES-256-CBC before storage
3. **Format Validation**: Validates API key format before saving
4. **Secure Storage**: Keys are never exposed in API responses

## 📝 How It Works

1. User pastes API key in the input field
2. Key is validated (must start with "AIza")
3. Key is trimmed to remove whitespace
4. Key is encrypted using ENCRYPTION_KEY
5. Encrypted key is stored in database (tenant-specific)
6. Key is decrypted only when needed for API calls

## ⚠️ ENCRYPTION_KEY Configuration

The `ENCRYPTION_KEY` must be:
- 64-character hexadecimal string
- Set in Vercel environment variables (Production & Preview)
- Generated with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### To Verify/Fix ENCRYPTION_KEY:

1. **Check current value:**
   ```bash
   vercel env ls | Select-String -Pattern "ENCRYPTION_KEY"
   ```

2. **If needed, regenerate:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Update in Vercel:**
   ```bash
   # Remove old value
   vercel env rm ENCRYPTION_KEY production
   vercel env rm ENCRYPTION_KEY preview
   
   # Add new value (replace with generated key)
   echo "YOUR_64_CHAR_HEX_KEY" | vercel env add ENCRYPTION_KEY production
   echo "YOUR_64_CHAR_HEX_KEY" | vercel env add ENCRYPTION_KEY preview
   ```

4. **Redeploy:**
   ```bash
   vercel --prod --yes
   ```

## ✅ Testing

After deployment, test:
1. Go to: Settings > AI Integrations
2. Paste a Google AI Studio API key (starts with "AIza...")
3. Click "Save API Key"
4. Should see success message
5. Key should be encrypted and stored

## 📋 Notes

- **Unique per tenant**: Each tenant's API key is stored separately
- **Encrypted at rest**: Keys are encrypted before database storage
- **Never exposed**: Keys are never returned in API responses
- **Format validation**: Only valid Google AI Studio keys are accepted

---

**Date:** 2024-12-29  
**Status:** ✅ Fixed and ready for deployment

