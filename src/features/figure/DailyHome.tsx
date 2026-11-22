import React, { useState } from 'react';
import { UmbralFigure } from './UmbralFigure';
import { UmbralMark } from './UmbralMark';
import { useFigureState } from './useFigureState';
import { useMission, wasSacrificeChecked, recordSacrificeCheck } from './useMission';
import { getUmbralDay } from '../../lib/umbralDay';
import { Settings, Sun, Moon } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export interface DailyHomeProps {
  mode: 'home' | 'ritual';
  onSelectLevel: (level: 1 | 2 | 3 | 4 | 5) => void;
  onEnterRitual?: () => void;
  onSelectToolDirect?: (toolKey: string) => void;
}

/**
 * DailyHome: Vista del núcleo de Umbral (Home y Ritual)
 * Cabecera con UmbralMark, "Umbral" y controles de ajustes/tema.
 * Renderiza UmbralFigure con sus 5 niveles concéntricos.
 */
export const DailyHome: React.FC<DailyHomeProps> = ({
  mode,
  onSelectLevel,
  onEnterRitual,
  onSelectToolDirect,
}) => {
  const { theme, toggleTheme, setIsSettingsOpen } = useSettings();
  const {
    currentObjective,
    activeThreshold,
    hasMultipleObjectives,
    selectedObjectiveIndex,
    allObjectives,
    toggleObjective,
    isLoading,
  } = useFigureState();

  const { mission } = useMission(currentObjective, activeThreshold);
  const today = getUmbralDay(new Date());

  // Chequeo de sacrificio
  let sacrificeText = '';
  try {
    const raw = localStorage.getItem('umbral_onboarding_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      const match = parsed.objectives?.find((o: any) => o.title === currentObjective?.title) || parsed.objectives?.[0];
      sacrificeText = match?.sacrifice || '';
    }
  } catch {}

  const [hasPendingSacrifice, setHasPendingSacrifice] = useState(() => {
    if (!currentObjective || !sacrificeText) return false;
    return !wasSacrificeChecked(currentObjective.id, today);
  });

  const handleAnswerSacrifice = (kept: boolean) => {
    if (currentObjective) {
      recordSacrificeCheck(currentObjective.id, today, kept);
      setHasPendingSacrifice(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Cabecera de 56px */}
      <header className="h-14 border-b border-[var(--border-color)] bg-[var(--bg-app)] flex items-center justify-between px-6 shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <UmbralMark size={22} color="var(--fig-accent)" />
          <span className="text-sm font-medium font-sans tracking-wide text-[var(--text-primary)]">
            Umbral
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            aria-label="Cambiar tema claro/oscuro"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            aria-label="Abrir ajustes"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* Contenido principal centrado */}
      <main className="flex-1 flex items-center justify-center p-4">
        <UmbralFigure
          mode={mode}
          objective={currentObjective}
          threshold={activeThreshold}
          mission={mission}
          onSelectLevel={onSelectLevel}
          onEnterRitual={onEnterRitual}
          onSelectToolDirect={onSelectToolDirect}
          hasSacrificeCheckPending={hasPendingSacrifice}
          sacrificeText={sacrificeText}
          onAnswerSacrifice={handleAnswerSacrifice}
          activeObjectiveIndex={selectedObjectiveIndex}
          totalObjectives={allObjectives.length}
          onToggleObjective={toggleObjective}
        />
      </main>
    </div>
  );
};
