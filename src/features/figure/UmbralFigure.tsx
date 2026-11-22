import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UmbralActiveObjective, UmbralActiveThreshold } from '../useUmbralProgress';
import { MissionRecord } from './useMission';

export interface UmbralFigureProps {
  mode: 'home' | 'ritual' | 'execution';
  objective: UmbralActiveObjective | null;
  threshold: UmbralActiveThreshold | null;
  mission: MissionRecord | null;
  onSelectLevel: (level: 1 | 2 | 3 | 4 | 5) => void;
  onEnterRitual?: () => void;
  onSelectToolDirect?: (toolKey: string) => void;
  hasSacrificeCheckPending?: boolean;
  sacrificeText?: string;
  onAnswerSacrifice?: (kept: boolean) => void;
  activeObjectiveIndex?: number;
  totalObjectives?: number;
  onToggleObjective?: () => void;
}

export const UmbralFigure: React.FC<UmbralFigureProps> = ({
  mode,
  objective,
  threshold,
  mission,
  onSelectLevel,
  onEnterRitual,
  onSelectToolDirect,
  hasSacrificeCheckPending = false,
  sacrificeText,
  onAnswerSacrifice,
  activeObjectiveIndex = 0,
  totalObjectives = 1,
  onToggleObjective,
}) => {
  const isRitual = mode === 'ritual';

  // Porcentaje del plazo inmutable (0 a 100)
  const daysElapsed = objective?.daysElapsed || 1;
  const daysTotal = objective?.deadlineDays || 90;
  const deadlinePct = Math.min(100, Math.max(0, Math.round((daysElapsed / daysTotal) * 100)));

  // Textos y formateo
  const objectiveTitle = objective?.title || 'Objetivo de maestría';
  const thresholdText = threshold?.text
    ? threshold.text.length > 110
      ? `${threshold.text.slice(0, 107)}...`
      : threshold.text
    : 'Explicar concepto clave sin consultar apuntes.';

  const missionTitle = mission?.title || 'Construir mapa de relaciones del tema';
  const toolName = mission?.tool
    ? {
        canvas: 'Construcción (Canvas)',
        pdf: 'Biblioteca (Lector)',
        aprendizaje: 'Aprendizaje activo (Flashcards)',
        examen: 'Evaluación (Examen)',
      }[mission.tool] || mission.tool
    : 'Construcción (Canvas)';
  const toolMinutes = mission?.estimatedMinutes || 25;

  const isPendingEvidence = mission?.status === 'pending_evidence';

  return (
    <div className="w-full flex flex-col items-center justify-center select-none py-2 px-4 max-w-2xl mx-auto">
      {/* Pregunta de sacrificio diaria no bloqueante si aplica */}
      {hasSacrificeCheckPending && sacrificeText && onAnswerSacrifice && (
        <div className="w-full mb-6 p-4 border border-[var(--fig-line)] bg-[var(--bg-card)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <span className="text-[var(--text-primary)]">
            ¿Cumpliste ayer tu sacrificio: <strong className="font-semibold">"{sacrificeText}"</strong>?
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onAnswerSacrifice(true)}
              className="px-3 py-1 border border-[var(--fig-accent)] text-[var(--fig-accent)] hover:bg-[var(--fig-accent)] hover:text-white transition-colors cursor-pointer"
            >
              Sí
            </button>
            <button
              onClick={() => onAnswerSacrifice(false)}
              className="px-3 py-1 border border-[var(--fig-line)] text-[var(--fig-mute)] hover:border-[var(--fig-ink)] hover:text-[var(--fig-ink)] transition-colors cursor-pointer"
            >
              No
            </button>
          </div>
        </div>
      )}

      {/* FIGURA CONCÉNTRICA: Divs anidados de afuera hacia adentro */}
      <motion.div
        layoutId="figure-level-1"
        role="button"
        tabIndex={0}
        aria-label={`Nivel 1: Objetivo. ${objectiveTitle}. Día ${daysElapsed} de ${daysTotal}.`}
        onClick={() => onSelectLevel(1)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectLevel(1);
          }
        }}
        className="w-full relative flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--fig-ink)] p-4 sm:p-6 transition-all overflow-hidden"
        style={{
          backgroundColor: 'var(--fig-card-bg)',
          border: '1px solid var(--fig-dark-border)',
          boxShadow: 'var(--fig-card-shadow)',
          borderRadius: 'var(--fig-card-radius)',
          '--fig-ink': 'var(--fig-dark-ink)',
          '--fig-mute': 'var(--fig-dark-mute)',
          '--fig-line': 'var(--fig-dark-border)',
        } as React.CSSProperties}
      >
        {/* Línea de progreso del plazo: barra delgada en el borde superior */}
        <div
          className="absolute top-0 left-0 h-[2px] pointer-events-none"
          style={{
            width: `${deadlinePct}%`,
            backgroundColor: 'var(--fig-accent)',
          }}
        />

        {/* Franja Nivel 1: Etiqueta OBJETIVO + Título + Día X de N */}
        <div className="w-full flex items-center justify-between gap-3 text-xs font-mono mb-3 sm:mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--fig-mute)] font-sans">
              OBJETIVO
            </span>
            <span className="text-sm sm:text-[15px] font-normal text-[var(--fig-ink)] truncate font-sans">
              {objectiveTitle}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {totalObjectives > 1 && onToggleObjective && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleObjective();
                }}
                className="text-[10px] border border-[var(--fig-line)] px-1.5 py-0.5 text-[var(--fig-mute)] hover:text-[var(--fig-ink)] cursor-pointer rounded"
                title="Alternar entre objetivos activos"
              >
                {activeObjectiveIndex + 1} / {totalObjectives}
              </button>
            )}
            <span className="text-[11px] sm:text-xs text-[var(--fig-mute)] font-mono">
              Día {daysElapsed} de {daysTotal}
            </span>
          </div>
        </div>

        {/* NIVEL 2: UMBRAL ACTUAL */}
        <motion.div
          layoutId="figure-level-2"
          role="button"
          tabIndex={0}
          aria-label={`Nivel 2: Umbral actual. ${thresholdText}.`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectLevel(2);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onSelectLevel(2);
            }
          }}
          className="w-full flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--fig-ink)] p-4 sm:p-5 transition-all"
          style={{
            backgroundColor: 'var(--fig-umbral-bg)',
            border: '1px solid var(--fig-inner-border)',
            borderRadius: 'var(--fig-umbral-radius)',
          }}
        >
          {/* Franja Nivel 2: Etiqueta UMBRAL ACTUAL + Frase */}
          <div className="w-full mb-3 sm:mb-4">
            <span className="block text-[11px] uppercase tracking-[0.2em] text-[var(--fig-mute)] font-sans mb-1">
              UMBRAL ACTUAL
            </span>
            <p className="text-sm sm:text-[16px] font-normal text-[var(--fig-ink)] leading-snug line-clamp-2 font-sans">
              {thresholdText}
            </p>
          </div>

          {/* RITUAL: Si estamos en modo ritual, solo niveles 1 y 2 visibles con botón ENTRAR */}
          {isRitual ? (
            <div className="w-full py-10 flex flex-col items-center justify-center space-y-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnterRitual?.();
                }}
                className="px-8 py-3.5 border border-[var(--fig-line)] text-xs font-sans uppercase tracking-[0.2em] text-[var(--fig-ink)] hover:bg-[var(--fig-ink)] hover:text-[var(--fig-umbral-bg)] transition-all cursor-pointer font-medium rounded"
              >
                ENTRAR
              </button>
              <span className="text-[11px] font-mono text-[var(--fig-mute)]">
                Apertura del ciclo de estudio diario
              </span>
            </div>
          ) : (
            <AnimatePresence>
              {/* NIVEL 3: MISIÓN ACTUAL (borde 1.6px) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45 }}
                layoutId="figure-level-3"
                role="button"
                tabIndex={0}
                aria-label={`Nivel 3: Misión actual. ${missionTitle}.`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLevel(3);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectLevel(3);
                  }
                }}
                className="w-full flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--fig-ink)] p-4 sm:p-5 transition-all"
                style={{
                  backgroundColor: 'var(--fig-mission-bg)',
                  border: '1.6px solid var(--fig-deep-border)',
                  borderRadius: 'var(--fig-mission-radius)',
                }}
              >
                {/* Franja Nivel 3: Etiqueta MISIÓN ACTUAL + Título destacado */}
                <div className="w-full mb-3 sm:mb-4">
                  <span className="block text-[11px] uppercase tracking-[0.2em] text-[var(--fig-mute)] font-sans mb-1">
                    MISIÓN ACTUAL
                  </span>
                  <h2 className="text-lg sm:text-[22px] font-medium text-[var(--fig-ink)] leading-snug font-sans">
                    {missionTitle}
                  </h2>
                </div>

                {/* NIVEL 4: HERRAMIENTA */}
                <motion.div
                  layoutId="figure-level-4"
                  role="button"
                  tabIndex={0}
                  aria-label={`Nivel 4: Herramienta. ${toolName}, ${toolMinutes} minutos.`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLevel(4);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectLevel(4);
                    }
                  }}
                  className="w-full flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--fig-ink)] p-4 sm:p-5 transition-all"
                  style={{
                    backgroundColor: 'var(--fig-tool-bg)',
                    border: '1px solid var(--fig-deep-border)',
                    borderRadius: 'var(--fig-tool-radius)',
                  }}
                >
                  {/* Franja Nivel 4: HERRAMIENTA + Nombre · N min + Botón CONTINUAR */}
                  <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <span className="block text-[11px] uppercase tracking-[0.2em] text-[var(--fig-mute)] font-sans mb-0.5">
                        HERRAMIENTA
                      </span>
                      <p className="text-sm sm:text-[15px] font-normal text-[var(--fig-ink)] font-sans">
                        {toolName} · {toolMinutes} min
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLevel(4);
                      }}
                      className="px-5 py-2 border border-[var(--fig-line)] text-[11px] font-sans uppercase tracking-[0.2em] text-[var(--fig-ink)] hover:bg-[var(--fig-ink)] hover:text-[var(--fig-card-bg)] transition-colors cursor-pointer self-start sm:self-auto rounded"
                    >
                      CONTINUAR
                    </button>
                  </div>

                  {/* NIVEL 5: EVIDENCIA (Cuadrado central) */}
                  <motion.div
                    layoutId="figure-level-5"
                    role="button"
                    tabIndex={0}
                    aria-label={
                      isPendingEvidence
                        ? 'Nivel 5: Evidencia habilitada. Entregar evidencia de la misión.'
                        : 'Nivel 5: Evidencia atenuada. Se activa al terminar la misión.'
                    }
                    title={
                      isPendingEvidence
                        ? 'Tocar para entregar evidencia'
                        : 'Se activa al terminar la misión'
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLevel(5);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectLevel(5);
                      }
                    }}
                    className={`w-full max-w-[190px] mx-auto py-3 px-4 flex flex-col items-center justify-center cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--fig-ink)] ${
                      isPendingEvidence ? 'opacity-100' : 'opacity-65 hover:opacity-90'
                    }`}
                    style={{
                      backgroundColor: 'var(--fig-evidence-bg)',
                      border: 'var(--fig-evidence-border)',
                      borderRadius: 'var(--fig-tool-radius)',
                    }}
                  >
                    {/* Punto central de 8px */}
                    <div
                      className="w-2 h-2 shrink-0 rounded-none mb-1.5 transition-transform"
                      style={{
                        backgroundColor: 'var(--fig-accent)',
                        transform: isPendingEvidence ? 'scale(1.3)' : 'scale(1)',
                      }}
                    />
                    <span className="text-[11px] uppercase tracking-[0.2em] font-sans text-[var(--fig-mute)]">
                      EVIDENCIA
                    </span>
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>
      </motion.div>

      {/* Franja de 5 accesos libres debajo de la figura */}
      {!isRitual && (
        <motion.nav
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-6 text-[13px] text-[var(--text-secondary)] font-sans select-none"
          aria-label="Herramientas libres"
        >
          <button
            onClick={() => onSelectToolDirect?.('canvas')}
            className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            Construcción
          </button>
          <span className="opacity-40">·</span>
          <button
            onClick={() => onSelectToolDirect?.('biblioteca')}
            className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            Biblioteca
          </button>
          <span className="opacity-40">·</span>
          <button
            onClick={() => onSelectToolDirect?.('aprendizaje')}
            className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            Aprendizaje activo
          </button>
          <span className="opacity-40">·</span>
          <button
            onClick={() => onSelectToolDirect?.('journal')}
            className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            Diario
          </button>
          <span className="opacity-40">·</span>
          <button
            onClick={() => onSelectToolDirect?.('examen')}
            className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            Evaluación
          </button>
        </motion.nav>
      )}
    </div>
  );
};
