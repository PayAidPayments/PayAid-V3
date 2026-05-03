"""
Text to Speech Service using Coqui TTS
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import time
import logging
import base64

# Accept Coqui/XTTS terms so model loads in Docker (no interactive prompt)
os.environ["COQUI_TOS_AGREED"] = "1"

from TTS.api import TTS

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
    voice: str | None = None  # optional; None or "" = use default speaker
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
            speaker_wav=request.voice.strip() if (request.voice and request.voice.strip()) else None,
            speed=request.speed,
        )

        # Return base64 so PayAid Next.js can use COQUI_TTS_URL=http://localhost:7861/synthesize
        with open(output_path, "rb") as f:
            audio_base64 = base64.b64encode(f.read()).decode("utf-8")
        try:
            os.remove(output_path)
        except Exception:
            pass

        return {
            "audio_base64": audio_base64,
            "duration": len(request.text) * 0.1,
        }
    except Exception as e:
        logger.error(f"TTS synthesis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
