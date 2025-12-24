# Text-to-Image Service Investigation Report

## Issue Summary
The text-to-image service is marked as **unhealthy** and not responding to health checks.

## Findings

### 1. Model Loading Status
- **Status:** Model is still loading (incomplete)
- **Model:** `stabilityai/stable-diffusion-xl-base-1.0` (Stable Diffusion XL)
- **Device:** CUDA (GPU detected)
- **Progress:** Loading pipeline components, but never completes

### 2. Container Status
- **Container State:** Running
- **Health Status:** Starting (not yet healthy)
- **CPU Usage:** 380.50% (multi-threaded, high CPU usage during model loading)
- **Memory Usage:** 1.492GiB / 3.676GiB (40.58%)
- **Memory Limit:** 16GB configured, but only 3.676GB available

### 3. Root Cause Analysis

#### Primary Issue: Model Loading Timeout
- The Stable Diffusion XL model is **very large** (~6-7GB)
- Model loading takes **much longer than 120 seconds** (health check start period)
- The service keeps restarting before the model finishes loading
- Health check fails because `/health` endpoint returns "unhealthy" while model is loading

#### Secondary Issues:
1. **Memory Constraints:** Container has 16GB limit configured, but system only has ~3.6GB available
2. **Health Check Too Aggressive:** 120s start period is insufficient for large model loading
3. **No Progress Tracking:** Service doesn't indicate when model loading is complete

### 4. Code Analysis
Looking at `services/text-to-image/server.py`:
- Health endpoint returns `"unhealthy"` if `sdxl_pipeline is None`
- Model loading happens at startup in a try/except block
- If loading fails, pipeline remains `None` and service stays unhealthy
- No retry mechanism for model loading

### 5. Logs Analysis
- Multiple restart attempts visible in logs
- Each restart shows: "Loading SDXL model" → "Loading pipeline components" → Restart
- No completion message ("✅ SDXL model loaded successfully") found
- Model loading gets stuck at various percentages (14%, 29%, 43%, 57%, 71%, 86%)

## Recommendations

### Immediate Fixes

1. **Increase Health Check Start Period**
   - Current: 120s
   - Recommended: 600s (10 minutes) for large model loading
   - Update `docker-compose.ai-services.yml` healthcheck `start_period`

2. **Add Model Loading Status to Health Endpoint**
   - Return "loading" status instead of "unhealthy" during model load
   - This prevents premature health check failures

3. **Check System Resources**
   - Verify GPU availability and memory
   - Ensure sufficient disk space for model cache
   - Check if model download is complete

### Long-term Solutions

1. **Lazy Loading**
   - Load model on first request instead of at startup
   - Return 503 with "model loading" message during initialization

2. **Model Caching**
   - Ensure models are cached in volume (`text-to-image-models`)
   - Verify model files are present before starting service

3. **Resource Monitoring**
   - Add metrics for model loading progress
   - Monitor memory usage during model load
   - Alert if loading takes too long

## Current Status

**Service:** Not functional - model never finishes loading
**Impact:** Text-to-image generation features will not work
**Priority:** Medium (other image services are working)

## Next Steps

1. ✅ Investigation complete
2. ✅ Fix health check configuration (increased to 600s)
3. ✅ Update health endpoint to return "loading" status
4. ✅ Implement background model loading
5. ⏳ Rebuild container with fixes (in progress)
6. ⏳ Restart service and verify
7. ⏳ Test service after fixes

---

**Note:** The text-to-image service requires significant resources (GPU + 16GB+ RAM) and may not work properly on systems with limited resources. Consider using a smaller model or cloud-based service for development.
