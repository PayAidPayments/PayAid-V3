"""
Speech to Text Service using Whisper
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import whisper
import os
import time
import logging
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Speech to Text Service")

# Initialize Whisper model
whisper_model = None
MODEL_NAME = os.getenv("MODEL_NAME", "openai/whisper-large-v3")

try:
    logger.info(f"Loading Whisper model: {MODEL_NAME}")
    whisper_model = whisper.load_model("large-v3")
    logger.info("✅ Whisper model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load Whisper model: {e}")
    whisper_model = None

class STTRequest(BaseModel):
    audio_url: str
    language: str = None
    task: str = "transcribe"  # transcribe or translate

@app.get("/health")
async def health():
    return {
        "status": "healthy" if whisper_model else "unhealthy",
        "model": MODEL_NAME,
    }

@app.post("/transcribe")
async def transcribe(request: STTRequest):
    if not whisper_model:
        raise HTTPException(status_code=503, detail="Whisper model not loaded")
    
    try:
        # Download audio file
        async with httpx.AsyncClient() as client:
            audio_response = await client.get(request.audio_url)
            audio_response.raise_for_status()
            
            # Save temporarily
            audio_path = f"/tmp/audio_{int(time.time())}.wav"
            with open(audio_path, "wb") as f:
                f.write(audio_response.content)
            
            # Transcribe
            result = whisper_model.transcribe(
                audio_path,
                language=request.language,
                task=request.task,
            )
            
            # Clean up
            os.remove(audio_path)
            
            return {
                "text": result["text"],
                "language": result["language"],
                "segments": result.get("segments", []),
            }
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
