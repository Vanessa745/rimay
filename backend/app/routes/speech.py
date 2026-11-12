
import io
import logging
import wave

from fastapi import APIRouter, File, HTTPException, UploadFile
from google.api_core.exceptions import GoogleAPICallError

from app.services.speech_service import transcribe_spanish


router = APIRouter(prefix="/api", tags=["Speech"])
logger = logging.getLogger(__name__)

MAX_BYTES = 2 * 1024 * 1024
MAX_SECONDS = 30


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...)
):
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
            detail="El archivo no es un WAV válido."
        )

    if (
        channels != 1
        or sample_rate != 16000
        or sample_width != 2
        or compression != "NONE"
    ):
        raise HTTPException(
            status_code=400,
            detail="Se requiere audio WAV PCM16, mono, 16 kHz."
        )

    duration = frame_count / sample_rate

    if duration <= 0 or duration > MAX_SECONDS:
        raise HTTPException(
            status_code=400,
            detail="La grabación debe durar entre 0 y 30 segundos."
        )

    try:
        transcript = transcribe_spanish(audio_bytes)

    except GoogleAPICallError:
        logger.exception("Error de Speech-to-Text")
        raise HTTPException(
            status_code=502,
            detail="El reconocimiento de voz no está disponible."
        )

    except Exception:
        logger.exception("Error inesperado de transcripción")
        raise HTTPException(
            status_code=500,
            detail="No se pudo procesar el audio."
        )

    if not transcript:
        raise HTTPException(
            status_code=422,
            detail="No se pudo reconocer una frase en el audio."
        )

    return {
        "transcript": transcript,
        "language": "es-BO",
        "duration_seconds": round(duration, 2),
    }
