import React from 'react';
import { BookHeart, Search } from 'lucide-react';
import { JournalEntry } from '../../types';

interface JournalSidebarProps {
  entries: JournalEntry[];
  filteredEntries: JournalEntry[];
  selectedDate: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectDate: (date: string) => void;
}

export const JournalSidebar: React.FC<JournalSidebarProps> = ({
  entries,
  filteredEntries,
  selectedDate,
  searchQuery,
  onSearchChange,
  onSelectDate,
}) => {
  return (
    <div className="hidden lg:flex flex-col w-72 h-full border-l border-[var(--border-color)] bg-[var(--bg-card)] p-4 select-none">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border-color)]">
        <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
          <BookHeart size={13} className="text-[var(--text-secondary)]" />
          <span>Bitácora</span>
        </div>
        <span className="text-[11px] font-mono text-[var(--text-secondary)]">
          {entries.length}
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={12} className="absolute left-2.5 top-[9px] text-[var(--text-secondary)]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar registros..."
          className="w-full text-xs pl-7 pr-2 py-1.5 bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--text-primary)]"
        />
      </div>

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-10 text-xs font-mono text-[var(--text-secondary)]">
            Sin entradas registradas
          </div>
        ) : (
          filteredEntries.map((e) => {
            const isSelected = e.date === selectedDate;
            return (
              <div
                key={e.id}
                onClick={() => onSelectDate(e.date)}
                className={`p-2.5 border transition-all text-xs cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--bg-app)] border-[var(--text-primary)] text-[var(--text-primary)] font-medium'
                    : 'border-[var(--border-color)] hover:border-[var(--text-primary)] text-[var(--text-secondary)] bg-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-[11px]">{e.date}</span>
                  {e.tags && e.tags.length > 0 && (
                    <span className="text-[9px] font-mono px-1 py-0.5 border border-[var(--border-color)] text-[var(--text-secondary)]">
                      #{e.tags[0]}
                    </span>
                  )}
                </div>
                <div className="font-medium text-[var(--text-primary)] truncate">
                  {e.title || 'Sin título'}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5 font-sans">
                  {e.content || 'Sin contenido'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
