# Self-Hosted AI Services - Quick Start Guide

## ✅ What's Been Created

### 1. Docker Compose Configuration
- **File**: `docker-compose.ai-services.yml`
- **Services**: 5 AI services + Gateway + Redis
- **Networking**: Isolated Docker network
- **Health Checks**: Built-in for all services

### 2. API Gateway
- **Location**: `services/ai-gateway/`
- **Framework**: FastAPI (Python)
- **Features**:
  - Authentication (JWT)
  - Rate limiting (Redis)
  - Usage tracking
  - Health monitoring
  - Request routing

### 3. Individual Service Containers
- **Text to Speech**: `services/text-to-speech/`
- **Speech to Text**: `services/speech-to-text/`
- **Image to Text**: `services/image-to-text/`
- **Text to Image**: Uses Hugging Face Diffusers
- **Image to Image**: Uses Hugging Face Diffusers

### 4. Model Download Scripts
- **Windows**: `scripts/download-ai-models.ps1`
- **Linux/Mac**: `scripts/download-ai-models.sh`

### 5. Next.js Integration
- **Gateway Client**: `lib/ai/gateway.ts`
- **Updated Routes**:
  - `/api/ai/generate-image` (uses gateway)
  - `/api/ai/text-to-speech` (new)
  - `/api/ai/speech-to-text` (new)
  - `/api/ai/image-to-image` (new)
  - `/api/ai/image-to-text` (new)
  - `/api/ai/usage` (new)

### 6. Database Schema
- **New Model**: `AIUsage` (tracks all AI service usage)
- **Relations**: Linked to Tenant

---

## 🚀 Quick Start (5 Steps)

### Step 1: Install Prerequisites
```bash
# Install Docker Desktop
# Install NVIDIA Docker (if using GPU)
# Install Python 3.11+ (for gateway)
```

### Step 2: Download Models
```powershell
# Windows
.\scripts\download-ai-models.ps1

# Linux/Mac
chmod +x scripts/download-ai-models.sh
./scripts/download-ai-models.sh
```

**Time**: 30-60 minutes (depending on internet speed)

### Step 3: Configure Environment
Add to `.env`:
```env
AI_GATEWAY_URL=http://localhost:8000
USE_AI_GATEWAY=true
REDIS_URL=redis://localhost:6379
```

### Step 4: Start Services
```bash
docker-compose -f docker-compose.ai-services.yml up -d
```

**Wait**: 2-5 minutes for services to initialize

### Step 5: Verify
```bash
# Check health
curl http://localhost:8000/health

# Should return:
# {
#   "status": "healthy",
#   "services": { ... }
# }
```

---

## 📋 Service Ports

| Service | Port | Health Check |
|---------|------|--------------|
| AI Gateway | 8000 | `http://localhost:8000/health` |
| Text to Image | 7860 | Internal |
| Text to Speech | 7861 | Internal |
| Speech to Text | 7862 | Internal |
| Image to Image | 7863 | Internal |
| Image to Text | 7864 | Internal |
| Redis | 6379 | Internal |

---

## 🔧 Configuration

### Memory Limits
Edit `docker-compose.ai-services.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 12G  # Adjust based on your system
```

### Model Selection
Edit service Dockerfiles or environment variables:
```env
MODEL_NAME=stabilityai/stable-diffusion-xl-base-1.0
```

### Rate Limits
Edit `services/ai-gateway/main.py`:
```python
limit = 100  # requests per hour
window = 3600  # 1 hour in seconds
```

---

## 🧪 Testing

### 1. Test Gateway Health
```bash
curl http://localhost:8000/health
```

### 2. Test Text to Image (from Next.js)
1. Go to: `http://localhost:3000/dashboard/marketing/social/create-image`
2. Enter prompt: "A modern business office"
3. Click "Generate Image"
4. Should use self-hosted service

### 3. Test via API
```bash
curl -X POST http://localhost:8000/api/text-to-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "style": "realistic",
    "size": "1024x1024"
  }'
```

---

## 📊 Monitoring

### View Logs
```bash
# All services
docker-compose -f docker-compose.ai-services.yml logs -f

# Specific service
docker-compose -f docker-compose.ai-services.yml logs -f ai-gateway
docker-compose -f docker-compose.ai-services.yml logs -f text-to-image
```

### Check Resource Usage
```bash
docker stats
```

### View Usage Statistics
```bash
# Via API
curl http://localhost:8000/api/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Via Database
# Connect to PostgreSQL and query AIUsage table
```

---

## 🐛 Common Issues

### Issue: "Service unhealthy"
**Solution**: Check logs for model loading errors
```bash
docker-compose -f docker-compose.ai-services.yml logs [service-name]
```

### Issue: "Out of memory"
**Solution**: 
1. Reduce number of services running
2. Use quantized models
3. Increase system RAM

### Issue: "Model not found"
**Solution**: 
1. Run model download script
2. Check model paths in volumes
3. Verify model names in environment variables

### Issue: "Gateway connection refused"
**Solution**:
1. Check if gateway is running: `docker ps | grep gateway`
2. Check gateway logs: `docker logs payaid-ai-gateway`
3. Verify port 8000 is not in use

---

## 🔐 Security

### JWT Token
- Gateway validates JWT tokens
- Must match `JWT_SECRET` in `.env`
- Tokens are extracted from `Authorization: Bearer` header

### Rate Limiting
- Per-tenant rate limits
- Stored in Redis
- Configurable per service

### Network Isolation
- Services communicate via Docker network
- Gateway is the only public-facing service
- Internal services not exposed to host

---

## 📈 Scaling

### Horizontal Scaling
```yaml
# Run multiple instances
services:
  text-to-image:
    deploy:
      replicas: 3
```

### Vertical Scaling
- Increase GPU memory limits
- Use larger GPU instances
- Enable model quantization

---

## 💰 Cost Optimization

### 1. Model Quantization
- Use 8-bit or 4-bit quantized models
- Reduces VRAM by 50-75%
- Minimal quality loss

### 2. On-Demand Scaling
- Start services only when needed
- Use cloud GPU spot instances
- Auto-scale based on demand

### 3. Caching
- Cache frequently requested generations
- Use Redis for response caching
- Reduce redundant API calls

---

## 📝 Next Steps

1. **Download models** (if not done)
2. **Start services** (`docker-compose up -d`)
3. **Test from frontend**
4. **Monitor usage**
5. **Optimize based on demand**

---

## 🎯 Success Criteria

✅ All services show "healthy" in `/health` endpoint
✅ Can generate images from frontend
✅ Usage tracking working
✅ Rate limiting active
✅ No errors in logs

**You're all set!** 🚀
