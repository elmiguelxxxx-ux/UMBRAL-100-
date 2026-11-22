import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Folder } from '../../types';
import { reviewFlashcard } from '../../lib/aiClient';

interface CreateFlashcardModalProps {
  isOpen: boolean;
  frontDraft: string;
  backDraft: string;
  targetFolderDraft: string;
  folders: Folder[];
  onClose: () => void;
  onSetFrontDraft: (val: string) => void;
  onSetBackDraft: (val: string) => void;
  onSetTargetFolderDraft: (val: string) => void;
  onCreateCard: () => void;
}

export const CreateFlashcardModal: React.FC<CreateFlashcardModalProps> = ({
  isOpen,
  frontDraft,
  backDraft,
  targetFolderDraft,
  folders,
  onClose,
  onSetFrontDraft,
  onSetBackDraft,
  onSetTargetFolderDraft,
  onCreateCard,
}) => {
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewQuestion, setReviewQuestion] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReview = async () => {
    if (!frontDraft.trim() || !backDraft.trim()) return;
    setIsReviewing(true);
    try {
      const questions = await reviewFlashcard(frontDraft.trim(), backDraft.trim());
      setReviewQuestion(questions[0] || null);
    } catch {
      setReviewQuestion('¿Tu respuesta es lo bastante concisa y comprensible sin ambigüedad?');
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[8px] max-w-md w-full p-6 space-y-4 text-[#1F2328]"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E9E8E4] pb-3">
          <h3 className="font-semibold text-sm text-[#1F2328] flex items-center gap-1.5">
            <Plus size={15} /> Nueva Flashcard Manual
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-[#F4F3EF] rounded text-[#787774]">
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-[#787774] mb-1">
              Frente (Pregunta o Concepto)
            </label>
            <textarea
              rows={2}
              value={frontDraft}
              onChange={(e) => onSetFrontDraft(e.target.value)}
              placeholder="¿Qué es...? o define el término..."
              className="w-full text-xs p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E9E8E4] text-[#1F2328] outline-none focus:border-[#1F2328] resize-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#787774] mb-1">
              Dorso (Respuesta o Explicación)
            </label>
            <textarea
              rows={3}
              value={backDraft}
              onChange={(e) => onSetBackDraft(e.target.value)}
              placeholder="La respuesta concisa..."
              className="w-full text-xs p-2.5 rounded-lg bg-[#FAF9F6] border border-[#E9E8E4] text-[#1F2328] outline-none focus:border-[#1F2328] resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#787774] mb-1">
              Carpeta / Mazo
            </label>
            <select
              value={targetFolderDraft}
              onChange={(e) => onSetTargetFolderDraft(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-[#FAF9F6] border border-[#E9E8E4] text-[#1F2328] outline-none focus:border-[#1F2328]"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {reviewQuestion && (
          <div className="p-3 border border-[var(--fig-line)] bg-[var(--bg-card)] text-xs text-[var(--fig-ink)]">
            <span className="text-[10px] uppercase font-mono text-[var(--fig-mute)] block mb-1">
              Pregunta de revisión:
            </span>
            <p className="italic leading-relaxed">"{reviewQuestion}"</p>
          </div>
        )}

        <div className="flex justify-between items-center gap-2 pt-2 border-t border-[#E9E8E4]">
          <button
            type="button"
            onClick={handleReview}
            disabled={isReviewing || !frontDraft.trim() || !backDraft.trim()}
            className="px-3 py-1.5 text-xs font-mono border border-[var(--fig-line)] hover:border-[var(--fig-ink)] text-[var(--fig-ink)] rounded-[7px] disabled:opacity-40 transition-colors"
          >
            {isReviewing ? 'Revisando...' : 'Revisar mi tarjeta'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#787774] hover:bg-[#F4F3EF] rounded-[7px] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onCreateCard}
              disabled={!frontDraft.trim() || !backDraft.trim()}
              className="px-4 py-1.5 bg-[#EAEAEA] hover:bg-[#DFDFDF] text-[#1F2328] rounded-[7px] text-xs font-medium disabled:opacity-40 transition-colors"
            >
              Crear Tarjeta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
