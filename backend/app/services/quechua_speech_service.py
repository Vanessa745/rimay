
import io
import os
import wave
from functools import lru_cache
from threading import Lock


MODEL_ID = "facebook/mms-1b-all"
LANGUAGE = "quh"

# Evita ejecutar inferencias simultáneas sobre el mismo modelo.
inference_lock = Lock()


@lru_cache(maxsize=1)
def load_mms():
    import torch
    from transformers import AutoProcessor, Wav2Vec2ForCTC

    if os.getenv("RIMAY_ENABLE_MMS", "").lower() != "true":
        raise RuntimeError(
            "El reconocimiento experimental MMS está desactivado."
        )

    device = "cuda" if torch.cuda.is_available() else "cpu"

    print("RIMAY: cargando modelo MMS...")
    print("Idioma:", LANGUAGE)
    print("Dispositivo:", device)

    processor = AutoProcessor.from_pretrained(
        MODEL_ID,
        target_lang=LANGUAGE
    )

    model = Wav2Vec2ForCTC.from_pretrained(
        MODEL_ID,
        target_lang=LANGUAGE,
        ignore_mismatched_sizes=True
    )

    model = model.to(device)
    model.eval()

    print("RIMAY: MMS cargado correctamente.")

    return processor, model, device


def transcribe_quechua(audio_bytes: bytes) -> str:
    import numpy as np
    import torch

    with wave.open(io.BytesIO(audio_bytes), "rb") as wav:
        sample_rate = wav.getframerate()
        channels = wav.getnchannels()
        sample_width = wav.getsampwidth()

        if (
            sample_rate != 16000
            or channels != 1
            or sample_width != 2
            or wav.getcomptype() != "NONE"
        ):
            raise ValueError(
                "El audio debe ser WAV PCM16 mono a 16000 Hz."
            )

        raw_audio = wav.readframes(wav.getnframes())

    # Convertimos PCM16 a muestras flotantes.
    audio = np.frombuffer(
        raw_audio,
        dtype="<i2"
    ).astype(np.float32) / 32768.0

    if audio.size == 0:
        raise ValueError("El audio está vacío.")

    with inference_lock:
        processor, model, device = load_mms()

        inputs = processor(
            audio,
            sampling_rate=16000,
            return_tensors="pt"
        )

        input_values = inputs.input_values.to(device)

        with torch.inference_mode():
            logits = model(input_values).logits

        predicted_ids = torch.argmax(
            logits,
            dim=-1
        )

        transcript = processor.batch_decode(
            predicted_ids.cpu()
        )[0]

    return transcript.strip()
