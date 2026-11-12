
const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function translateText(text, source, target) {
  let response;

  try {
    response = await fetch(`${API_URL}/api/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        source,
        target,
      }),
    });
  } catch {
    throw new Error(
      "No se pudo conectar con RIMAY. Comprueba que FastAPI esté funcionando."
    );
  }

  if (!response.ok) {
    if (response.status === 422) {
      throw new Error("Verifica el texto y los idiomas seleccionados.");
    }

    if (response.status === 502) {
      throw new Error(
        "El servicio de traducción no está disponible temporalmente."
      );
    }

    throw new Error(
      `No se pudo completar la traducción (HTTP ${response.status}).`
    );
  }

  return response.json();
}
