import React from 'react';
import { CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { WarLogEntry } from '../../types';

interface WarLogEntryListProps {
  entries: WarLogEntry[];
  onDeleteEntry: (id: string) => void;
}

export const WarLogEntryList: React.FC<WarLogEntryListProps> = ({
  entries,
  onDeleteEntry,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#5A5A58]">
          Historial de Sesiones ({entries.length})
        </span>
      </div>

      {entries.length === 0 ? (
        <div
          className="text-center py-10 bg-white rounded-[8px] text-[#9B9A97] text-xs font-normal"
          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}
        >
          Aún no hay sesiones registradas. Inicia el cronómetro o haz clic en "Registrar Sesión".
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="p-3.5 rounded-[8px] bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    entry.victory
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {entry.victory ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-[#1F2328]">
                      {entry.date}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                        entry.victory
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {entry.victory ? 'Victoria' : 'Derrota'}
                    </span>
                    <span className="text-xs text-[#787774] font-mono">
                      {entry.focusMinutes} min de foco
                    </span>
                  </div>

                  <p className="text-xs text-[#37352F] leading-relaxed">
                    "{entry.reflection}"
                  </p>

                  {entry.excuseDefeated && (
                    <p className="text-[11px] text-[#787774]">
                      <span className="text-amber-700 font-medium">Excusa derrotada:</span>{' '}
                      {entry.excuseDefeated}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDeleteEntry(entry.id)}
                className="p-1.5 rounded-md hover:bg-rose-50 text-[#B0ADA7] hover:text-rose-600 transition-colors self-end sm:self-center shrink-0"
                title="Eliminar registro"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
