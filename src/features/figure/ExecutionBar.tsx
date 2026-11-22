import React, { useState, useEffect } from 'react';
import { FigureMini } from './FigureMini';
import { UmbralActiveThreshold } from '../useUmbralProgress';
import { MissionRecord } from './useMission';

export interface ExecutionBarProps {
  threshold: UmbralActiveThreshold | null;
  mission: MissionRecord | null;
  onFinish: () => void;
}

/**
 * ExecutionBar: Barra superior mínima durante la ejecución de una misión.
 * - Umbral truncado a la izquierda.
 * - FigureMini a la derecha con el cuadrado interior dibujando el progreso
 *   (pathLength = transcurrido/estimado, calculado desde started_at para sobrevivir a recargas).
 * - Cronómetro mm:ss.
 * - Botón TERMINAR (marca pending_evidence y abre EvidenceView).
 */
export const ExecutionBar: React.FC<ExecutionBarProps> = ({
  threshold,
  mission,
  onFinish,
}) => {
  const startedAt = mission?.startedAt || Date.now();
  const estimatedSeconds = (mission?.estimatedMinutes || 25) * 60;

  const [elapsedSeconds, setElapsedSeconds] = useState(
    Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  const progressPercent = Math.min(100, Math.round((elapsedSeconds / estimatedSeconds) * 100));

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const thresholdText = threshold?.text
    ? threshold.text.length > 70
      ? `${threshold.text.slice(0, 67)}...`
      : threshold.text
    : 'Ejecución en curso';

  return (
    <header className="h-14 w-full border-b border-[var(--fig-line)] bg-[var(--bg-app)] flex items-center justify-between px-4 sm:px-6 shrink-0 select-none z-30">
      {/* Izquierda: Umbral truncado */}
      <div className="flex items-center gap-2 min-w-0 mr-4">
        <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-[var(--fig-mute)] shrink-0 hidden sm:inline">
          UMBRAL:
        </span>
        <span className="text-xs sm:text-sm text-[var(--fig-ink)] truncate font-sans">
          {thresholdText}
        </span>
      </div>

      {/* Derecha: FigureMini con progreso, cronómetro y TERMINAR */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0 font-mono text-xs">
        <FigureMini currentLevel={4} progressPercent={progressPercent} />

        <span className="text-sm text-[var(--fig-ink)] font-semibold min-w-[48px] text-right">
          {timeFormatted}
        </span>

        <button
          type="button"
          onClick={onFinish}
          className="px-3.5 py-1.5 border border-[var(--fig-ink)] text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--fig-ink)] hover:bg-[var(--fig-ink)] hover:text-[var(--bg-app)] transition-colors cursor-pointer font-medium"
        >
          TERMINAR
        </button>
      </div>
    </header>
  );
};
