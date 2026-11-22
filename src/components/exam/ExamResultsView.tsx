import React from 'react';
import { Award, ArrowRight } from 'lucide-react';
import { ExamAttempt } from '../../types';

interface ExamResultsViewProps {
  done: ExamAttempt;
  onPrioritize: (conceptIds: string[]) => void;
  onResetExam: () => void;
}

export const ExamResultsView: React.FC<ExamResultsViewProps> = ({
  done,
  onPrioritize,
  onResetExam,
}) => {
  const isPassing = done.score >= 70;

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto">
      <div className="border border-[var(--border-color)] bg-[var(--bg-card)] p-8">
        <div className="flex items-center gap-3">
          <div className="p-3 border border-[var(--border-color)] text-[var(--fig-accent)]">
            <Award size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono text-[var(--text-primary)]">
              Resultado: {done.score}%
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {isPassing
                ? 'Objetivo de retención alcanzado en los conceptos evaluados.'
                : 'Se identificaron conceptos para reforzar en tu ciclo.'}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 py-4 border-y border-[var(--border-color)]">
          <div className="p-4 border border-[var(--border-color)] bg-[var(--bg-app)]">
            <div className="text-xs font-mono text-[var(--text-secondary)]">Conceptos acertados</div>
            <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-1">
              {done.correctConceptIds.length}
            </div>
          </div>
          <div className="p-4 border border-[var(--border-color)] bg-[var(--bg-app)]">
            <div className="text-xs font-mono text-[var(--text-secondary)]">Conceptos por reforzar</div>
            <div className="text-xl font-bold font-mono text-[var(--text-secondary)] mt-1">
              {done.missedConceptIds.length}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {done.missedConceptIds.length > 0 && (
            <button
              onClick={() => onPrioritize(done.missedConceptIds)}
              className="flex items-center gap-2 border border-[var(--border-color)] hover:border-[var(--text-primary)] px-4 py-2 text-xs font-mono text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <ArrowRight size={13} /> Mandar a repaso ({done.missedConceptIds.length})
            </button>
          )}
          <button
            onClick={onResetExam}
            className="border border-[var(--text-primary)] bg-[var(--text-primary)] px-4 py-2 text-xs font-mono text-[var(--bg-app)] hover:opacity-90 transition-colors cursor-pointer"
          >
            Nueva evaluación
          </button>
        </div>
      </div>
    </div>
  );
};
