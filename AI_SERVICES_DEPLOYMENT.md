# Self-Hosted AI Services Deployment Guide

## Overview

This guide covers deploying self-hosted AI services using Docker Compose for:
- **Text to Image** (Stable Diffusion XL)
- **Text to Speech** (Coqui TTS)
- **Speech to Text** (Whisper)
- **Image to Image** (Stable Diffusion img2img)
- **Image to Text** (BLIP-2 + OCR)

---

## Prerequisites

### 1. System Requirements
- **OS**: Linux (Ubuntu 20.04+), Windows with WSL2, or macOS
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **GPU**: NVIDIA GPU with CUDA support (recommended)
  - Minimum: 8GB VRAM (for single service)
  - Recommended: 16GB+ VRAM (for multiple services)
- **RAM**: 32GB+ recommended
- **Storage**: 50GB+ free space for models

### 2. Software Installation

#### Docker & Docker Compose
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### NVIDIA Docker (for GPU support)
```bash
# Add NVIDIA Docker repository
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

# Install
sudo apt-get update
sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker
```

### 3. Environment Variables

Add to your `.env` file:
```env
# AI Gateway
AI_GATEWAY_URL=http://localhost:8000
USE_AI_GATEWAY=true

# Database (for usage tracking)
DATABASE_URL=your_postgresql_url

# Redis (for rate limiting)
REDIS_URL=redis://localhost:6379

# JWT Secret (must match your Next.js app)
JWT_SECRET=your_jwt_secret_here
```

---

## Step 1: Download Models

### Option A: Using PowerShell (Windows)
```powershell
cd "d:\Cursor Projects\PayAid V3"
.\scripts\download-ai-models.ps1
```

### Option B: Using Bash (Linux/Mac)
```bash
chmod +x scripts/download-ai-models.sh
./scripts/download-ai-models.sh
```

### Option C: Manual Download
```bash
# Install huggingface-cli
pip install huggingface-hub

# Download each model
huggingface-cli download stabilityai/stable-diffusion-xl-base-1.0 --local-dir models/text-to-image/stable-diffusion-xl
huggingface-cli download openai/whisper-large-v3 --local-dir models/speech-to-text/whisper-large-v3
# ... etc
```

**Note**: Model downloads can take 30-60 minutes depending on your internet speed.

---

## Step 2: Start Services

### Start All Services
```bash
docker-compose -f docker-compose.ai-services.yml up -d
```

### Check Service Status
```bash
docker-compose -f docker-compose.ai-services.yml ps
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.ai-services.yml logs -f

# Specific service
docker-compose -f docker-compose.ai-services.yml logs -f text-to-image
```

---

## Step 3: Verify Health

### Check Gateway Health
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "text-to-image": {"status": "healthy", "response_time": 0.05},
    "text-to-speech": {"status": "healthy", "response_time": 0.03},
    "speech-to-text": {"status": "healthy", "response_time": 0.04},
    "image-to-image": {"status": "healthy", "response_time": 0.05},
    "image-to-text": {"status": "healthy", "response_time": 0.02}
  },
  "timestamp": "2025-12-12T10:00:00.000Z"
}
```

### Test Individual Services
```bash
# Text to Image
curl -X POST http://localhost:8000/api/text-to-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful sunset", "style": "realistic", "size": "1024x1024"}'

# Text to Speech
curl -X POST http://localhost:8000/api/text-to-speech \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test", "language": "en"}'
```

---

## Step 4: Update Next.js Configuration

### 1. Update `.env`
```env
AI_GATEWAY_URL=http://localhost:8000
USE_AI_GATEWAY=true
```

### 2. Restart Next.js Dev Server
```bash
npm run dev
```

### 3. Test from Frontend
- Go to: `http://localhost:3000/dashboard/marketing/social/create-image`
- Try generating an image
- Should use self-hosted service if gateway is available

---

## Service Details

### 1. Text to Image Service
- **Model**: `stabilityai/stable-diffusion-xl-base-1.0`
- **Port**: `7860`
- **VRAM**: 6-12GB
- **Response Time**: 10-30 seconds

### 2. Text to Speech Service
- **Model**: `tts_models/multilingual/multi-dataset/xtts_v2`
- **Port**: `7861`
- **VRAM**: 2-4GB
- **Response Time**: 2-5 seconds

### 3. Speech to Text Service
- **Model**: `openai/whisper-large-v3`
- **Port**: `7862`
- **VRAM**: 2-4GB
- **Response Time**: 5-15 seconds

### 4. Image to Image Service
- **Model**: `stabilityai/stable-diffusion-xl-base-1.0` (img2img mode)
- **Port**: `7863`
- **VRAM**: 6-12GB
- **Response Time**: 10-30 seconds

### 5. Image to Text Service
- **Models**: `Salesforce/blip-2-opt-2.7b` + PaddleOCR
- **Port**: `7864`
- **VRAM**: 4-8GB
- **Response Time**: 2-5 seconds

---

## Usage Tracking

Usage is automatically tracked in:
1. **Redis** (for real-time stats)
2. **PostgreSQL** (for persistent records)

### View Usage via API
```bash
curl http://localhost:8000/api/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### View Usage in Database
```sql
SELECT service, COUNT(*) as count, SUM(tokens) as total_tokens
FROM "AIUsage"
WHERE "tenantId" = 'your-tenant-id'
  AND "createdAt" >= date_trunc('month', CURRENT_DATE)
GROUP BY service;
```

---

## Rate Limiting

Rate limits are configured per tenant:
- **Default**: 100 requests/hour per service
- **Configurable**: Edit `services/ai-gateway/main.py`

### Check Rate Limit Status
Rate limit status is returned in error responses:
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 3600
}
```

---

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose -f docker-compose.ai-services.yml logs [service-name]

# Check GPU availability
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

### Out of Memory
- Reduce number of concurrent services
- Use quantized models
- Increase swap space
- Use smaller models

### Model Download Fails
```bash
# Check disk space
df -h

# Retry download
huggingface-cli download [model-name] --resume-download
```

### Gateway Connection Issues
```bash
# Check gateway health
curl http://localhost:8000/health

# Check service connectivity
docker exec payaid-ai-gateway curl http://text-to-image:7860/health
```

---

## Production Deployment

### 1. Use Cloud GPU Instances
- **AWS**: g4dn.2xlarge or larger
- **Google Cloud**: n1-standard-8 with T4
- **Azure**: NC6s v3 or larger

### 2. Enable HTTPS
- Use reverse proxy (Nginx/Traefik)
- Configure SSL certificates
- Update `AI_GATEWAY_URL` to HTTPS

### 3. Scale Services
```yaml
# In docker-compose.ai-services.yml
services:
  text-to-image:
    deploy:
      replicas: 2  # Run 2 instances
```

### 4. Monitoring
- Add Prometheus metrics
- Set up Grafana dashboards
- Configure alerts

---

## Cost Estimation

### Self-Hosted (Cloud GPU)
- **Instance**: AWS g4dn.2xlarge
- **Cost**: ~$720/month (24/7)
- **Break-even**: 20,000+ images/month

### Per-Request Costs
- Text to Image: ~$0.001-0.005
- Text to Speech: ~$0.0001-0.001
- Speech to Text: ~$0.0005-0.002
- Image to Image: ~$0.001-0.005
- Image to Text: ~$0.0005-0.001

---

## Next Steps

1. ✅ **Download models** (30-60 min)
2. ✅ **Start services** (`docker-compose up -d`)
3. ✅ **Verify health** (`curl http://localhost:8000/health`)
4. ✅ **Update .env** (`USE_AI_GATEWAY=true`)
5. ✅ **Test from frontend**

---

## Support

For issues:
1. Check service logs
2. Verify GPU availability
3. Check model downloads
4. Review gateway health endpoint

**All services are now ready for deployment!** 🚀
