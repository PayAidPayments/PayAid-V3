# TTS Routing Strategy - Implementation Guide

## ✅ **Hybrid Approach Implemented**

The Voice Agent uses a **smart hybrid TTS routing strategy** that automatically selects the best TTS provider based on language.

---

## 🎯 **Routing Logic**

### **1. Coqui XTTS v2** (English & Hindi)
- **Languages:** `en` (English), `hi` (Hindi)
- **Model:** `tts_models/multilingual/multi-dataset/xtts_v2`
- **Quality:** ⭐⭐⭐⭐⭐ (Best quality for these languages)
- **Service:** Self-hosted via AI Gateway
- **Cost:** ₹0 (Free, local)

**Why Coqui for English/Hindi?**
- XTTS v2 has **excellent quality** for English and Hindi
- **Free** and self-hosted (no API costs)
- **Fast** inference (local processing)
- **Voice cloning** support (advanced feature)

### **2. Bhashini TTS** (Regional Languages - Paid)
- **Languages:** `ta`, `te`, `kn`, `mr`, `gu`, `pa`, `bn`, `ml`, `or`, `as`, `ne`, `ur`
- **Quality:** ⭐⭐⭐⭐⭐ (High quality, government-backed)
- **Service:** Cloud API (paid)
- **Cost:** Pay-per-use (check https://pay.bhashini.ai)

**Why Bhashini for Regional Languages?**
- **Best quality** for Indian regional languages
- **Government-backed** platform
- **22 Indian languages** supported
- **Natural-sounding** voices

### **3. IndicParler-TTS** (Regional Languages - Free)
- **Languages:** Same as Bhashini
- **Quality:** ⭐⭐⭐⭐ (Good quality, open-source)
- **Service:** Self-hosted (free)
- **Cost:** ₹0 (Free, local)

**Why IndicParler as Fallback?**
- **100% free** alternative to Bhashini
- **Same language support**
- **Self-hosted** (no external dependencies)
- **Good quality** for regional languages

---

## 🔄 **Fallback Chain**

For **regional languages**, the system tries providers in this order:

```
Regional Language Request
  ├─→ 1. Bhashini TTS (if API key configured)
  │     └─→ ✅ High quality, paid
  │
  ├─→ 2. IndicParler-TTS (if service available)
  │     └─→ ✅ Free, self-hosted
  │
  └─→ 3. Coqui XTTS v2 (fallback)
        └─→ ⚠️ Limited support for regional languages
```

For **English/Hindi**, the system uses:

```
English/Hindi Request
  └─→ Coqui XTTS v2
        └─→ ✅ Best quality, free, local
```

---

## 📋 **Language Support Matrix**

| Language | Code | Coqui XTTS v2 | Bhashini | IndicParler | Recommended |
|----------|------|---------------|----------|-------------|-------------|
| English | `en` | ✅ Excellent | ❌ | ✅ | **Coqui** |
| Hindi | `hi` | ✅ Excellent | ✅ | ✅ | **Coqui** |
| Tamil | `ta` | ⚠️ Limited | ✅ Excellent | ✅ Good | **Bhashini** or **IndicParler** |
| Telugu | `te` | ⚠️ Limited | ✅ Excellent | ✅ Good | **Bhashini** or **IndicParler** |
| Kannada | `kn` | ⚠️ Limited | ✅ Excellent | ✅ Good | **Bhashini** or **IndicParler** |
| Marathi | `mr` | ⚠️ Limited | ✅ Excellent | ✅ Good | **Bhashini** or **IndicParler** |
| Gujarati | `gu` | ⚠️ Limited | ✅ Excellent | ✅ Good | **Bhashini** or **IndicParler** |
| Punjabi | `pa` | ⚠️ Limited | ✅ Excellent | ✅ Good | **Bhashini** or **IndicParler** |
| Bengali | `bn` | ⚠️ Limited | ✅ Excellent | ✅ Good | **Bhashini** or **IndicParler** |
| Malayalam | `ml` | ⚠️ Limited | ✅ Excellent | ✅ Good | **Bhashini** or **IndicParler** |
| Odia | `or` | ❌ | ✅ Excellent | ✅ Good | **Bhashini** or **IndicParler** |
| Assamese | `as` | ❌ | ✅ Excellent | ✅ Good | **Bhashini** or **IndicParler** |
| Nepali | `ne` | ❌ | ✅ Excellent | ✅ Good | **Bhashini** or **IndicParler** |
| Urdu | `ur` | ❌ | ✅ Excellent | ✅ Good | **Bhashini** or **IndicParler** |

---

## 💻 **Code Implementation**

### **Automatic Routing:**

```typescript
import { synthesizeSpeech } from '@/lib/voice-agent/tts'

// English → Coqui XTTS v2
const englishAudio = await synthesizeSpeech('Hello, how can I help you?', 'en')

// Hindi → Coqui XTTS v2
const hindiAudio = await synthesizeSpeech('नमस्ते, मैं आपकी कैसे मदद कर सकता हूं?', 'hi')

// Tamil → Bhashini (if configured) or IndicParler (free)
const tamilAudio = await synthesizeSpeech('வணக்கம், நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?', 'ta')

// Telugu → Bhashini (if configured) or IndicParler (free)
const teluguAudio = await synthesizeSpeech('నమస్కారం, నేను మీకు ఎలా సహాయం చేయగలను?', 'te')
```

### **Manual Provider Selection:**

```typescript
import { synthesizeWithBhashini } from '@/lib/voice-agent/bhashini-tts'
import { synthesizeWithIndicParler } from '@/lib/voice-agent/indicparler-tts'
import { synthesizeSpeech } from '@/lib/voice-agent/tts'

// Force Bhashini (if configured)
if (isBhashiniConfigured()) {
  const audio = await synthesizeWithBhashini('வணக்கம்', {
    language: 'ta',
    voiceId: 'ta-IN-Standard-A',
  })
}

// Force IndicParler (if available)
if (await isIndicParlerAvailable()) {
  const audio = await synthesizeWithIndicParler('வணக்கம்', {
    language: 'ta',
  })
}

// Use automatic routing (recommended)
const audio = await synthesizeSpeech('வணக்கம்', 'ta')
```

---

## ⚙️ **Configuration**

### **Environment Variables:**

```env
# Coqui XTTS v2 (via AI Gateway)
USE_AI_GATEWAY="true"
AI_GATEWAY_URL="http://localhost:8000"

# Bhashini TTS (optional, for regional languages)
BHASHINI_API_KEY="your-api-key-here"

# IndicParler-TTS (optional, free alternative)
INDICPARLER_TTS_URL="http://localhost:7862"
```

### **Docker Compose:**

```yaml
# Coqui XTTS v2 service
text-to-speech:
  environment:
    - MODEL_NAME=tts_models/multilingual/multi-dataset/xtts_v2
```

---

## ✅ **Benefits of This Approach**

1. **Best Quality:** Uses the best TTS for each language
2. **Cost-Effective:** Free for English/Hindi, optional paid for regional
3. **Flexible:** Automatic fallback ensures service always works
4. **Scalable:** Can add more providers easily
5. **Maintainable:** Clear separation of concerns

---

## 🎯 **Summary**

- ✅ **English/Hindi** → **Coqui XTTS v2** (Free, Best Quality)
- ✅ **Regional Languages** → **Bhashini TTS** (Paid, Best Quality) or **IndicParler-TTS** (Free, Good Quality)
- ✅ **Automatic Routing** → System selects best provider
- ✅ **Fallback Chain** → Always works, even if one service fails

**Status:** ✅ **Fully Implemented and Ready to Use!**

