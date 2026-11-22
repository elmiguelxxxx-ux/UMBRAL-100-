import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface ExamQuestionListProps {
  questions: any[];
  answers: Record<string, string>;
  loading: boolean;
  onAnswerChange: (questionId: string, answer: string) => void;
  onFinishExam: () => void;
  onResetExam: () => void;
}

export const ExamQuestionList: React.FC<ExamQuestionListProps> = ({
  questions,
  answers,
  loading,
  onAnswerChange,
  onFinishExam,
  onResetExam,
}) => {
  return (
    <div className="mt-6 space-y-5">
      <div className="text-xs font-mono text-[var(--text-secondary)]">
        Responde con tus propias palabras cada pregunta. Al finalizar, se evaluará tu comprensión y se registrará tu intento.
      </div>

      {questions.map((q, idx) => (
        <div
          key={q.id || idx}
          className="border border-[var(--border-color)] bg-[var(--bg-card)] p-5 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-primary)]">
              {idx + 1}
            </span>
            <p className="flex-1 text-sm font-medium text-[var(--text-primary)] leading-relaxed">
              {q.prompt}
            </p>
          </div>

          <textarea
            value={answers[q.id] || ''}
            onChange={(e) => onAnswerChange(q.id, e.target.value)}
            rows={3}
            placeholder="Escribe tu respuesta aquí (intenta explicar la causa, efecto o definición clave)..."
            className="w-full border border-[var(--border-color)] bg-[var(--bg-app)] p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
          />
        </div>
      ))}

      <div className="pt-2 flex items-center justify-between">
        <button
          onClick={onResetExam}
          className="text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          Cancelar y descartar
        </button>
        <button
          disabled={loading}
          onClick={onFinishExam}
          className="flex items-center gap-2 border border-[var(--text-primary)] bg-[var(--text-primary)] px-4 py-2 text-xs font-mono text-[var(--bg-app)] hover:opacity-90 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Evaluando respuestas…
            </>
          ) : (
            <>
              <CheckCircle2 size={13} />
              Terminar evaluación
            </>
          )}
        </button>
      </div>
    </div>
  );
};
