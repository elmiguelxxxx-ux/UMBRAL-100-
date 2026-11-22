import React from 'react';
import {
  FileText,
  StickyNote,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
  Trash2,
} from 'lucide-react';
import { PdfDoc, Note } from '../../types';
import { KIND_META } from '../../constants';
import { BibliotecaNoteCard } from './BibliotecaNoteCard';

interface BibliotecaDocTableRowProps {
  pdf: PdfDoc;
  docNotes: Note[];
  isExpanded: boolean;
  editingNoteId: string | null;
  onToggleExpand: (pdfId: string, e?: React.MouseEvent) => void;
  onOpenPdf: (pdfId: string) => void;
  onSendDocToCanvas: (pdf: PdfDoc) => void;
  onDeletePdf: (pdfId: string) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onSendNoteToCanvas: (note: Note) => void;
  onSetEditingNoteId: (noteId: string | null) => void;
}

export const BibliotecaDocTableRow: React.FC<BibliotecaDocTableRowProps> = ({
  pdf,
  docNotes,
  isExpanded,
  editingNoteId,
  onToggleExpand,
  onOpenPdf,
  onSendDocToCanvas,
  onDeletePdf,
  onUpdateNote,
  onDeleteNote,
  onSendNoteToCanvas,
  onSetEditingNoteId,
}) => {
  const meta = KIND_META[pdf.kind || 'pdf'];

  return (
    <React.Fragment>
      <div
        onClick={() => onOpenPdf(pdf.id)}
        className="grid grid-cols-12 gap-3 items-center px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group text-xs text-[var(--text-primary)]"
      >
        {/* Nombre del archivo */}
        <div className="col-span-6 md:col-span-5 flex items-center gap-2.5 min-w-0 pr-2">
          <FileText size={15} className="shrink-0" style={{ color: meta.color }} />
          <span className="font-medium text-[var(--text-primary)] truncate">
            {pdf.title}
          </span>
        </div>

        {/* Tipo */}
        <div className="col-span-2 md:col-span-2">
          <span
            className="text-[10px] font-mono px-2 py-0.5 border border-[var(--border-color)] inline-block"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
        </div>

        {/* Subrayados */}
        <div className="col-span-2 md:col-span-2 text-[var(--text-secondary)] font-mono text-[11px]">
          {pdf.highlights?.length || 0} cita{pdf.highlights?.length !== 1 ? 's' : ''}
        </div>

        {/* Notas vinculadas */}
        <div className="hidden md:block md:col-span-2" onClick={(e) => e.stopPropagation()}>
          {docNotes.length > 0 ? (
            <button
              onClick={(e) => onToggleExpand(pdf.id, e)}
              className={`flex items-center gap-1 px-2 py-0.5 border text-[11px] font-mono transition-colors cursor-pointer ${
                isExpanded
                  ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-app)]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Ver notas generadas de este documento"
            >
              <StickyNote size={11} />
              <span>{docNotes.length} nota{docNotes.length !== 1 ? 's' : ''}</span>
              {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </button>
          ) : (
            <button
              onClick={() => onOpenPdf(pdf.id)}
              className="text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              + Crear nota
            </button>
          )}
        </div>

        {/* Acciones */}
        <div
          className="col-span-2 md:col-span-1 flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onOpenPdf(pdf.id)}
            className="p-1.5 border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Abrir lector"
          >
            <ExternalLink size={13} />
          </button>
          <button
            onClick={() => onSendDocToCanvas(pdf)}
            className="p-1.5 border border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Enviar al Canvas"
          >
            <Layers size={13} />
          </button>
          <button
            onClick={() => onDeletePdf(pdf.id)}
            className="p-1.5 border border-transparent hover:border-red-500/40 text-[var(--text-secondary)] hover:text-red-500 transition-colors cursor-pointer"
            title="Eliminar documento"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded Notes for this Document */}
      {isExpanded && docNotes.length > 0 && (
        <div className="bg-[#FAF9F7] dark:bg-[#141416] px-5 py-3 border-t border-[#F0EFEA] dark:border-[#222225]">
          <div className="text-[11px] font-medium text-[#71717A] dark:text-[#A1A1AA] flex items-center gap-1.5 mb-2.5">
            <StickyNote size={12} className="text-[#18181B] dark:text-[#F4F4F5]" />
            <span>Notas vinculadas a "{pdf.title}":</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {docNotes.map((note) => (
              <BibliotecaNoteCard
                key={note.id}
                note={note}
                isEditing={editingNoteId === note.id}
                onStartEditing={() => onSetEditingNoteId(note.id)}
                onStopEditing={() => onSetEditingNoteId(null)}
                onUpdateNote={onUpdateNote}
                onDeleteNote={onDeleteNote}
                onSendNoteToCanvas={onSendNoteToCanvas}
              />
            ))}
          </div>
        </div>
      )}
    </React.Fragment>
  );
};
