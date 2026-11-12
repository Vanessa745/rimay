
from google.cloud import translate_v2 as translate
from google.api_core.exceptions import GoogleAPICallError
import html

client = translate.Client()

def traducir(texto, origen, destino):
    resultado = client.translate(
        texto,
        source_language=origen,
        target_language=destino,
        format_="text",
        model="nmt"
    )

    return html.unescape(resultado["translatedText"])


if __name__ == "__main__":
    pruebas = [
        ("Buenos días", "es", "qu"),
        ("¿Cómo estás?", "es", "qu"),
        ("Allin p'unchay", "qu", "es"),
        ("Sulpayki", "qu", "es")
    ]

    for texto, origen, destino in pruebas:
        try:
            resultado = traducir(texto, origen, destino)
            print(f"\n{origen} -> {destino}")
            print(f"Original: {texto}")
            print(f"Traducción: {resultado}")

        except GoogleAPICallError as error:
            print(f"Error de Google Cloud: {error}")
        except Exception as error:
            print(f"Error: {error}")
