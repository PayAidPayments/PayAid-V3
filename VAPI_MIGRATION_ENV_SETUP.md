# VAPI Migration - Environment Variables Setup

**Status:** Required for Telephony Implementation  
**Last Updated:** January 2026

---

## 📋 Required Environment Variables

Add these to your `.env` file for the VAPI-style telephony implementation:

### 🔴 CRITICAL - Telephony (Twilio)

```env
# Twilio Account Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_secret_here

# Twilio Phone Number (E.164 format)
TWILIO_PHONE_NUMBER=+1234567890

# Webhook URL (must be publicly accessible)
TWILIO_WEBHOOK_URL=https://your-domain.com/api/v1/voice-agents/twilio/webhook
```

**How to get:**
1. Sign up at https://www.twilio.com
2. Get Account SID and Auth Token from Console Dashboard
3. Create API Key/Secret (recommended over Auth Token)
4. Buy a phone number from Twilio Console
5. Set webhook URL in Twilio Console → Phone Numbers → Configure

---

### 🔴 CRITICAL - Speech-to-Text (Deepgram)

```env
# Deepgram API Key (for real-time streaming STT)
DEEPGRAM_API_KEY=your_deepgram_api_key_here
DEEPGRAM_MODEL=nova-2
```

**How to get:**
1. Sign up at https://www.deepgram.com
2. Get API key from Dashboard
3. Model: `nova-2` (recommended for lowest latency)
4. Alternative models: `nova`, `base`, `enhanced`

**Pricing:** ~$0.0043 per minute (nova-2)

---

### 🔴 CRITICAL - Text-to-Speech (ElevenLabs)

```env
# ElevenLabs API Key (for high-quality streaming TTS)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_DEFAULT_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

**How to get:**
1. Sign up at https://elevenlabs.io
2. Get API key from Profile → API Keys
3. Get Voice ID from Voice Library (or use default)
4. Recommended voice: `Rachel` (21m00Tcm4TlvDq8ikWAM)

**Pricing:** ~$0.18 per 1000 characters (turbo model)

---

### 🔴 CRITICAL - LLM (OpenAI)

```env
# OpenAI API Key (for LLM responses)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo
```

**How to get:**
1. Sign up at https://platform.openai.com
2. Get API key from API Keys section
3. Model: `gpt-4-turbo` (recommended) or `gpt-3.5-turbo` (cheaper)

**Pricing:** ~$0.01 per 1K input tokens, $0.03 per 1K output tokens

---

### 🟡 IMPORTANT - WebSocket Configuration

```env
# Telephony WebSocket Server
TELEPHONY_WEBSOCKET_PORT=3002
TELEPHONY_WEBSOCKET_URL=wss://your-domain.com:3002

# Legacy WebSocket (for browser-based demo)
WEBSOCKET_PORT=3001
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001
```

**Note:** Use `wss://` (secure WebSocket) in production, `ws://` only for localhost.

---

### 🟡 IMPORTANT - Database

```env
# PostgreSQL Database URL
DATABASE_URL=postgresql://user:password@localhost:5432/payaid
```

**Already configured?** Keep your existing `DATABASE_URL`.

---

### 🟡 IMPORTANT - JWT Authentication

```env
# JWT Secret (must match across all services)
JWT_SECRET=your-secret-key-change-in-production-minimum-256-chars
```

**Critical:** This must be the SAME value in:
- Next.js server
- WebSocket server
- Telephony WebSocket server

---

### 🟢 OPTIONAL - AWS S3 (Call Recordings)

```env
# AWS S3 Configuration (for storing call recordings)
AWS_REGION=us-east-1
AWS_S3_BUCKET=payaid-voice-recordings
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

**When needed:** Only if you want to store call recordings in S3.

---

### 🟢 OPTIONAL - Redis (Rate Limiting)

```env
# Redis URL (for rate limiting and caching)
REDIS_URL=redis://localhost:6379
```

**When needed:** For rate limiting API calls and caching.

---

## 📝 Complete .env Template

```env
# ============================================
# TELEPHONY (TWILIO) - REQUIRED
# ============================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_secret_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://your-domain.com/api/v1/voice-agents/twilio/webhook

# ============================================
# SPEECH-TO-TEXT (DEEPGRAM) - REQUIRED
# ============================================
DEEPGRAM_API_KEY=your_deepgram_api_key_here
DEEPGRAM_MODEL=nova-2

# ============================================
# TEXT-TO-SPEECH (ELEVENLABS) - REQUIRED
# ============================================
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_DEFAULT_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# ============================================
# LLM (OPENAI) - REQUIRED
# ============================================
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo

# ============================================
# WEBSOCKET CONFIGURATION
# ============================================
TELEPHONY_WEBSOCKET_PORT=3002
TELEPHONY_WEBSOCKET_URL=wss://your-domain.com:3002
WEBSOCKET_PORT=3001
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001

# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://user:password@localhost:5432/payaid

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET=your-secret-key-change-in-production-minimum-256-chars

# ============================================
# AWS S3 (OPTIONAL - for recordings)
# ============================================
AWS_REGION=us-east-1
AWS_S3_BUCKET=payaid-voice-recordings
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# ============================================
# REDIS (OPTIONAL - for rate limiting)
# ============================================
REDIS_URL=redis://localhost:6379

# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV=development
```

---

## ✅ Verification Checklist

After setting up environment variables:

- [ ] Twilio account created and phone number purchased
- [ ] Deepgram API key obtained
- [ ] ElevenLabs API key obtained
- [ ] OpenAI API key obtained
- [ ] All variables added to `.env` file
- [ ] Webhook URL is publicly accessible (use ngrok for local testing)
- [ ] JWT_SECRET matches across all services
- [ ] Database connection tested
- [ ] Run `npx prisma generate` to update Prisma client
- [ ] Run `npx prisma db push` to apply schema changes

---

## 🧪 Testing Environment Variables

Create a test script to verify all variables are set:

```typescript
// scripts/verify-telephony-env.ts
const required = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'DEEPGRAM_API_KEY',
  'ELEVENLABS_API_KEY',
  'OPENAI_API_KEY',
  'DATABASE_URL',
  'JWT_SECRET'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing environment variables:', missing);
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

Run: `npx tsx scripts/verify-telephony-env.ts`

---

## 📞 Next Steps

1. **Set up all accounts** (Twilio, Deepgram, ElevenLabs, OpenAI)
2. **Add variables to `.env`**
3. **Run database migration**: `npx prisma db push`
4. **Start services**: 
   - `npm run dev` (Next.js)
   - `npm run dev:telephony` (Telephony WebSocket server)
5. **Test with real phone call**

---

**Document Version:** 1.0  
**Last Updated:** January 2026
