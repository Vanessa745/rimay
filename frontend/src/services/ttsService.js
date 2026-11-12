
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

export async function generateQuechuaAudio(text, signal) {
  let response;

  try {
    response = await fetch(`${API_URL}/api/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        language: "qu",
      }),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;

    throw new Error(
      "No se pudo conectar con el servicio de voz."
    );
  }

  if (!response.ok) {
    throw new Error(
      "No se pudo generar el audio en quechua."
    );
  }

  return response.blob();
}
