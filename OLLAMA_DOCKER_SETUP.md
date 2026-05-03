# Ollama Docker Setup Guide

## Problem
Ollama requires 4.0 GiB of system memory, but only 3.4 GiB is available. Docker can help manage resources better and allow you to use smaller models.

## Solution: Run Ollama in Docker

### Option 1: Docker Compose (Recommended)

Create a `docker-compose.yml` file in your project root:

```yaml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: payaid-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0:11434
    # Memory limit (adjust based on your system)
    deploy:
      resources:
        limits:
          memory: 3.2G
        reservations:
          memory: 2G
    restart: unless-stopped
    # Optional: CPU limit
    cpus: '2.0'

volumes:
  ollama-data:
    driver: local
```

### Option 2: Docker Run Command

```bash
docker run -d \
  --name payaid-ollama \
  -p 11434:11434 \
  -v ollama-data:/root/.ollama \
  -e OLLAMA_HOST=0.0.0.0:11434 \
  --memory="3.2g" \
  --cpus="2.0" \
  --restart unless-stopped \
  ollama/ollama:latest
```

---

## Step-by-Step Setup

### Step 1: Install Docker Desktop (if not already installed)

**Windows:**
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install and restart your computer
3. Start Docker Desktop

**Verify Installation:**
```bash
docker --version
docker-compose --version
```

### Step 2: Create Docker Compose File

Create `docker-compose.ollama.yml` in your project root:

```yaml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: payaid-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0:11434
    deploy:
      resources:
        limits:
          memory: 3.2G
        reservations:
          memory: 2G
    restart: unless-stopped
    cpus: '2.0'

volumes:
  ollama-data:
    driver: local
```

### Step 3: Start Ollama Container

```bash
# Start the container
docker-compose -f docker-compose.ollama.yml up -d

# Check if it's running
docker ps | grep ollama

# View logs
docker logs payaid-ollama
```

### Step 4: Pull a Smaller Model (Memory-Efficient)

Since you have limited memory, use smaller models:

**Recommended Models (Smaller Memory Footprint):**

1. **TinyLlama (1.1B)** - ~700MB
   ```bash
   docker exec payaid-ollama ollama pull tinyllama
   ```

2. **Phi-2 (2.7B)** - ~1.6GB
   ```bash
   docker exec payaid-ollama ollama pull phi
   ```

3. **Llama 3.2 1B** - ~1.3GB
   ```bash
   docker exec payaid-ollama ollama pull llama3.2:1b
   ```

4. **Mistral 7B (Quantized)** - ~4GB (might still be too large)
   ```bash
   docker exec payaid-ollama ollama pull mistral:7b-instruct-q4_0
   ```

**For your 3.4GB system, I recommend:**
- `tinyllama` (best for testing)
- `phi` (good balance)
- `llama3.2:1b` (good quality, small size)

### Step 5: Test the Model

```bash
# Test the model
docker exec payaid-ollama ollama run tinyllama "Say hello"

# List available models
docker exec payaid-ollama ollama list
```

### Step 6: Update Your .env File

Your `.env` should already be correct:
```env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="tinyllama"  # or "phi" or "llama3.2:1b"
OLLAMA_API_KEY=""  # Not needed for local
```

### Step 7: Test in Your Application

1. Make sure the container is running:
   ```bash
   docker ps | grep ollama
   ```

2. Test the API:
   ```bash
   curl http://localhost:11434/api/tags
   ```

3. Go to your app: `http://localhost:3000/dashboard/ai/test`
   - Click "Run Test Again"
   - Ollama should now show ✅ Success

---

## Memory-Optimized Configuration

### For Systems with Limited RAM (3-4GB):

```yaml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: payaid-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0:11434
      # Limit GPU layers (if using GPU)
      - OLLAMA_NUM_GPU=0
      # Use CPU only
      - OLLAMA_NUM_PARALLEL=1
    deploy:
      resources:
        limits:
          memory: 2.8G  # Leave some for system
        reservations:
          memory: 1.5G
    restart: unless-stopped
    cpus: '1.5'  # Limit CPU usage

volumes:
  ollama-data:
    driver: local
```

---

## Useful Docker Commands

```bash
# Start Ollama
docker-compose -f docker-compose.ollama.yml up -d

# Stop Ollama
docker-compose -f docker-compose.ollama.yml down

# View logs
docker logs payaid-ollama
docker logs -f payaid-ollama  # Follow logs

# Restart Ollama
docker restart payaid-ollama

# Check container status
docker ps | grep ollama

# Check resource usage
docker stats payaid-ollama

# Pull a model
docker exec payaid-ollama ollama pull tinyllama

# List models
docker exec payaid-ollama ollama list

# Remove a model (to free space)
docker exec payaid-ollama ollama rm mistral:7b

# Test a model
docker exec payaid-ollama ollama run tinyllama "Hello, how are you?"
```

---

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs payaid-ollama

# Check if port is already in use
netstat -ano | findstr :11434

# Stop any existing Ollama processes
# Then restart container
docker-compose -f docker-compose.ollama.yml restart
```

### Out of memory errors
1. Use a smaller model (tinyllama, phi, llama3.2:1b)
2. Reduce memory limit in docker-compose.yml
3. Close other applications
4. Use quantized models (q4_0, q5_0)

### Model download fails
```bash
# Check disk space
docker system df

# Clean up unused images
docker system prune -a

# Check container logs
docker logs payaid-ollama
```

### Connection refused
1. Make sure container is running: `docker ps | grep ollama`
2. Check port mapping: `docker port payaid-ollama`
3. Verify OLLAMA_BASE_URL in .env: `http://localhost:11434`

---

## Model Size Reference

| Model | Size | RAM Needed | Quality |
|-------|------|------------|---------|
| TinyLlama 1.1B | ~700MB | ~1.5GB | Basic |
| Phi-2 2.7B | ~1.6GB | ~3GB | Good |
| Llama 3.2 1B | ~1.3GB | ~2.5GB | Good |
| Mistral 7B (q4) | ~4GB | ~5GB | Excellent |
| Mistral 7B (full) | ~7GB | ~9GB | Excellent |

**For 3.4GB system:** Use TinyLlama, Phi-2, or Llama 3.2 1B

---

## Quick Start Script

Create `start-ollama.ps1` (PowerShell):

```powershell
# Start Ollama Docker container
Write-Host "Starting Ollama in Docker..." -ForegroundColor Green
docker-compose -f docker-compose.ollama.yml up -d

# Wait for container to be ready
Start-Sleep -Seconds 5

# Check status
Write-Host "Checking Ollama status..." -ForegroundColor Green
docker ps | Select-String "ollama"

# Pull tinyllama model (if not already pulled)
Write-Host "Pulling TinyLlama model (smallest, best for limited RAM)..." -ForegroundColor Green
docker exec payaid-ollama ollama pull tinyllama

# List models
Write-Host "Available models:" -ForegroundColor Green
docker exec payaid-ollama ollama list

# Test
Write-Host "Testing Ollama..." -ForegroundColor Green
docker exec payaid-ollama ollama run tinyllama "Say hello"

Write-Host "`n✅ Ollama is ready!" -ForegroundColor Green
Write-Host "Update your .env: OLLAMA_MODEL='tinyllama'" -ForegroundColor Yellow
```

Run it:
```bash
.\start-ollama.ps1
```

---

## Integration with Your Project

### Update .env:
```env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="tinyllama"  # or "phi" or "llama3.2:1b"
OLLAMA_API_KEY=""  # Not needed for local Docker
```

### No code changes needed!
Your existing code in `lib/ai/ollama.ts` will work with Docker Ollama.

---

## Summary

1. ✅ **Create** `docker-compose.ollama.yml`
2. ✅ **Start** container: `docker-compose -f docker-compose.ollama.yml up -d`
3. ✅ **Pull** small model: `docker exec payaid-ollama ollama pull tinyllama`
4. ✅ **Update** `.env`: `OLLAMA_MODEL="tinyllama"`
5. ✅ **Test** at: `http://localhost:3000/dashboard/ai/test`

**Recommended Model for 3.4GB RAM:** `tinyllama` or `phi`
