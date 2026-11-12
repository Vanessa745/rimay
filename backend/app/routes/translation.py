
import logging
from fastapi import APIRouter, HTTPException
from google.api_core.exceptions import GoogleAPICallError
from app.schemas.translation import (
    TranslationRequest,
    TranslationResponse
)
from app.services.translation_service import translate_text


router = APIRouter(prefix="/api", tags=["Translation"])

logger = logging.getLogger(__name__)


@router.post(
    "/translate",
    response_model=TranslationResponse
)
def translate_endpoint(request: TranslationRequest):

    try:
        translated = translate_text(
            text=request.text,
            source=request.source,
            target=request.target
        )

        return TranslationResponse(
            original_text=request.text,
            translated_text=translated,
            source_language=request.source,
            target_language=request.target
        )

    except GoogleAPICallError:
        logger.exception("Error del servicio de Google Cloud")
        raise HTTPException(
            status_code=502,
            detail="No se pudo completar la traducción"
        )

    except Exception:
        logger.exception("Error inesperado durante la traducción")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor"
        )
