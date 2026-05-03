"""
Image to Image Service using Stable Diffusion XL (img2img mode)
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from diffusers import StableDiffusionXLImg2ImgPipeline
import torch
from PIL import Image
import os
import logging
import time
import httpx
from io import BytesIO
import base64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Image to Image Service")

# Initialize SDXL img2img pipeline
img2img_pipeline = None
MODEL_NAME = os.getenv("MODEL_NAME", "stabilityai/stable-diffusion-xl-base-1.0")

try:
    logger.info(f"Loading SDXL img2img model: {MODEL_NAME}")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using device: {device}")
    
    img2img_pipeline = StableDiffusionXLImg2ImgPipeline.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        use_safetensors=True,
    )
    img2img_pipeline = img2img_pipeline.to(device)
    
    if device == "cpu":
        img2img_pipeline.enable_attention_slicing()
    
    logger.info("✅ SDXL img2img model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load img2img model: {e}")
    img2img_pipeline = None

class I2IRequest(BaseModel):
    image_url: str
    prompt: str
    strength: float = 0.8
    num_inference_steps: int = 30

@app.get("/health")
async def health():
    return {
        "status": "healthy" if img2img_pipeline else "unhealthy",
        "model": MODEL_NAME,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "mode": "img2img",
    }

@app.post("/img2img")
async def img2img(request: I2IRequest):
    if not img2img_pipeline:
        raise HTTPException(status_code=503, detail="img2img model not loaded")
    
    try:
        # Download source image
        async with httpx.AsyncClient() as client:
            image_response = await client.get(request.image_url)
            image_response.raise_for_status()
            
            # Load image
            source_image = Image.open(BytesIO(image_response.content)).convert("RGB")
            source_image = source_image.resize((1024, 1024))  # SDXL standard size
        
        logger.info(f"Transforming image with prompt: {request.prompt[:50]}...")
        start_time = time.time()
        
        # Generate transformed image
        result_image = img2img_pipeline(
            prompt=request.prompt,
            image=source_image,
            strength=request.strength,
            num_inference_steps=request.num_inference_steps,
        ).images[0]
        
        generation_time = time.time() - start_time
        logger.info(f"Image transformed in {generation_time:.2f}s")
        
        # Convert to base64
        buffer = BytesIO()
        result_image.save(buffer, format="PNG")
        image_bytes = buffer.getvalue()
        image_base64 = base64.b64encode(image_bytes).decode()
        image_url = f"data:image/png;base64,{image_base64}"
        
        return {
            "image_url": image_url,
            "generation_time": generation_time,
        }
    except Exception as e:
        logger.error(f"Image transformation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
