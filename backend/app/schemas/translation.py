
from typing import Literal
from pydantic import BaseModel, Field, model_validator


Language = Literal["es", "qu"]


class TranslationRequest(BaseModel):
    text: str = Field(
        min_length=1,
        max_length=1000
    )
    source: Language
    target: Language

    @model_validator(mode="after")
    def validate_request(self):
        if not self.text.strip():
            raise ValueError("El texto no puede estar vacío")

        if self.source == self.target:
            raise ValueError(
                "Los idiomas de origen y destino deben ser diferentes"
            )

        return self


class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: Language
    target_language: Language
