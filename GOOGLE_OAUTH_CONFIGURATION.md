# Google OAuth Configuration - Complete ✅

## Credentials Configured

**Client ID:** `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com`  
**Client Secret:** `GOCSPX-YOUR_CLIENT_SECRET`

⚠️ **Security Note:** Actual credentials are stored in `.env` file (not committed to git)

## Environment Variables Set

The following variables should be added to `.env`:

```env
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-YOUR_CLIENT_SECRET"
APP_URL="http://localhost:3000"
```

**To get your credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Create OAuth 2.0 Client ID (if not already created)
4. Copy the Client ID and Client Secret
5. Add them to your `.env` file

## Redirect URI Configuration

**Important:** Make sure the following redirect URI is added in Google Cloud Console:

### For Local Development:
```
http://localhost:3000/api/ai/google-ai-studio/callback
```

### For Production (when deployed):
```
https://yourdomain.com/api/ai/google-ai-studio/callback
```

## How to Verify in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, ensure:
   - `http://localhost:3000/api/ai/google-ai-studio/callback` is listed

## Next Steps

1. ✅ Environment variables configured
2. ⏳ **Restart the Next.js server** to load new environment variables
3. ⏳ Verify redirect URI in Google Cloud Console
4. ⏳ Test the OAuth flow

## Testing the Integration

1. **Restart the server:**
   ```powershell
   # Stop current server (Ctrl+C in terminal)
   npm run dev
   ```

2. **Connect Google Account:**
   - Go to `http://localhost:3000/dashboard/settings/ai`
   - Click "Connect Google Account"
   - Authorize the application
   - You'll be redirected back with Google AI Studio connected

3. **Generate an Image:**
   - Go to `http://localhost:3000/dashboard/marketing/social/create-image`
   - Select "Google AI Studio (Free)" as provider
   - Enter a prompt and generate

## Troubleshooting

### "OAuth not configured" Error
- ✅ **Fixed:** Credentials are now in `.env`
- **Action:** Restart the server if you see this error

### "redirect_uri_mismatch" Error
- **Cause:** Redirect URI in Google Cloud Console doesn't match
- **Fix:** Add `http://localhost:3000/api/ai/google-ai-studio/callback` to authorized redirect URIs

### "invalid_client" Error
- **Cause:** Client ID or Secret is incorrect
- **Fix:** Verify credentials in `.env` match Google Cloud Console

### Token Refresh Issues
- The system automatically refreshes expired tokens
- If refresh fails, user needs to reconnect in Settings > AI Integrations

## Security Notes

⚠️ **Important:** 
- The `.env` file contains sensitive credentials
- Never commit `.env` to version control (it's in `.gitignore`)
- In production, use environment variables or a secrets manager
- Consider encrypting OAuth tokens in the database (currently stored in plain text for simplicity)

---

**Status:** ✅ Configuration complete  
**Next Action:** Restart the Next.js server to apply changes
