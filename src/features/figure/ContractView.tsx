import React from 'react';
import { UmbralActiveObjective } from '../useUmbralProgress';

export interface ContractViewProps {
  objective: UmbralActiveObjective | null;
  onBack: () => void;
}

/**
 * ContractView: Nivel 1 OBJETIVO
 * Solo lectura: objetivo, plazo (inicio, vencimiento, días restantes),
 * sacrificio, porqué literal del usuario, y un mapa de ciclo de N cuadrados pequeños.
 */
export const ContractView: React.FC<ContractViewProps> = ({ objective, onBack }) => {
  // Cargar datos del contrato desde localStorage
  let rawWhy = '';
  let rawSacrifice = '';
  try {
    const rawOnboarding = localStorage.getItem('umbral_onboarding_v1');
    if (rawOnboarding) {
      const parsed = JSON.parse(rawOnboarding);
      const match = parsed.objectives?.find((o: any) => o.title === objective?.title) || parsed.objectives?.[0];
      if (match) {
        rawWhy = match.why || '';
        rawSacrifice = match.sacrifice || '';
      }
    }
  } catch {}

  const daysTotal = objective?.deadlineDays || 90;
  const daysElapsed = objective?.daysElapsed || 1;
  const daysRemaining = objective?.remainingDays || Math.max(0, daysTotal - daysElapsed);

  // Días completados vs hoy vs pendientes
  const completedDaysSet = new Set<number>();
  for (let i = 1; i < daysElapsed; i++) {
    completedDaysSet.add(i);
  }

  return (
    <div className="w-full h-full overflow-y-auto p-6 md:p-12 max-w-3xl mx-auto flex flex-col space-y-8 select-none">
      {/* Cabecera de sección */}
      <div className="border-b border-[var(--fig-line)] pb-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--fig-mute)] block mb-1">
            CONTRATO DEL CICLO · NIVEL 1
          </span>
          <h1 className="text-xl md:text-2xl font-normal text-[var(--fig-ink)]">
            {objective?.title || 'Objetivo de maestría'}
          </h1>
        </div>
      </div>

      {/* Métricas de Plazo Inmutable */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-4 border border-[var(--fig-line)] bg-[var(--bg-card)]">
          <span className="text-[10px] text-[var(--fig-mute)] uppercase tracking-wider block mb-1">
            Inicio del Ciclo
          </span>
          <span className="text-sm text-[var(--fig-ink)]">
            {objective?.startsAt ? new Date(objective.startsAt).toLocaleDateString('es-ES') : 'Día 1'}
          </span>
        </div>
        <div className="p-4 border border-[var(--fig-line)] bg-[var(--bg-card)]">
          <span className="text-[10px] text-[var(--fig-mute)] uppercase tracking-wider block mb-1">
            Vencimiento
          </span>
          <span className="text-sm text-[var(--fig-ink)]">
            {objective?.deadlineAt ? new Date(objective.deadlineAt).toLocaleDateString('es-ES') : `En ${daysTotal} días`}
          </span>
        </div>
        <div className="p-4 border border-[var(--fig-line)] bg-[var(--bg-card)]">
          <span className="text-[10px] text-[var(--fig-mute)] uppercase tracking-wider block mb-1">
            Días Restantes
          </span>
          <span className="text-sm text-[var(--fig-accent)] font-semibold">
            {daysRemaining} días ({daysElapsed} transcurridos)
          </span>
        </div>
      </div>

      {/* Porqué literal */}
      <div className="p-5 border border-[var(--fig-line)] bg-[var(--bg-card)] space-y-2">
        <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--fig-mute)] block">
          Porqué literal (Motivación innegociable)
        </span>
        <p className="text-sm sm:text-base text-[var(--fig-ink)] italic leading-relaxed">
          "{rawWhy || 'Conquistar el estándar más alto y defender el primer puesto con rigor.'}"
        </p>
      </div>

      {/* Sacrificio diario */}
      <div className="p-5 border border-[var(--fig-line)] bg-[var(--bg-card)] space-y-2">
        <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--fig-mute)] block">
          Sacrificio diario asumido
        </span>
        <p className="text-sm sm:text-base text-[var(--fig-ink)] leading-relaxed">
          {rawSacrifice || 'Eliminar distracciones digitales durante las primeras 3 horas de la mañana.'}
        </p>
      </div>

      {/* Mapa de ciclo: N cuadrados pequeños */}
      <div className="p-5 border border-[var(--fig-line)] bg-[var(--bg-card)] space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--fig-mute)]">
            Mapa de ciclo ({daysTotal} días)
          </span>
          <div className="flex items-center gap-3 text-[10px] text-[var(--fig-mute)]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[var(--fig-ink)] inline-block" /> Completado
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 border border-[var(--fig-accent)] inline-block" /> Hoy
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 border border-[var(--fig-line)] inline-block" /> Pendiente
            </span>
          </div>
        </div>

        <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-18 gap-1.5 pt-2">
          {Array.from({ length: daysTotal }, (_, idx) => {
            const dayNum = idx + 1;
            const isCompleted = completedDaysSet.has(dayNum);
            const isToday = dayNum === daysElapsed;

            return (
              <div
                key={dayNum}
                title={`Día ${dayNum}`}
                className={`w-full aspect-square border transition-colors ${
                  isCompleted
                    ? 'bg-[var(--fig-ink)] border-[var(--fig-ink)]'
                    : isToday
                    ? 'border-[var(--fig-accent)] border-2 bg-transparent'
                    : 'border-[var(--fig-line)] bg-transparent'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
