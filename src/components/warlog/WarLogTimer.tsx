import React from 'react';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';

interface WarLogTimerProps {
  timerDurationMins: number;
  timeLeftSecs: number;
  isTimerRunning: boolean;
  onSetTimer: (mins: number) => void;
  onToggleTimer: () => void;
  onResetTimer: () => void;
}

export const WarLogTimer: React.FC<WarLogTimerProps> = ({
  timerDurationMins,
  timeLeftSecs,
  isTimerRunning,
  onSetTimer,
  onToggleTimer,
  onResetTimer,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="bg-white rounded-[8px] p-5 flex flex-col justify-between"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-[#5A5A58] flex items-center gap-1.5">
            <Clock size={13} className="text-[#1F2328]" /> Cronómetro de Foco
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-[6px] font-medium ${
              isTimerRunning
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-[#F4F3EF] text-[#787774]'
            }`}
          >
            {isTimerRunning ? 'En sesión' : 'Pausa'}
          </span>
        </div>

        {/* Countdown Display */}
        <div className="my-6 text-center">
          <div className="text-5xl font-mono font-bold tracking-tight text-[#1F2328] select-none">
            {formatTime(timeLeftSecs)}
          </div>
          <div className="text-[11px] text-[#9B9A97] mt-2 font-normal">
            Bloque de {timerDurationMins} minutos de inmersión profunda
          </div>
        </div>

        {/* Quick Preset Buttons */}
        <div className="grid grid-cols-4 gap-1.5 mb-5">
          {[25, 45, 60, 90].map((mins) => (
            <button
              key={mins}
              onClick={() => onSetTimer(mins)}
              className={`py-1.5 rounded-[6px] text-xs font-mono transition-colors ${
                timerDurationMins === mins
                  ? 'bg-[#EAEAEA] text-[#1F2328] font-medium'
                  : 'bg-[#F7F6F3] hover:bg-[#EAE8E3] text-[#787774] font-normal'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex gap-2">
        <button
          onClick={onToggleTimer}
          className={`flex-1 py-2.5 rounded-[7px] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors ${
            isTimerRunning
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-[#EAEAEA] hover:bg-[#DFDFDF] text-[#1F2328]'
          }`}
        >
          {isTimerRunning ? (
            <>
              <Pause size={13} /> Pausar
            </>
          ) : (
            <>
              <Play size={13} /> Iniciar Sesión
            </>
          )}
        </button>
        <button
          onClick={onResetTimer}
          className="p-2.5 bg-[#F4F3EF] hover:bg-[#EAE8E3] text-[#787774] rounded-[7px] transition-colors"
          title="Reiniciar reloj"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
};
