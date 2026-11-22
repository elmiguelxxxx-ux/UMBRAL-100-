import React from 'react';
import { Shield, Check } from 'lucide-react';
import { WarStandard } from '../../types';

interface WarLogStandardsProps {
  standards: WarStandard[];
}

export const WarLogStandards: React.FC<WarLogStandardsProps> = ({ standards }) => {
  return (
    <div
      className="bg-white rounded-[8px] p-4"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}
    >
      <span className="text-xs font-medium text-[#5A5A58] flex items-center gap-1.5 mb-2.5">
        <Shield size={13} className="text-amber-600" /> Estándares No Negociables
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {standards.map((std) => (
          <div
            key={std.id}
            className="p-2.5 rounded-[7px] bg-[#FAF9F6] border border-[#E9E8E4] flex items-start gap-2"
          >
            <div className="w-4 h-4 rounded-[4px] bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <Check size={10} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-[#1F2328] truncate">{std.title}</div>
              <div className="text-[10px] text-[#9B9A97] font-normal">{std.target}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
