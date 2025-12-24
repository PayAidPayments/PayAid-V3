# Self-Hosted AI Services - Quick Setup Guide

## Quick Start (3 Steps)

### Step 1: Enable in .env
Add to your `.env` file:
```env
USE_AI_GATEWAY=true
AI_GATEWAY_URL=http://localhost:8000
```

### Step 2: Start Services
```bash
docker-compose -f docker-compose.ai-services.yml up -d
```

### Step 3: Wait for Models
Models download automatically on first run (30-60 minutes). Check status:
```bash
docker-compose -f docker-compose.ai-services.yml ps
docker logs payaid-text-to-image
```

## Verify It's Working

### Check Service Status
```bash
# Check all services
docker-compose -f docker-compose.ai-services.yml ps

# Check gateway health
curl http://localhost:8000/health

# Check text-to-image service
curl http://localhost:7860/health
```

### Expected Output
All services should show `Up` status. Health checks should return `200 OK`.

## Requirements

⚠️ **Important**: Self-hosted services require:
- **GPU**: NVIDIA GPU with CUDA (8GB+ VRAM recommended)
- **RAM**: 32GB+ recommended
- **Storage**: 50GB+ free space for models
- **Docker**: 20.10+ with GPU support

If you don't have a GPU, use **Google AI Studio** instead (free, no setup required).

## Troubleshooting

### Services Not Starting
```bash
# Check Docker logs
docker logs payaid-ai-gateway
docker logs payaid-text-to-image

# Check if GPU is available
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

### Models Not Downloading
```bash
# Check download progress
docker logs payaid-text-to-image -f

# Models are downloaded automatically on first container start
# This can take 30-60 minutes depending on internet speed
```

### Port Conflicts
If ports 8000, 7860-7864 are already in use:
```bash
# Check what's using the ports
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/Mac

# Stop conflicting services or change ports in docker-compose.ai-services.yml
```

## Usage

Once services are running:
1. Go to **Marketing > Social Media > Create Image**
2. Select **"Self-Hosted (Hugging Face - Free)"** from provider dropdown
3. Enter your prompt and generate

The system will automatically use your self-hosted services.

## Alternative: Use Google AI Studio (Easier)

If you don't have a GPU or want a simpler setup:
1. Go to **Settings > AI Integrations**
2. Click **"Link Google Gemini"**
3. Follow the 3-step wizard
4. No Docker or GPU required!
