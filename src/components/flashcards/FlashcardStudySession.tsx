import React, { useState } from 'react';
import { ArrowLeft, RotateCw, FileText } from 'lucide-react';
import { Flashcard, FSRSRating } from '../../types';
import { formatIntervalString } from '../../lib/fsrs';

interface FlashcardStudySessionProps {
  card: Flashcard;
  currentIndex: number;
  totalCards: number;
  onExit: () => void;
  onRateCard: (rating: FSRSRating, recallText?: string) => void;
}

export const FlashcardStudySession: React.FC<FlashcardStudySessionProps> = ({
  card,
  currentIndex,
  totalCards,
  onExit,
  onRateCard,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [recallDraft, setRecallDraft] = useState('');

  const handleRate = (rating: FSRSRating) => {
    onRateCard(rating, recallDraft.trim() || undefined);
    setIsFlipped(false);
    setRecallDraft('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)] text-[var(--text-primary)] p-6 md:p-10 select-none">
      {/* Study Top Bar */}
      <div className="flex items-center justify-between mb-8 max-w-xl w-full mx-auto">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>Salir de la sesión</span>
        </button>

        <div className="text-xs font-mono text-[var(--text-secondary)]">
          {currentIndex + 1} / {totalCards}
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div className="max-w-xl w-full mx-auto h-1 bg-[var(--border-color)] mb-8 overflow-hidden">
        <div
          className="h-full bg-[var(--text-primary)] transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / totalCards) * 100}%`,
          }}
        />
      </div>

      {/* Flashcard Component */}
      <div className="max-w-xl w-full mx-auto flex-1 flex flex-col justify-center min-h-[320px] mb-8">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full min-h-[280px] bg-[var(--bg-card)] border border-[var(--border-color)] p-7 flex flex-col justify-between transition-colors cursor-pointer relative"
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
            <span className="uppercase tracking-widest text-[10px]">
              {isFlipped ? 'Respuesta' : 'Pregunta'}
            </span>
            {card.sourceDocTitle && (
              <span className="truncate max-w-[220px] flex items-center gap-1 font-normal">
                <FileText size={11} className="opacity-60" /> {card.sourceDocTitle}
              </span>
            )}
          </div>

          <div className="py-8 text-center px-2">
            {!isFlipped && (
              <textarea
                value={recallDraft}
                onChange={(e) => setRecallDraft(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="¿Qué recuerdas? (opcional)"
                className="w-full mb-5 border border-[var(--border-color)] bg-[var(--bg-app)] p-2 text-xs text-[var(--text-primary)] text-left resize-none outline-none focus:border-[var(--text-primary)]"
                rows={2}
              />
            )}
            <p className="text-base md:text-lg font-medium text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {isFlipped ? card.back : card.front}
            </p>
          </div>

          <div className="text-center">
            <span className="text-[11px] font-mono text-[var(--text-secondary)] flex items-center justify-center gap-1.5 font-normal">
              <RotateCw size={11} /> {isFlipped ? 'Clic para ver pregunta' : 'Clic para voltear y ver respuesta'}
            </span>
          </div>
        </div>
      </div>

      {/* FSRS Rating Buttons (Only visible when flipped) */}
      <div className="max-w-xl w-full mx-auto shrink-0 pb-4">
        {isFlipped ? (
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleRate(FSRSRating.Again)}
              className="py-2.5 px-2 bg-[var(--bg-card)] border border-rose-500/40 hover:border-rose-500 text-rose-500 text-center transition-colors cursor-pointer"
            >
              <div className="text-xs font-mono">De nuevo</div>
              <div className="text-[10px] opacity-75 font-mono mt-0.5">
                {formatIntervalString(card, FSRSRating.Again)}
              </div>
            </button>

            <button
              onClick={() => handleRate(FSRSRating.Hard)}
              className="py-2.5 px-2 bg-[var(--bg-card)] border border-amber-500/40 hover:border-amber-500 text-amber-500 text-center transition-colors cursor-pointer"
            >
              <div className="text-xs font-mono">Difícil</div>
              <div className="text-[10px] opacity-75 font-mono mt-0.5">
                {formatIntervalString(card, FSRSRating.Hard)}
              </div>
            </button>

            <button
              onClick={() => handleRate(FSRSRating.Good)}
              className="py-2.5 px-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--text-primary)] text-[var(--text-primary)] text-center transition-colors cursor-pointer"
            >
              <div className="text-xs font-mono">Bien</div>
              <div className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
                {formatIntervalString(card, FSRSRating.Good)}
              </div>
            </button>

            <button
              onClick={() => handleRate(FSRSRating.Easy)}
              className="py-2.5 px-2 bg-[var(--bg-card)] border border-emerald-500/40 hover:border-emerald-500 text-emerald-500 text-center transition-colors cursor-pointer"
            >
              <div className="text-xs font-mono">Fácil</div>
              <div className="text-[10px] opacity-75 font-mono mt-0.5">
                {formatIntervalString(card, FSRSRating.Easy)}
              </div>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsFlipped(true)}
            className="w-full py-3 border border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-app)] font-mono text-xs tracking-wider uppercase hover:opacity-90 transition-colors cursor-pointer"
          >
            Mostrar Respuesta
          </button>
        )}
      </div>
    </div>
  );
};
