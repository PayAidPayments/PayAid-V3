"""
Text to Image Service using Stable Diffusion XL
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from diffusers import StableDiffusionXLPipeline
import torch
import os
import logging
import time
from io import BytesIO
import base64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Text to Image Service")

# Initialize SDXL model
sdxl_pipeline = None
model_loading = True
model_load_error = None
MODEL_NAME = os.getenv("MODEL_NAME", "stabilityai/stable-diffusion-xl-base-1.0")

def load_model():
    global sdxl_pipeline, model_loading, model_load_error
    try:
        logger.info(f"Loading SDXL model: {MODEL_NAME}")
        # Use CPU if no GPU available
        device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {device}")
        
        sdxl_pipeline = StableDiffusionXLPipeline.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            use_safetensors=True,
        )
        sdxl_pipeline = sdxl_pipeline.to(device)
        
        if device == "cpu":
            # Enable CPU optimizations
            sdxl_pipeline.enable_attention_slicing()
        
        logger.info("✅ SDXL model loaded successfully")
        model_loading = False
        model_load_error = None
    except Exception as e:
        logger.error(f"❌ Failed to load SDXL model: {e}")
        sdxl_pipeline = None
        model_loading = False
        model_load_error = str(e)

# Load model in background thread to avoid blocking
import threading
loading_thread = threading.Thread(target=load_model, daemon=True)
loading_thread.start()

class T2IRequest(BaseModel):
    prompt: str
    style: str = "realistic"
    size: str = "1024x1024"
    num_inference_steps: int = 30
    guidance_scale: float = 7.5

@app.get("/health")
async def health():
    if model_loading:
        return {
            "status": "loading",
            "model": MODEL_NAME,
            "device": "cuda" if torch.cuda.is_available() else "cpu",
            "message": "Model is still loading, please wait..."
        }
    elif sdxl_pipeline:
        return {
            "status": "healthy",
            "model": MODEL_NAME,
            "device": "cuda" if torch.cuda.is_available() else "cpu",
        }
    else:
        return {
            "status": "unhealthy",
            "model": MODEL_NAME,
            "device": "cuda" if torch.cuda.is_available() else "cpu",
            "error": model_load_error or "Model failed to load",
        }

@app.post("/generate")
async def generate(request: T2IRequest):
    if not sdxl_pipeline:
        raise HTTPException(status_code=503, detail="SDXL model not loaded")
    
    try:
        # Enhance prompt with style
        style_map = {
            "realistic": "photorealistic, professional photography style",
            "artistic": "artistic, creative, visually striking",
            "cartoon": "cartoon style, animated, colorful",
            "minimalist": "minimalist, clean, simple design",
            "vintage": "vintage style, retro aesthetic",
            "modern": "modern, contemporary design",
        }
        
        enhanced_prompt = f"{request.prompt}, {style_map.get(request.style, request.style)} style"
        
        # Parse size
        width, height = map(int, request.size.split('x'))
        
        logger.info(f"Generating image: {enhanced_prompt[:50]}...")
        start_time = time.time()
        
        # Generate image
        image = sdxl_pipeline(
            prompt=enhanced_prompt,
            width=width,
            height=height,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
        ).images[0]
        
        generation_time = time.time() - start_time
        logger.info(f"Image generated in {generation_time:.2f}s")
        
        # Convert to base64 (in production, upload to storage)
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        image_bytes = buffer.getvalue()
        image_base64 = base64.b64encode(image_bytes).decode()
        
        # In production, upload to Cloudflare R2/S3 and return URL
        # For now, return base64 data URL
        image_url = f"data:image/png;base64,{image_base64}"
        
        return {
            "image_url": image_url,
            "revised_prompt": enhanced_prompt,
            "generation_time": generation_time,
        }
    except Exception as e:
        logger.error(f"Image generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
