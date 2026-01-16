# Bhashini TTS Setup Guide

## ✅ **Bhashini TTS Integration Complete**

Bhashini TTS has been integrated into the Voice Agent system for high-quality Indian regional language support.

---

## 🎯 **What is Bhashini TTS?**

Bhashini is a government-backed AI platform that provides high-quality Text-to-Speech services for **22 Indian languages**, including:

- **Hindi** (hi)
- **Tamil** (ta)
- **Telugu** (te)
- **Kannada** (kn)
- **Marathi** (mr)
- **Gujarati** (gu)
- **Punjabi** (pa)
- **Bengali** (bn)
- **Malayalam** (ml)
- **Odia** (or)
- **Assamese** (as)
- **Nepali** (ne)
- **Urdu** (ur)
- And more...

---

## 🚀 **Quick Setup**

### **Step 1: Get API Key**

1. Visit: https://pay.bhashini.ai/services/bhashini-o1esd
2. Register and purchase an API key
3. Copy your API key

### **Step 2: Configure Environment**

Add to your `.env` file:

```env
BHASHINI_API_KEY="your-api-key-here"
```

### **Step 3: Test Connection**

```typescript
import { testBhashiniConnection } from '@/lib/voice-agent/bhashini-tts'

const isConnected = await testBhashiniConnection()
console.log('Bhashini TTS:', isConnected ? '✅ Connected' : '❌ Not connected')
```

---

## 📋 **How It Works**

The Voice Agent automatically routes TTS requests based on language:

### **Automatic Routing:**

```typescript
// Regional languages → Bhashini TTS (if configured)
// Falls back to IndicParler-TTS (free) or Coqui TTS

// English/Hindi → Coqui TTS (via AI Gateway)
```

### **Language Support:**

| Language | Code | Bhashini | IndicParler | Coqui |
|----------|------|----------|--------------|-------|
| Hindi | `hi` | ✅ | ✅ | ✅ |
| Tamil | `ta` | ✅ | ✅ | ⚠️ |
| Telugu | `te` | ✅ | ✅ | ⚠️ |
| Kannada | `kn` | ✅ | ✅ | ⚠️ |
| Marathi | `mr` | ✅ | ✅ | ⚠️ |
| Gujarati | `gu` | ✅ | ✅ | ⚠️ |
| Punjabi | `pa` | ✅ | ✅ | ⚠️ |
| Bengali | `bn` | ✅ | ✅ | ⚠️ |
| Malayalam | `ml` | ✅ | ✅ | ⚠️ |
| English | `en` | ❌ | ✅ | ✅ |

---

## 💻 **Usage Examples**

### **Basic Usage:**

```typescript
import { synthesizeSpeech } from '@/lib/voice-agent/tts'

// Automatically uses Bhashini for Tamil
const audio = await synthesizeSpeech(
  'வணக்கம், நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?',
  'ta' // Tamil
)
```

### **With Voice Selection:**

```typescript
import { synthesizeSpeech, getAvailableVoices } from '@/lib/voice-agent/tts'

// Get available voices for Tamil
const voices = getAvailableVoices('ta')
// Returns: ['ta-IN-Standard-A', 'ta-IN-Standard-B']

// Use specific voice
const audio = await synthesizeSpeech(
  'வணக்கம்',
  'ta',
  'ta-IN-Standard-A' // Female voice
)
```

### **Direct Bhashini API:**

```typescript
import { synthesizeWithBhashini, isBhashiniConfigured } from '@/lib/voice-agent/bhashini-tts'

if (isBhashiniConfigured()) {
  const result = await synthesizeWithBhashini('नमस्ते', {
    language: 'hi',
    voiceId: 'hi-IN-Standard-A',
    speed: 1.0,
    pitch: 0,
    volume: 1.0,
  })
  
  console.log('Audio URL:', result.audioUrl)
  console.log('Audio Data:', result.audioData)
  console.log('Duration:', result.duration)
}
```

---

## 🔄 **Fallback Strategy**

The TTS system uses a smart fallback:

1. **Bhashini TTS** (if configured) → High quality, paid
2. **IndicParler-TTS** (if available) → Free, self-hosted
3. **Coqui TTS** (via AI Gateway) → Free, local

This ensures your voice agent always works, even if one service is unavailable.

---

## 💰 **Pricing**

Bhashini TTS is a **paid service**. Check current pricing at:
- https://pay.bhashini.ai/services/bhashini-o1esd

**Free Alternative:** Use **IndicParler-TTS** (self-hosted, 100% free)

---

## 🆓 **Free Alternative: IndicParler-TTS**

If you want to avoid costs, you can use **IndicParler-TTS** instead:

1. **Self-hosted** (100% free)
2. **Same language support** as Bhashini
3. **No API key required**

See: `INDICPARLER_TTS_SETUP.md` (if created)

---

## 📚 **API Documentation**

- **Bhashini TTS API**: https://www.bhashini.ai/tts
- **Payment Portal**: https://pay.bhashini.ai/services/bhashini-o1esd
- **Python Client**: https://pypi.org/project/bhashini-client/

---

## ✅ **Status**

- ✅ Bhashini TTS integration complete
- ✅ Automatic language routing
- ✅ Fallback to free alternatives
- ✅ Voice selection support
- ✅ Error handling

**Ready to use!** Just add your API key to `.env` and start using regional languages.

