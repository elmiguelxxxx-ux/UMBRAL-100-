import React from 'react';

interface WarLogStatsProps {
  currentStreak: number;
  totalHours: string;
  winRate: number;
  totalVictories: number;
  totalEntries: number;
}

export const WarLogStats: React.FC<WarLogStatsProps> = ({
  currentStreak,
  totalHours,
  winRate,
  totalVictories,
  totalEntries,
}) => {
  return (
    <div
      className="bg-white rounded-[8px] p-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-6"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}
    >
      <div>
        <span className="text-xs text-[#787774] font-normal block mb-1">Racha de Victoria</span>
        <div className="text-2xl font-bold font-mono text-[#1F2328] tracking-tight">
          {currentStreak} <span className="text-xs font-normal text-[#9B9A97]">días</span>
        </div>
      </div>

      <div>
        <span className="text-xs text-[#787774] font-normal block mb-1">Horas de Foco</span>
        <div className="text-2xl font-bold font-mono text-[#1F2328] tracking-tight">
          {totalHours} <span className="text-xs font-normal text-[#9B9A97]">hrs</span>
        </div>
      </div>

      <div>
        <span className="text-xs text-[#787774] font-normal block mb-1">Tasa de Victoria</span>
        <div className="text-2xl font-bold font-mono text-emerald-700 tracking-tight">
          {winRate}%
        </div>
      </div>

      <div>
        <span className="text-xs text-[#787774] font-normal block mb-1">Sesiones</span>
        <div className="text-2xl font-bold font-mono text-[#1F2328] tracking-tight">
          {totalVictories} <span className="text-xs font-normal text-[#9B9A97]">/ {totalEntries}</span>
        </div>
      </div>
    </div>
  );
};
