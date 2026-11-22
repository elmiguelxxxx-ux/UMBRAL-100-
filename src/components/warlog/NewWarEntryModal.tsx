import React from 'react';
import { Flame, CheckCircle2, XCircle } from 'lucide-react';
import { WarStandard } from '../../types';

interface NewWarEntryModalProps {
  isOpen: boolean;
  isVictory: boolean;
  loggedMinutes: number;
  excuseText: string;
  reflectionText: string;
  completedHabits: string[];
  activeStandards: WarStandard[];
  onClose: () => void;
  onToggleVictory: (victory: boolean) => void;
  onChangeMinutes: (mins: number) => void;
  onChangeExcuse: (text: string) => void;
  onChangeReflection: (text: string) => void;
  onToggleHabit: (id: string) => void;
  onSave: () => void;
}

export const NewWarEntryModal: React.FC<NewWarEntryModalProps> = ({
  isOpen,
  isVictory,
  loggedMinutes,
  excuseText,
  reflectionText,
  completedHabits,
  activeStandards,
  onClose,
  onToggleVictory,
  onChangeMinutes,
  onChangeExcuse,
  onChangeReflection,
  onToggleHabit,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/15 backdrop-blur-2xs flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[8px] max-w-md w-full p-5 space-y-4 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-[#E9E8E4] text-[#1F2328]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E9E8E4] pb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-[#1F2328]">
            <Flame size={15} className="text-amber-600" /> Registrar Sesión Diaria
          </h3>
          <button
            onClick={onClose}
            className="text-[#9B9A97] hover:text-[#1F2328] text-xs font-medium p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Victory vs Defeat Toggle */}
          <div>
            <label className="block text-[11px] font-normal text-[#787774] mb-1.5">
              Resultado de la jornada
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onToggleVictory(true)}
                className={`py-2 rounded-[7px] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  isVictory
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                    : 'bg-[#FAF9F6] border border-[#E9E8E4] text-[#787774]'
                }`}
              >
                <CheckCircle2 size={14} /> Victoria
              </button>
              <button
                type="button"
                onClick={() => onToggleVictory(false)}
                className={`py-2 rounded-[7px] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  !isVictory
                    ? 'bg-rose-50 border border-rose-300 text-rose-800'
                    : 'bg-[#FAF9F6] border border-[#E9E8E4] text-[#787774]'
                }`}
              >
                <XCircle size={14} /> Derrota / Ceder
              </button>
            </div>
          </div>

          {/* Minutes focused */}
          <div>
            <label className="block text-[11px] font-normal text-[#787774] mb-1">
              Minutos de foco profundo completados
            </label>
            <input
              type="number"
              value={loggedMinutes}
              onChange={(e) => onChangeMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full text-xs font-mono px-3 py-2 rounded-[7px] bg-[#FAF9F6] border border-[#E9E8E4] text-[#1F2328] outline-none focus:border-[#1F2328]"
            />
          </div>

          {/* Excuses Defeated */}
          <div>
            <label className="block text-[11px] font-normal text-[#787774] mb-1">
              {isVictory ? 'Excusa superada hoy' : 'Excusa que te hizo ceder'}
            </label>
            <input
              type="text"
              value={excuseText}
              onChange={(e) => onChangeExcuse(e.target.value)}
              placeholder={
                isVictory
                  ? 'Ej: Quería postergar pero me senté y arranqué.'
                  : 'Ej: Me distraje con el teléfono.'
              }
              className="w-full text-xs px-3 py-2 rounded-[7px] bg-[#FAF9F6] border border-[#E9E8E4] text-[#1F2328] outline-none focus:border-[#1F2328]"
            />
          </div>

          {/* Reflection */}
          <div>
            <label className="block text-[11px] font-normal text-[#787774] mb-1">
              Reflexión o lección aprendida
            </label>
            <textarea
              rows={2}
              value={reflectionText}
              onChange={(e) => onChangeReflection(e.target.value)}
              placeholder="Anota cómo respondió tu mente y concentración hoy..."
              className="w-full text-xs px-3 py-2 rounded-[7px] bg-[#FAF9F6] border border-[#E9E8E4] text-[#1F2328] outline-none focus:border-[#1F2328] resize-none leading-relaxed font-normal"
            />
          </div>

          {/* Habit Checklist */}
          <div>
            <label className="block text-[11px] font-normal text-[#787774] mb-1.5">
              Estándares cumplidos
            </label>
            <div className="space-y-1">
              {activeStandards.map((std) => {
                const checked = completedHabits.includes(std.id);
                return (
                  <div
                    key={std.id}
                    onClick={() => onToggleHabit(std.id)}
                    className={`p-2 rounded-[6px] text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      checked
                        ? 'bg-amber-50 text-amber-900'
                        : 'bg-[#FAF9F6] text-[#787774]'
                    }`}
                  >
                    <span className="truncate">{std.title}</span>
                    <div
                      className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 text-[10px] ${
                        checked
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'border-[#CCC9BF]'
                      }`}
                    >
                      {checked && '✓'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-[#E9E8E4]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-[7px] text-xs font-normal bg-[#F4F3EF] hover:bg-[#EAE8E3] text-[#5A5A58] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            className="flex-1 py-2 rounded-[7px] text-xs font-medium bg-[#EAEAEA] hover:bg-[#DFDFDF] text-[#1F2328] transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
