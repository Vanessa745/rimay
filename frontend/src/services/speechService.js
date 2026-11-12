
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

async function convertToWav(audioBlob) {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error(
      "Tu navegador no permite procesar el audio."
    );
  }

  const context = new AudioContextClass();

  try {
    const bytes = await audioBlob.arrayBuffer();

    const decoded = await context.decodeAudioData(
      bytes.slice(0)
    );

    if (decoded.duration > 30) {
      throw new Error(
        "La grabación supera los 30 segundos."
      );
    }

    const targetRate = 16000;

    const offline = new OfflineAudioContext(
      1,
      Math.ceil(decoded.duration * targetRate),
      targetRate
    );

    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);

    const rendered = await offline.startRendering();
    const samples = rendered.getChannelData(0);

    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset, str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");

    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, targetRate, true);
    view.setUint32(28, targetRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);

    writeString(36, "data");
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;

    for (const value of samples) {
      const sample = Math.max(-1, Math.min(1, value));

      view.setInt16(
        offset,
        sample < 0
          ? sample * 0x8000
          : sample * 0x7fff,
        true
      );

      offset += 2;
    }

    return new Blob([buffer], {
      type: "audio/wav",
    });
  } finally {
    await context.close();
  }
}

export async function transcribeAudio(audioBlob) {
  const wavBlob = await convertToWav(audioBlob);

  const formData = new FormData();

  formData.append(
    "file",
    wavBlob,
    "rimay-audio.wav"
  );

  let response;

  try {
    response = await fetch(`${API_URL}/api/transcribe`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error(
      "No fue posible conectar con el servidor RIMAY."
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(
      () => ({})
    );

    throw new Error(
      typeof errorData.detail === "string"
        ? errorData.detail
        : "No se pudo transcribir el audio."
    );
  }

  return response.json();
}
