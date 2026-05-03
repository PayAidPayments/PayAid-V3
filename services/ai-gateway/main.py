"""
AI Services Gateway - Routes requests to appropriate AI services
Handles authentication, rate limiting, usage tracking, and health checks
"""

from fastapi import FastAPI, HTTPException, Depends, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import httpx
import os
import time
import jwt
from datetime import datetime, timedelta
import redis
from contextlib import asynccontextmanager
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Service URLs
# Note: text-to-image and image-to-image removed - using cloud APIs only
SERVICES = {
    'text-to-speech': os.getenv('TEXT_TO_SPEECH_URL', 'http://text-to-speech:7860'),
    'speech-to-text': os.getenv('SPEECH_TO_TEXT_URL', 'http://speech-to-text:7860'),
    'image-to-text': os.getenv('IMAGE_TO_TEXT_URL', 'http://image-to-text:7860'),
}

# Redis client for rate limiting and caching
redis_client = None
redis_url = os.getenv('REDIS_URL', 'redis://host.docker.internal:6379')
try:
    redis_client = redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=2)
    redis_client.ping()
    logger.info("✅ Redis connected for rate limiting")
except Exception as e:
    logger.warning(f"⚠️ Redis not available: {e}. Rate limiting disabled.")

# JWT secret
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')

app = FastAPI(
    title="PayAid AI Services Gateway",
    description="Gateway for routing AI service requests with authentication and rate limiting",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class TextToImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    style: Optional[str] = "realistic"
    size: Optional[str] = "1024x1024"
    num_inference_steps: Optional[int] = 30
    guidance_scale: Optional[float] = 7.5

class TextToSpeechRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    language: Optional[str] = "en"
    voice: Optional[str] = None
    speed: Optional[float] = 1.0

class SpeechToTextRequest(BaseModel):
    audio_url: Optional[str] = None
    language: Optional[str] = None
    task: Optional[str] = "transcribe"  # transcribe or translate

class ImageToImageRequest(BaseModel):
    image_url: str = Field(..., min_length=1)
    prompt: str = Field(..., min_length=1, max_length=1000)
    strength: Optional[float] = 0.8
    num_inference_steps: Optional[int] = 30

class ImageToTextRequest(BaseModel):
    image_url: str = Field(..., min_length=1)
    task: Optional[str] = "caption"  # caption, ocr, or both

class HealthResponse(BaseModel):
    status: str
    services: Dict[str, Any]
    timestamp: str

# Authentication
async def verify_token(authorization: Optional[str] = Header(None)):
    """Verify JWT token from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Rate Limiting
async def check_rate_limit(tenant_id: str, service: str) -> bool:
    """Check if request is within rate limit"""
    if not redis_client:
        return True  # No rate limiting if Redis unavailable
    
    key = f"rate_limit:{tenant_id}:{service}"
    limit = 100  # requests per hour
    window = 3600  # 1 hour in seconds
    
    try:
        current = redis_client.get(key)
        if current is None:
            redis_client.setex(key, window, 1)
            return True
        
        count = int(current)
        if count >= limit:
            return False
        
        redis_client.incr(key)
        return True
    except Exception as e:
        logger.error(f"Rate limit check error: {e}")
        return True  # Allow on error

# Usage Tracking
async def track_usage(tenant_id: str, service: str, tokens: Optional[int] = None):
    """Track AI service usage"""
    if not redis_client:
        return
    
    try:
        # Track per service
        service_key = f"usage:{tenant_id}:{service}:{datetime.now().strftime('%Y-%m')}"
        redis_client.incr(service_key)
        redis_client.expire(service_key, 86400 * 32)  # Keep for 32 days
        
        # Track total
        total_key = f"usage:{tenant_id}:total:{datetime.now().strftime('%Y-%m')}"
        redis_client.incr(total_key)
        redis_client.expire(total_key, 86400 * 32)
        
        if tokens:
            tokens_key = f"usage:{tenant_id}:tokens:{datetime.now().strftime('%Y-%m')}"
            redis_client.incrby(tokens_key, tokens)
            redis_client.expire(tokens_key, 86400 * 32)
    except Exception as e:
        logger.error(f"Usage tracking error: {e}")

# Health Check
async def check_service_health(service_url: str) -> Dict[str, Any]:
    """Check if a service is healthy"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{service_url}/health")
            if response.status_code == 200:
                return {"status": "healthy", "response_time": response.elapsed.total_seconds()}
            else:
                return {"status": "unhealthy", "error": f"Status {response.status_code}"}
    except httpx.TimeoutException:
        return {"status": "timeout", "error": "Service did not respond in time"}
    except Exception as e:
        return {"status": "error", "error": str(e)}

# Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    services_status = {}
    
    for service_name, service_url in SERVICES.items():
        services_status[service_name] = await check_service_health(service_url)
    
    all_healthy = all(s.get("status") == "healthy" for s in services_status.values())
    
    return HealthResponse(
        status="healthy" if all_healthy else "degraded",
        services=services_status,
        timestamp=datetime.now().isoformat()
    )

@app.post("/api/text-to-image")
async def text_to_image(
    request: TextToImageRequest,
    user: dict = Depends(verify_token)
):
    """Generate image from text"""
    tenant_id = user.get("tenantId")
    
    # Rate limiting
    if not await check_rate_limit(tenant_id, "text-to-image"):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{SERVICES['text-to-image']}/generate",
                json={
                    "prompt": request.prompt,
                    "style": request.style,
                    "size": request.size,
                    "num_inference_steps": request.num_inference_steps,
                    "guidance_scale": request.guidance_scale,
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            result = response.json()
            
            # Track usage
            await track_usage(tenant_id, "text-to-image")
            
            return {
                "image_url": result.get("image_url"),
                "revised_prompt": result.get("revised_prompt"),
                "service": "text-to-image",
            }
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Service timeout")
    except Exception as e:
        logger.error(f"Text-to-image error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/text-to-speech")
async def text_to_speech(
    request: TextToSpeechRequest,
    user: dict = Depends(verify_token)
):
    """Convert text to speech"""
    tenant_id = user.get("tenantId")
    
    # Rate limiting
    if not await check_rate_limit(tenant_id, "text-to-speech"):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{SERVICES['text-to-speech']}/synthesize",
                json={
                    "text": request.text,
                    "language": request.language,
                    "voice": request.voice,
                    "speed": request.speed,
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            result = response.json()
            
            # Track usage
            await track_usage(tenant_id, "text-to-speech", len(request.text))
            
            return {
                "audio_url": result.get("audio_url"),
                "duration": result.get("duration"),
                "service": "text-to-speech",
            }
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Service timeout")
    except Exception as e:
        logger.error(f"Text-to-speech error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/speech-to-text")
async def speech_to_text(
    request: SpeechToTextRequest,
    user: dict = Depends(verify_token)
):
    """Convert speech to text"""
    tenant_id = user.get("tenantId")
    
    # Rate limiting
    if not await check_rate_limit(tenant_id, "speech-to-text"):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{SERVICES['speech-to-text']}/transcribe",
                json={
                    "audio_url": request.audio_url,
                    "language": request.language,
                    "task": request.task,
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            result = response.json()
            
            # Track usage
            await track_usage(tenant_id, "speech-to-text")
            
            return {
                "text": result.get("text"),
                "language": result.get("language"),
                "segments": result.get("segments", []),
                "service": "speech-to-text",
            }
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Service timeout")
    except Exception as e:
        logger.error(f"Speech-to-text error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/image-to-image")
async def image_to_image(
    request: ImageToImageRequest,
    user: dict = Depends(verify_token)
):
    """Transform image using AI"""
    tenant_id = user.get("tenantId")
    
    # Rate limiting
    if not await check_rate_limit(tenant_id, "image-to-image"):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{SERVICES['image-to-image']}/img2img",
                json={
                    "image_url": request.image_url,
                    "prompt": request.prompt,
                    "strength": request.strength,
                    "num_inference_steps": request.num_inference_steps,
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            result = response.json()
            
            # Track usage
            await track_usage(tenant_id, "image-to-image")
            
            return {
                "image_url": result.get("image_url"),
                "service": "image-to-image",
            }
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Service timeout")
    except Exception as e:
        logger.error(f"Image-to-image error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/image-to-text")
async def image_to_text(
    request: ImageToTextRequest,
    user: dict = Depends(verify_token)
):
    """Extract text or generate caption from image"""
    tenant_id = user.get("tenantId")
    
    # Rate limiting
    if not await check_rate_limit(tenant_id, "image-to-text"):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{SERVICES['image-to-text']}/analyze",
                json={
                    "image_url": request.image_url,
                    "task": request.task,
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            result = response.json()
            
            # Track usage
            await track_usage(tenant_id, "image-to-text")
            
            return {
                "caption": result.get("caption"),
                "ocr_text": result.get("ocr_text"),
                "service": "image-to-text",
            }
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Service timeout")
    except Exception as e:
        logger.error(f"Image-to-text error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/usage")
async def get_usage(
    user: dict = Depends(verify_token)
):
    """Get usage statistics for current tenant"""
    tenant_id = user.get("tenantId")
    
    if not redis_client:
        return {"usage": {}, "message": "Usage tracking not available"}
    
    try:
        current_month = datetime.now().strftime('%Y-%m')
        usage = {}
        
        for service in SERVICES.keys():
            key = f"usage:{tenant_id}:{service}:{current_month}"
            count = redis_client.get(key) or "0"
            usage[service] = int(count)
        
        total_key = f"usage:{tenant_id}:total:{current_month}"
        total = redis_client.get(total_key) or "0"
        
        return {
            "usage": usage,
            "total": int(total),
            "month": current_month,
        }
    except Exception as e:
        logger.error(f"Usage retrieval error: {e}")
        return {"usage": {}, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
