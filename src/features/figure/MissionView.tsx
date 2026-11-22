import React from 'react';
import { MissionRecord } from './useMission';

export interface MissionViewProps {
  mission: MissionRecord | null;
  onStartMission: () => void;
  onBack: () => void;
}

/**
 * MissionView: Nivel 3 MISIÓN
 * Muestra: título, checklist (máx. 4), tiempo estimado, herramienta y botón COMENZAR.
 */
export const MissionView: React.FC<MissionViewProps> = ({
  mission,
  onStartMission,
  onBack,
}) => {
  const title = mission?.title || 'Misión diaria';
  const checklist = mission?.checklist?.slice(0, 4) || [
    'Construir el mapa conceptual de los conceptos clave',
    'Conectar relaciones nucleares sin apuntes',
    'Sintetizar la explicación con tus propias palabras',
  ];
  const estimatedMinutes = mission?.estimatedMinutes || 25;
  const toolName = mission?.tool
    ? {
        canvas: 'Construcción (Canvas)',
        pdf: 'Biblioteca (Lector)',
        aprendizaje: 'Aprendizaje activo (Flashcards)',
        examen: 'Evaluación (Examen)',
      }[mission.tool] || mission.tool
    : 'Construcción (Canvas)';

  return (
    <div className="w-full h-full overflow-y-auto p-6 md:p-12 max-w-2xl mx-auto flex flex-col space-y-8 select-none">
      <div className="border-b border-[var(--fig-line)] pb-4">
        <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--fig-mute)] block mb-1">
          MISIÓN DEL DÍA · NIVEL 3
        </span>
        <h1 className="text-xl md:text-2xl font-medium text-[var(--fig-ink)]">
          {title}
        </h1>
      </div>

      {/* Parámetros: Tiempo y Herramienta */}
      <div className="grid grid-cols-2 gap-4 font-mono text-xs">
        <div className="p-4 border border-[var(--fig-line)] bg-[var(--bg-card)]">
          <span className="text-[10px] text-[var(--fig-mute)] uppercase tracking-wider block mb-1">
            Tiempo Estimado
          </span>
          <span className="text-sm text-[var(--fig-ink)] font-semibold">
            {estimatedMinutes} minutos
          </span>
        </div>
        <div className="p-4 border border-[var(--fig-line)] bg-[var(--bg-card)]">
          <span className="text-[10px] text-[var(--fig-mute)] uppercase tracking-wider block mb-1">
            Herramienta
          </span>
          <span className="text-sm text-[var(--fig-ink)]">
            {toolName}
          </span>
        </div>
      </div>

      {/* Checklist de pasos */}
      <div className="p-6 border border-[var(--fig-line)] bg-[var(--bg-card)] space-y-4">
        <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--fig-mute)] block">
          Checklist de ejecución observable (Máx. 4)
        </span>
        <div className="space-y-3">
          {checklist.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm text-[var(--fig-ink)]">
              <span className="w-4 h-4 border border-[var(--fig-line)] inline-flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-mono text-[var(--fig-mute)]">
                {idx + 1}
              </span>
              <p className="leading-snug">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Acción principal: Comenzar */}
      <div className="pt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-mono text-[var(--fig-mute)] hover:text-[var(--fig-ink)] transition-colors cursor-pointer"
        >
          Volver a la figura
        </button>

        <button
          type="button"
          onClick={onStartMission}
          className="px-8 py-3.5 border border-[var(--fig-ink)] text-xs font-sans uppercase tracking-[0.2em] text-[var(--fig-ink)] hover:bg-[var(--fig-ink)] hover:text-[var(--bg-app)] transition-all cursor-pointer font-medium"
        >
          COMENZAR MISIÓN
        </button>
      </div>
    </div>
  );
};
