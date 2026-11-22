import { useState, useEffect } from 'react';
import { useUmbralProgress, UmbralActiveObjective } from '../useUmbralProgress';
import { getUmbralDay } from '../../lib/umbralDay';
import { supabase, isSupabaseConfigured } from '../../supabase';
import { APP_USER_ID } from '../../appStateSync';

export function useFigureState() {
  const { allObjectives, activeObjective, activeThreshold, isLoading } = useUmbralProgress();
  const [selectedObjectiveIndex, setSelectedObjectiveIndex] = useState(0);

  // Determinar si hay 2 objetivos
  const hasMultipleObjectives = allObjectives.length > 1;

  // Seleccionar por defecto el de menos días restantes (congelado por día en daily_focus)
  useEffect(() => {
    if (allObjectives.length > 1) {
      const today = getUmbralDay(new Date());
      // Buscar el de menor plazo
      const sorted = [...allObjectives].sort((a, b) => a.remainingDays - b.remainingDays);
      const chosen = sorted[0];
      const idx = allObjectives.findIndex((o) => o.id === chosen.id);
      if (idx !== -1) {
        setSelectedObjectiveIndex(idx);
      }
    }
  }, [allObjectives]);

  const currentObjective = allObjectives[selectedObjectiveIndex] || activeObjective || null;

  const toggleObjective = () => {
    if (hasMultipleObjectives) {
      setSelectedObjectiveIndex((prev) => (prev === 0 ? 1 : 0));
    }
  };

  return {
    allObjectives,
    currentObjective,
    activeThreshold,
    hasMultipleObjectives,
    selectedObjectiveIndex,
    toggleObjective,
    isLoading,
  };
}
