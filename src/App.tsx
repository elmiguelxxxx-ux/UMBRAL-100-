import React, { useCallback, useRef, useState, useEffect } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { SettingsProvider } from './context/SettingsContext';
import { NavigationProvider } from './context/NavigationContext';
import { AppShell } from './components/AppShell';
import { OnboardingFlow } from './features/onboarding/OnboardingFlow';
import { PrimeraMision } from './features/primera-mision/PrimeraMision';
import { InicioDiario } from './features/inicio-diario/InicioDiario';
import { useOnboardingState } from './features/onboarding/useOnboardingState';
import { getUmbralDay } from './lib/umbralDay';

function MainContent() {
  const {
    onboardingCompleted,
    firstMissionCompleted,
    lastDailyEntryDate,
    markFirstMissionCompleted,
    markDailyEntryDone,
    isLoading,
    resetOnboarding,
  } = useOnboardingState();

  const [route, setRoute] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const handlePop = () => {
      setRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePop);

    // Soporte para pruebas y desarrollo: window.__resetUmbralOnboarding() o ?reset_onboarding=1
    if (typeof window !== 'undefined') {
      (window as any).__resetUmbralOnboarding = resetOnboarding;
      if (window.location.search.includes('reset_onboarding=1')) {
        resetOnboarding();
        window.history.replaceState({}, '', '/');
        setRoute('/');
      }
    }

    return () => window.removeEventListener('popstate', handlePop);
  }, [resetOnboarding]);

  // Regla 1: isLoading → pantalla negra con punto pulsante
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#000000] flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-neutral-800 animate-pulse" />
      </div>
    );
  }

  // Regla 2: !onboarding_completed → OnboardingFlow
  if (!onboardingCompleted) {
    return (
      <OnboardingFlow
        onComplete={() => {
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/primera-mision');
          }
          setRoute('/primera-mision');
        }}
      />
    );
  }

  // Regla 3: !first_mission_completed (o ruta explícita /primera-mision) → PrimeraMision
  if (!firstMissionCompleted || route === '/primera-mision') {
    return (
      <PrimeraMision
        onComplete={async () => {
          await markFirstMissionCompleted();
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/');
          }
          setRoute('/');
        }}
      />
    );
  }

  // Regla 4: last_daily_entry_date !== hoy(corte 04:00) → InicioDiario
  const today = getUmbralDay(new Date());
  if (lastDailyEntryDate !== today) {
    return (
      <InicioDiario
        onEnterApp={async () => {
          await markDailyEntryDone();
          setRoute('/');
        }}
        onRedirectToFirstMission={() => {
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/primera-mision');
          }
          setRoute('/primera-mision');
        }}
      />
    );
  }

  // Regla 5: Si no → AppShell (interior de trabajo)
  return <AppShell />;
}

function InnerProviders({ children }: { children: React.ReactNode }) {
  const { data, updateCanvas } = useData();
  const canvasRef = useRef(data?.canvas);
  canvasRef.current = data?.canvas;

  const handleCanvasBoardSelect = useCallback(
    (boardId: string) => {
      if (canvasRef.current && canvasRef.current.activeBoardId !== boardId) {
        updateCanvas({ ...canvasRef.current, activeBoardId: boardId });
      }
    },
    [updateCanvas]
  );

  return (
    <SettingsProvider>
      <NavigationProvider onCanvasBoardSelect={handleCanvasBoardSelect}>
        {children}
      </NavigationProvider>
    </SettingsProvider>
  );
}

export default function App() {
  return (
    <DataProvider>
      <InnerProviders>
        <MainContent />
      </InnerProviders>
    </DataProvider>
  );
}
