import React from 'react';

export interface FigureMiniProps {
  currentLevel?: 1 | 2 | 3 | 4 | 5;
  progressPercent?: number; // 0 a 100 para dibujar el progreso del nivel interior en ejecución
  onClick?: () => void;
  className?: string;
}

/**
 * FigureMini: 28px de navegación global en la cabecera de toda vista interior.
 * Cuadrados concéntricos anidados con el nivel actual resaltado en --fig-ink 1.6px y punto central en --fig-accent.
 */
export const FigureMini: React.FC<FigureMiniProps> = ({
  currentLevel = 1,
  progressPercent,
  onClick,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-7 h-7 shrink-0 relative flex items-center justify-center p-0.5 cursor-pointer bg-transparent border-0 outline-none focus-visible:ring-1 focus-visible:ring-[var(--fig-ink)] transition-opacity hover:opacity-85 ${className}`}
      aria-label="Volver al inicio de Umbral"
      title="Volver al núcleo de Umbral"
    >
      {/* Nivel 1 Exterior: 26x26 */}
      <div
        className="w-full h-full border flex items-center justify-center relative transition-colors"
        style={{
          borderColor: currentLevel === 1 ? 'var(--fig-ink)' : 'var(--fig-line)',
          borderWidth: currentLevel === 1 ? '1.6px' : '1px',
        }}
      >
        {/* Nivel 2: 20x20 */}
        <div
          className="w-[20px] h-[20px] border flex items-center justify-center relative transition-colors"
          style={{
            borderColor: currentLevel === 2 ? 'var(--fig-ink)' : 'var(--fig-line)',
            borderWidth: currentLevel === 2 ? '1.6px' : '1px',
          }}
        >
          {/* Nivel 3: 15x15 */}
          <div
            className="w-[15px] h-[15px] border flex items-center justify-center relative transition-colors"
            style={{
              borderColor: currentLevel === 3 ? 'var(--fig-ink)' : 'var(--fig-line)',
              borderWidth: currentLevel === 3 ? '1.6px' : '1px',
            }}
          >
            {/* Nivel 4: 10x10 */}
            <div
              className="w-[10px] h-[10px] border flex items-center justify-center relative transition-colors overflow-hidden"
              style={{
                borderColor: currentLevel === 4 ? 'var(--fig-ink)' : 'var(--fig-line)',
                borderWidth: currentLevel === 4 ? '1.6px' : '1px',
              }}
            >
              {/* Progreso en modo ejecución para el nivel 4 */}
              {progressPercent !== undefined && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none -rotate-90"
                  viewBox="0 0 10 10"
                >
                  <rect
                    x="0.5"
                    y="0.5"
                    width="9"
                    height="9"
                    fill="none"
                    stroke="var(--fig-accent)"
                    strokeWidth="1.2"
                    pathLength="100"
                    strokeDasharray={`${Math.min(100, Math.max(0, progressPercent))} ${100 - Math.min(100, Math.max(0, progressPercent))}`}
                  />
                </svg>
              )}

              {/* Nivel 5: Punto de evidencia */}
              <div
                className="w-1.5 h-1.5 shrink-0 rounded-none transition-transform"
                style={{
                  backgroundColor: 'var(--fig-accent)',
                  opacity: currentLevel === 5 ? 1 : 0.85,
                  transform: currentLevel === 5 ? 'scale(1.25)' : 'scale(1)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};
