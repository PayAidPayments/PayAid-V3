# Voice Components Usage Guide

## Overview

The voice interface components provide Speech-to-Text (STT) and Text-to-Speech (TTS) functionality with Hindi/Hinglish support.

## Components

### VoiceInput

Voice recording and transcription component.

**Location:** `components/VoiceInput.tsx`

**Usage:**
```tsx
import { VoiceInput } from '@/components/VoiceInput'

function MyComponent() {
  const handleTranscript = (text: string, language: string) => {
    console.log('Transcript:', text)
    console.log('Language:', language)
  }

  return (
    <VoiceInput
      onTranscript={handleTranscript}
      onError={(error) => console.error(error)}
      autoDetectLanguage={true}
    />
  )
}
```

**Props:**
- `onTranscript?: (text: string, language: string) => void` - Callback when transcription completes
- `onError?: (error: Error) => void` - Error handler
- `autoDetectLanguage?: boolean` - Enable automatic language detection (default: true)
- `className?: string` - Additional CSS classes

**Features:**
- Browser-based audio recording
- Automatic transcription via Whisper
- Language detection (English, Hindi, Hinglish)
- Real-time transcript display
- Loading and error states

---

### VoiceOutput

Text-to-speech synthesis and playback component.

**Location:** `components/VoiceOutput.tsx`

**Usage:**
```tsx
import { VoiceOutput } from '@/components/VoiceOutput'

function MyComponent() {
  return (
    <VoiceOutput
      text="Hello, this is a test"
      language="en"
      speed={1.0}
      onPlay={() => console.log('Playing')}
      onEnd={() => console.log('Finished')}
    />
  )
}
```

**Props:**
- `text: string` - Text to synthesize
- `language?: string` - Language code (en, hi, hinglish)
- `voiceId?: string` - Specific voice ID (optional)
- `speed?: number` - Playback speed (default: 1.0)
- `onPlay?: () => void` - Callback when playback starts
- `onPause?: () => void` - Callback when paused
- `onEnd?: () => void` - Callback when playback ends
- `className?: string` - Additional CSS classes
- `autoPlay?: boolean` - Auto-play when text changes (default: false)

**Features:**
- Text-to-speech synthesis via Coqui TTS
- Language-aware voice selection
- Playback controls
- Error handling

---

## API Endpoint

### POST /api/ai/voice/process

Unified endpoint for STT and TTS.

**STT (Speech-to-Text):**
```typescript
const formData = new FormData()
formData.append('audio', audioBlob, 'recording.webm')
formData.append('autoDetect', 'true')

const response = await fetch('/api/ai/voice/process', {
  method: 'POST',
  body: formData
})

const data = await response.json()
// { transcript: string, language: string, confidence: number }
```

**TTS (Text-to-Speech):**
```typescript
const response = await fetch('/api/ai/voice/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'synthesize',
    text: 'Hello world',
    language: 'en',
    speed: 1.0
  })
})

const data = await response.json()
// { audioUrl: string, language: string, voiceId: string }
```

---

## Language Support

### Hindi/Hinglish Detection

The `hindi-support.ts` utility provides:

- **Language Detection:** Automatically detects Hindi, Hinglish, or English
- **Voice Selection:** Maps language to appropriate TTS voice
- **Text Normalization:** Normalizes Hinglish text for better processing

**Usage:**
```typescript
import { detectHindiOrHinglish, getLanguageCode, getTTSVoiceId } from '@/lib/voice-agent/hindi-support'

const detection = detectHindiOrHinglish('मैं English में बोल रहा हूं')
// { isHindi: false, isHinglish: true, detectedLanguage: 'hinglish', confidence: 0.7 }

const languageCode = getLanguageCode(detection) // 'hi'
const voiceId = getTTSVoiceId(languageCode) // 'hi-IN'
```

---

## Demo Page

A complete demo is available at `/dashboard/voice-demo`.

**Features:**
- Interactive voice input testing
- Text-to-speech testing
- Language detection display
- Usage instructions

---

## Browser Requirements

- **Microphone Access:** Required for voice input
- **MediaRecorder API:** Supported in modern browsers
- **Audio Playback:** Standard HTML5 audio support

**Supported Browsers:**
- Chrome/Edge (recommended)
- Firefox
- Safari (with limitations)

---

## Troubleshooting

### Microphone Not Working
1. Check browser permissions (Settings > Privacy > Microphone)
2. Ensure HTTPS (required for microphone access in production)
3. Check browser console for errors

### Transcription Fails
1. Verify Whisper service is running
2. Check API endpoint is accessible
3. Ensure audio format is supported (webm/opus)

### TTS Not Playing
1. Verify Coqui TTS service is running
2. Check audio URL is valid
3. Ensure browser supports audio playback

---

## Integration Examples

### Chat Interface with Voice
```tsx
function ChatWithVoice() {
  const [messages, setMessages] = useState([])
  
  return (
    <div>
      <VoiceInput
        onTranscript={(text) => {
          setMessages([...messages, { role: 'user', text }])
        }}
      />
      {messages.map(msg => (
        <div key={msg.id}>
          {msg.text}
          <VoiceOutput text={msg.text} language="auto" />
        </div>
      ))}
    </div>
  )
}
```

### Voice Commands
```tsx
function VoiceCommands() {
  return (
    <VoiceInput
      onTranscript={(text, language) => {
        if (text.includes('open')) {
          // Handle voice command
        }
      }}
    />
  )
}
```

---

## Performance Notes

- **STT Latency:** ~2-5 seconds depending on audio length
- **TTS Latency:** ~1-3 seconds depending on text length
- **Language Detection:** Real-time, minimal overhead
- **Browser Compatibility:** Modern browsers only

---

## Security

- All audio processing happens server-side
- No audio data is stored permanently
- Authentication required for API access
- CORS protection enabled

---

## Next Steps

1. Test components in `/dashboard/voice-demo`
2. Integrate into your application
3. Customize voice settings per use case
4. Add error handling for production
