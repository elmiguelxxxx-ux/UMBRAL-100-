import React from 'react';
import { Quote, Layers, StickyNote, X } from 'lucide-react';
import { HIGHLIGHT_COLORS } from '../../constants';

interface ReaderSelectionMenuProps {
  selectedText: string;
  folderId: string;
  onAddHighlight: (color: string, text: string) => void;
  onSendHighlightToCanvas: (text: string) => void;
  onRequestNoteFromHighlight: (text: string, folderId: string) => void;
  onClearSelection: () => void;
}

export const ReaderSelectionMenu: React.FC<ReaderSelectionMenuProps> = ({
  selectedText,
  folderId,
  onAddHighlight,
  onSendHighlightToCanvas,
  onRequestNoteFromHighlight,
  onClearSelection,
}) => {
  if (!selectedText) return null;

  return (
    <div
      className="sticky top-0 z-20 mb-4 flex items-center gap-2 px-3.5 py-2 bg-[var(--bg-card)] text-[var(--text-primary)] text-xs border border-[var(--border-color)] animate-in fade-in select-none"
    >
      <Quote size={13} className="text-[var(--text-secondary)] shrink-0" />
      <span className="truncate flex-1 italic text-[var(--text-secondary)] font-normal">
        "{selectedText.length > 50 ? selectedText.slice(0, 50) + '…' : selectedText}"
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              onAddHighlight(c.value, selectedText);
              onClearSelection();
            }}
            title={`Subrayar en ${c.label}`}
            className="w-4 h-4 rounded-full border border-[var(--border-color)] hover:scale-110 transition-transform cursor-pointer"
            style={{ background: c.value }}
          />
        ))}

        <button
          onClick={() => {
            onSendHighlightToCanvas(selectedText);
            onClearSelection();
          }}
          className="ml-1 px-2.5 py-1 border border-[var(--border-color)] hover:border-[var(--text-primary)] text-[var(--text-primary)] flex items-center gap-1 text-[11px] font-mono transition-colors cursor-pointer"
          title="Enviar al Canvas como nodo"
        >
          <Layers size={12} />
          <span>Canvas</span>
        </button>

        <button
          onClick={() => {
            onRequestNoteFromHighlight(selectedText, folderId);
            onClearSelection();
          }}
          className="px-2.5 py-1 border border-[var(--border-color)] hover:border-[var(--text-primary)] text-[var(--text-primary)] flex items-center gap-1 text-[11px] font-mono transition-colors cursor-pointer"
          title="Crear Apunte desde este fragmento"
        >
          <StickyNote size={12} />
          <span>Apunte</span>
        </button>

        <button
          onClick={onClearSelection}
          className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          title="Deseleccionar"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
