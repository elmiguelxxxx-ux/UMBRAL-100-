import React, { useMemo } from 'react';
import { Flashcard, FSRSState, ReviewEvent, WarLogEntry } from '../types';
import { Brain, Flame, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

interface LearningDashboardProps {
  cards: Flashcard[];
  reviews: ReviewEvent[];
  warLog: WarLogEntry[];
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}

function MetricCard({ icon, label, value, detail }: MetricCardProps) {
  return (
    <div className="border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-[var(--text-secondary)]">{label}</span>
        <div className="text-[var(--text-secondary)]">{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-bold font-mono text-[var(--text-primary)]">{value}</div>
      <div className="mt-1 text-[11px] font-mono text-[var(--text-secondary)]">{detail}</div>
    </div>
  );
}

export function LearningDashboard({ cards, reviews, warLog }: LearningDashboardProps) {
  const metrics = useMemo(() => {
    const total = cards.length || 1;
    const review = cards.filter((c) => c.state === FSRSState.Review).length;
    const avgDifficulty = cards.length
      ? cards.reduce((sum, c) => sum + c.difficulty, 0) / cards.length
      : 0;

    const hard = [...cards]
      .filter((c) => (c.lapses || 0) > 0)
      .sort((a, b) => (b.lapses || 0) - (a.lapses || 0))
      .slice(0, 5);

    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const recentLapses = reviews.filter(
      (r) => r.wasLapse && r.reviewedAt > sevenDaysAgo
    ).length;

    // Las entradas nuevas se agregan al inicio del array en WarLogView,
    // por lo que los últimos 7 días son las primeras 7 entradas
    const focus = warLog.slice(0, 7).reduce((sum, e) => sum + (e.focusMinutes || 0), 0);

    return {
      review,
      total,
      avgDifficulty,
      hard,
      recentLapses,
      focus,
    };
  }, [cards, reviews, warLog]);

  const reviewPercentage = Math.round((metrics.review / metrics.total) * 100);

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Cabecera */}
      <div className="border-b border-[var(--border-color)] pb-5">
        <h1 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Brain size={16} className="text-[var(--fig-accent)]" />
          <span className="font-ailerons tracking-widest uppercase text-xs">Métricas de Retención FSRS</span>
        </h1>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          Consolidado de memoria activa, intervalos calculados y consistencia de estudio.
        </p>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<TrendingUp size={14} className="text-[var(--text-primary)]" />}
          label="En repaso"
          value={`${reviewPercentage}%`}
          detail={`${metrics.review} de ${cards.length} flashcards`}
        />
        <MetricCard
          icon={<Brain size={14} className="text-[var(--text-primary)]" />}
          label="Dificultad media"
          value={`${metrics.avgDifficulty.toFixed(1)} / 10`}
          detail="Estabilidad vs lapsus"
        />
        <MetricCard
          icon={<AlertTriangle size={14} className="text-amber-500" />}
          label="Lapsus (7 días)"
          value={String(metrics.recentLapses)}
          detail="Fallos en repaso"
        />
        <MetricCard
          icon={<Flame size={14} className="text-[var(--fig-accent)]" />}
          label="Foco semanal"
          value={`${metrics.focus} min`}
          detail="Registro de Guerra"
        />
      </div>

      {/* Conceptos y tarjetas con mayor fricción */}
      <section className="mt-8 border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[var(--text-secondary)]" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--text-primary)]">
              Tarjetas con mayor índice de lapsus (Top 5)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[var(--text-secondary)]">Prioridad de repaso</span>
        </div>

        {metrics.hard.length > 0 ? (
          <div className="mt-4 divide-y divide-[var(--border-color)]">
            {metrics.hard.map((card, index) => (
              <div
                key={card.id || index}
                className="py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-secondary)]">
                    {index + 1}
                  </span>
                  <span className="font-medium text-[var(--text-primary)] truncate">{card.front}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
                  <span className="text-rose-500">
                    {card.lapses} {card.lapses === 1 ? 'fallo' : 'fallos'}
                  </span>
                  <span className="text-[var(--text-secondary)] text-[10px]">
                    Dif: {card.difficulty.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-xs font-mono text-[var(--text-secondary)] py-4 text-center">
            Aún no hay lapsus registrados. Rendimiento óptimo en tus repasos.
          </p>
        )}
      </section>
    </div>
  );
}
