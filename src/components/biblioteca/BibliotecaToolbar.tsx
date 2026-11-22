import React from 'react';
import { BookOpen, FilePlus, Upload, Loader2, Search, X } from 'lucide-react';

interface BibliotecaToolbarProps {
  totalPdfs: number;
  totalNotes: number;
  totalItems: number;
  activeTab: 'all' | 'docs' | 'notes';
  searchQuery: string;
  isImporting?: boolean;
  onSelectTab: (tab: 'all' | 'docs' | 'notes') => void;
  onChangeSearch: (query: string) => void;
  onAddNote: () => void;
  onOpenImportPicker: () => void;
}

export const BibliotecaToolbar: React.FC<BibliotecaToolbarProps> = ({
  totalPdfs,
  totalNotes,
  totalItems,
  activeTab,
  searchQuery,
  isImporting = false,
  onSelectTab,
  onChangeSearch,
  onAddNote,
  onOpenImportPicker,
}) => {
  return (
    <>
      {/* Header with Title and Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <span className="w-6 h-6 border border-[var(--border-color)] bg-[var(--bg-app)] flex items-center justify-center text-[var(--fig-accent)]">
              <BookOpen size={13} />
            </span>
            <span className="font-ailerons tracking-widest uppercase text-xs">Biblioteca</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-normal mt-0.5">
            {totalPdfs} documento{totalPdfs !== 1 ? 's' : ''} y {totalNotes} nota{totalNotes !== 1 ? 's' : ''} organizados en tu espacio de estudio.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={onAddNote}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-transparent hover:bg-[var(--text-primary)] hover:text-[var(--bg-app)] text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <FilePlus size={13} />
            <span>+ Nueva nota</span>
          </button>
          <button
            onClick={onOpenImportPicker}
            disabled={isImporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono bg-[var(--text-primary)] text-[var(--bg-app)] border border-[var(--text-primary)] hover:opacity-90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isImporting ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            <span>Importar</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Underline Tabs + Right-Aligned Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#E7E2D3] dark:border-[#222225] pt-1">
        <div className="flex items-center gap-6">
          <button
            onClick={() => onSelectTab('all')}
            className={`pb-2.5 text-xs font-medium transition-colors relative ${
              activeTab === 'all'
                ? 'text-[#18181B] dark:text-[#F4F4F5]'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
            }`}
          >
            Todos <span className="text-[#A1A1AA] dark:text-[#71717A] font-normal ml-0.5">({totalItems})</span>
            {activeTab === 'all' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3B6D11] rounded-full" />
            )}
          </button>
          <button
            onClick={() => onSelectTab('docs')}
            className={`pb-2.5 text-xs font-medium transition-colors relative ${
              activeTab === 'docs'
                ? 'text-[#18181B] dark:text-[#F4F4F5]'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
            }`}
          >
            Documentos <span className="text-[#A1A1AA] dark:text-[#71717A] font-normal ml-0.5">({totalPdfs})</span>
            {activeTab === 'docs' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3B6D11] rounded-full" />
            )}
          </button>
          <button
            onClick={() => onSelectTab('notes')}
            className={`pb-2.5 text-xs font-medium transition-colors relative ${
              activeTab === 'notes'
                ? 'text-[#18181B] dark:text-[#F4F4F5]'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
            }`}
          >
            Notas de lectura <span className="text-[#A1A1AA] dark:text-[#71717A] font-normal ml-0.5">({totalNotes})</span>
            {activeTab === 'notes' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3B6D11] rounded-full" />
            )}
          </button>
        </div>

        {/* Right-aligned search */}
        <div className="relative pb-2 self-end sm:self-auto">
          <Search size={13} className="absolute left-2.5 top-[7px] text-[#A1A1AA]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-44 focus:w-60 transition-all duration-200 text-xs pl-8 pr-7 py-1.5 rounded-[6px] bg-[#F4F4F5] dark:bg-[#1C1C1F] text-[#18181B] dark:text-[#F4F4F5] placeholder-[#A1A1AA] outline-none border border-transparent focus:border-[#E9E8E4] dark:focus:border-[#3F3F46] font-normal"
          />
          {searchQuery && (
            <button
              onClick={() => onChangeSearch('')}
              className="absolute right-2 top-[7px] text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5]"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
    </>
  );
};
