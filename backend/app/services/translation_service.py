
import html
from functools import lru_cache
from google.cloud import translate_v2 as translate


@lru_cache(maxsize=1)
def get_translation_client():
    return translate.Client()


def translate_text(
    text: str,
    source: str,
    target: str
) -> str:

    client = get_translation_client()

    result = client.translate(
        text,
        source_language=source,
        target_language=target,
        format_="text",
        model="nmt"
    )

    return html.unescape(result["translatedText"])
