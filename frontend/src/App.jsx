
import { useState } from "react";
import { translateText } from "./services/translationService";
import "./App.css";

const MAX_LENGTH = 1000;

function App() {
  const [source, setSource] = useState("es");
  const [target, setTarget] = useState("qu");
  const [text, setText] = useState("");
  const [translation, setTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const languages = {
    es: "Español",
    qu: "Quechua",
  };

  const handleTextChange = (event) => {
    setText(event.target.value);
    setTranslation("");
    setError("");
    setCopied(false);
  };

  const handleSwap = () => {
    if (loading) return;

    setSource(target);
    setTarget(source);

    if (translation) {
      setText(translation);
    }

    setTranslation("");
    setError("");
    setCopied(false);
  };

  const handleTranslate = async () => {
    if (!text.trim() || loading) return;

    setLoading(true);
    setError("");
    setTranslation("");
    setCopied(false);

    try {
      const result = await translateText(
        text.trim(),
        source,
        target
      );

      setTranslation(result.translated_text);
    } catch (err) {
      setError(
        err.message || "Ha ocurrido un error inesperado."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!translation) return;

    try {
      await navigator.clipboard.writeText(translation);
      setCopied(true);
    } catch {
      setError("No se pudo copiar el texto.");
    }
  };

  const handleClear = () => {
    if (loading) return;

    setText("");
    setTranslation("");
    setError("");
    setCopied(false);
  };

  const examples = {
    es: [
      "Buenos días",
      "¿Cómo estás?",
      "Muchas gracias",
      "¿Dónde está el mercado?"
    ],
    qu: [
      "Sulpayki",
      "Allin p'unchay"
    ]
  };

  const selectExample = (example) => {
    if (loading) return;

    setText(example);
    setTranslation("");
    setError("");
    setCopied(false);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="container header-content">
          <div className="brand">
            <div className="brand-icon">R</div>

            <div>
              <h1>RIMAY</h1>
              <p>La tecnología que conecta idiomas</p>
            </div>
          </div>

          <span className="demo-badge">
            Demo v0.1
          </span>
        </div>
      </header>

      <main className="container main">
        <section className="hero">
          <span className="eyebrow">
            TRADUCTOR INTELIGENTE
          </span>

          <h2>
            Quechua y español,
            <br />
            <span>más cerca que nunca.</span>
          </h2>

          <p>
            Rompiendo barreras lingüísticas mediante
            inteligencia artificial.
          </p>
        </section>

        <div className="examples">
          <span>Prueba con una frase:</span>

          <div className="example-list">
            {examples[source].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => selectExample(example)}
                disabled={loading}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <section className="translator-card">
          <div className="language-selector">
            <div className="language-box">
              <span>Idioma de origen</span>
              <strong>{languages[source]}</strong>
            </div>

            <button
              className="swap-button"
              onClick={handleSwap}
              disabled={loading}
              title="Intercambiar idiomas"
              aria-label="Intercambiar idiomas"
            >
              ⇄
            </button>

            <div className="language-box target">
              <span>Traducir a</span>
              <strong>{languages[target]}</strong>
            </div>
          </div>

          <div className="translator-body">
            <div className="input-panel">
              <div className="panel-header">
                <span>Texto original</span>
                <button
                  className="text-button"
                  onClick={handleClear}
                  disabled={loading}
                >
                  Limpiar
                </button>
              </div>

              <textarea
                value={text}
                onChange={handleTextChange}
                placeholder="Escribe el texto que deseas traducir..."
                maxLength={MAX_LENGTH}
                disabled={loading}
              />

              <div className="panel-footer">
                <span>
                  {text.length}/{MAX_LENGTH} caracteres
                </span>
              </div>
            </div>

            <div className="output-panel">
              <div className="panel-header">
                <span>Traducción</span>
                <span className="ai-tag">RIMAY AI</span>
              </div>

              <div
                className="translation-output"
                aria-live="polite"
              >
                {loading ? (
                  <div className="loading">
                    <div className="spinner" />
                    <span>Traduciendo...</span>
                  </div>
                ) : translation ? (
                  <p>{translation}</p>
                ) : (
                  <p className="placeholder">
                    Tu traducción aparecerá aquí.
                  </p>
                )}
              </div>

              <div className="panel-footer right">
                {translation && (
                  <button
                    className="text-button"
                    onClick={handleCopy}
                  >
                    {copied ? "✓ Copiado" : "Copiar texto"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="translator-actions">
            <p>
              Traducción automática con IA.
              Verifica las expresiones importantes.
            </p>

            <button
              className="translate-button"
              onClick={handleTranslate}
              disabled={!text.trim() || loading}
            >
              {loading ? "Traduciendo..." : "Traducir →"}
            </button>
          </div>
        </section>

        <section className="about">
          <h3>¿Qué es RIMAY?</h3>
          <p>
            RIMAY es un proyecto tecnológico que busca
            facilitar la comunicación entre personas
            que hablan español y quechua, con especial
            interés en el quechua de Cochabamba.
          </p>
        </section>
      </main>

      <footer className="footer">
        <p>
          RIMAY © 2026 — Inteligencia artificial
          para conectar personas.
        </p>
      </footer>
    </div>
  );
}

export default App;
