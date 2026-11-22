import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { JournalEntry } from '../../types';

interface JournalEditorProps {
  selectedDate: string;
  isToday: boolean;
  formattedDateTitle: string;
  currentEntry: JournalEntry | null;
  onUpdateCurrent: (updates: Partial<JournalEntry>) => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  selectedDate,
  isToday,
  formattedDateTitle,
  currentEntry,
  onUpdateCurrent,
}) => {
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    const cleanTag = tagInput.trim().replace(/^#/, '');
    if (!cleanTag) return;
    const currentTags = currentEntry?.tags || [];
    if (!currentTags.includes(cleanTag)) {
      onUpdateCurrent({ tags: [...currentTags, cleanTag] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = currentEntry?.tags || [];
    onUpdateCurrent({ tags: currentTags.filter((t) => t !== tagToRemove) });
  };

  const wordCount = currentEntry?.content?.split(/\s+/).filter(Boolean).length || 0;
  const charCount = currentEntry?.content?.length || 0;

  return (
    <>
      {/* Date Display */}
      <div className="mb-4">
        <div className="text-xs font-medium text-[#71717A] flex items-center gap-1.5 mb-1">
          <CalendarIcon size={13} />
          <span>{isToday ? 'Hoy • ' : ''}{selectedDate}</span>
        </div>
        <h1 className="text-xl md:text-2xl font-semibold text-[#18181B] tracking-tight">
          {formattedDateTitle}
        </h1>
      </div>

      {/* Title Input */}
      <div className="mb-4">
        <input
          type="text"
          value={currentEntry?.title || ''}
          onChange={(e) => onUpdateCurrent({ title: e.target.value })}
          placeholder="Título del apunte o enfoque del día..."
          className="w-full text-base md:text-lg font-medium text-[#18181B] placeholder-[#A1A1AA] bg-transparent outline-none border-b border-transparent focus:border-[#E4E4E7] pb-1 transition-colors"
        />
      </div>

      {/* Tags Section */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6">
        {currentEntry?.tags?.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#F4F4F5] text-[#71717A] group"
          >
            #{tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="text-[#A1A1AA] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </span>
        ))}

        <div className="inline-flex items-center gap-1">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="+ etiqueta"
            className="text-[11px] text-[#71717A] placeholder-[#A1A1AA] bg-transparent outline-none w-20 px-1 py-0.5"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] p-6 flex flex-col min-h-[360px]">
        <details className="mb-4 border border-[var(--border-color)] bg-[var(--bg-app)] p-3 text-xs">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Bitácora estructurada de auto-indagación (opcional)
          </summary>
          <div className="mt-3 grid gap-3 font-mono text-[11px]">
            <label className="text-[var(--text-secondary)]">
              Qué aprendí con mis propias palabras
              <textarea
                value={currentEntry?.learned || ''}
                onChange={(e) => onUpdateCurrent({ learned: e.target.value })}
                rows={2}
                className="mt-1 w-full bg-[var(--bg-card)] border border-[var(--border-color)] p-2 text-xs font-sans text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
              />
            </label>
            <label className="text-[var(--text-secondary)]">
              Qué no quedó del todo claro
              <textarea
                value={currentEntry?.notUnderstood || ''}
                onChange={(e) => onUpdateCurrent({ notUnderstood: e.target.value })}
                rows={2}
                className="mt-1 w-full bg-[var(--bg-card)] border border-[var(--border-color)] p-2 text-xs font-sans text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
              />
            </label>
            <label className="text-[var(--text-secondary)]">
              Qué debo repasar o poner a prueba
              <textarea
                value={currentEntry?.toReview || ''}
                onChange={(e) => onUpdateCurrent({ toReview: e.target.value })}
                rows={2}
                className="mt-1 w-full bg-[var(--bg-card)] border border-[var(--border-color)] p-2 text-xs font-sans text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
              />
            </label>
          </div>
        </details>

        <textarea
          value={currentEntry?.content || ''}
          onChange={(e) => onUpdateCurrent({ content: e.target.value })}
          placeholder="Escribe tus reflexiones, apuntes de trabajo o notas del día..."
          className="flex-1 w-full text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] bg-transparent outline-none resize-none leading-relaxed font-sans"
        />

        <div className="pt-3 mt-auto border-t border-[var(--border-color)] flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
          <span>
            {charCount} caracteres • {wordCount} palabras
          </span>
          <span>Autoguardado en tiempo real</span>
        </div>
      </div>
    </>
  );
};
