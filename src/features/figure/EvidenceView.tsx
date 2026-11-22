import React, { useState } from 'react';
import { Mic, MicOff, Check, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '../../lib/useSpeechRecognition';
import { MissionRecord } from './useMission';
import { UmbralActiveThreshold } from '../useUmbralProgress';
import { useVerdict, VerdictResult } from './useVerdict';
import { useSettings } from '../../context/SettingsContext';

export interface EvidenceViewProps {
  mission: MissionRecord;
  threshold: UmbralActiveThreshold;
  docExcerpt?: string;
  onFinishCycle: () => void;
  onSaveJournalNote?: (text: string) => void;
}

/**
 * EvidenceView: Nivel 5 EVIDENCIA
 * Campo de texto (mín 60 chars) con micrófono (useSpeechRecognition).
 * Botón ENVIAR → POST /api/evaluate-evidence o modo autoevaluación.
 * Muestra Veredicto: Logrado (--fig-accent), Parcial (--fig-partial), No logrado (--fig-mute).
 */
export const EvidenceView: React.FC<EvidenceViewProps> = ({
  mission,
  threshold,
  docExcerpt = '',
  onFinishCycle,
  onSaveJournalNote,
}) => {
  const { settings } = useSettings();
  const aiEnabled = settings.aiEnabled !== false;

  const [answer, setAnswer] = useState('');
  const [rubricAnswers, setRubricAnswers] = useState<boolean[]>(
    threshold.subtopics?.map(() => false) || [false]
  );
  const [journalReflection, setJournalReflection] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);

  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition({
    onFinalTranscript: (text) => setAnswer((prev) => (prev ? `${prev} ${text}` : text)),
  });

  const { evaluateEvidence, isSubmitting, result } = useVerdict();

  const handleToggleMic = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleSend = async () => {
    if (answer.trim().length < 60) return;
    await evaluateEvidence({
      mission,
      threshold,
      answer: answer.trim(),
      docExcerpt,
      aiEnabled,
      selfRubricAnswers: rubricAnswers,
    });
  };

  const handleSaveReflection = () => {
    if (journalReflection.trim() && onSaveJournalNote) {
      onSaveJournalNote(journalReflection.trim());
      setJournalSaved(true);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto p-6 md:p-12 max-w-2xl mx-auto flex flex-col space-y-6 select-none">
      <div className="border-b border-[var(--fig-line)] pb-4">
        <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--fig-mute)] block mb-1">
          EVIDENCIA Y VEREDICTO · NIVEL 5
        </span>
        <h1 className="text-xl md:text-2xl font-normal text-[var(--fig-ink)]">
          {threshold.text}
        </h1>
        <p className="text-xs font-mono text-[var(--fig-mute)] mt-1">
          Explica el umbral con tus propias palabras y sin consultar notas.
        </p>
      </div>

      {!result ? (
        <div className="space-y-6">
          {/* Autoevaluación previa si no hay IA */}
          {!aiEnabled && threshold.subtopics && threshold.subtopics.length > 0 && (
            <div className="p-4 border border-[var(--fig-line)] bg-[var(--bg-card)] space-y-2.5">
              <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--fig-mute)] block">
                Rúbrica de auto-verificación (Subtemas esperados)
              </span>
              <div className="space-y-2">
                {threshold.subtopics.map((sub, idx) => (
                  <label key={idx} className="flex items-center gap-2.5 text-xs text-[var(--fig-ink)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rubricAnswers[idx] || false}
                      onChange={(e) => {
                        const copy = [...rubricAnswers];
                        copy[idx] = e.target.checked;
                        setRubricAnswers(copy);
                      }}
                      className="accent-[var(--fig-accent)]"
                    />
                    <span>¿Cubriste con precisión: {sub}?</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Campo de texto de evidencia con contador y micrófono */}
          <div className="border border-[var(--fig-line)] bg-[var(--bg-card)] p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--fig-mute)]">Mi respuesta / demostración</span>
              {isSupported && (
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`flex items-center gap-1.5 px-2 py-1 border text-[11px] transition-colors cursor-pointer ${
                    isListening
                      ? 'border-red-500 text-red-500 animate-pulse'
                      : 'border-[var(--fig-line)] text-[var(--fig-mute)] hover:text-[var(--fig-ink)]'
                  }`}
                >
                  {isListening ? <MicOff size={12} /> : <Mic size={12} />}
                  <span>{isListening ? 'Detener micrófono' : 'Dictar'}</span>
                </button>
              )}
            </div>

            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Explica detalladamente la idea central sin consultar ningún material externo..."
              rows={8}
              className="w-full bg-transparent border-0 outline-none text-sm text-[var(--fig-ink)] placeholder-[var(--fig-mute)] leading-relaxed resize-none font-sans"
            />

            <div className="flex items-center justify-between pt-2 border-t border-[var(--fig-line)] text-[11px] font-mono">
              <span className={answer.length < 60 ? 'text-[var(--fig-mute)]' : 'text-[var(--fig-accent)]'}>
                {answer.length} / 60 caracteres mínimos
              </span>
              <span className="text-[var(--fig-mute)]">
                {aiEnabled ? 'Evaluación guiada por IA' : 'Autoevaluación manual'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={answer.trim().length < 60 || isSubmitting}
              onClick={handleSend}
              className="px-8 py-3.5 border border-[var(--fig-ink)] text-xs font-sans uppercase tracking-[0.2em] text-[var(--fig-ink)] hover:bg-[var(--fig-ink)] hover:text-[var(--bg-app)] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-medium"
            >
              {isSubmitting ? 'EVALUANDO...' : 'ENVIAR EVIDENCIA'}
            </button>
          </div>
        </div>
      ) : (
        /* Pantalla de Veredicto */
        <div className="space-y-6 animate-in fade-in duration-300">
          <div
            className="p-6 border"
            style={{
              borderColor:
                result.verdict === 'logrado'
                  ? 'var(--fig-accent)'
                  : result.verdict === 'parcial'
                  ? 'var(--fig-partial)'
                  : 'var(--fig-line)',
              backgroundColor: 'var(--bg-card)',
            }}
          >
            <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--fig-mute)] block mb-1">
              VEREDICTO
            </span>
            <div className="flex items-center gap-3">
              <h2
                className="text-2xl font-medium uppercase font-sans"
                style={{
                  color:
                    result.verdict === 'logrado'
                      ? 'var(--fig-accent)'
                      : result.verdict === 'parcial'
                      ? 'var(--fig-partial)'
                      : 'var(--fig-mute)',
                }}
              >
                {result.verdict === 'logrado'
                  ? 'LOGRADO'
                  : result.verdict === 'parcial'
                  ? 'PARCIAL'
                  : 'NO LOGRADO'}
              </h2>
              {result.helpUsed > 0 && (
                <span className="text-xs font-mono text-[var(--fig-mute)]">
                  (Ayuda utilizada: {result.helpUsed})
                </span>
              )}
            </div>

            {/* Lagunas */}
            {result.gaps && result.gaps.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--fig-line)] space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fig-mute)]">
                  Lagunas señaladas:
                </span>
                <ul className="list-disc list-inside space-y-1 text-xs text-[var(--fig-ink)]">
                  {result.gaps.map((g, idx) => (
                    <li key={idx}>{g}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pregunta socrática de seguimiento */}
            {result.question && (
              <div className="mt-4 pt-3 border-t border-[var(--fig-line)]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fig-mute)] block mb-1">
                  Pregunta de auto-indagación:
                </span>
                <p className="text-xs italic text-[var(--fig-ink)]">"{result.question}"</p>
              </div>
            )}
          </div>

          {/* Pregunta opcional de Diario */}
          <div className="p-4 border border-[var(--fig-line)] bg-[var(--bg-card)] space-y-3">
            <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--fig-mute)] block">
              Registro en Bitácora / Diario (Opcional)
            </span>
            <p className="text-xs text-[var(--fig-ink)]">
              ¿Qué salió mal o qué aprendiste en esta sesión?
            </p>
            <textarea
              value={journalReflection}
              onChange={(e) => setJournalReflection(e.target.value)}
              placeholder="Reflexión de consolidación..."
              rows={3}
              className="w-full bg-transparent border border-[var(--fig-line)] p-2 text-xs text-[var(--fig-ink)] placeholder-[var(--fig-mute)] outline-none resize-none font-sans"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveReflection}
                disabled={journalSaved || !journalReflection.trim()}
                className="px-4 py-1.5 border border-[var(--fig-line)] text-xs font-mono text-[var(--fig-ink)] hover:border-[var(--fig-ink)] disabled:opacity-40 transition-colors cursor-pointer"
              >
                {journalSaved ? 'Guardado en Diario' : 'Guardar en Diario'}
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onFinishCycle}
              className="px-8 py-3.5 border border-[var(--fig-ink)] text-xs font-sans uppercase tracking-[0.2em] text-[var(--fig-ink)] hover:bg-[var(--fig-ink)] hover:text-[var(--bg-app)] transition-all cursor-pointer font-medium"
            >
              FINALIZAR CICLO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
