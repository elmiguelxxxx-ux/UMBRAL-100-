import React, { useState, useEffect } from 'react';
import { Settings, X, Sun, Moon, Type, Save } from 'lucide-react';
import { AppData, FontFamily } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppData['settings'];
  onSave: (newSettings: AppData['settings']) => void;
}

const FONT_OPTIONS: { value: FontFamily; label: string; font: string }[] = [
  { value: 'inter', label: 'Inter', font: "'Inter', sans-serif" },
  { value: 'lexend', label: 'Lexend', font: "'Lexend', sans-serif" },
  { value: 'prime', label: 'Prime', font: "'Prime', sans-serif" },
  { value: 'quinta', label: 'Quinta', font: "'BW Quinta Pro', serif" },
];



export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(settings?.theme || 'light');
  const [fontFamily, setFontFamily] = useState<FontFamily>(settings?.fontFamily || 'inter');
  const [aiEnabled, setAiEnabled] = useState<boolean>(settings?.aiEnabled ?? true);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(settings?.geminiApiKey || '');
  const [aiProvider, setAiProvider] = useState<'gemini' | 'groq'>(settings?.aiProvider || 'gemini');

  useEffect(() => {
    if (settings) {
      setTheme(settings.theme || 'light');
      setFontFamily(settings.fontFamily || 'inter');
      setAiEnabled(settings.aiEnabled ?? true);
      setGeminiApiKey(settings.geminiApiKey || '');
      setAiProvider(settings.aiProvider || 'gemini');
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      aiEnabled,
      geminiApiKey: geminiApiKey.trim(),
      groqApiKey: '',
      aiProvider,
      theme,
      fontFamily,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] w-full max-w-sm p-6 space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h3 className="font-ailerons text-xs tracking-[0.25em] uppercase text-[var(--text-primary)] flex items-center gap-2">
            <Settings size={14} /> Preferencias del Sistema
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            aria-label="Cerrar ajustes"
          >
            <X size={16} />
          </button>
        </div>

        {/* Apariencia / Tema */}
        <div className="flex items-center justify-between border border-[var(--border-color)] p-3.5">
          <div>
            <p className="font-ailerons text-[11px] tracking-wider uppercase text-[var(--text-primary)]">
              Apariencia
            </p>
            <p className="text-[11px] font-mono text-[var(--text-secondary)]">
              Modo {theme === 'dark' ? 'oscuro' : 'claro'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(nextTheme);
              document.documentElement.dataset.theme = nextTheme;
              document.documentElement.classList.toggle('dark', nextTheme === 'dark');
              try {
                localStorage.setItem('umbral-theme', nextTheme);
              } catch (e) {}
            }}
            className="flex items-center gap-1.5 border border-[var(--border-color)] hover:border-[var(--text-primary)] px-3 py-1.5 text-xs font-mono text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} />}
            {theme === 'dark' ? 'Claro' : 'Oscuro'}
          </button>
        </div>

        {/* Tipografía */}
        <div className="border border-[var(--border-color)] p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <Type size={13} className="text-[var(--text-secondary)]" />
            <p className="font-ailerons text-[11px] tracking-wider uppercase text-[var(--text-primary)]">
              Tipografía
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setFontFamily(opt.value);
                  document.documentElement.dataset.font = opt.value;
                }}
                style={{ fontFamily: opt.font }}
                className={`py-2 text-xs font-medium border transition-colors cursor-pointer ${
                  fontFamily === opt.value
                    ? 'bg-[var(--text-primary)] text-[var(--bg-app)] border-[var(--text-primary)]'
                    : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Política de IA */}
        <div className="border border-[var(--border-color)] p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] tracking-wider uppercase text-[var(--text-primary)]">
                Usar IA (Cuestionar y Evaluar)
              </p>
              <p className="text-[10px] font-mono text-[var(--text-secondary)]">
                {aiEnabled ? 'Activa para preguntas socráticas y veredicto' : 'Apagada: modo 100% manual / autoevaluación'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`px-2.5 py-1 text-[11px] font-mono border transition-colors cursor-pointer ${
                aiEnabled
                  ? 'border-[var(--fig-accent)] text-[var(--fig-accent)]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              {aiEnabled ? 'ACTIVADA' : 'APAGADA'}
            </button>
          </div>

          {/* Sección Avanzado */}
          <details className="pt-1 text-[11px] font-mono border-t border-[var(--border-color)]">
            <summary className="cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-1">
              Avanzado (Clave y Proveedor)
            </summary>
            <div className="mt-2 space-y-2">
              <div>
                <label className="text-[10px] text-[var(--text-secondary)] block mb-1">
                  Proveedor de IA
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value as any)}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] p-1.5 text-xs font-mono text-[var(--text-primary)] outline-none"
                >
                  <option value="gemini">Google Gemini (Recomendado)</option>
                  <option value="groq">Groq</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[var(--text-secondary)] block mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] p-1.5 text-xs font-mono text-[var(--text-primary)] outline-none"
                />
              </div>
            </div>
          </details>
        </div>

        {/* Guardar */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 py-3 text-xs font-mono tracking-widest uppercase border border-[var(--text-primary)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-app)] transition-colors cursor-pointer"
        >
          <Save size={13} /> Guardar Cambios
        </button>
      </div>
    </div>
  );
};
