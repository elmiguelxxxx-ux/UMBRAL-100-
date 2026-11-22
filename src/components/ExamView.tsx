import React, { useMemo, useState } from 'react';
import { Concept, ExamAttempt, Folder } from '../types';
import { Award, AlertCircle } from 'lucide-react';
import { ExamHeader } from './exam/ExamHeader';
import { ExamQuestionList } from './exam/ExamQuestionList';
import { ExamResultsView } from './exam/ExamResultsView';

interface ExamViewProps {
  folders: Folder[];
  concepts: Concept[];
  attempts: ExamAttempt[];
  onAddAttempt: (attempt: ExamAttempt) => void;
  onPrioritize: (conceptIds: string[]) => void;
}

export const ExamView: React.FC<ExamViewProps> = ({
  folders,
  concepts,
  attempts,
  onAddAttempt,
  onPrioritize,
}) => {
  const [folderId, setFolderId] = useState('root');
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<ExamAttempt | null>(null);

  // Filtrado de conceptos según la carpeta seleccionada ('root' = todas las carpetas)
  const selectedConcepts = useMemo(() => {
    if (!folderId || folderId === 'root') return concepts;
    return concepts.filter((c) => c.folderId === folderId);
  }, [concepts, folderId]);

  const handleCreateExam = async () => {
    if (!selectedConcepts.length) {
      setError('No se encontraron conceptos para evaluar en esta carpeta. Agrega material o notas primero.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const generated = selectedConcepts.slice(0, 5).map((c, idx) => ({
        id: c.id || `q-${idx}`,
        prompt: `Explica en detalle el concepto "${c.term || 'Concepto clave'}" y su aplicación práctica.`,
        conceptId: c.id,
        expectedKeywords: c.term,
      }));
      setQuestions(generated);
      setAnswers({});
      setDone(null);
    } catch (e: any) {
      setError(e.message || 'No se pudo generar la evaluación.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishExam = async () => {
    if (!questions.length) return;
    setLoading(true);
    setError('');
    try {
      const answered = questions.filter((q) => (answers[q.id] || '').trim().length > 10);
      const correctQuestionIds = answered.map((q) => q.id);
      const correct = questions.filter((q) => correctQuestionIds.includes(q.id));
      const missed = questions
        .filter((q) => !correctQuestionIds.includes(q.id))
        .map((q) => q.conceptId);

      const score = questions.length ? Math.round((correct.length / questions.length) * 100) : 0;

      const attempt: ExamAttempt = {
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
        folderId,
        questions,
        answers,
        correctConceptIds: correct.map((q) => q.conceptId),
        missedConceptIds: missed,
        score,
        createdAt: Date.now(),
      };

      onAddAttempt(attempt);
      setDone(attempt);
    } catch (e: any) {
      setError(e.message || 'No se pudo calificar la evaluación.');
    } finally {
      setLoading(false);
    }
  };

  const resetExam = () => {
    setDone(null);
    setQuestions([]);
    setAnswers({});
    setError('');
  };

  // Pantalla de resultados cuando el examen finaliza
  if (done) {
    return (
      <ExamResultsView
        done={done}
        onPrioritize={onPrioritize}
        onResetExam={resetExam}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto">
      {/* Cabecera de la vista */}
      <ExamHeader
        folderId={folderId}
        folders={folders}
        concepts={concepts}
        hasQuestions={questions.length > 0}
        loading={loading}
        onSelectFolder={setFolderId}
        onCreateExam={handleCreateExam}
      />

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de preguntas */}
      {questions.length > 0 ? (
        <ExamQuestionList
          questions={questions}
          answers={answers}
          loading={loading}
          onAnswerChange={(qId, val) => setAnswers((prev) => ({ ...prev, [qId]: val }))}
          onFinishExam={handleFinishExam}
          onResetExam={resetExam}
        />
      ) : (
        <div className="mt-12 flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-[#E9E8E4] bg-[#FAFAF9]">
          <div className="p-3 rounded-full bg-[#EAE8E3] text-[#787774] mb-3">
            <Award size={24} />
          </div>
          <h3 className="text-sm font-semibold text-[#1F2328]">Sin examen activo</h3>
          <p className="mt-1 max-w-sm text-xs text-[#787774]">
            Selecciona una carpeta arriba y pulsa en "Generar examen" para crear una sesión de evaluación adaptativa.
          </p>
          {attempts.length > 0 && (
            <div className="mt-6 text-xs text-[#787774]">
              Has completado <b>{attempts.length}</b> evaluaciones previas.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
