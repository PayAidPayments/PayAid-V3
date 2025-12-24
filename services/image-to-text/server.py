"""
Image to Text Service using BLIP-2 and OCR
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import pytesseract
import httpx
import os
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Image to Text Service")

# Initialize models
blip_processor = None
blip_model = None
BLIP_MODEL = os.getenv("BLIP_MODEL", "Salesforce/blip-2-opt-2.7b")

try:
    logger.info(f"Loading BLIP model: {BLIP_MODEL}")
    blip_processor = BlipProcessor.from_pretrained(BLIP_MODEL)
    blip_model = BlipForConditionalGeneration.from_pretrained(BLIP_MODEL)
    logger.info("✅ BLIP model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load BLIP model: {e}")

class ITTRequest(BaseModel):
    image_url: str
    task: str = "caption"  # caption, ocr, or both

@app.get("/health")
async def health():
    return {
        "status": "healthy" if blip_model else "unhealthy",
        "blip_model": BLIP_MODEL,
        "ocr_available": True,
    }

@app.post("/analyze")
async def analyze(request: ITTRequest):
    try:
        # Download image
        async with httpx.AsyncClient() as client:
            image_response = await client.get(request.image_url)
            image_response.raise_for_status()
            
            # Save temporarily
            image_path = f"/tmp/image_{int(time.time())}.jpg"
            with open(image_path, "wb") as f:
                f.write(image_response.content)
            
            image = Image.open(image_path).convert("RGB")
            
            result = {}
            
            # Generate caption if requested
            if request.task in ["caption", "both"]:
                if not blip_model:
                    raise HTTPException(status_code=503, detail="BLIP model not loaded")
                
                inputs = blip_processor(image, return_tensors="pt")
                out = blip_model.generate(**inputs, max_length=50)
                caption = blip_processor.decode(out[0], skip_special_tokens=True)
                result["caption"] = caption
            
            # Extract OCR text if requested
            if request.task in ["ocr", "both"]:
                ocr_text = pytesseract.image_to_string(image)
                result["ocr_text"] = ocr_text.strip()
            
            # Clean up
            os.remove(image_path)
            
            return result
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
