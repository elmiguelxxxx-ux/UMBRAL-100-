import React from 'react';
import {
  Folder as FolderIcon,
  Trash2,
  Edit2,
  FileText,
  Clock,
  RotateCw,
} from 'lucide-react';
import { Flashcard, Folder } from '../../types';

interface FlashcardListProps {
  cards: Flashcard[];
  folders: Folder[];
  onDeleteCard: (id: string) => void;
  onEditCard: (card: Flashcard) => void;
  onResetCardProgress: (card: Flashcard) => void;
}

export const FlashcardList: React.FC<FlashcardListProps> = ({
  cards,
  folders,
  onDeleteCard,
  onEditCard,
  onResetCardProgress,
}) => {
  if (cards.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] p-8 text-center border border-[var(--border-color)] my-4">
        <p className="text-xs font-mono text-[var(--text-secondary)]">No hay tarjetas que coincidan con la búsqueda o colección seleccionada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {cards.map((card) => {
        const folder = folders.find((f) => f.id === card.deckId);
        const folderName = folder ? folder.name : 'General';
        const isDue = card.nextReview && new Date(card.nextReview) <= new Date();

        return (
          <div
            key={card.id}
            className="bg-[var(--bg-card)] p-4 border border-[var(--border-color)] hover:border-[var(--text-primary)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[var(--text-primary)]"
          >
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{card.front}</span>
                {isDue && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono border border-amber-500/50 text-amber-500">
                    Repaso Pendiente
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed font-normal">{card.back}</p>

              <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <FolderIcon size={11} /> {folderName}
                </span>
                {card.sourceDocTitle && (
                  <span className="flex items-center gap-1 truncate max-w-[160px]">
                    <FileText size={11} /> {card.sourceDocTitle}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={11} /> Estabilidad: {card.stability ? card.stability.toFixed(1) : 0}d
                </span>
                <span>Repasos: {card.reps || 0}</span>
                {card.lapses > 0 && <span className="text-rose-500">Fallos: {card.lapses}</span>}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
              <button
                onClick={() => onResetCardProgress(card)}
                className="p-1.5 border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Reiniciar progreso de esta tarjeta"
              >
                <RotateCw size={13} />
              </button>
              <button
                onClick={() => onEditCard(card)}
                className="p-1.5 border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Editar tarjeta"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={() => onDeleteCard(card.id)}
                className="p-1.5 border border-transparent hover:border-red-500/40 text-[var(--text-secondary)] hover:text-red-500 transition-colors cursor-pointer"
                title="Eliminar tarjeta"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
