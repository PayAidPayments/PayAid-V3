# Google AI Studio Integration Setup

This guide explains how to set up Google AI Studio (Gemini 2.5 Flash Image) with API keys for free image generation.

## Overview

Google AI Studio provides free image generation using Gemini 2.5 Flash Image. Simply get a free API key and add it to your `.env` file - no OAuth setup required!

## Prerequisites

1. A Google account
2. Access to [Google AI Studio](https://aistudio.google.com/)

## Setup Steps

### 1. Get Your Free API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select your Google Cloud project (or create a new one if you don't have one)
5. Copy the API key that's generated

### 2. Configure Environment Variable

Add the API key to your `.env` file:

```env
GOOGLE_AI_STUDIO_API_KEY="[YOUR-API-KEY]"
```

### 3. Restart Your Application

```bash
npm run dev
```

That's it! No OAuth setup, no complex configuration. Just add the API key and you're ready to go.

## Usage

### For Users

1. Go to **Marketing > Social Media > Create Image**
2. Select **"Google AI Studio (Free)"** from the provider dropdown
3. Enter your prompt and generate

Or use **"Auto"** to automatically try Google AI Studio first.

## API Endpoints

- **Generate Image**: `POST /api/ai/google-ai-studio/generate-image`
- **Main Image Generation** (with provider selection): `POST /api/ai/generate-image`

## Image Generation

Users can now select "Google AI Studio" as their provider when generating images:

1. Go to **Marketing > Social Media > Create Image**
2. Select "Google AI Studio (Free)" from the provider dropdown
3. Enter your prompt and generate

Or use "Auto" to automatically try Google AI Studio first.

## Troubleshooting

### "Google AI Studio not configured" Error

- Ensure `GOOGLE_AI_STUDIO_API_KEY` is set in your `.env` file
- Restart your dev server after adding it
- Verify the API key is correct (no extra spaces or quotes)

### "API error" When Generating Images

- Check that your API key is valid
- Verify you haven't exceeded the free tier quota
- Check Google AI Studio dashboard for usage limits
- The API endpoint may need adjustment based on Google's latest API structure

### API Key Not Working

1. Verify the key is correct in `.env`
2. Make sure there are no extra spaces or quotes around the key
3. Restart your dev server
4. Check the server logs for detailed error messages

## Benefits

✅ **Free**: Generous free tier for image generation  
✅ **Simple**: Just add API key to `.env` - no OAuth needed  
✅ **Fast**: Quick setup, no complex configuration  
✅ **Reliable**: Google's infrastructure  
✅ **User-Friendly**: Works immediately after setup  

## Security Notes

⚠️ **Important**: 
- Never commit your API key to version control
- Keep your `.env` file in `.gitignore`
- API keys are server-side only (not exposed to browser)
- Consider adding API key restrictions in Google Cloud Console for production

## Next Steps

1. Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add it to `.env`
3. Restart your dev server
4. Test image generation in **Marketing > Social Media > Create Image**

## Support

If you encounter issues:
1. Check Google AI Studio dashboard for API quotas/limits
2. Verify API key is correct in `.env`
3. Check application logs for detailed error messages
4. Ensure the Generative Language API is enabled in your Google Cloud project (usually automatic)
