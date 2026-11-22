import React from 'react';
import { ArrowLeft, FileText, Mic } from 'lucide-react';
import { PdfDoc, Folder } from '../../types';
import { KIND_META } from '../../constants';

interface ReaderHeaderProps {
  pdf: PdfDoc;
  path: Folder[];
  readerMode: 'texto' | 'original';
  onClose: () => void;
  onSetReaderMode: (mode: 'texto' | 'original') => void;
}

export const ReaderHeader: React.FC<ReaderHeaderProps> = ({
  pdf,
  path = [],
  readerMode,
  onClose,
  onSetReaderMode,
}) => {
  const docKind = (pdf?.kind || 'pdf') as keyof typeof KIND_META;
  const meta = KIND_META[docKind] || KIND_META.pdf;
  const docTitle = pdf?.title || 'Documento';

  return (
    <div className="px-6 pt-3.5 pb-2.5 border-b border-[var(--border-color)] shrink-0 bg-[var(--bg-app)] text-[var(--text-primary)]">
      <div className="flex items-center justify-between mb-1.5">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <ArrowLeft size={12} /> Volver a {path[path.length - 1]?.name || 'documentos'}
        </button>
      </div>

      <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-secondary)] mb-1">
        {path.map((p, i) => (
          <React.Fragment key={p.id}>
            {i > 0 && <span>/</span>}
            <span>{p.name}</span>
          </React.Fragment>
        ))}
      </div>
      <h2 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
        <FileText size={16} style={{ color: meta.color }} /> {docTitle}
        <span
          className="text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 border border-[var(--border-color)]"
          style={{ color: meta.color }}
        >
          {meta.label}
        </span>
      </h2>

      {pdf?.conceptsStatus === 'processing' && (
        <p className="mt-1 text-[10px] font-mono text-[var(--text-secondary)]">Procesando conceptos clave del documento…</p>
      )}
      {pdf?.conceptsStatus === 'ready' && (
        <p className="mt-1 text-[10px] font-mono text-[var(--fig-accent)]">
          {pdf.concepts?.length || 0} conceptos disponibles para tarjetas, Canvas y evaluación.
        </p>
      )}
      {pdf?.conceptsStatus === 'error' && (
        <p className="mt-1 text-[10px] font-mono text-rose-500">
          No se pudieron extraer conceptos: {pdf.conceptsError}
        </p>
      )}

      {pdf?.kind === 'pdf' && pdf.hasOriginalFile && (
        <div className="mt-2 inline-flex rounded-[7px] border border-[#E9E8E4] p-0.5 bg-[#F4F3EF]">
          <button
            onClick={() => onSetReaderMode('texto')}
            className={`px-2.5 py-1 rounded-[5px] text-[10.5px] font-medium transition-colors ${
              readerMode === 'texto'
                ? 'bg-white text-[#1F2328] shadow-sm'
                : 'text-[#787774] hover:text-[#1F2328]'
            }`}
          >
            Texto extraído
          </button>
          <button
            onClick={() => onSetReaderMode('original')}
            className={`px-2.5 py-1 rounded-[5px] text-[10.5px] font-medium transition-colors ${
              readerMode === 'original'
                ? 'bg-white text-[#1F2328] shadow-sm'
                : 'text-[#787774] hover:text-[#1F2328]'
            }`}
          >
            PDF original
          </button>
        </div>
      )}
    </div>
  );
};
