import React, { useState, useEffect, useRef } from 'react';
import { WarLogEntry, WarStandard } from '../types';
import { Flame, Plus } from 'lucide-react';
import { WarLogStats } from './warlog/WarLogStats';
import { WarLogTimer } from './warlog/WarLogTimer';
import { WarLogConsistencyHeatmap } from './warlog/WarLogConsistencyHeatmap';
import { WarLogStandards } from './warlog/WarLogStandards';
import { WarLogEntryList } from './warlog/WarLogEntryList';
import { NewWarEntryModal } from './warlog/NewWarEntryModal';

interface WarLogViewProps {
  entries: WarLogEntry[];
  standards: WarStandard[];
  onUpdateWarLog: (entries: WarLogEntry[], standards: WarStandard[]) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const MOTIVATIONAL_QUOTES = [
  { quote: 'No pares cuando estés cansado. Para cuando hayas terminado.', author: 'David Goggins' },
  { quote: 'La disciplina es elegir entre lo que quieres ahora y lo que más quieres.', author: 'Abraham Lincoln' },
  { quote: 'Sufre el dolor de la disciplina, o sufre el dolor del arrepentimiento.', author: 'Jim Rohn' },
  { quote: 'El impedimento a la acción avanza la acción. Lo que se interpone en el camino se convierte en el camino.', author: 'Marco Aurelio' },
  { quote: 'La excelencia no es un acto, sino un hábito.', author: 'Aristóteles' },
];

const DEFAULT_STANDARDS: WarStandard[] = [
  { id: 'std-1', title: 'Estudio profundo sin distracciones (45m+)', target: '1 sesión' },
  { id: 'std-2', title: 'Repaso diario de Flashcards FSRS', target: 'Todas las pendientes' },
  { id: 'std-3', title: 'Cero teléfono/redes durante bloques de foco', target: '100% blindado' },
  { id: 'std-4', title: 'Lectura activa o síntesis en Canvas', target: 'Mínimo 1 tema' },
];

export const WarLogView: React.FC<WarLogViewProps> = ({
  entries,
  standards = DEFAULT_STANDARDS,
  onUpdateWarLog,
}) => {
  const activeStandards = standards.length > 0 ? standards : DEFAULT_STANDARDS;

  // Deep Work Timer State
  const [timerDurationMins, setTimerDurationMins] = useState(45);
  const [timeLeftSecs, setTimeLeftSecs] = useState(45 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<any>(null);

  // New Daily Log Modal / Form State
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isVictory, setIsVictory] = useState(true);
  const [loggedMinutes, setLoggedMinutes] = useState(45);
  const [excuseText, setExcuseText] = useState('');
  const [reflectionText, setReflectionText] = useState('');
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);

  // Quote rotation
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const idx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuoteIndex(idx);
  }, []);

  // Timer loop
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeftSecs((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsTimerRunning(false);
            setLoggedMinutes(timerDurationMins);
            setIsVictory(true);
            setIsNewEntryOpen(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isTimerRunning, timerDurationMins]);

  const handleSetTimer = (mins: number) => {
    setIsTimerRunning(false);
    setTimerDurationMins(mins);
    setTimeLeftSecs(mins * 60);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeftSecs(timerDurationMins * 60);
  };

  const toggleHabit = (id: string) => {
    setCompletedHabits((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  };

  // Save War Log Entry
  const handleSaveEntry = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newEntry: WarLogEntry = {
      id: uid(),
      date: todayStr,
      victory: isVictory,
      focusMinutes: Number(loggedMinutes) || 0,
      reflection: reflectionText.trim() || (isVictory ? 'Misión cumplida.' : 'Día difícil pero nos levantamos.'),
      excuseDefeated: excuseText.trim(),
      completedHabits,
      createdAt: Date.now(),
    };

    onUpdateWarLog([newEntry, ...entries], activeStandards);
    setIsNewEntryOpen(false);
    setExcuseText('');
    setReflectionText('');
    setCompletedHabits([]);
  };

  const handleDeleteEntry = (id: string) => {
    onUpdateWarLog(
      entries.filter((e) => e.id !== id),
      activeStandards
    );
  };

  // Compute Streak & Stats
  const totalVictories = entries.filter((e) => e.victory).length;
  const totalMinutes = entries.reduce((acc, e) => acc + (e.focusMinutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const winRate = entries.length > 0 ? Math.round((totalVictories / entries.length) * 100) : 100;

  let currentStreak = 0;
  for (const e of entries) {
    if (e.victory) currentStreak++;
    else break;
  }

  // Generate 30 days grid
  const daysGrid: Array<{ dateStr: string; entry?: WarLogEntry }> = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const str = d.toISOString().split('T')[0];
    const entry = entries.find((e) => e.date === str);
    daysGrid.push({ dateStr: str, entry });
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)] text-[var(--text-primary)] overflow-y-auto p-6 md:p-8 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-center text-[var(--fig-accent)]">
              <Flame size={13} />
            </div>
            <h1 className="text-base font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <span className="font-ailerons tracking-widest uppercase text-xs">Registro de Guerra</span>
              <span className="font-mono text-xs text-[var(--text-secondary)]">/ Disciplina</span>
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-normal">
            Bitácora de disciplina, bloques de foco profundo y auditoría de hábitos.
          </p>
        </div>

        <button
          onClick={() => {
            setLoggedMinutes(timerDurationMins);
            setIsVictory(true);
            setIsNewEntryOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[var(--text-primary)] text-[var(--bg-app)] border border-[var(--text-primary)] hover:opacity-90 transition-colors cursor-pointer"
        >
          <Plus size={13} />
          <span>+ Registrar Sesión</span>
        </button>
      </div>

      {/* Quote Banner */}
      <div
        className="bg-white rounded-[8px] p-4 mb-6"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}
      >
        <p className="text-xs font-normal italic text-[#37352F] leading-relaxed">
          "{MOTIVATIONAL_QUOTES[quoteIndex].quote}"
        </p>
        <span className="text-[11px] text-[#9B9A97] mt-1.5 block font-normal">
          — {MOTIVATIONAL_QUOTES[quoteIndex].author}
        </span>
      </div>

      {/* Stats Bar */}
      <WarLogStats
        currentStreak={currentStreak}
        totalHours={totalHours}
        winRate={winRate}
        totalVictories={totalVictories}
        totalEntries={entries.length}
      />

      {/* Main Grid: Timer on left, Heatmap & Standards on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <WarLogTimer
          timerDurationMins={timerDurationMins}
          timeLeftSecs={timeLeftSecs}
          isTimerRunning={isTimerRunning}
          onSetTimer={handleSetTimer}
          onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
          onResetTimer={handleResetTimer}
        />

        <div className="lg:col-span-2 space-y-4">
          <WarLogConsistencyHeatmap daysGrid={daysGrid} />
          <WarLogStandards standards={activeStandards} />
        </div>
      </div>

      {/* Daily Battle Log Stream */}
      <WarLogEntryList entries={entries} onDeleteEntry={handleDeleteEntry} />

      {/* New War Entry Modal */}
      <NewWarEntryModal
        isOpen={isNewEntryOpen}
        isVictory={isVictory}
        loggedMinutes={loggedMinutes}
        excuseText={excuseText}
        reflectionText={reflectionText}
        completedHabits={completedHabits}
        activeStandards={activeStandards}
        onClose={() => setIsNewEntryOpen(false)}
        onToggleVictory={setIsVictory}
        onChangeMinutes={setLoggedMinutes}
        onChangeExcuse={setExcuseText}
        onChangeReflection={setReflectionText}
        onToggleHabit={toggleHabit}
        onSave={handleSaveEntry}
      />
    </div>
  );
};
