"""
Text to Speech Service using Coqui TTS
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from TTS.api import TTS
import os
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Text to Speech Service")

# Initialize TTS model
tts_model = None
MODEL_NAME = os.getenv("MODEL_NAME", "tts_models/multilingual/multi-dataset/xtts_v2")

try:
    logger.info(f"Loading TTS model: {MODEL_NAME}")
    tts_model = TTS(model_name=MODEL_NAME, progress_bar=False)
    logger.info("✅ TTS model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load TTS model: {e}")
    tts_model = None

class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    voice: str = None
    speed: float = 1.0

@app.get("/health")
async def health():
    return {
        "status": "healthy" if tts_model else "unhealthy",
        "model": MODEL_NAME,
    }

@app.post("/synthesize")
async def synthesize(request: TTSRequest):
    if not tts_model:
        raise HTTPException(status_code=503, detail="TTS model not loaded")
    
    try:
        # Generate speech
        output_path = f"/tmp/tts_{int(time.time())}.wav"
        tts_model.tts_to_file(
            text=request.text,
            file_path=output_path,
            language=request.language,
            speaker_wav=request.voice if request.voice else None,
            speed=request.speed,
        )
        
        # In production, upload to storage and return URL
        # For now, return a placeholder
        return {
            "audio_url": f"file://{output_path}",
            "duration": len(request.text) * 0.1,  # Rough estimate
        }
    except Exception as e:
        logger.error(f"TTS synthesis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
