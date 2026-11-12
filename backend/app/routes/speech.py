
import io
import logging
import os
import wave

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    UploadFile
)
from google.api_core.exceptions import GoogleAPICallError
from starlette.concurrency import run_in_threadpool

from app.services.speech_service import transcribe_spanish
from app.services.quechua_speech_service import transcribe_quechua


router = APIRouter(prefix="/api", tags=["Speech"])
logger = logging.getLogger(__name__)

MAX_BYTES = 2 * 1024 * 1024
MAX_SECONDS = 30


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("es")
):
    if language not in ("es", "qu"):
        raise HTTPException(
            status_code=422,
            detail="Idioma no compatible."
        )

    if language == "qu" and (
        os.getenv("RIMAY_ENABLE_MMS", "").lower() != "true"
    ):
        raise HTTPException(
            status_code=503,
            detail="Reconocimiento de quechua desactivado."
        )

    try:
        audio_bytes = await file.read(MAX_BYTES + 1)
    finally:
        await file.close()

    if not audio_bytes:
        raise HTTPException(
            status_code=400,
            detail="El archivo de audio está vacío."
        )

    if len(audio_bytes) > MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail="El archivo excede el tamaño permitido."
        )

    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as wav:
            channels = wav.getnchannels()
            sample_rate = wav.getframerate()
            sample_width = wav.getsampwidth()
            frame_count = wav.getnframes()
            compression = wav.getcomptype()

    except (wave.Error, EOFError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Archivo WAV inválido."
        )

    if (
        channels != 1
        or sample_rate != 16000
        or sample_width != 2
        or compression != "NONE"
    ):
        raise HTTPException(
            status_code=400,
            detail="Se requiere WAV PCM16 mono a 16 kHz."
        )

    duration = frame_count / sample_rate

    if duration <= 0 or duration > MAX_SECONDS:
        raise HTTPException(
            status_code=400,
            detail="El audio debe durar entre 0 y 30 segundos."
        )

    try:
        if language == "es":
            transcript = await run_in_threadpool(
                transcribe_spanish,
                audio_bytes
            )

            model_name = "Google Speech-to-Text"

        else:
            transcript = await run_in_threadpool(
                transcribe_quechua,
                audio_bytes
            )

            model_name = "Meta MMS - quh"

    except GoogleAPICallError:
        logger.exception("Error en Google Speech-to-Text")
        raise HTTPException(
            status_code=502,
            detail="Servicio de reconocimiento no disponible."
        )

    except Exception:
        logger.exception("Error al procesar reconocimiento")
        raise HTTPException(
            status_code=503,
            detail="No fue posible procesar el audio."
        )

    if not transcript:
        raise HTTPException(
            status_code=422,
            detail="No se reconocieron palabras en el audio."
        )

    return {
        "transcript": transcript,
        "language": language,
        "model": model_name,
        "experimental": language == "qu",
        "duration_seconds": round(duration, 2)
    }
