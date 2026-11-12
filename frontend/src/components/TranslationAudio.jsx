
import { useEffect, useRef, useState } from "react";
import { Volume2, LoaderCircle, Square } from "lucide-react";

import { generateQuechuaAudio } from "../services/ttsService";

export default function TranslationAudio({ text, language, autoPlayToken = 0}) {
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState("");

  const audioRef = useRef(null);
  const urlRef = useRef(null);
  const requestRef = useRef(null);
  const generationRef = useRef(0);

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      requestRef.current?.abort();

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }

      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [text, language]);

  const stopPlayback = () => {
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    setSpeaking(false);
  };

  const handleListen = async () => {
    if (!text?.trim() || loading) return;

    setError("");
    stopPlayback();

    if (language === "es") {
      if (!("speechSynthesis" in window)) {
        setError("Tu navegador no permite reproducir voz.");
        return;
      }

      const voices = window.speechSynthesis.getVoices();

      const voice =
        voices.find((v) => v.lang.toLowerCase() === "es-bo") ||
        voices.find((v) => v.lang.toLowerCase().startsWith("es-")) ||
        voices.find((v) => v.lang.toLowerCase() === "es");

      if (!voice) {
        setError("No hay una voz en español disponible.");
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = 0.95;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => {
        setSpeaking(false);
        setError("No se pudo reproducir la voz.");
      };

      window.speechSynthesis.speak(utterance);
      return;
    }

    if (language !== "qu") {
      setError("Idioma de audio no compatible.");
      return;
    }

    const generation = ++generationRef.current;
    const controller = new AbortController();
    requestRef.current = controller;

    setLoading(true);

    try {
      // Si ya generamos el audio, reutilizamos el archivo.
      if (urlRef.current) {
        await audioRef.current?.play();
        return;
      }

      const blob = await generateQuechuaAudio(
        text,
        controller.signal
      );

      if (generation !== generationRef.current) return;

      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setAudioUrl(url);

    } catch (err) {
      if (
        err.name !== "AbortError" &&
        generation === generationRef.current
      ) {
        setError(err.message);
      }
    } finally {
      if (generation === generationRef.current) {
        setLoading(false);
        requestRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;

    audioRef.current.play().catch(() => {
      setError(
        "El navegador bloqueó la reproducción automática. Presiona reproducir."
      );
    });
  }, [audioUrl]);

  useEffect(() => {
    if (autoPlayToken > 0 && text?.trim()) {
        handleListen();
    }
    // La activación depende de una nueva traducción por voz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlayToken]);

  return (
    <div className="translation-audio">
      <button
        type="button"
        className="listen-button"
        onClick={speaking ? stopPlayback : handleListen}
        disabled={!text || loading}
      >
        {loading ? (
          <LoaderCircle size={17} className="spin" />
        ) : speaking ? (
          <Square size={17} />
        ) : (
          <Volume2 size={18} />
        )}

        {loading
          ? "Generando audio..."
          : speaking
          ? "Detener audio"
          : "Escuchar traducción"}
      </button>

      {language === "qu" && audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          onPlay={() => setSpeaking(true)}
          onPause={() => setSpeaking(false)}
          onEnded={() => setSpeaking(false)}
          aria-label="Audio de la traducción"
        />
      )}

      {error && (
        <p className="audio-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
