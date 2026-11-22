import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { AppData, Folder, Note, PdfDoc } from '../types';
import { BibliotecaToolbar } from './biblioteca/BibliotecaToolbar';
import { BibliotecaFolderSection } from './biblioteca/BibliotecaFolderSection';

interface BibliotecaViewProps {
  data: AppData;
  onOpenPdf: (pdfId: string) => void;
  onAddNote: (folderId: string) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onDeletePdf: (pdfId: string) => void;
  onMovePdf: (pdfId: string, destinationFolderId: string) => void;
  onMoveMultiplePdfs: (pdfIds: string[], destinationFolderId: string) => void;
  onRenamePdf: (pdfId: string, newTitle: string) => void;
  onCreateFolderWithName: (name: string, parentId?: string) => Folder;
  onSendDocToCanvas: (pdf: PdfDoc) => void;
  onSendNoteToCanvas: (note: Note) => void;
  onOpenImportPicker: (folderId: string) => void;
  onSelectFolder?: (folderId: string) => void;
  isImporting?: boolean;
}

export const BibliotecaView: React.FC<BibliotecaViewProps> = ({
  data,
  onOpenPdf,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onDeletePdf,
  onMovePdf,
  onMoveMultiplePdfs,
  onRenamePdf,
  onCreateFolderWithName,
  onSendDocToCanvas,
  onSendNoteToCanvas,
  onOpenImportPicker,
  onSelectFolder,
  isImporting = false,
}) => {
  const [bibliotecaTab, setBibliotecaTab] = useState<'all' | 'docs' | 'notes'>('all');
  const [bibliotecaSearch, setBibliotecaSearch] = useState('');
  const [expandedDocNotes, setExpandedDocNotes] = useState<Set<string>>(new Set());
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const totalPdfs = data.pdfs.length;
  const totalNotes = data.notes.length;
  const totalItems = totalPdfs + totalNotes;

  const toggleDocNotes = (pdfId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedDocNotes((prev) => {
      const next = new Set(prev);
      if (next.has(pdfId)) next.delete(pdfId);
      else next.add(pdfId);
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#F8F5EE] dark:bg-[#09090B] transition-colors">
      {/* Header and Filter Toolbar */}
      <BibliotecaToolbar
        totalPdfs={totalPdfs}
        totalNotes={totalNotes}
        totalItems={totalItems}
        activeTab={bibliotecaTab}
        searchQuery={bibliotecaSearch}
        isImporting={isImporting}
        onSelectTab={setBibliotecaTab}
        onChangeSearch={setBibliotecaSearch}
        onAddNote={() => onAddNote('root')}
        onOpenImportPicker={() => onOpenImportPicker('root')}
      />

      {/* Content list or Empty State */}
      {totalItems === 0 ? (
        <div
          className="text-center py-20 text-xs text-[#71717A] bg-white dark:bg-[#09090B] dark:border dark:border-[#222225] rounded-[8px]"
          style={{ boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)' }}
        >
          <BookOpen size={32} className="mx-auto mb-2 text-[#D4D4D8] dark:text-[#3F3F46]" />
          Aún no hay documentos ni notas en tu biblioteca.
          <div className="flex gap-2 justify-center mt-3">
            <button
              onClick={() => onAddNote('root')}
              className="px-3 py-1.5 rounded-[6px] text-xs font-medium bg-[#F4F4F5] hover:bg-[#E4E4E7] dark:bg-[#1C1C1F] dark:hover:bg-[#27272A] text-[#3F3F46] dark:text-[#F4F4F5] transition-colors"
            >
              + Crear primera nota
            </button>
            <button
              onClick={() => onOpenImportPicker('root')}
              className="px-3 py-1.5 rounded-[6px] text-xs font-medium bg-[#F4F4F5] hover:bg-[#E4E4E7] dark:bg-[#1C1C1F] dark:hover:bg-[#27272A] text-[#3F3F46] dark:text-[#F4F4F5] transition-colors"
            >
              Importar documento
            </button>
          </div>
        </div>
      ) : (
        <BibliotecaFolderSection
          folderId="root"
          data={data}
          activeTab={bibliotecaTab}
          searchQuery={bibliotecaSearch}
          expandedDocNotes={expandedDocNotes}
          editingNoteId={editingNoteId}
          onOpenPdf={onOpenPdf}
          onAddNote={onAddNote}
          onUpdateNote={onUpdateNote}
          onDeleteNote={onDeleteNote}
          onDeletePdf={onDeletePdf}
          onSendDocToCanvas={onSendDocToCanvas}
          onSendNoteToCanvas={onSendNoteToCanvas}
          onToggleDocNotes={toggleDocNotes}
          onSetEditingNoteId={setEditingNoteId}
        />
      )}
    </div>
  );
};
