import React, { useState, useMemo } from 'react';
import { JournalEntry } from '../types';
import { JournalNavigation } from './journal/JournalNavigation';
import { JournalEditor } from './journal/JournalEditor';
import { JournalSidebar } from './journal/JournalSidebar';

interface JournalViewProps {
  entries?: JournalEntry[];
  onUpdateEntries: (entries: JournalEntry[]) => void;
  onSendToCanvas?: (title: string, content: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const JournalView: React.FC<JournalViewProps> = ({
  entries = [],
  onUpdateEntries,
  onSendToCanvas,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSavedNotification, setShowSavedNotification] = useState<boolean>(false);

  // Find or create entry for current date
  const currentEntry = useMemo(() => {
    return entries.find((e) => e.date === selectedDate) || null;
  }, [entries, selectedDate]);

  // Handle previous / next date
  const handleShiftDate = (days: number) => {
    const parts = selectedDate.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  // Upsert current day entry
  const handleUpdateCurrent = (updates: Partial<JournalEntry>) => {
    const now = Date.now();
    if (currentEntry) {
      const updated = entries.map((e) =>
        e.id === currentEntry.id ? { ...e, ...updates, updatedAt: now } : e
      );
      onUpdateEntries(updated);
    } else {
      const newEntry: JournalEntry = {
        id: uid(),
        date: selectedDate,
        title: updates.title || '',
        content: updates.content || '',
        tags: updates.tags || [],
        createdAt: now,
        updatedAt: now,
      };
      onUpdateEntries([newEntry, ...entries]);
    }
    setShowSavedNotification(true);
    setTimeout(() => setShowSavedNotification(false), 1500);
  };

  // Format date display in Spanish
  const formattedDateTitle = useMemo(() => {
    const parts = selectedDate.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const formatted = d.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [selectedDate]);

  const isToday = selectedDate === getTodayString();

  // All dates with entries for the history sidebar
  const filteredEntries = useMemo(() => {
    return entries
      .filter((e) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, searchQuery]);

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Journal Main Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 md:p-8 max-w-4xl mx-auto w-full">
        <JournalNavigation
          selectedDate={selectedDate}
          isToday={isToday}
          showSavedNotification={showSavedNotification}
          currentEntry={currentEntry}
          onShiftDate={handleShiftDate}
          onSelectDate={setSelectedDate}
          onGoToToday={() => setSelectedDate(getTodayString())}
          onSendToCanvas={onSendToCanvas}
        />

        <JournalEditor
          selectedDate={selectedDate}
          isToday={isToday}
          formattedDateTitle={formattedDateTitle}
          currentEntry={currentEntry}
          onUpdateCurrent={handleUpdateCurrent}
        />
      </div>

      {/* Right Sidebar: Timeline / History of Entries */}
      <JournalSidebar
        entries={entries}
        filteredEntries={filteredEntries}
        selectedDate={selectedDate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectDate={setSelectedDate}
      />
    </div>
  );
};
