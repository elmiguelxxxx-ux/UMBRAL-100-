import React from 'react';
import {
  CanvasNode,
  CanvasEdge,
  CanvasSection,
  Whiteboard,
  OrganizerMode,
} from '../../types';

export interface CanvasViewportState {
  zoom: number;
  pan: { x: number; y: number };
  isPanning: boolean;
}

export const NODE_COLORS = [
  {
    id: 'slate',
    bg: '#FFFDF8',
    border: '#E7E2D3',
    text: '#1F2328',
    header: '#FFFDF8',
    darkBg: '#18181B',
    darkBorder: '#2E2E33',
    darkText: '#F4F4F5',
    darkHeader: '#18181B',
  },
  {
    id: 'blue',
    bg: '#F6F9FD',
    border: '#DCE8F6',
    text: '#204E78',
    header: '#F0F5FB',
    darkBg: '#0F1A2E',
    darkBorder: '#1E3A5F',
    darkText: '#93C5FD',
    darkHeader: '#13233D',
  },
  {
    id: 'emerald',
    bg: '#F6FAF7',
    border: '#D8EBDD',
    text: '#1E5830',
    header: '#EFF7F1',
    darkBg: '#092113',
    darkBorder: '#164E28',
    darkText: '#86EFAC',
    darkHeader: '#0E2E1B',
  },
  {
    id: 'amber',
    bg: '#FDFBF7',
    border: '#F0E8D7',
    text: '#78551E',
    header: '#F9F4EB',
    darkBg: '#231806',
    darkBorder: '#4E3310',
    darkText: '#FDE047',
    darkHeader: '#30220A',
  },
  {
    id: 'rose',
    bg: '#FDF7F7',
    border: '#F2DCDE',
    text: '#7E2B2E',
    header: '#FAEEEE',
    darkBg: '#240C10',
    darkBorder: '#521B24',
    darkText: '#FDA4AF',
    darkHeader: '#331219',
  },
  {
    id: 'purple',
    bg: '#FAF8FC',
    border: '#ECE2F5',
    text: '#5D3B78',
    header: '#F4EEF9',
    darkBg: '#1A102A',
    darkBorder: '#3C215E',
    darkText: '#D8B4FE',
    darkHeader: '#25173B',
  },
];

export const getNodeColor = (colorId?: string, isDark?: boolean) => {
  const found = NODE_COLORS.find((c) => c.id === colorId) || NODE_COLORS[0];
  if (isDark) {
    return {
      bg: found.darkBg,
      border: found.darkBorder,
      text: found.darkText,
      header: found.darkHeader,
    };
  }
  return {
    bg: found.bg,
    border: found.border,
    text: found.text,
    header: found.header,
  };
};

export const MODE_DESCRIPTIONS: Record<OrganizerMode, { label: string; desc: string; icon: string }> = {
  conceptual: {
    label: 'Mapa Conceptual',
    desc: 'Red jerárquica de conceptos interconectados por palabras de enlace (ej: "causa", "contiene").',
    icon: '🕸️',
  },
  llaves: {
    label: 'Esquema de Llaves',
    desc: 'Cuadro sinóptico horizontal con llaves jerárquicas: Idea general → Ideas principales → Detalles.',
    icon: '📑',
  },
  mental: {
    label: 'Mapa Mental',
    desc: 'Idea central radiante con ramas orgánicas y ramificaciones secundarias hacia los lados.',
    icon: '🧠',
  },
  libre: {
    label: 'Lienzo Libre',
    desc: 'Disposición libre sin restricciones espaciales para esbozar ideas, notas y secciones.',
    icon: '✨',
  },
};
