import { useState, useEffect, useRef, useCallback } from 'react';

// Declaración de tipos para SpeechRecognition web standard
interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

interface UseSpeechRecognitionOptions {
  onFinalTranscript?: (transcript: string) => void;
  lang?: string;
}

export function useSpeechRecognition({
  onFinalTranscript,
  lang = 'es-ES',
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  onFinalTranscriptRef.current = onFinalTranscript;

  useEffect(() => {
    const win = window as IWindowWithSpeech;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionClass);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignorar si ya estaba detenido
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');

    const win = window as IWindowWithSpeech;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setError('El reconocimiento de voz no está soportado en este navegador. Puedes escribir tus comandos.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognitionClass();
      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalResult = '';
      let lastInterim = '';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalResult += text;
          } else {
            interim += text;
          }
        }
        lastInterim = interim;
        const current = (finalResult || interim).trim();
        setTranscript(current);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('Permiso de micrófono denegado. Permite el acceso al micrófono o escribe el comando.');
        } else if (event.error === 'no-speech') {
          // No se detectó voz
        } else if (event.error !== 'aborted') {
          setError(`Error de voz: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Usa finalResult si existe, si no usa el último interim capturado
        const trimmed = (finalResult || lastInterim).trim();
        if (trimmed && onFinalTranscriptRef.current) {
          onFinalTranscriptRef.current(trimmed);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setError('No se pudo activar el micrófono.');
    }
  }, [lang]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
}
