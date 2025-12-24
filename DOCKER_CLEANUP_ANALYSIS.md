# 🧹 Docker Cleanup Analysis - What Can Be Removed

## 📊 Current Docker Status

### Running Containers:
- ✅ `payaid-ai-gateway` - AI Gateway (healthy)
- ✅ `payaid-image-to-text` - Image-to-Text (healthy)
- ✅ `payaid-speech-to-text` - Speech-to-Text (healthy)
- ✅ `payaid-text-to-speech` - Text-to-Speech (healthy)
- ✅ `payaid-ollama` - Ollama (for chat)
- ❌ `payaid-postgres` - PostgreSQL (EXITED - not running)
- ❌ `payaid-redis` - Redis (EXITED - not running)

### Docker Images (Size):
- `payaidv3-text-to-speech` - **9.99GB**
- `payaidv3-speech-to-text` - **8.43GB**
- `payaidv3-image-to-text` - **7.88GB**
- `payaidv3-ai-gateway` - **309MB**
- `ollama/ollama` - **6.12GB**
- `postgres:14` - **628MB**
- `redis:6-alpine` - **45.1MB**
- `redis:7-alpine` - **61.2MB**

**Total Docker Images:** ~33GB

---

## 🔍 What's Actually Being Used?

### Condition: Services require `USE_AI_GATEWAY=true` or `AI_GATEWAY_URL` to work

**If `USE_AI_GATEWAY` is NOT set or `false`:**
- ❌ AI Gateway is NOT used
- ❌ Text-to-Speech Docker is NOT used (falls back to cloud/error)
- ❌ Speech-to-Text Docker is NOT used (falls back to cloud/error)
- ❌ Image-to-Text Docker is NOT used (falls back to cloud/error)

**If `USE_AI_GATEWAY=true`:**
- ✅ AI Gateway IS used
- ✅ Text-to-Speech Docker IS used
- ✅ Speech-to-Text Docker IS used
- ✅ Image-to-Text Docker IS used

### Ollama:
- **If using cloud Ollama** (`OLLAMA_BASE_URL` points to cloud): ❌ Docker Ollama NOT needed
- **If using local Ollama** (`OLLAMA_BASE_URL=http://localhost:11434`): ✅ Docker Ollama IS needed

### Postgres & Redis:
- **If containers are EXITED**: You're likely using external instances
- **If using external**: ❌ Docker containers NOT needed

---

## ✅ Safe to Remove (If Not Using)

### 1. **AI Services** (If `USE_AI_GATEWAY` is not set)
**Total Space:** ~26.6GB
- `payaid-ai-gateway` container + image (309MB)
- `payaid-text-to-speech` container + image (9.99GB)
- `payaid-speech-to-text` container + image (8.43GB)
- `payaid-image-to-text` container + image (7.88GB)

### 2. **Ollama** (If using cloud Ollama)
**Total Space:** ~6.12GB
- `payaid-ollama` container + `ollama/ollama` image

### 3. **Postgres & Redis** (If using external instances)
**Total Space:** ~734MB
- `payaid-postgres` container + `postgres:14` image (628MB)
- `payaid-redis` container + `redis:6-alpine` image (45.1MB)
- `redis:7-alpine` image (61.2MB) - unused duplicate

---

## 🎯 Recommended Cleanup Strategy

### Step 1: Check Your .env File

```powershell
# Check if you're using self-hosted services
Select-String -Path ".env" -Pattern "USE_AI_GATEWAY|AI_GATEWAY_URL|OLLAMA_BASE_URL"
```

### Step 2: Based on Results

**If `USE_AI_GATEWAY` is NOT set or `false`:**
→ **Remove ALL AI Docker services** (~26.6GB)

**If `OLLAMA_BASE_URL` points to cloud:**
→ **Remove Ollama Docker** (~6.12GB)

**If Postgres/Redis are external:**
→ **Remove Docker Postgres/Redis** (~734MB)

**Maximum Space to Free:** ~33.4GB

---

## 🚀 Cleanup Commands

### Option 1: Remove Everything (If Not Using Any Docker Services)

```powershell
# Stop all containers
docker stop payaid-ai-gateway payaid-text-to-speech payaid-speech-to-text payaid-image-to-text payaid-ollama payaid-postgres payaid-redis

# Remove all containers
docker rm payaid-ai-gateway payaid-text-to-speech payaid-speech-to-text payaid-image-to-text payaid-ollama payaid-postgres payaid-redis

# Remove all images
docker rmi payaidv3-ai-gateway:latest
docker rmi payaidv3-text-to-speech:latest
docker rmi payaidv3-speech-to-text:latest
docker rmi payaidv3-image-to-text:latest
docker rmi ollama/ollama:latest
docker rmi postgres:14
docker rmi redis:6-alpine
docker rmi redis:7-alpine

# Clean up
docker system prune -a -f
```

### Option 2: Remove Only Unused (Safer)

See the cleanup script for conditional removal based on .env settings.

---

## ⚠️ Before Removing

**Check these in your `.env` file:**
1. `USE_AI_GATEWAY` - If not set or false, AI services are unused
2. `OLLAMA_BASE_URL` - If points to cloud, Docker Ollama is unused
3. `DATABASE_URL` - If points to external DB, Docker Postgres is unused
4. `REDIS_URL` - If points to external Redis, Docker Redis is unused

---

## 📋 Summary

**Potential Space to Free:** Up to **~33.4GB**

**Decision Tree:**
- Not using `USE_AI_GATEWAY`? → Remove AI services (~26.6GB)
- Using cloud Ollama? → Remove Docker Ollama (~6.12GB)
- Using external DB/Redis? → Remove Docker Postgres/Redis (~734MB)
