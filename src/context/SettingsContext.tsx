import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { AppSettings, AiConfig, FontFamily } from '../types';
import { useData } from './DataContext';

interface SettingsContextType {
  settings: AppSettings;
  aiConfig: AiConfig;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
}

const defaultSettings: AppSettings = {
  aiEnabled: true,
  geminiApiKey: '',
  groqApiKey: '',
  aiProvider: 'gemini',
  theme: 'light',
  fontFamily: 'inter',
};

const SettingsContext = createContext<SettingsContextType | null>(null);

interface SettingsProviderProps {
  initialSettings?: AppSettings;
  onPersistSettings?: (settings: AppSettings) => void;
  children: React.ReactNode;
}

export function SettingsProvider({
  initialSettings,
  onPersistSettings,
  children,
}: SettingsProviderProps) {
  const { data, updateSettings: dataUpdateSettings } = useData();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings provienen de DataContext de forma única y confiable
  const settings: AppSettings = useMemo(() => {
    return data?.settings || initialSettings || defaultSettings;
  }, [data?.settings, initialSettings]);

  const theme = settings.theme || 'light';

  // Efecto del tema (aplicar dataset y clase dark al HTML)
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('umbral-theme', theme);
    } catch {}
  }, [theme]);

  // Efecto de tipografía
  useEffect(() => {
    if (settings.fontFamily) {
      document.documentElement.dataset.font = settings.fontFamily;
    }
  }, [settings.fontFamily]);


  const updateSettings = useCallback(
    (newPartial: Partial<AppSettings>) => {
      const nextSettings: AppSettings = { ...settings, ...newPartial };
      dataUpdateSettings(nextSettings);
      if (onPersistSettings) {
        onPersistSettings(nextSettings);
      }
    },
    [settings, dataUpdateSettings, onPersistSettings]
  );

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
  }, [theme, updateSettings]);

  const aiConfig = useMemo<AiConfig>(
    () => ({
      provider: settings.aiProvider || 'gemini',
      apiKey:
        settings.aiProvider === 'groq'
          ? settings.groqApiKey || ''
          : settings.geminiApiKey || '',
    }),
    [settings.aiProvider, settings.groqApiKey, settings.geminiApiKey]
  );

  const value = useMemo(
    () => ({
      settings,
      aiConfig,
      theme,
      toggleTheme,
      updateSettings,
      isSettingsOpen,
      setIsSettingsOpen,
    }),
    [settings, aiConfig, theme, toggleTheme, updateSettings, isSettingsOpen]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings debe utilizarse dentro de un SettingsProvider');
  }
  return context;
}
