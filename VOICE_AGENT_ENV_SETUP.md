# Voice Agent - Environment Variables Setup

## ✅ **Required for Creating Agents (Basic CRUD)**

These are **already in your `.env`** - you just need to make sure they're set:

```env
# Database (REQUIRED)
DATABASE_URL="postgresql://user:password@localhost:5432/payaid_v3?schema=public"

# JWT (REQUIRED for authentication)
JWT_SECRET="your-secret-key-change-in-production"
```

**That's it!** You can create and manage voice agents with just these two.

---

## 🔧 **Required for Full Functionality (Making Calls)**

To actually **make voice calls**, you need these services running:

### **1. LLM Service (Required for generating responses)**

**Option A: Ollama (Free, Recommended)**
```env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"
```
**Start with:** `docker-compose -f docker-compose.ollama.yml up -d`

**Option B: Groq (Fast, Paid)**
```env
GROQ_API_KEY="your-groq-api-key"
GROQ_MODEL="llama-3.1-8b-instant"
```

**Option C: OpenAI (Paid)**
```env
OPENAI_API_KEY="your-openai-api-key"
```

### **2. TTS/STT Service (Required for speech)**

**AI Gateway (Free, Self-Hosted)**
```env
AI_GATEWAY_URL="http://localhost:8000"
USE_AI_GATEWAY="true"
```
**Start with:** `docker-compose -f docker-compose.ai-services.yml up -d`

### **3. Knowledge Base (Optional, for RAG)**

**Chroma Vector DB (Free)**
```env
CHROMA_URL="http://localhost:8001"
```
**Start with:** `docker-compose -f docker-compose.ai-services.yml up -d chroma`

---

## 🌐 **Optional: Regional Language TTS**

### **Bhashini TTS (Paid, High Quality)**
```env
BHASHINI_API_KEY="your-bhashini-api-key"
```
Get from: https://pay.bhashini.ai/services/bhashini-o1esd

### **IndicParler-TTS (Free, Self-Hosted)**
```env
INDICPARLER_TTS_URL="http://localhost:7862"
```
Self-hosted alternative for Indian languages

---

## 📋 **Quick Setup Checklist**

### **Minimum (Just to Create Agents):**
- ✅ `DATABASE_URL` - Already set
- ✅ `JWT_SECRET` - Already set
- ✅ Run `npx prisma generate` (fix the lock issue first)

### **For Testing Voice Calls:**
- ✅ `OLLAMA_BASE_URL` - Start Ollama Docker
- ✅ `AI_GATEWAY_URL` - Start AI Gateway Docker
- ✅ `USE_AI_GATEWAY="true"`

### **For Knowledge Base:**
- ✅ `CHROMA_URL` - Start Chroma Docker

---

## 🚀 **Quick Start Commands**

```bash
# 1. Start all services (if you want full functionality)
docker-compose -f docker-compose.ai-services.yml up -d
docker-compose -f docker-compose.ollama.yml up -d

# 2. Verify services are running
docker ps

# 3. Check your .env file has these (at minimum):
# DATABASE_URL
# JWT_SECRET
# OLLAMA_BASE_URL (if using Ollama)
# AI_GATEWAY_URL (if using TTS/STT)
```

---

## ⚠️ **Current Issue**

Right now, you're getting the Prisma lock error. **You don't need any additional env variables** - you just need to:

1. **Fix Prisma lock** (close everything, run `npx prisma generate`)
2. **Then you can create agents** (even without TTS/STT/LLM services)

The services are only needed when you actually **make calls**, not for creating agents.

---

## 🔍 **Check Your Current .env**

Run this to see what's missing:
```bash
# Check if required vars are set
echo "DATABASE_URL: $env:DATABASE_URL"
echo "JWT_SECRET: $env:JWT_SECRET"
```

If these are empty, copy from `env.example` to `.env`.

