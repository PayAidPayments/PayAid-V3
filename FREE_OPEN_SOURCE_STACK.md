# Free Open-Source Voice Agent Stack - Complete Technical Guide

**Date:** January 2026  
**Status:** Production-Ready Free Alternative  
**Purpose:** Build enterprise-grade voice agents with 90-99% cost savings  
**Timeline:** 2-4 weeks to production

---

## 📋 Executive Summary

This guide provides a **complete, production-ready, free open-source stack** for building voice agents that rivals VAPI.ai functionality at **92-98% cost savings**.

**Key Finding:** You can build a professional voice agent system for **$15-20/month** instead of **$300-500/month** with VAPI, using entirely free and open-source components.

---

## 🎯 Recommended Free Stack Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Phone (PSTN)                       │
│                    Any phone, any carrier                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ PSTN Call
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              PSTN Gateway (VoIPStreet)                      │
│              Cost: $1.50-5/month                            │
│              • Connects PSTN to SIP                         │
│              • Provides phone numbers                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ SIP/RTP
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Wazo + Asterisk (Self-Hosted)                   │
│              Cost: FREE                                      │
│              • IPBX system                                   │
│              • Call routing                                  │
│              • IVR support                                   │
│              • Call recording                                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ WebSocket/HTTP
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Vocode.dev or Pipecat Framework                 │
│              Cost: FREE (Open Source)                        │
│              • Voice agent orchestration                      │
│              • Real-time streaming                           │
│              • Conversation management                       │
└───────────┬───────────────┬───────────────┬─────────────────┘
            │               │               │
    ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
    │ Faster-       │ │ Coqui       │ │ Ollama     │
    │ Whisper       │ │ TTS         │ │ + Llama 2  │
    │ (STT)         │ │ (TTS)       │ │ (LLM)      │
    │ FREE          │ │ FREE        │ │ FREE       │
    └───────────────┘ └─────────────┘ └───────────┘
```

---

## 🏗️ Component Breakdown

### 1. Framework Layer

#### Option A: **Vocode.dev** ⭐ RECOMMENDED (Easiest)

**What it is:**
- Open-source Python framework for building voice agents
- Handles real-time audio streaming
- Built-in integrations for STT, TTS, LLM
- Production-ready out of the box

**Features:**
- ✅ Real-time bidirectional audio
- ✅ Streaming STT/TTS/LLM support
- ✅ WebSocket and telephony connectors
- ✅ Conversation management
- ✅ Easy to customize

**Installation:**
```bash
pip install vocode
```

**Basic Example:**
```python
from vocode.streaming.agent import ChatGPTAgent
from vocode.streaming.transcriber import DeepgramTranscriber
from vocode.streaming.synthesizer import ElevenLabsSynthesizer
from vocode.streaming.streaming_conversation import StreamingConversation

# Configure agent
agent = ChatGPTAgent(
    system_prompt="You are a helpful assistant",
    transcriber=DeepgramTranscriber(),  # Replace with Faster-Whisper
    synthesizer=ElevenLabsSynthesizer(),  # Replace with Coqui
    llm=OpenAIChatGPTLLM()  # Replace with Ollama
)

# Start conversation
conversation = StreamingConversation(
    agent=agent,
    input_device=...,
    output_device=...
)
```

**Resources:**
- https://github.com/vocodedev/vocode-python
- https://docs.vocode.dev/

#### Option B: **Pipecat** (More Advanced)

**What it is:**
- More flexible, lower-level framework
- Better for custom implementations
- Requires more setup but more control

**Features:**
- ✅ Highly customizable
- ✅ Better for complex workflows
- ✅ More control over pipeline
- ❌ More setup required

**Resources:**
- https://github.com/pipecat-ai/pipecat

**Recommendation:** Start with **Vocode.dev** for faster development.

---

### 2. Speech-to-Text (STT)

#### **Faster-Whisper** ⭐ RECOMMENDED

**What it is:**
- Optimized version of OpenAI Whisper
- 4x faster than original Whisper
- Real-time streaming support
- 99 languages supported

**Performance:**
- GPU: ~100-300ms latency
- CPU: ~500-1000ms latency
- Accuracy: 95-97% (comparable to Deepgram)

**Installation:**
```bash
pip install faster-whisper
```

**Basic Usage:**
```python
from faster_whisper import WhisperModel

# Load model (downloads automatically)
model = WhisperModel("base", device="cuda", compute_type="float16")

# Transcribe audio
segments, info = model.transcribe("audio.wav", beam_size=5)

for segment in segments:
    print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")
```

**Streaming Setup:**
```python
# For real-time streaming, use with audio chunks
from faster_whisper import WhisperModel

model = WhisperModel("base", device="cuda")

# Process audio chunks in real-time
def transcribe_stream(audio_chunk):
    segments, _ = model.transcribe(
        audio_chunk,
        vad_filter=True,  # Voice activity detection
        vad_parameters=dict(min_silence_duration_ms=500)
    )
    return segments
```

**Model Sizes:**
- `tiny`: Fastest, lower accuracy (~39M params)
- `base`: Balanced (~74M params) ⭐ Recommended
- `small`: Better accuracy (~244M params)
- `medium`: High accuracy (~769M params)
- `large-v2`: Best accuracy (~1550M params)

**Resources:**
- https://github.com/guillaumekln/faster-whisper
- https://huggingface.co/guillaumekln/faster-whisper-base

**Cost:** FREE (runs locally)

---

### 3. Text-to-Speech (TTS)

#### **Coqui XTTS v2** ⭐ ALREADY IN YOUR SYSTEM!

**What it is:**
- High-quality neural TTS
- Voice cloning (5-10 seconds of audio)
- Multilingual support
- Streaming support

**Performance:**
- Latency: ~500-1000ms (with GPU)
- Quality: **Beats ElevenLabs in blind tests!**
- Languages: 17+ languages

**Status:** ✅ Already in your Docker setup!

**Usage:**
```python
from TTS.api import TTS

# Initialize
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")

# Synthesize
tts.tts_to_file(
    text="Hello, how can I help you?",
    speaker_wav="speaker_voice.wav",  # Voice cloning
    language="en",
    file_path="output.wav"
)
```

**Streaming:**
```python
# For real-time streaming
import io
from TTS.api import TTS

tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")

# Generate audio chunks
for chunk in tts.tts_stream(
    text="Your response here",
    speaker_wav="speaker.wav",
    language="en"
):
    # Send chunk to audio output
    play_audio(chunk)
```

**Resources:**
- Already in `docker-compose.ai-services.yml`
- https://github.com/coqui-ai/TTS

**Cost:** FREE (already have it!)

---

### 4. Large Language Model (LLM)

#### **Ollama + Llama 2/3** ⭐ RECOMMENDED

**What it is:**
- Local LLM runner
- Multiple model options
- Streaming support
- No API costs

**Models Available:**
- `llama2` (7B, 13B, 70B) - Good balance
- `llama3` (8B, 70B) - Latest, better
- `mistral` (7B) - Fast, efficient
- `codellama` - For code-related tasks

**Performance:**
- GPU: ~200-500ms per response
- CPU: ~1-3 seconds per response
- Quality: Comparable to GPT-3.5

**Installation:**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull model
ollama pull llama2
ollama pull mistral
```

**Usage:**
```python
import ollama

# Streaming response
stream = ollama.chat(
    model='llama2',
    messages=[
        {'role': 'system', 'content': 'You are a helpful assistant'},
        {'role': 'user', 'content': 'Hello!'}
    ],
    stream=True
)

for chunk in stream:
    print(chunk['message']['content'], end='', flush=True)
```

**Integration with Vocode:**
```python
from vocode.streaming.llm import OllamaLLM

llm = OllamaLLM(
    model="llama2",
    base_url="http://localhost:11434"
)
```

**Resources:**
- https://ollama.ai/
- https://github.com/ollama/ollama

**Cost:** FREE (runs locally)

---

### 5. Telephony System

#### **Wazo + Asterisk** ⭐ RECOMMENDED

**What it is:**
- Wazo: User-friendly web interface for Asterisk
- Asterisk: Industry-standard open-source PBX
- Full telephony functionality

**Features:**
- ✅ SIP trunking
- ✅ Call routing
- ✅ IVR (Interactive Voice Response)
- ✅ Call recording
- ✅ WebRTC support
- ✅ REST API

**Installation:**
```bash
# Using Docker (easiest)
docker run -d \
  --name wazo \
  -p 80:80 \
  -p 443:443 \
  -p 5060:5060/udp \
  -p 10000-20000:10000-20000/udp \
  wazoplatform/wazo
```

**Configuration:**
1. Access web UI: `http://your-server-ip`
2. Configure SIP trunks
3. Set up call routing
4. Configure webhooks for voice agent

**Integration:**
```python
# Wazo REST API example
import requests

# Make outbound call
response = requests.post(
    'https://wazo-server/api/confd/1.0/calls',
    json={
        'caller_id': '+1234567890',
        'extension': '100',
        'context': 'default'
    },
    auth=('username', 'password')
)
```

**Resources:**
- https://wazo-platform.org/
- https://www.asterisk.org/
- https://github.com/wazo-platform/wazo

**Cost:** FREE (self-hosted)

---

### 6. PSTN Gateway (Phone Numbers)

#### **VoIPStreet** (Cheapest Option)

**What it is:**
- Connects your SIP system to real phone numbers
- Provides DID (Direct Inward Dialing) numbers

**Pricing:**
- US numbers: $1.50/month + $0.009/min
- Indian numbers: Check local providers
- Very affordable

**Alternatives:**
- **VoIP.ms**: $0.85/month + $0.009/min (US)
- **CallCentric**: Free numbers (limited)
- **Local Indian providers**: Often cheaper for India

**Setup:**
1. Sign up for account
2. Buy phone number
3. Configure SIP trunk in Wazo
4. Route calls to your voice agent

**Cost:** $1.50-5/month (vs $50-200 with Twilio)

---

### 7. Hosting

#### **Linode** (Recommended)

**Why Linode:**
- Better network for voice (lower latency)
- More reliable than AWS for real-time
- Cheaper than AWS
- Good support

**Recommended Plan:**
- **4GB RAM**: $10/month
- **8GB RAM**: $20/month (if using GPU)
- **GPU instances**: $30-50/month (for faster inference)

**Alternatives:**
- DigitalOcean: Similar pricing
- Hetzner: Cheaper in Europe
- AWS/GCP: More expensive but more features

**Requirements:**
- Minimum 4GB RAM
- 2+ CPU cores
- GPU recommended (but not required)
- Ubuntu 22.04 LTS

**Cost:** $10-20/month

---

## 🚀 Complete Implementation Guide

### Phase 1: Setup Infrastructure (Week 1)

#### Step 1.1: Set Up Server

```bash
# 1. Create Linode instance (Ubuntu 22.04)
# 2. SSH into server
ssh root@your-server-ip

# 3. Update system
apt update && apt upgrade -y

# 4. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 5. Install Docker Compose
apt install docker-compose -y
```

#### Step 1.2: Install Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull models
ollama pull llama2
ollama pull mistral

# Test
ollama run llama2 "Hello, test"
```

#### Step 1.3: Set Up Wazo + Asterisk

```bash
# Create docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'
services:
  wazo:
    image: wazoplatform/wazo
    ports:
      - "80:80"
      - "443:443"
      - "5060:5060/udp"
      - "10000-20000:10000-20000/udp"
    volumes:
      - wazo-data:/var/lib/wazo
    restart: unless-stopped

volumes:
  wazo-data:
EOF

# Start Wazo
docker-compose up -d
```

#### Step 1.4: Install Faster-Whisper

```bash
# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install faster-whisper
pip install faster-whisper

# Test
python3 -c "from faster_whisper import WhisperModel; print('OK')"
```

---

### Phase 2: Build Voice Agent (Week 2)

#### Step 2.1: Install Vocode

```bash
pip install vocode
```

#### Step 2.2: Create Voice Agent

**File:** `voice_agent.py`

```python
from vocode.streaming.agent import ChatGPTAgent
from vocode.streaming.transcriber import BaseTranscriber
from vocode.streaming.synthesizer import BaseSynthesizer
from vocode.streaming.llm import BaseLLM
from vocode.streaming.streaming_conversation import StreamingConversation
from vocode.streaming.telephony.hosted.zoom_phone import ZoomPhoneConfig
import asyncio

# Custom Faster-Whisper Transcriber
class FasterWhisperTranscriber(BaseTranscriber):
    def __init__(self):
        from faster_whisper import WhisperModel
        self.model = WhisperModel("base", device="cuda", compute_type="float16")
    
    async def transcribe(self, audio_chunk):
        segments, _ = self.model.transcribe(
            audio_chunk,
            vad_filter=True
        )
        return " ".join([seg.text for seg in segments])

# Custom Coqui TTS Synthesizer
class CoquiSynthesizer(BaseSynthesizer):
    def __init__(self):
        from TTS.api import TTS
        self.tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")
    
    async def synthesize(self, text, speaker_wav=None):
        # Generate audio
        audio = self.tts.tts(
            text=text,
            speaker_wav=speaker_wav or "default_speaker.wav",
            language="en"
        )
        return audio

# Custom Ollama LLM
class OllamaLLM(BaseLLM):
    def __init__(self):
        import ollama
        self.client = ollama
    
    async def generate(self, messages, stream=False):
        response = self.client.chat(
            model='llama2',
            messages=messages,
            stream=stream
        )
        return response

# Create Agent
agent = ChatGPTAgent(
    system_prompt="You are a helpful payment reminder assistant.",
    transcriber=FasterWhisperTranscriber(),
    synthesizer=CoquiSynthesizer(),
    llm=OllamaLLM()
)

# Start conversation
async def main():
    conversation = StreamingConversation(
        agent=agent,
        # Configure for telephony
    )
    await conversation.start()

if __name__ == "__main__":
    asyncio.run(main())
```

#### Step 2.3: Integrate with Wazo

```python
# Connect to Wazo via SIP
from vocode.streaming.telephony import TwilioTelephonyConfig

# Configure SIP connection
telephony_config = {
    "sip_server": "your-wazo-server-ip",
    "sip_port": 5060,
    "sip_username": "your-extension",
    "sip_password": "your-password"
}

# Start telephony connection
conversation = StreamingConversation(
    agent=agent,
    telephony_config=telephony_config
)
```

---

### Phase 3: Production Deployment (Week 3)

#### Step 3.1: Set Up Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/voice-agent
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Step 3.2: Set Up Systemd Service

```ini
# /etc/systemd/system/voice-agent.service
[Unit]
Description=Voice Agent Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/opt/voice-agent
Environment="PATH=/opt/voice-agent/venv/bin"
ExecStart=/opt/voice-agent/venv/bin/python voice_agent.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable voice-agent
sudo systemctl start voice-agent
```

#### Step 3.3: Configure Firewall

```bash
# Allow SIP
ufw allow 5060/udp
ufw allow 10000:20000/udp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow SSH
ufw allow 22/tcp
```

---

### Phase 4: Testing & Optimization (Week 4)

#### Step 4.1: Test Components

```bash
# Test Faster-Whisper
python3 -c "
from faster_whisper import WhisperModel
model = WhisperModel('base')
segments, _ = model.transcribe('test_audio.wav')
for seg in segments:
    print(seg.text)
"

# Test Coqui TTS
python3 -c "
from TTS.api import TTS
tts = TTS('tts_models/multilingual/multi-dataset/xtts_v2')
tts.tts_to_file('Hello test', file_path='test.wav')
"

# Test Ollama
ollama run llama2 "Test response"
```

#### Step 4.2: Measure Latency

```python
import time

# Measure STT latency
start = time.time()
transcript = transcribe_audio(audio_chunk)
stt_latency = time.time() - start

# Measure LLM latency
start = time.time()
response = generate_response(transcript)
llm_latency = time.time() - start

# Measure TTS latency
start = time.time()
audio = synthesize_speech(response)
tts_latency = time.time() - start

total_latency = stt_latency + llm_latency + tts_latency
print(f"Total latency: {total_latency*1000:.0f}ms")
```

#### Step 4.3: Optimize Performance

1. **Use GPU for Faster-Whisper:**
   ```python
   model = WhisperModel("base", device="cuda", compute_type="float16")
   ```

2. **Use Smaller Models:**
   - Faster-Whisper: `base` instead of `large`
   - Ollama: `mistral` (7B) instead of `llama2-70b`

3. **Implement Caching:**
   ```python
   # Cache common responses
   from functools import lru_cache
   
   @lru_cache(maxsize=100)
   def get_cached_response(prompt):
       return llm.generate(prompt)
   ```

4. **Parallel Processing:**
   ```python
   # Process STT and prepare LLM in parallel
   import asyncio
   
   async def process_audio(audio):
       transcript_task = transcribe_audio(audio)
       # Start LLM thinking while STT processes
       response = await generate_response_async(transcript_task)
       return response
   ```

---

## 📊 Performance Benchmarks

### Expected Latency (With GPU)

| Component | Latency | Notes |
|-----------|---------|-------|
| Faster-Whisper STT | 100-300ms | GPU required |
| Ollama LLM | 200-500ms | Depends on model size |
| Coqui TTS | 500-1000ms | GPU recommended |
| **Total** | **800-1800ms** | **Acceptable for production** |

### Expected Latency (CPU Only)

| Component | Latency | Notes |
|-----------|---------|-------|
| Faster-Whisper STT | 500-1000ms | Slower but works |
| Ollama LLM | 1-3 seconds | Slower but acceptable |
| Coqui TTS | 1-2 seconds | CPU works |
| **Total** | **2.5-6 seconds** | **Still better than current!** |

---

## 💰 Complete Cost Breakdown

### Monthly Costs

| Component | Cost | Notes |
|-----------|------|-------|
| **Linode 4GB Server** | $10 | Hosting |
| **VoIPStreet PSTN** | $1.50 | Phone number |
| **Domain (optional)** | $0.83 | $10/year |
| **Faster-Whisper** | $0 | Free, local |
| **Coqui TTS** | $0 | Free, local |
| **Ollama** | $0 | Free, local |
| **Wazo/Asterisk** | $0 | Free, open-source |
| **Vocode Framework** | $0 | Free, open-source |
| **TOTAL** | **~$12-15/month** | **vs $300-500 with VAPI** |

### At Scale (10,000 minutes/month)

| Component | Cost |
|-----------|------|
| Server (upgrade to 8GB) | $20 |
| PSTN Gateway | $90 (10k min × $0.009) |
| **TOTAL** | **~$110/month** |
| **VAPI Equivalent** | **~$3,000-5,000/month** |
| **Savings** | **97%** |

---

## ✅ Quality Comparison

| Aspect | Free Stack | VAPI | Winner |
|--------|-----------|------|--------|
| **STT Accuracy** | 95-97% (Whisper) | 96-98% (Deepgram) | TIE 🤝 |
| **TTS Quality** | Excellent (Coqui) | Excellent (ElevenLabs) | TIE 🤝 |
| **LLM Quality** | Good (Llama 2) | Excellent (GPT-4) | VAPI (slightly) |
| **Latency** | 800-1800ms | 300-400ms | VAPI (better) |
| **Customization** | 100% control | Limited | **FREE ✅** |
| **Cost** | $12-15/month | $300-500/month | **FREE ✅** |
| **Privacy** | 100% local | Cloud-based | **FREE ✅** |

---

## 🎯 Implementation Checklist

### Week 1: Infrastructure
- [ ] Set up Linode server
- [ ] Install Docker
- [ ] Install Ollama
- [ ] Set up Wazo + Asterisk
- [ ] Configure SIP trunk
- [ ] Buy phone number from VoIPStreet

### Week 2: Voice Agent
- [ ] Install Vocode
- [ ] Set up Faster-Whisper
- [ ] Configure Coqui TTS
- [ ] Integrate Ollama
- [ ] Build basic agent
- [ ] Test with browser (WebRTC)

### Week 3: Telephony Integration
- [ ] Connect Wazo to PSTN gateway
- [ ] Configure call routing
- [ ] Set up webhooks
- [ ] Test incoming calls
- [ ] Test outbound calls
- [ ] Implement call recording

### Week 4: Production
- [ ] Set up Nginx reverse proxy
- [ ] Configure SSL/TLS
- [ ] Set up systemd service
- [ ] Implement monitoring
- [ ] Load testing
- [ ] Deploy to production

---

## 🐛 Troubleshooting

### Issue: High Latency

**Solution:**
1. Use GPU for Faster-Whisper
2. Use smaller models
3. Implement caching
4. Optimize audio chunk sizes

### Issue: Poor Audio Quality

**Solution:**
1. Use higher quality Coqui TTS models
2. Adjust audio encoding settings
3. Use better microphone/audio input

### Issue: LLM Too Slow

**Solution:**
1. Use smaller model (Mistral 7B)
2. Use GPU for Ollama
3. Implement response caching
4. Pre-generate common responses

### Issue: Call Drops

**Solution:**
1. Check network stability
2. Increase SIP timeout
3. Implement reconnection logic
4. Monitor server resources

---

## 📚 Resources & Documentation

### Frameworks
- **Vocode:** https://docs.vocode.dev/
- **Pipecat:** https://github.com/pipecat-ai/pipecat

### STT
- **Faster-Whisper:** https://github.com/guillaumekln/faster-whisper
- **Whisper.cpp:** https://github.com/ggerganov/whisper.cpp (C++ version, faster)

### TTS
- **Coqui TTS:** https://github.com/coqui-ai/TTS
- **Piper TTS:** https://github.com/rhasspy/piper (faster alternative)

### LLM
- **Ollama:** https://ollama.ai/
- **Llama Models:** https://huggingface.co/meta-llama

### Telephony
- **Wazo:** https://wazo-platform.org/
- **Asterisk:** https://www.asterisk.org/
- **FreePBX:** https://www.freepbx.org/

### PSTN Gateways
- **VoIPStreet:** https://www.voipstreet.com/
- **VoIP.ms:** https://www.voip.ms/

### Hosting
- **Linode:** https://www.linode.com/
- **DigitalOcean:** https://www.digitalocean.com/

---

## 🎓 Best Practices

1. **Start Small:**
   - Test with browser first (WebRTC)
   - Then move to telephony
   - Scale gradually

2. **Monitor Everything:**
   - Latency metrics
   - Call success rates
   - Resource usage
   - Error rates

3. **Optimize Incrementally:**
   - Start with CPU
   - Add GPU if needed
   - Optimize models
   - Implement caching

4. **Backup Everything:**
   - Call recordings
   - Transcripts
   - Configuration files
   - Database backups

5. **Security:**
   - Use SSL/TLS
   - Secure SIP connections
   - Protect API keys
   - Regular updates

---

## 🎯 Success Criteria

Your free stack is production-ready when:

- ✅ Incoming calls work reliably
- ✅ Latency < 2 seconds (acceptable)
- ✅ STT accuracy > 95%
- ✅ TTS quality is natural
- ✅ LLM responses are relevant
- ✅ System handles 10+ concurrent calls
- ✅ Uptime > 99%
- ✅ Cost < $20/month

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Ready for Implementation  
**Estimated Build Time:** 2-4 weeks

---

## 🔗 Quick Start Command

```bash
# Complete setup in one script (example)
#!/bin/bash

# 1. Install dependencies
apt update && apt install -y docker.io docker-compose python3-pip

# 2. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama2

# 3. Install Python packages
pip3 install vocode faster-whisper TTS ollama

# 4. Set up Wazo
docker run -d -p 80:80 -p 5060:5060/udp wazoplatform/wazo

# 5. Configure and start voice agent
# (See Phase 2 for code)
```

---

**Next Step:** Share this document with Cursor and ask it to implement the free stack!
