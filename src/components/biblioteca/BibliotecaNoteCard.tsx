import React from 'react';
import { Layers, Trash2, FileText, ExternalLink } from 'lucide-react';
import { Note } from '../../types';

interface BibliotecaNoteCardProps {
  note: Note;
  sourceDocTitle?: string;
  sourceDocId?: string;
  isEditing: boolean;
  onStartEditing: () => void;
  onStopEditing: () => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onSendNoteToCanvas: (note: Note) => void;
  onOpenSourceDoc?: (docId: string) => void;
}

export const BibliotecaNoteCard: React.FC<BibliotecaNoteCardProps> = ({
  note,
  sourceDocTitle,
  sourceDocId,
  isEditing,
  onStartEditing,
  onStopEditing,
  onUpdateNote,
  onDeleteNote,
  onSendNoteToCanvas,
  onOpenSourceDoc,
}) => {
  return (
    <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2 group relative transition-all text-[var(--text-primary)]">
      {/* Source document link if any */}
      {sourceDocTitle && sourceDocId && onOpenSourceDoc && (
        <div
          onClick={() => onOpenSourceDoc(sourceDocId)}
          className="text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer transition-colors truncate mb-1"
          title={`Documento de origen: ${sourceDocTitle}`}
        >
          <FileText size={11} className="shrink-0 text-[var(--text-secondary)]" />
          <span className="truncate">
            De: <span className="hover:underline">{sourceDocTitle}</span>
          </span>
          <ExternalLink size={9} className="shrink-0 opacity-60" />
        </div>
      )}

      {/* Header with Title and Actions */}
      <div className="flex items-start justify-between gap-2">
        <input
          value={note.title}
          onChange={(e) => onUpdateNote({ ...note, title: e.target.value })}
          className="w-full text-xs font-semibold text-[var(--text-primary)] bg-transparent outline-none placeholder-[var(--text-secondary)]"
          placeholder="Título de la nota"
        />
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onSendNoteToCanvas(note)}
            className="p-1 border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Enviar al Canvas"
          >
            <Layers size={12} />
          </button>
          <button
            onClick={() => onDeleteNote(note.id)}
            className="p-1 border border-transparent hover:border-red-500/40 text-[var(--text-secondary)] hover:text-red-500 transition-colors cursor-pointer"
            title="Eliminar nota"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Note Content */}
      {isEditing ? (
        <textarea
          autoFocus
          rows={3}
          value={note.content}
          onChange={(e) => onUpdateNote({ ...note, content: e.target.value })}
          onBlur={onStopEditing}
          placeholder="Escribe aquí tu nota..."
          className="w-full text-xs text-[var(--text-primary)] bg-transparent outline-none resize-none leading-relaxed font-normal overflow-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        />
      ) : (
        <div
          onClick={onStartEditing}
          className="text-xs text-[var(--text-primary)] leading-relaxed font-normal line-clamp-3 overflow-hidden text-ellipsis cursor-text min-h-[3.5rem]"
          title="Haz clic para editar"
        >
          {note.content || (
            <span className="text-[var(--text-secondary)] italic">Escribe aquí tu nota...</span>
          )}
        </div>
      )}

      {/* Metadata Footer */}
      <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
        <span>
          {new Date(note.createdAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
          })}
        </span>
        <button
          onClick={() => onSendNoteToCanvas(note)}
          className="text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-normal flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Layers size={11} /> Canvas
        </button>
      </div>
    </div>
  );
};
