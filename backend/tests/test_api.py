
from fastapi.testclient import TestClient
from app.main import app
import app.routes.translation as translation_route

client = TestClient(app)


def test_health():
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_translation_es_to_qu(monkeypatch):
    # Simulamos Google Cloud para no generar cargos.
    def fake_translate(text, source, target):
        assert text == "Buenos días"
        assert source == "es"
        assert target == "qu"
        return "Rimaykullayki"

    monkeypatch.setattr(
        translation_route,
        "translate_text",
        fake_translate
    )

    response = client.post(
        "/api/translate",
        json={
            "text": "Buenos días",
            "source": "es",
            "target": "qu"
        }
    )

    assert response.status_code == 200
    assert response.json()["translated_text"] == "Rimaykullayki"


def test_translation_qu_to_es(monkeypatch):
    monkeypatch.setattr(
        translation_route,
        "translate_text",
        lambda text, source, target: "Gracias"
    )

    response = client.post(
        "/api/translate",
        json={
            "text": "Sulpayki",
            "source": "qu",
            "target": "es"
        }
    )

    assert response.status_code == 200
    assert response.json()["translated_text"] == "Gracias"


def test_empty_text():
    response = client.post(
        "/api/translate",
        json={
            "text": "",
            "source": "es",
            "target": "qu"
        }
    )

    assert response.status_code == 422


def test_same_languages():
    response = client.post(
        "/api/translate",
        json={
            "text": "Hola",
            "source": "es",
            "target": "es"
        }
    )

    assert response.status_code == 422


def test_unsupported_language():
    response = client.post(
        "/api/translate",
        json={
            "text": "Hello",
            "source": "en",
            "target": "qu"
        }
    )

    assert response.status_code == 422


def test_text_too_long():
    response = client.post(
        "/api/translate",
        json={
            "text": "a" * 1001,
            "source": "es",
            "target": "qu"
        }
    )

    assert response.status_code == 422


def test_google_cloud_error(monkeypatch):
    from google.api_core.exceptions import ServiceUnavailable

    def fake_error(text, source, target):
        raise ServiceUnavailable("Servicio no disponible")

    monkeypatch.setattr(
        translation_route,
        "translate_text",
        fake_error
    )

    response = client.post(
        "/api/translate",
        json={
            "text": "Hola",
            "source": "es",
            "target": "qu"
        }
    )

    assert response.status_code == 502
    assert response.json()["detail"] == (
        "No se pudo completar la traducción"
    )
