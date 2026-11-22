import React from 'react';
import { ChevronLeft, ChevronRight, Check, Layers } from 'lucide-react';
import { JournalEntry } from '../../types';

interface JournalNavigationProps {
  selectedDate: string;
  isToday: boolean;
  showSavedNotification: boolean;
  currentEntry: JournalEntry | null;
  onShiftDate: (days: number) => void;
  onSelectDate: (date: string) => void;
  onGoToToday: () => void;
  onSendToCanvas?: (title: string, content: string) => void;
}

export const JournalNavigation: React.FC<JournalNavigationProps> = ({
  selectedDate,
  isToday,
  showSavedNotification,
  currentEntry,
  onShiftDate,
  onSelectDate,
  onGoToToday,
  onSendToCanvas,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)] mb-6 select-none">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onShiftDate(-1)}
          className="p-1.5 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors cursor-pointer"
          title="Día anterior"
          aria-label="Día anterior"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && onSelectDate(e.target.value)}
            className="text-xs font-mono text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-color)] px-2.5 py-1.5 outline-none cursor-pointer transition-colors"
          />

          {!isToday && (
            <button
              onClick={onGoToToday}
              className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Ir a Hoy
            </button>
          )}
        </div>

        <button
          onClick={() => onShiftDate(1)}
          className="p-1.5 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors cursor-pointer"
          title="Día siguiente"
          aria-label="Día siguiente"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {showSavedNotification && (
          <span className="text-[11px] font-mono text-[var(--fig-accent)] flex items-center gap-1">
            <Check size={12} /> Guardado
          </span>
        )}

        {onSendToCanvas && currentEntry && (currentEntry.content || currentEntry.title) && (
          <button
            onClick={() =>
              onSendToCanvas(
                currentEntry.title || `Diario: ${selectedDate}`,
                currentEntry.content
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border-color)] hover:border-[var(--text-primary)] text-xs font-mono text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Colocar apunte en el lienzo visual"
          >
            <Layers size={13} />
            <span>Enviar a Pizarra</span>
          </button>
        )}
      </div>
    </div>
  );
};
