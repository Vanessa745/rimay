import { useRef, useState } from 'react';
import {
  ArrowDownUp, ArrowRight, Check, CheckCheck, CircleAlert, ClipboardCopy,
  Languages, LoaderCircle, RotateCcw, Sparkles, Volume2, Wifi,
} from 'lucide-react';
import { translateText } from './services/translationService';
import AudioRecorder from "./components/AudioRecorder";
import { transcribeAudio } from "./services/speechService";
import './App.css';

const MAX_LENGTH = 1000;
const languageNames = { es: 'Español', qu: 'Quechua' };
const suggestions = {
  es: ['Buenos días', '¿Cómo estás?', 'Muchas gracias', '¿Puedes ayudarme?'],
  qu: ["Allin p'unchay", 'Sulpayki'],
};

export default function App() {
  const [source, setSource] = useState('es');
  const [target, setTarget] = useState('qu');
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [lastTranslation, setLastTranslation] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [speechStatus, setSpeechStatus] = useState("idle");
  const [speechError, setSpeechError] = useState("");
  const controllerRef = useRef(null);
  const requestIdRef = useRef(0);

  function cancelPending() {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus('idle');
  }

  function resetOutput() {
    cancelPending();
    setResult('');
    setError('');
    setCopied(false);
    setLastTranslation(null);
  }

  function changeText(nextText) {
    setText(nextText.slice(0, MAX_LENGTH));
    resetOutput();
  }

  function swapLanguages() {
    const oldSource = source;
    setSource(target);
    setTarget(oldSource);
    const reverseText = result || text;
    setText(reverseText.slice(0, MAX_LENGTH));
    resetOutput();
  }

  async function handleTranslate() {
    const cleanText = text.trim();
    if (!cleanText || status === 'loading') return;

    cancelPending();
    const requestId = requestIdRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('loading');
    setError('');
    setResult('');
    setCopied(false);
    setLastTranslation(null);

    try {
      const response = await translateText(cleanText, source, target, controller.signal);
      if (requestId !== requestIdRef.current) return;
      setResult(response.translated_text);
      setLastTranslation({ source, target });
      setStatus('success');
    } catch (err) {
      if (requestId !== requestIdRef.current || err.name === 'AbortError') return;
      setError(err.message || 'No se pudo completar la traducción.');
      setStatus('error');
    } finally {
      if (requestId === requestIdRef.current) {
        controllerRef.current = null;
        setStatus((current) => current === 'loading' ? 'idle' : current);
      }
    }
  }

  async function copyResult() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setError('');
    } catch {
      setError('No se pudo copiar el resultado. Intenta seleccionar el texto manualmente.');
    }
  }

  const handleTranscribe = async () => {
    if (!recordedAudio || speechStatus === "loading") return;

    if (source !== "es") {
      setSpeechError(
        "Por ahora solo está disponible el reconocimiento de español."
      );
      return;
    }

    setSpeechStatus("loading");
    setSpeechError("");

    try {
      const response = await transcribeAudio(recordedAudio);

      // Reutiliza la función actual del traductor.
      changeText(response.transcript.slice(0, MAX_LENGTH));

      setSpeechStatus("success");
    } catch (err) {
      setSpeechStatus("error");
      setSpeechError(
        err.message || "No se pudo reconocer la voz."
      );
    }
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#inicio" aria-label="RIMAY, ir al inicio">
            <img src="/rimay-logo.png" alt="Logo RIMAY" className="brand-logo" />
            <div className="brand-identity">
              <span className="brand-name">RIMAY</span>
              <span className="brand-subtitle">Voces que conectan</span>
            </div>
          </a>
          <nav className="header-nav" aria-label="Navegación principal">
            <a href="#traductor">Traductor</a>
            <a href="#proyecto">El proyecto</a>
            <span className="version-pill"><span className="pill-dot" /> Demo v1.0</span>
          </nav>
        </div>
      </header>

      <main id="inicio">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> Inteligencia artificial e inclusión lingüística</div>
            <h1 id="hero-title">Dos idiomas.<br /><span>Una conexión.</span></h1>
            <p>La tecnología puede acercarnos. Traduce textos entre español y quechua con una experiencia simple, clara y accesible.</p>
            <a className="hero-link" href="#traductor">Probar el traductor <ArrowRight size={17} /></a>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <span className="hero-orbit orbit-one" /><span className="hero-orbit orbit-two" />
            <div className="hero-logo-card"><img src="/rimay-logo.png" alt="" /></div>
            <div className="visual-caption"><Languages size={17} /> Español <ArrowRight size={15} /> Quechua</div>
          </div>
        </section>

        <section id="traductor" className="translator-section container" aria-labelledby="translator-heading">
          <div className="section-heading">
            <div>
              <span className="section-kicker">TRADUCTOR RIMAY</span>
              <h2 id="translator-heading">Las palabras nos acercan</h2>
            </div>
            <div className="live-label"><Wifi size={15} /> Traducción en línea</div>
          </div>
          <div className="translator-card">
            <div className="translator-topbar">
              <div className="language-heading"><span>IDIOMA DE ORIGEN</span><strong>{languageNames[source]}</strong></div>
              <button type="button" className="swap-btn" onClick={swapLanguages} aria-label="Intercambiar idiomas" title="Intercambiar idiomas"><ArrowDownUp size={19} /></button>
              <div className="language-heading right"><span>IDIOMA DE DESTINO</span><strong>{languageNames[target]}</strong></div>
            </div>
            <div className="translator-panels">
              <div className="translation-panel input-panel">
                <div className="panel-title"><span>Escribe tu mensaje</span><button type="button" className="clear-button" onClick={() => changeText('')} disabled={!text && !result}><RotateCcw size={14} /> Limpiar</button></div>
                <label htmlFor="translation-input" className="sr-only">Texto a traducir</label>
                <textarea id="translation-input" placeholder={source === 'es' ? 'Escribe aquí en español…' : 'Escribe aquí en quechua…'} value={text} onChange={(e) => changeText(e.target.value)} maxLength={MAX_LENGTH} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleTranslate(); } }} />
                <div className="panel-bottom"><span>{text.length} / {MAX_LENGTH} caracteres</span><span className="shortcut-hint">Ctrl + Enter para traducir</span></div>
              </div>
              <div className="translation-panel output-panel">
                <div className="panel-title"><span>Tu traducción</span><span className="ai-tag"><Sparkles size={13} /> RIMAY AI</span></div>
                <div className="result-content" aria-live="polite" aria-busy={status === 'loading'}>
                  {status === 'loading' ? <div className="loading-state"><LoaderCircle className="spin" size={24}/><span>Traduciendo tu mensaje…</span></div> : result ? <p className="translated-text">{result}</p> : <div className="empty-state"><Languages size={28} strokeWidth={1.5}/><span>Tu traducción aparecerá aquí.</span></div>}
                </div>
                <div className="panel-bottom output-bottom">
                  <span>{lastTranslation && result ? `${languageNames[lastTranslation.source]} → ${languageNames[lastTranslation.target]}` : 'Resultado de traducción'}</span>
                  <button type="button" className="copy-button" onClick={copyResult} disabled={!result}><span>{copied ? <CheckCheck size={16}/> : <ClipboardCopy size={16}/>}</span>{copied ? 'Copiado' : 'Copiar'}</button>
                </div>
              </div>
            </div>
            {error && <div className="error-banner" role="alert"><CircleAlert size={17}/>{error}</div>}
            <div className="translator-footer">
              <p>La traducción automática puede contener errores. Verifica la información importante.</p>
              <button type="button" className="translate-btn" onClick={handleTranslate} disabled={!text.trim() || status === 'loading'}>{status === 'loading' ? <><LoaderCircle className="spin" size={18}/> Traduciendo…</> : <>Traducir texto <ArrowRight size={18}/></>}</button>
            </div>
          </div>
          <div className="examples-area">
            <span>Prueba con una frase:</span>
            <div className="example-chips">{suggestions[source].map((example) => <button key={example} type="button" onClick={() => changeText(example)}>{example} <ArrowRight size={13}/></button>)}</div>
          </div>
        </section>

        <section id="rimay-voz" className="voice-section container" aria-label="Reconocimiento de voz RIMAY">
          <AudioRecorder
            onAudioReady={(blob) => {
              setRecordedAudio(blob);
              setSpeechStatus("idle");
              setSpeechError("");
            }}
          />

          <div className="voice-transcription">
            <div>
              <h3>Convertir voz a texto</h3>

              <p>
                Reconocimiento de español boliviano.
                El audio se enviará a Google Cloud
                únicamente cuando presiones Transcribir.
              </p>

              {source !== "es" && (
                <p className="voice-notice">
                  Selecciona Español como idioma de origen.
                </p>
              )}
            </div>

            <button
              type="button"
              className="voice-transcribe-btn"
              onClick={handleTranscribe}
              disabled={
                !recordedAudio ||
                source !== "es" ||
                speechStatus === "loading"
              }
            >
              {speechStatus === "loading"
                ? "Reconociendo voz..."
                : "Transcribir audio"}
            </button>

            {speechStatus === "success" && (
              <p className="voice-success">
                Transcripción completada. Revisa el texto
                en el traductor antes de continuar.
              </p>
            )}

            {speechError && (
              <p className="voice-error" role="alert">
                {speechError}
              </p>
            )}
          </div>
        </section>

        <section id="proyecto" className="project-section container">
          <div className="project-card">
            <span className="section-kicker">SOBRE EL PROYECTO</span>
            <h2>Un puente entre lenguas y personas</h2>
            <p>RIMAY es un prototipo de inteligencia artificial orientado a facilitar la comunicación entre hablantes de español y quechua, con la visión de adaptarse al quechua de Cochabamba y, en el futuro, apoyar la atención institucional.</p>
            <div className="project-note"><Check size={16}/> Versión experimental: traducción de texto, no traducción de voz.</div>
          </div>
        </section>
      </main>
      <footer className="site-footer"><div className="container footer-inner"><span>© 2026 RIMAY · Tecnología que conecta personas</span><span>Hecho para una comunicación más inclusiva</span></div></footer>
    </div>
  );
}
