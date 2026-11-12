
import io
import wave
from functools import lru_cache
from threading import Lock

import numpy as np

MODEL_ID = "facebook/mms-tts-quh"

# Evitamos cargar el modelo dos veces simultáneamente.
model_lock = Lock()


@lru_cache(maxsize=1)
def load_tts_model():
    import torch
    from transformers import AutoTokenizer, VitsModel

    device = "cuda" if torch.cuda.is_available() else "cpu"

    print("RIMAY TTS: cargando voz quechua...")

    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)

    model = VitsModel.from_pretrained(MODEL_ID)
    model = model.to(device)
    model.eval()

    print("RIMAY TTS listo:", device)

    return tokenizer, model, device


def synthesize_quechua(text: str) -> bytes:
    import torch

    if not text.strip():
        raise ValueError("El texto está vacío.")

    with model_lock:
        tokenizer, model, device = load_tts_model()

        inputs = tokenizer(
            text.strip(),
            return_tensors="pt"
        ).to(device)

        with torch.inference_mode():
            output = model(**inputs).waveform

        audio = output[0].cpu().numpy()
        sample_rate = model.config.sampling_rate

    # Convertir salida flotante a WAV PCM16.
    audio = np.clip(audio, -1.0, 1.0)
    pcm = (audio * 32767).astype("<i2")

    buffer = io.BytesIO()

    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm.tobytes())

    return buffer.getvalue()
