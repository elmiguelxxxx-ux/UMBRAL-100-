import React from 'react';
import { FigureMini } from './FigureMini';
import { Settings, Sun, Moon } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export interface FigureShellProps {
  sectionTitle: string;
  currentLevel?: 1 | 2 | 3 | 4 | 5;
  onGoHome: () => void;
  children: React.ReactNode;
}

/**
 * FigureShell: Cabecera de 56px de navegación global en TODA vista interior.
 * [FigureMini] [nombre de la sección en 11px mayúsculas] ... [Ajustes] [tema]
 * Esc vuelve a HOME. Ocupa el 100% del ancho sin Sidebars ni menús antiguos.
 */
export const FigureShell: React.FC<FigureShellProps> = ({
  sectionTitle,
  currentLevel = 4,
  onGoHome,
  children,
}) => {
  const { theme, toggleTheme, setIsSettingsOpen } = useSettings();

  // Atajo de teclado: Esc vuelve a HOME si no hay input enfocado
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement;
        const isInput =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;
        if (!isInput) {
          onGoHome();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onGoHome]);

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Cabecera superior de 56px */}
      <header className="h-14 border-b border-[var(--border-color)] bg-[var(--bg-app)] flex items-center justify-between px-6 shrink-0 select-none z-20">
        <div className="flex items-center gap-4">
          <FigureMini currentLevel={currentLevel} onClick={onGoHome} />

          <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--fig-mute)] font-medium">
            {sectionTitle}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            aria-label="Cambiar tema"
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

      {/* Contenido a pantalla completa (100dvh - 56px) */}
      <div className="flex-1 w-full min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
};
