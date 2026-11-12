
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from app.services.tts_service import synthesize_quechua

router = APIRouter(prefix="/api", tags=["Text-to-Speech"])
logger = logging.getLogger(__name__)


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=300)
    language: str = "qu"


@router.post("/tts")
async def generate_speech(request: TTSRequest):

    if request.language != "qu":
        raise HTTPException(
            status_code=422,
            detail="Este endpoint solo genera voz en quechua."
        )

    if not request.text.strip():
        raise HTTPException(
            status_code=422,
            detail="El texto no puede estar vacío."
        )

    try:
        audio_bytes = await run_in_threadpool(
            synthesize_quechua,
            request.text
        )

        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={
                "Cache-Control": "no-store"
            }
        )

    except Exception:
        logger.exception("Error de síntesis de voz")

        raise HTTPException(
            status_code=503,
            detail="No se pudo generar la voz en quechua."
        )
