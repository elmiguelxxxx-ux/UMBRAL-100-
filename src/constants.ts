import { AppData, HomeData, CanvasData, Flashcard } from './types';

export const STORAGE_KEY = 'umbral-web-data-v2';

export const uid = () => Math.random().toString(36).slice(2, 10);

export const defaultHomeData: HomeData = {
  goal: {
    title: 'Mantener primer puesto',
    institution: 'Psicología UTP',
    currentWeek: 6,
    totalWeeks: 18,
    progressPercent: 34,
  },
  umbralActual: 'Explicar Condicionamiento Clásico sin mirar apuntes.',
  misionActual: 'Mapa de Condicionamiento Clásico',
  missions: [
    { id: 'm-1', text: 'Revisar Capítulo 4', completed: false, targetView: 'biblioteca' },
    { id: 'm-2', text: 'Resolver práctica clínica', completed: false, targetView: 'examen' },
    { id: 'm-3', text: '20 flashcards', completed: false, targetView: 'aprendizaje' },
    { id: 'm-4', text: 'Deep Work 25 min', completed: false, targetView: 'warlog' },
    { id: 'm-5', text: 'Reflexión diaria', completed: false, targetView: 'journal' },
  ],
  recommendation: {
    subject: 'Neuroanatomía',
    message: 'Tus errores aumentaron en Neuroanatomía.',
    steps: ['15 flashcards', '10 preguntas clínicas'],
    estimatedMinutes: 18,
    targetView: 'aprendizaje',
  },
  stats: {
    masteredFlashcards: 230,
    deepHours: 12,
    masteredTopics: 3,
  },
};

export const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Amarillo', value: '#FDE68A' },
  { id: 'green', label: 'Verde', value: '#BBF7D0' },
  { id: 'blue', label: 'Azul', value: '#BFDBFE' },
  { id: 'pink', label: 'Rosa', value: '#FBCFE8' },
];

export const KIND_META = {
  pdf: { label: 'PDF', color: '#F87171' },
  docx: { label: 'DOC', color: '#60A5FA' },
  pptx: { label: 'PPT', color: '#FB923C' },
} as const;

export const kindFromFileName = (name: string): 'pdf' | 'docx' | 'pptx' => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'pptx' || ext === 'ppt') return 'pptx';
  return 'pdf';
};

export const initialCanvasData: CanvasData = {
  mode: 'conceptual',
  nodes: [
    {
      id: 'n-welcome-1',
      x: 200,
      y: 100,
      title: 'Umbral: Aprendizaje Profundo',
      content: 'Lienzo infinito para sintetizar y conectar ideas de tus lecturas y apuntes.',
      type: 'concept',
      color: 'blue',
    },
    {
      id: 'n-welcome-2',
      x: 480,
      y: 100,
      title: '3 Modos de Organización',
      content: 'Cambia entre Mapa Conceptual, Esquema de Llaves y Mapa Mental con auto-organización.',
      type: 'category',
      color: 'emerald',
    },
    {
      id: 'n-welcome-3',
      x: 480,
      y: 260,
      title: 'Enlace desde Documentos',
      content: 'Subraya cualquier PDF, Word o PPT y pulsa "Enviar al Canvas" para crear un nodo aquí.',
      type: 'quote',
      color: 'amber',
    },
  ],
  edges: [
    { id: 'e-1', from: 'n-welcome-1', to: 'n-welcome-2', label: 'incorpora' },
    { id: 'e-2', from: 'n-welcome-2', to: 'n-welcome-3', label: 'permite' },
  ],
};

export const initialFlashcards: Flashcard[] = [
  {
    id: 'fc-1',
    deckId: 'root',
    front: '¿Qué es el algoritmo FSRS y cuál es su ventaja sobre SM-2?',
    back: 'Free Spaced Repetition Scheduler: modelo moderno basado en dos componentes de memoria (Estabilidad y Dificultad) que calcula intervalos óptimos con precisión matemática superior.',
    state: 0,
    stability: 2.0,
    difficulty: 5.0,
    due: Date.now(),
    reps: 0,
    lapses: 0,
    sourceDocTitle: 'Guía de Estudio Activo',
    createdAt: Date.now(),
  },
  {
    id: 'fc-2',
    deckId: 'root',
    front: '¿Cuál es la regla de oro para convertir un subrayado en conocimiento?',
    back: 'Transformarlo en una pregunta activa (Active Recall) en vez de solo releer el texto pasivamente.',
    state: 0,
    stability: 1.5,
    difficulty: 4.5,
    due: Date.now(),
    reps: 0,
    lapses: 0,
    sourceDocTitle: 'Guía de Estudio Activo',
    createdAt: Date.now(),
  },
];

export const initialWarLog = {
  entries: [
    {
      id: 'wl-1',
      date: new Date().toISOString().split('T')[0],
      victory: true,
      focusMinutes: 60,
      reflection: 'Sesión inicial enfocada. Todo el sistema conectado y listo para la batalla.',
      excuseDefeated: 'Quería postergar el repaso, pero la disciplina mandó.',
      completedHabits: ['std-1', 'std-2'],
      createdAt: Date.now(),
    },
  ],
  standards: [
    { id: 'std-1', title: 'Estudio profundo sin distracciones (45m+)', target: '1 sesión' },
    { id: 'std-2', title: 'Repaso diario de Flashcards FSRS', target: 'Todas las pendientes' },
    { id: 'std-3', title: 'Cero teléfono/redes durante bloques de foco', target: '100% blindado' },
    { id: 'std-4', title: 'Lectura activa o síntesis en Canvas', target: 'Mínimo 1 tema' },
  ],
};

export const emptyData = (): AppData => ({
  folders: [{ id: 'root', name: 'Mi Espacio', parentId: null }],
  notes: [],
  pdfs: [],
  canvas: initialCanvasData,
  flashcards: initialFlashcards,
  reviewEvents: [],
  examAttempts: [],
  warLog: initialWarLog,
  journal: [],
  homeData: defaultHomeData,
  settings: {
    geminiApiKey: '',
    groqApiKey: '',
    aiProvider: 'gemini',
    theme: 'light',
    fontFamily: 'inter',
  },
});

import { appStorage, storageHelper } from './lib/storage';

export { appStorage, storageHelper };
