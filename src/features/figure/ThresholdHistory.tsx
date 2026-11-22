import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../supabase';
import { APP_USER_ID } from '../../appStateSync';

export interface ThresholdItem {
  id: string;
  text: string;
  topic: string;
  status: 'active' | 'achieved' | 'replaced';
  attempts: number;
  helpUsedCount: number;
}


/** Suma las ayudas gastadas por umbral (mission_evidence.help_used agrupado por umbral de la misión). */
async function loadHelpByThreshold(): Promise<Record<string, number>> {
  const byMission: Record<string, number> = {};
  const missionToThreshold: Record<string, string> = {};

  try {
    const raw = localStorage.getItem('umbral_mission_evidences_v1');
    (raw ? JSON.parse(raw) : []).forEach((e: any) => { byMission[e.mission_id] = Number(e.help_used) || 0; });
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('umbral_active_mission_v2_')) continue;
      const m = JSON.parse(localStorage.getItem(k) || 'null');
      if (m?.id && m?.thresholdId) missionToThreshold[m.id] = m.thresholdId;
    }
  } catch {}

  if (isSupabaseConfigured) {
    try {
      const [{ data: ev }, { data: ms }] = await Promise.all([
        supabase.from('mission_evidence').select('mission_id, help_used').eq('user_id', APP_USER_ID),
        supabase.from('missions').select('id, threshold_id').eq('user_id', APP_USER_ID),
      ]);
      (ev || []).forEach((e: any) => { byMission[e.mission_id] = Number(e.help_used) || 0; });
      (ms || []).forEach((m: any) => { if (m.threshold_id) missionToThreshold[m.id] = m.threshold_id; });
    } catch {}
  }

  const out: Record<string, number> = {};
  Object.entries(byMission).forEach(([missionId, help]) => {
    const t = missionToThreshold[missionId];
    if (t) out[t] = (out[t] || 0) + help;
  });
  return out;
}

export const ThresholdHistory: React.FC = () => {
  const [history, setHistory] = useState<ThresholdItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      let list: ThresholdItem[] = [];
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase
            .from('thresholds')
            .select('*')
            .eq('user_id', APP_USER_ID)
            .order('created_at', { ascending: false });

          if (data && data.length > 0) {
            list = data.map((d: any) => ({
              id: d.id,
              text: d.text,
              topic: d.topic,
              status: d.status,
              attempts: d.attempts || 1,
              helpUsedCount: 0,
            }));
          }
        } catch (err) {}
      }

      if (list.length === 0) {
        try {
          const raw = localStorage.getItem('umbral_thresholds_v1');
          if (raw) {
            const parsed = JSON.parse(raw);
            list = (Array.isArray(parsed) ? parsed : [parsed]).map((p: any) => ({
              id: p.id || 't-1',
              text: p.text || 'Explicar concepto clave sin consultar apuntes.',
              topic: p.topic || 'General',
              status: p.status || 'active',
              attempts: p.attempts || 1,
              helpUsedCount: 0,
            }));
          }
        } catch {}
      }

      const helpMap = await loadHelpByThreshold();
      list = list.map((t) => ({ ...t, helpUsedCount: helpMap[t.id] || 0 }));
      setHistory(list);
      setIsLoading(false);
    }

    load();
  }, []);

  return (
    <div className="w-full p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--fig-line)] pb-2 mb-4">
        <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--fig-mute)]">
          HISTORIAL DE UMBRALES
        </span>
        <span className="text-xs font-mono text-[var(--fig-mute)]">
          {history.length} registrados
        </span>
      </div>

      {isLoading ? (
        <div className="text-xs font-mono text-[var(--fig-mute)] py-8 text-center">
          Cargando umbrales...
        </div>
      ) : history.length === 0 ? (
        <div className="text-xs font-mono text-[var(--fig-mute)] py-8 text-center">
          No hay umbrales previos aún.
        </div>
      ) : (
        <div className="space-y-2.5">
          {history.map((t) => {
            const isAchieved = t.status === 'achieved';
            const isReplaced = t.status === 'replaced';
            return (
              <div
                key={t.id}
                className="p-4 border border-[var(--fig-line)] bg-[var(--bg-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[var(--fig-mute)] uppercase">
                      {t.topic}
                    </span>
                    <span
                      className="text-[10px] font-mono uppercase px-1.5 py-0.2 border"
                      style={{
                        borderColor: isAchieved
                          ? 'var(--fig-accent)'
                          : isReplaced
                          ? 'var(--fig-line)'
                          : 'var(--fig-ink)',
                        color: isAchieved
                          ? 'var(--fig-accent)'
                          : isReplaced
                          ? 'var(--fig-mute)'
                          : 'var(--fig-ink)',
                      }}
                    >
                      {isAchieved ? 'Logrado' : isReplaced ? 'Reemplazado' : 'Activo'}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--fig-ink)]">{t.text}</p>
                </div>

                <div className="text-[11px] font-mono text-[var(--fig-mute)] shrink-0 sm:text-right">
                  <div>Intentos: {t.attempts}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
