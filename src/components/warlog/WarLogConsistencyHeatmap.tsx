import React from 'react';
import { Calendar } from 'lucide-react';
import { WarLogEntry } from '../../types';

interface WarLogConsistencyHeatmapProps {
  daysGrid: Array<{ dateStr: string; entry?: WarLogEntry }>;
}

export const WarLogConsistencyHeatmap: React.FC<WarLogConsistencyHeatmapProps> = ({
  daysGrid,
}) => {
  return (
    <div
      className="bg-white rounded-[8px] p-4"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[#5A5A58] flex items-center gap-1.5">
          <Calendar size={13} className="text-[#1F2328]" /> Consistencia (Últimos 30 Días)
        </span>
        <div className="flex items-center gap-3 text-[10px] text-[#787774]">
          <span className="flex items-center gap-1 font-normal">
            <span className="w-2 h-2 rounded-[3px] bg-emerald-600 inline-block" /> Victoria
          </span>
          <span className="flex items-center gap-1 font-normal">
            <span className="w-2 h-2 rounded-[3px] bg-rose-500 inline-block" /> Derrota
          </span>
          <span className="flex items-center gap-1 font-normal">
            <span className="w-2 h-2 rounded-[3px] bg-[#EAEAEA] inline-block" /> Sin registro
          </span>
        </div>
      </div>

      <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5 pt-1">
        {daysGrid.map((d) => {
          const hasEntry = !!d.entry;
          const isWin = d.entry?.victory;
          return (
            <div
              key={d.dateStr}
              title={`${d.dateStr}: ${
                hasEntry
                  ? isWin
                    ? `Victoria (${d.entry?.focusMinutes}m)`
                    : 'Derrota'
                  : 'Sin sesión registrada'
              }`}
              className={`h-7 rounded-[6px] flex items-center justify-center text-[10px] font-mono font-medium transition-colors cursor-default ${
                hasEntry
                  ? isWin
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-rose-50 text-rose-800'
                  : 'bg-[#F7F6F3] text-[#B0ADA7]'
              }`}
            >
              {d.dateStr.slice(8)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
