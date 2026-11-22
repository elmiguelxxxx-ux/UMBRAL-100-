import React from 'react';
import { Folder as FolderIcon, FilePlus } from 'lucide-react';
import { AppData, Note, PdfDoc } from '../../types';
import { BibliotecaDocTableRow } from './BibliotecaDocTableRow';
import { BibliotecaNoteCard } from './BibliotecaNoteCard';

interface BibliotecaFolderSectionProps {
  folderId: string;
  depth?: number;
  data: AppData;
  activeTab: 'all' | 'docs' | 'notes';
  searchQuery: string;
  expandedDocNotes: Set<string>;
  editingNoteId: string | null;
  onOpenPdf: (pdfId: string) => void;
  onAddNote: (folderId: string) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onDeletePdf: (pdfId: string) => void;
  onSendDocToCanvas: (pdf: PdfDoc) => void;
  onSendNoteToCanvas: (note: Note) => void;
  onToggleDocNotes: (pdfId: string, e?: React.MouseEvent) => void;
  onSetEditingNoteId: (noteId: string | null) => void;
}

export const BibliotecaFolderSection: React.FC<BibliotecaFolderSectionProps> = ({
  folderId,
  depth = 0,
  data,
  activeTab,
  searchQuery,
  expandedDocNotes,
  editingNoteId,
  onOpenPdf,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onDeletePdf,
  onSendDocToCanvas,
  onSendNoteToCanvas,
  onToggleDocNotes,
  onSetEditingNoteId,
}) => {
  const folder = data.folders.find((f) => f.id === folderId);
  if (!folder) return null;

  let folderPdfs = data.pdfs.filter((p) => p.folderId === folderId);
  let folderNotes = data.notes.filter((n) => n.folderId === folderId && !n.sourcePdfId);

  const query = searchQuery.toLowerCase().trim();
  if (query) {
    folderPdfs = folderPdfs.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        (p.content && p.content.toLowerCase().includes(query))
    );
    folderNotes = folderNotes.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        (n.content && n.content.toLowerCase().includes(query))
    );
  }

  const showPdfs = activeTab === 'all' || activeTab === 'docs';
  const showNotes = activeTab === 'all' || activeTab === 'notes';

  const visiblePdfs = showPdfs ? folderPdfs : [];
  const visibleNotes = showNotes ? folderNotes : [];
  const children = data.folders.filter((f) => f.parentId === folderId);

  if (visiblePdfs.length === 0 && visibleNotes.length === 0 && children.length === 0) {
    return null;
  }

  const getPdfNotes = (pdfId: string) =>
    data.notes.filter((n) => n.sourcePdfId === pdfId);

  return (
    <div style={{ marginLeft: depth * 12 }} className="space-y-3 mb-6">
      {/* Folder header divider */}
      <div className="flex items-center justify-between pt-2 pb-1.5 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
          <FolderIcon size={14} className="text-[var(--text-secondary)]" />
          <span>{folder.name}</span>
          <span className="text-[11px] font-mono text-[var(--text-secondary)] ml-1">
            ({folderPdfs.length} doc{folderPdfs.length !== 1 ? 's' : ''}, {folderNotes.length} nota{folderNotes.length !== 1 ? 's' : ''})
          </span>
        </div>
        <button
          onClick={() => onAddNote(folder.id)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-color)] transition-colors cursor-pointer"
          title="Añadir nota a esta carpeta"
        >
          <FilePlus size={12} /> + Nota
        </button>
      </div>

      {/* Minimalist Structured Documents Table */}
      {visiblePdfs.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-[var(--bg-app)] border-b border-[var(--border-color)] text-[11px] font-mono text-[var(--text-secondary)] select-none">
            <div className="col-span-6 md:col-span-5">Archivo</div>
            <div className="col-span-2 md:col-span-2">Tipo</div>
            <div className="col-span-2 md:col-span-2">Subrayados</div>
            <div className="hidden md:block md:col-span-2">Notas vinculadas</div>
            <div className="col-span-2 md:col-span-1 text-right">Acciones</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[var(--border-color)]">
            {visiblePdfs.map((pdf) => (
              <BibliotecaDocTableRow
                key={pdf.id}
                pdf={pdf}
                docNotes={getPdfNotes(pdf.id)}
                isExpanded={expandedDocNotes.has(pdf.id)}
                editingNoteId={editingNoteId}
                onToggleExpand={onToggleDocNotes}
                onOpenPdf={onOpenPdf}
                onSendDocToCanvas={onSendDocToCanvas}
                onDeletePdf={onDeletePdf}
                onUpdateNote={onUpdateNote}
                onDeleteNote={onDeleteNote}
                onSendNoteToCanvas={onSendNoteToCanvas}
                onSetEditingNoteId={onSetEditingNoteId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Clean Notes in folder */}
      {visibleNotes.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleNotes.map((note) => {
              const sourceDoc = note.sourcePdfId
                ? data.pdfs.find((p) => p.id === note.sourcePdfId)
                : null;

              return (
                <BibliotecaNoteCard
                  key={note.id}
                  note={note}
                  sourceDocTitle={sourceDoc?.title}
                  sourceDocId={sourceDoc?.id}
                  isEditing={editingNoteId === note.id}
                  onStartEditing={() => onSetEditingNoteId(note.id)}
                  onStopEditing={() => onSetEditingNoteId(null)}
                  onUpdateNote={onUpdateNote}
                  onDeleteNote={onDeleteNote}
                  onSendNoteToCanvas={onSendNoteToCanvas}
                  onOpenSourceDoc={onOpenPdf}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Recursive nested folders */}
      {children.map((c) => (
        <BibliotecaFolderSection
          key={c.id}
          folderId={c.id}
          depth={depth + 1}
          data={data}
          activeTab={activeTab}
          searchQuery={searchQuery}
          expandedDocNotes={expandedDocNotes}
          editingNoteId={editingNoteId}
          onOpenPdf={onOpenPdf}
          onAddNote={onAddNote}
          onUpdateNote={onUpdateNote}
          onDeleteNote={onDeleteNote}
          onDeletePdf={onDeletePdf}
          onSendDocToCanvas={onSendDocToCanvas}
          onSendNoteToCanvas={onSendNoteToCanvas}
          onToggleDocNotes={onToggleDocNotes}
          onSetEditingNoteId={onSetEditingNoteId}
        />
      ))}
    </div>
  );
};
