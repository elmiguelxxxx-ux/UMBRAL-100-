/**
 * aiPolicy.ts
 * Filosofía de IA en Umbral:
 * "La IA evalúa y cuestiona; la persona produce."
 * Todo lo que construye comprensión lo hace el usuario a mano.
 */

export const AI_HELP_LIMIT_PER_MISSION = 1;

export type AiHelpKind = 'hint' | 'review' | 'interrogate';

export class AiUnavailable extends Error {
  constructor(message = 'IA no disponible o deshabilitada.') {
    super(message);
    this.name = 'AiUnavailable';
  }
}

export interface AiHelpEventRecord {
  id: string;
  userId: string;
  missionId?: string;
  kind: AiHelpKind;
  createdAt: string;
}
