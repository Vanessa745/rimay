
import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import "./AudioRecorder.css";

export default function AudioRecorder({ onAudioReady }) {
  const [status, setStatus] = useState("idle");
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState("");

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioUrlRef = useRef(null);
  const mountedRef = useRef(true);

  const clearAudio = () => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setAudioUrl(null);
  };

  const releaseMicrophone = () => {
    streamRef.current?.getTracks().forEach(
      (track) => track.stop()
    );
    streamRef.current = null;
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }

      releaseMicrophone();

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  
  const startRecording = async () => {
    setError("");
    clearAudio();
    onAudioReady?.(null);

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError(
        "Tu navegador no admite grabación de audio."
      );
      return;
    }

    setStatus("requesting");

    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      chunksRef.current = [];

      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ];

      const mimeType = preferredTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        releaseMicrophone();

        if (!mountedRef.current) return;

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "application/octet-stream",
        });

        if (blob.size === 0) {
          setError("No se capturó ningún audio.");
          setStatus("idle");
          return;
        }

        const url = URL.createObjectURL(blob);

        audioUrlRef.current = url;
        setAudioUrl(url);
        setStatus("recorded");

        // Preparado para la futura fase Speech-to-Text.
        onAudioReady?.(blob);
      };

      recorder.onerror = () => {
        releaseMicrophone();
        if (!mountedRef.current) return;

        setError("Ocurrió un error durante la grabación.");
        setStatus("idle");
      };

      recorder.start();
      setStatus("recording");
    } catch (err) {
      stream?.getTracks().forEach((track) => track.stop());
      releaseMicrophone();

      if (!mountedRef.current) return;

      setStatus("idle");

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setError(
          "Permiso denegado. Habilita el micrófono en tu navegador."
        );
      } else if (err.name === "NotFoundError") {
        setError(
          "No se encontró un micrófono conectado."
        );
      } else {
        setError(
          "No fue posible iniciar la grabación."
        );
      }
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") {
      setStatus("processing");
      recorderRef.current.stop();
      releaseMicrophone();
    }
  };

  const resetRecording = () => {
    clearAudio();
    setError("");
    onAudioReady?.(null);
    setStatus("idle");
  };

  const recording = status === "recording";

  return (
    <section className="rimay-recorder">
      <div className="recorder-heading">
        <div>
          <span className="recorder-eyebrow">
            RIMAY VOZ
          </span>
          <h3>Habla en tu idioma</h3>
          <p>
            Graba tu voz para preparar la futura
            traducción por audio.
          </p>
        </div>

        <span className="recorder-beta">
          Grabación local
        </span>
      </div>

      <div className="recorder-content">
        <div
          className={`recorder-mic ${recording ? "is-recording" : ""}`}
        >
          {recording ? (
            <span className="recorder-pulse">
              <Mic size={36} />
            </span>
          ) : (
            <Mic size={36} />
          )}
        </div>

        <div
          className="recorder-status"
          aria-live="polite"
        >
          {status === "idle" && "Listo para grabar"}
          {status === "requesting" &&
            "Solicitando acceso al micrófono..."}
          {status === "recording" &&
            "Grabando audio..."}
          {status === "processing" &&
            "Preparando grabación..."}
          {status === "recorded" &&
            "Grabación completada"}
        </div>

        {status === "idle" && (
          <button
            type="button"
            className="recorder-btn primary"
            onClick={startRecording}
          >
            <Mic size={18} />
            Iniciar grabación
          </button>
        )}

        {status === "requesting" && (
          <button
            type="button"
            className="recorder-btn primary"
            disabled
          >
            Solicitando permiso...
          </button>
        )}

        {recording && (
          <button
            type="button"
            className="recorder-btn stop"
            onClick={stopRecording}
          >
            <Square size={16} fill="currentColor" />
            Detener grabación
          </button>
        )}

        {status === "recorded" && audioUrl && (
          <div className="recorder-result">
            <div className="recorder-success">
              <CheckCircle2 size={18} />
              Audio capturado correctamente
            </div>

            <audio
              controls
              src={audioUrl}
              className="recorder-player"
              aria-label="Reproducir grabación"
            />

            <div className="recorder-actions">
              <button
                type="button"
                onClick={resetRecording}
                className="recorder-btn secondary"
              >
                <RotateCcw size={17} />
                Grabar otra vez
              </button>

              <button
                type="button"
                onClick={resetRecording}
                className="recorder-btn delete"
              >
                <Trash2 size={17} />
                Eliminar
              </button>
            </div>
          </div>
        )}

        {status === "processing" && (
          <p className="recorder-help">
            Procesando el audio...
          </p>
        )}

        {error && (
          <div className="recorder-error" role="alert">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <p className="recorder-help">
          <Play size={14} />
          En esta etapa, el audio solo se graba y
          reproduce en tu navegador.
        </p>
      </div>
    </section>
  );
}
