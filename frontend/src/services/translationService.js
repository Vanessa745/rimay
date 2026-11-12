const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export async function translateText(text, source, target, signal) {
  let response;
  try {
    response = await fetch(`${API_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source, target }),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error('No pudimos conectar con el servidor. Comprueba que FastAPI esté encendido.');
  }
  if (!response.ok) {
    if (response.status === 422) throw new Error('Revisa el texto y los idiomas seleccionados.');
    if (response.status === 502) throw new Error('El servicio de traducción no está disponible en este momento.');
    if (response.status === 429) throw new Error('Se alcanzó el límite de solicitudes. Intenta nuevamente más tarde.');
    throw new Error(`No fue posible traducir el mensaje (HTTP ${response.status}).`);
  }
  const data = await response.json();
  if (typeof data.translated_text !== 'string') throw new Error('El servidor devolvió una respuesta inesperada.');
  return data;
}
