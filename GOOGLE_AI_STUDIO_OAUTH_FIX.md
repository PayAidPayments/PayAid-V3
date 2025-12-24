# Fixing Google AI Studio OAuth Error

## Error: `invalid_scope` for `https://www.googleapis.com/auth/generative-language`

This error occurs because the OAuth scope is not properly configured in Google Cloud Console.

## Solution: Add Scope to OAuth Consent Screen

### Step 1: Enable Generative Language API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** > **Library**
4. Search for **"Generative Language API"**
5. Click on it and click **"Enable"**

### Step 2: Add Scope to OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Click **"Edit App"** or **"Add or Remove Scopes"**
3. Click **"Add or Remove Scopes"**
4. In the **"Manually add scopes"** section, add:
   ```
   https://www.googleapis.com/auth/generative-language
   ```
5. Click **"Add to Table"**
6. Click **"Update"**
7. Click **"Save and Continue"**
8. Complete the OAuth consent screen setup if prompted

### Step 3: Verify OAuth Client Configuration

1. Go to **APIs & Services** > **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Verify the **Authorized redirect URIs** include:
   ```
   http://localhost:3000/api/ai/google-ai-studio/callback
   ```
4. If not, add it and click **"Save"**

### Step 4: Test Again

1. Go to **Settings > AI Integrations** in your app
2. Click **"Connect Google Account"**
3. The OAuth flow should now work

---

## Alternative: Use API Key Instead (Simpler)

If OAuth continues to cause issues, you can use an API key instead (also free):

### Get Google AI Studio API Key:

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Select your Google Cloud project
4. Copy the API key

### Add to `.env`:

```env
GOOGLE_AI_STUDIO_API_KEY="your-api-key-here"
```

### Note:
The current implementation uses OAuth. To switch to API keys, the code would need to be updated to use API keys instead of OAuth tokens. However, OAuth is preferred for user-specific access.

---

## Troubleshooting

### Still Getting "invalid_scope" Error?

1. **Check API is enabled:**
   - Go to APIs & Services > Library
   - Search "Generative Language API"
   - Ensure it shows "Enabled"

2. **Check OAuth consent screen:**
   - Go to APIs & Services > OAuth consent screen
   - Verify the scope `https://www.googleapis.com/auth/generative-language` is listed
   - If your app is in "Testing" mode, add your email as a test user

3. **Check OAuth client:**
   - Go to APIs & Services > Credentials
   - Verify your OAuth client ID matches `GOOGLE_CLIENT_ID` in `.env`
   - Verify redirect URI matches exactly

4. **Publish the app (if ready):**
   - If you're ready for production, publish the OAuth consent screen
   - Or add test users if still in testing mode

---

## Quick Fix Checklist

- [ ] Generative Language API is enabled
- [ ] Scope `https://www.googleapis.com/auth/generative-language` is added to OAuth consent screen
- [ ] OAuth consent screen is saved
- [ ] Redirect URI matches exactly: `http://localhost:3000/api/ai/google-ai-studio/callback`
- [ ] Your email is added as a test user (if app is in testing mode)
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- [ ] Dev server has been restarted after adding env variables
