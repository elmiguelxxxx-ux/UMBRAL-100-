import React from 'react';
import { HelpCircle, Play, Loader2 } from 'lucide-react';
import { Folder, Concept } from '../../types';

interface ExamHeaderProps {
  folderId: string;
  folders: Folder[];
  concepts: Concept[];
  hasQuestions: boolean;
  loading: boolean;
  onSelectFolder: (id: string) => void;
  onCreateExam: () => void;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  folderId,
  folders,
  concepts,
  hasQuestions,
  loading,
  onSelectFolder,
  onCreateExam,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border-color)] pb-5">
      <div>
        <h1 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <HelpCircle size={16} className="text-[var(--text-secondary)]" />
          <span className="font-ailerons tracking-widest uppercase text-xs">Evaluación de Dominio</span>
        </h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Ponte a prueba con preguntas activas extraídas de tus conceptos y documentos clave.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={folderId}
          onChange={(e) => onSelectFolder(e.target.value)}
          className="border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)]"
        >
          <option value="root">Todas las carpetas ({concepts.length} conceptos)</option>
          {folders
            .filter((f) => f.id !== 'root')
            .map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
        </select>

        {!hasQuestions && (
          <button
            disabled={loading}
            onClick={onCreateExam}
            className="flex items-center gap-1.5 border border-[var(--text-primary)] bg-[var(--text-primary)] px-3.5 py-1.5 text-xs font-mono text-[var(--bg-app)] hover:opacity-90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Generando…
              </>
            ) : (
              <>
                <Play size={12} />
                Iniciar evaluación
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
