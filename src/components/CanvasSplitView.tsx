import React, { useState } from 'react';
import { DocumentItem, Note, Highlight } from '../types';
import {
  X,
  FileText,
  StickyNote,
  Plus,
  ChevronDown,
  Search,
  ExternalLink,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface CanvasSplitViewProps {
  documents: DocumentItem[];
  notes: Note[];
  onClose: () => void;
  onInsertQuoteToCanvas: (quote: string, docTitle?: string, docId?: string) => void;
  onInsertNoteToCanvas: (note: Note) => void;
  onOpenFullDoc?: (docId: string) => void;
}

export const CanvasSplitView: React.FC<CanvasSplitViewProps> = ({
  documents = [],
  notes = [],
  onClose,
  onInsertQuoteToCanvas,
  onInsertNoteToCanvas,
  onOpenFullDoc,
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'notes'>('docs');
  const [selectedDocId, setSelectedDocId] = useState<string>(
    documents[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHighlightText, setSelectedHighlightText] = useState('');

  const currentDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  // Capture user-selected text inside reader
  const handleMouseUpText = () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length > 3) {
      setSelectedHighlightText(sel);
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-80 md:w-96 border-l border-[#E9E8E4] dark:border-[#222225] bg-white dark:bg-[#121214] h-full flex flex-col shadow-lg z-20 transition-all select-none">
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-[#E9E8E4] dark:border-[#222225] flex items-center justify-between bg-[#FAFAF9] dark:bg-[#18181B]">
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-[#18181B] dark:text-[#F4F4F5]" />
          <span className="text-xs font-semibold text-[#18181B] dark:text-[#F4F4F5]">Lector Lateral (Split View)</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-[6px] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors"
          title="Cerrar panel lateral"
        >
          <X size={15} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E9E8E4] dark:border-[#222225] px-4 bg-[#FAFAF9] dark:bg-[#18181B]">
        <button
          onClick={() => setActiveTab('docs')}
          className={`py-2 text-xs font-medium mr-4 relative transition-colors ${
            activeTab === 'docs'
              ? 'text-[#18181B] dark:text-[#F4F4F5]'
              : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
          }`}
        >
          Documentos ({documents.length})
          {activeTab === 'docs' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1F2A17] dark:bg-[#86EFAC] rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`py-2 text-xs font-medium relative transition-colors ${
            activeTab === 'notes'
              ? 'text-[#18181B] dark:text-[#F4F4F5]'
              : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
          }`}
        >
          Notas ({notes.length})
          {activeTab === 'notes' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1F2A17] dark:bg-[#86EFAC] rounded-full" />
          )}
        </button>
      </div>

      {/* Tab 1: Documents View */}
      {activeTab === 'docs' && (
        <div className="flex-1 flex flex-col min-h-0">
          {documents.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#71717A] dark:text-[#A1A1AA]">
              No hay documentos cargados en tus carpetas.
            </div>
          ) : (
            <>
              {/* Document Selector */}
              <div className="p-3 border-b border-[#F0EFEA] dark:border-[#222225] bg-white dark:bg-[#121214] flex items-center justify-between gap-2">
                <select
                  value={selectedDocId}
                  onChange={(e) => {
                    setSelectedDocId(e.target.value);
                    setSelectedHighlightText('');
                  }}
                  className="flex-1 text-xs font-medium text-[#18181B] dark:text-[#F4F4F5] bg-[#F4F4F5] dark:bg-[#18181B] hover:bg-[#E4E4E7] dark:hover:bg-[#27272A] px-2.5 py-1.5 rounded-[6px] outline-none cursor-pointer border border-transparent dark:border-[#27272A] truncate transition-colors"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id} className="dark:bg-[#18181B] dark:text-[#F4F4F5]">
                      {d.title} ({d.kind.toUpperCase()})
                    </option>
                  ))}
                </select>

                {currentDoc && onOpenFullDoc && (
                  <button
                    onClick={() => onOpenFullDoc(currentDoc.id)}
                    className="p-1.5 rounded-[6px] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors"
                    title="Abrir en lector principal completo"
                  >
                    <ExternalLink size={13} />
                  </button>
                )}
              </div>

              {/* Selection banner: click to insert quote onto canvas */}
              {selectedHighlightText && (
                <div className="p-2.5 bg-[#F6F9FD] dark:bg-[#0F1A2E] border-b border-[#DCE8F6] dark:border-[#1E3A5F] flex items-center justify-between gap-2 animate-in fade-in">
                  <span className="text-[11px] text-[#204E78] dark:text-[#93C5FD] truncate flex-1 font-medium">
                    Texto seleccionado: "{selectedHighlightText.slice(0, 45)}..."
                  </span>
                  <button
                    onClick={() => {
                      onInsertQuoteToCanvas(
                        selectedHighlightText,
                        currentDoc?.title,
                        currentDoc?.id
                      );
                      setSelectedHighlightText('');
                    }}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#204E78] dark:bg-[#2563EB] text-white text-[11px] font-medium hover:bg-[#163857] dark:hover:bg-[#1D4ED8] transition-colors"
                  >
                    <Plus size={12} />
                    <span>Enviar a Pizarra</span>
                  </button>
                </div>
              )}

              {/* Document Text Body */}
              <div
                onMouseUp={handleMouseUpText}
                className="flex-1 overflow-y-auto p-4 select-text text-xs text-[#3F3F46] dark:text-[#D4D4D8] leading-relaxed font-serif"
              >
                {currentDoc?.content ? (
                  <div className="whitespace-pre-wrap">
                    {currentDoc.content}
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs text-[#71717A] dark:text-[#A1A1AA] font-sans">
                    {currentDoc?.extractError || 'Documento sin contenido de texto extraído.'}
                  </div>
                )}
              </div>

              {/* Highlights drawer at bottom if any */}
              {currentDoc?.highlights && currentDoc.highlights.length > 0 && (
                <div className="p-3 border-t border-[#F0EFEA] dark:border-[#222225] bg-[#FAFAF9] dark:bg-[#18181B] max-h-40 overflow-y-auto">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] mb-2">
                    Citas / Subrayados ({currentDoc.highlights.length})
                  </div>
                  <div className="space-y-1.5">
                    {currentDoc.highlights.map((h) => (
                      <div
                        key={h.id}
                        className="p-2 rounded-[6px] bg-white dark:bg-[#121214] border border-[#E4E4E7] dark:border-[#27272A] text-[11px] flex items-start justify-between gap-2"
                      >
                        <p className="line-clamp-2 text-[#3F3F46] dark:text-[#D4D4D8] flex-1">"{h.text}"</p>
                        <button
                          onClick={() =>
                            onInsertQuoteToCanvas(h.text, currentDoc.title, currentDoc.id)
                          }
                          className="shrink-0 p-1 rounded hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] transition-colors"
                          title="Insertar cita en el Canvas"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 2: Notes View */}
      {activeTab === 'notes' && (
        <div className="flex-1 flex flex-col min-h-0 p-3">
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2.5 top-[8px] text-[#A1A1AA]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar notas..."
              className="w-full text-xs pl-7 pr-2 py-1.5 rounded-[6px] bg-[#F4F4F5] dark:bg-[#18181B] border border-transparent dark:border-[#27272A] outline-none text-[#18181B] dark:text-[#F4F4F5] placeholder-[#A1A1AA] focus:border-[#3B6D11] dark:focus:border-[#86EFAC] transition-colors"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                No se encontraron notas.
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-2.5 rounded-[6px] bg-white dark:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] hover:border-[#18181B]/20 dark:hover:border-white/20 transition-all text-xs group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate flex-1">
                      {note.title || 'Sin título'}
                    </span>
                    <button
                      onClick={() => onInsertNoteToCanvas(note)}
                      className="opacity-80 group-hover:opacity-100 flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#F4F4F5] dark:bg-[#27272A] hover:bg-[#E4E4E7] dark:hover:bg-[#3F3F46] text-[10px] text-[#18181B] dark:text-[#F4F4F5] transition-colors"
                      title="Insertar en la Pizarra"
                    >
                      <Plus size={11} />
                      <span>Insertar</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] line-clamp-2 leading-relaxed">
                    {note.content || 'Nota vacía'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
