
from functools import lru_cache
from google.cloud import speech


@lru_cache(maxsize=1)
def get_speech_client():
    return speech.SpeechClient()


def transcribe_spanish(audio_bytes: bytes) -> str:
    client = get_speech_client()

    audio = speech.RecognitionAudio(
        content=audio_bytes
    )

    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=16000,
        language_code="es-BO",
        model="default",
        max_alternatives=1,
    )

    response = client.recognize(
        config=config,
        audio=audio,
        timeout=45,
    )

    transcripts = [
        result.alternatives[0].transcript
        for result in response.results
        if result.alternatives
    ]

    return " ".join(transcripts).strip()
