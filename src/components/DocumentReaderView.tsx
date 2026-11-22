import React, { useState } from 'react';
import { AppData, PdfDoc, Note, Folder } from '../types';
import PdfCanvasViewer from './PdfCanvasViewer';
import { ReaderHeader } from './reader/ReaderHeader';
import { ReaderSelectionMenu } from './reader/ReaderSelectionMenu';
import { ReaderSidebar } from './reader/ReaderSidebar';

interface DocumentReaderViewProps {
  pdf: PdfDoc;
  data: AppData;
  path: Folder[];
  onClose: () => void;
  onAddHighlight: (color: string, text: string) => void;
  onDeleteHighlight: (highlightId: string) => void;
  onSendHighlightToCanvas: (text: string, color?: string) => void;
  onAddNoteForDoc: () => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onSendNoteToCanvas: (note: Note) => void;
  onRequestNoteFromHighlight: (text: string, folderId: string) => void;
  onMovePdf?: (pdfId: string, destinationFolderId: string) => void;
  onMoveMultiplePdfs?: (pdfIds: string[], destinationFolderId: string) => void;
  onRenamePdf?: (pdfId: string, newTitle: string) => void;
  onCreateFolderWithName?: (name: string, parentId?: string) => Folder;
  onDeletePdf?: (pdfId: string) => void;
}

export const DocumentReaderView: React.FC<DocumentReaderViewProps> = ({
  pdf,
  path,
  onClose,
  onAddHighlight,
  onDeleteHighlight,
  onSendHighlightToCanvas,
  onAddNoteForDoc,
  onUpdateNote,
  onDeleteNote,
  onSendNoteToCanvas,
  onRequestNoteFromHighlight,
}) => {
  const [readerMode, setReaderMode] = useState<'texto' | 'original'>('texto');
  const [sidebarTab, setSidebarTab] = useState<'anotaciones' | 'notas' | 'interrogador'>('anotaciones');
  const [selectedText, setSelectedText] = useState('');

  const paragraphs =
    pdf.content && pdf.content.trim()
      ? pdf.content.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean)
      : [
          `No se pudo leer texto en "${pdf.title}". Puedes redactar notas personales y extraer fragmentos al Canvas.`,
        ];

  const highlights = pdf.highlights || [];
  const docNotes = pdf.notes || [];

  const handleTextSelected = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim()) {
      setSelectedText(sel.toString().trim());
    }
  };

  const renderHighlightedText = (text: string, hls: typeof highlights) => {
    if (!hls.length) return text;
    let parts: { text: string; color?: string }[] = [{ text }];

    hls.forEach((hl) => {
      const newParts: { text: string; color?: string }[] = [];
      parts.forEach((part) => {
        if (part.color || !part.text.includes(hl.text)) {
          newParts.push(part);
          return;
        }
        const splits = part.text.split(hl.text);
        splits.forEach((s, idx) => {
          if (s) newParts.push({ text: s });
          if (idx < splits.length - 1) {
            newParts.push({ text: hl.text, color: hl.color });
          }
        });
      });
      parts = newParts;
    });

    return parts.map((p, idx) =>
      p.color ? (
        <mark
          key={idx}
          className="rounded-none px-0.5"
          style={{ backgroundColor: p.color, color: 'inherit' }}
        >
          {p.text}
        </mark>
      ) : (
        <span key={idx}>{p.text}</span>
      )
    );
  };

  return (
    <div className="flex h-full w-full bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden">
      {/* Columna Principal de Lectura */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <ReaderHeader
          pdf={pdf}
          path={path}
          readerMode={readerMode}
          onClose={onClose}
          onSetReaderMode={setReaderMode}
        />

        {readerMode === 'original' ? (
          <div className="flex-1 min-h-0 bg-[#404040]">
            <PdfCanvasViewer
              docId={pdf.id}
              docTitle={pdf.title}
            />
          </div>
        ) : (
          <div
            className="flex-1 overflow-y-auto px-6 py-8 md:px-16 lg:px-24 focus:outline-none"
            onMouseUp={handleTextSelected}
          >
            {/* Menú flotante contextual de selección */}
            <ReaderSelectionMenu
              selectedText={selectedText}
              folderId={pdf.folderId}
              onAddHighlight={onAddHighlight}
              onSendHighlightToCanvas={onSendHighlightToCanvas}
              onRequestNoteFromHighlight={onRequestNoteFromHighlight}
              onClearSelection={() => setSelectedText('')}
            />

            {/* Párrafos del texto con formato editorial */}
            <div className="max-w-[70ch] mx-auto space-y-6 text-sm sm:text-base leading-relaxed text-[var(--text-primary)] select-text font-serif">
              {paragraphs.map((para, i) => (
                <p key={i} className="whitespace-pre-wrap">
                  {renderHighlightedText(para, highlights)}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Barra lateral de Subrayados y Notas */}
      <ReaderSidebar
        activeTab={sidebarTab}
        highlights={highlights}
        docNotes={docNotes}
        docContent={pdf.content || ''}
        folderId={pdf.folderId}
        onSelectTab={setSidebarTab}
        onSendHighlightToCanvas={onSendHighlightToCanvas}
        onRequestNoteFromHighlight={onRequestNoteFromHighlight}
        onDeleteHighlight={onDeleteHighlight}
        onAddNoteForDoc={onAddNoteForDoc}
        onUpdateNote={onUpdateNote}
        onDeleteNote={onDeleteNote}
        onSendNoteToCanvas={onSendNoteToCanvas}
      />
    </div>
  );
};
