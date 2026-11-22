import React, { useState } from 'react';
import { ExamView } from './ExamView';
import { LearningDashboard } from './LearningDashboard';
import { WarLogView } from './WarLogView';
import { ThresholdHistory } from '../features/figure/ThresholdHistory';
import { AppData, ExamAttempt, AiConfig } from '../types';

interface EvaluationSectionProps {
  data: AppData;
  selectedFolderId: string;
  initialTab?: 'examen' | 'dashboard' | 'warlog' | 'umbrales';
  addExamAttempt: (attempt: ExamAttempt) => void;
  prioritizeConcepts: (conceptIds: string[], folderId: string) => void;
  updateWarLog: (warLog: AppData['warLog']) => void;
  onNavigateToAprendizaje: () => void;
}

export const EvaluationSection: React.FC<EvaluationSectionProps> = ({
  data,
  selectedFolderId,
  initialTab = 'examen',
  addExamAttempt,
  prioritizeConcepts,
  updateWarLog,
  onNavigateToAprendizaje,
}) => {
  const [activeTab, setActiveTab] = useState<'examen' | 'dashboard' | 'warlog' | 'umbrales'>(initialTab);

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden">
      {/* Pestañas secundarias de Evaluación */}
      <div className="h-10 min-h-[40px] px-6 border-b border-[var(--border-color)] bg-[var(--bg-app)] flex items-center gap-8 shrink-0 select-none">
        <button
          type="button"
          onClick={() => setActiveTab('examen')}
          className={`h-full flex items-center font-mono text-[11px] tracking-[0.2em] uppercase transition-colors border-b-2 cursor-pointer ${
            activeTab === 'examen'
              ? 'border-[var(--text-primary)] text-[var(--text-primary)] font-bold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Evaluación
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('umbrales')}
          className={`h-full flex items-center font-mono text-[11px] tracking-[0.2em] uppercase transition-colors border-b-2 cursor-pointer ${
            activeTab === 'umbrales'
              ? 'border-[var(--text-primary)] text-[var(--text-primary)] font-bold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Umbrales
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`h-full flex items-center font-mono text-[11px] tracking-[0.2em] uppercase transition-colors border-b-2 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'border-[var(--text-primary)] text-[var(--text-primary)] font-bold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Métricas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('warlog')}
          className={`h-full flex items-center font-mono text-[11px] tracking-[0.2em] uppercase transition-colors border-b-2 cursor-pointer ${
            activeTab === 'warlog'
              ? 'border-[var(--text-primary)] text-[var(--text-primary)] font-bold'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Registro de Guerra
        </button>
      </div>

      {/* Contenido de la pestaña */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'examen' && (
          <ExamView
            folders={data.folders}
            concepts={data.pdfs.flatMap((d) =>
              (d.concepts || []).map((c) => ({ ...c, folderId: d.folderId }))
            )}
            attempts={data.examAttempts || []}
            onAddAttempt={addExamAttempt}
            onPrioritize={(conceptIds) => {
              prioritizeConcepts(conceptIds, selectedFolderId || 'root');
              onNavigateToAprendizaje();
            }}
          />
        )}

        {activeTab === 'umbrales' && <ThresholdHistory />}

        {activeTab === 'dashboard' && (
          <LearningDashboard
            cards={data.flashcards}
            reviews={data.reviewEvents || []}
            warLog={data.warLog.entries}
          />
        )}

        {activeTab === 'warlog' && (
          <WarLogView
            entries={data.warLog.entries}
            standards={data.warLog.standards}
            onUpdateWarLog={updateWarLog}
          />
        )}
      </div>
    </div>
  );
};
