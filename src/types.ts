export type DocumentKind = 'pdf' | 'docx' | 'pptx';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface Note {
  id: string;
  folderId: string;
  title: string;
  content: string;
  sourcePdfId?: string;
  createdAt: number;
}

export interface Highlight {
  id: string;
  text: string;
  color: string;
  createdAt: number;
  linkedCanvasNodeId?: string;
  linkedNoteId?: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface Concept {
  id: string;
  term: string;
  definition: string;
  sourceExcerpt?: string;
  sourcePage?: number;
  createdAt: number;
  /** folderId del documento del que viene este concepto (se asigna al armar la lista para ExamView) */
  folderId?: string;
}

export interface DocumentItem {
  id: string;
  folderId: string;
  title: string;
  kind: DocumentKind;
  content: string;
  extractError?: string | null;
  /** true si el archivo original (binario) quedó guardado en IndexedDB para el visor real */
  hasOriginalFile?: boolean;
  highlights: Highlight[];
  aiChat: AiChatMessage[];
  concepts?: Concept[];
  conceptsStatus?: 'idle' | 'processing' | 'ready' | 'error';
  conceptsError?: string | null;
  createdAt: number;
}

export type PdfDoc = DocumentItem;

// --- CANVAS TYPES ---
export type OrganizerMode = 'conceptual' | 'llaves' | 'mental' | 'libre';

export interface CanvasSection {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: 'slate' | 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
}

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  title: string;
  content: string;
  type: 'concept' | 'category' | 'branch' | 'quote' | 'note' | 'whiteboard';
  color?: string;
  sourceDocId?: string;
  sourceDocTitle?: string;
  conceptId?: string;
  sourceHighlightId?: string;
  sourceNoteId?: string;
  targetBoardId?: string; // For nested whiteboards
}

export interface CanvasEdge {
  id: string;
  from: string;
  to: string;
  label?: string; // e.g. "causa", "contiene", "se compone de"
  style?: 'solid' | 'dashed' | 'bracket';
}

export interface Whiteboard {
  id: string;
  title: string;
  parentId?: string | null;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  sections?: CanvasSection[];
  mode?: OrganizerMode;
  createdAt: number;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  sections?: CanvasSection[];
  mode: OrganizerMode;
  boards?: Whiteboard[];
  activeBoardId?: string;
}

// --- FSRS & FLASHCARDS TYPES ---
export enum FSRSState {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

export enum FSRSRating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

export interface Flashcard {
  id: string;
  deckId: string; // folderId or custom deck
  front: string;
  back: string;
  state: FSRSState;
  stability: number; // in days
  difficulty: number; // 1 to 10
  due: number; // timestamp in ms
  lastReview?: number; // timestamp in ms
  reps: number;
  lapses: number;
  sourceDocId?: string;
  sourceDocTitle?: string;
  createdAt: number;
}

// --- WAR LOG (STAY HARD) TYPES ---
export interface WarLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  victory: boolean; // true = victoria, false = derrota / excusas
  focusMinutes: number;
  reflection: string;
  excuseDefeated?: string;
  completedHabits: string[];
  createdAt: number;
}

export interface WarStandard {
  id: string;
  title: string;
  target: string;
}

// --- JOURNAL (DIARIO) TYPES ---
export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  tags?: string[];
  learned?: string;
  notUnderstood?: string;
  toReview?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ReviewEvent {
  id: string;
  cardId: string;
  conceptId?: string;
  rating: FSRSRating;
  reviewedAt: number;
  wasLapse: boolean;
}

export interface ExamQuestion {
  id: string;
  conceptId: string;
  prompt: string;
  expectedAnswer: string;
}

export interface ExamAttempt {
  id: string;
  folderId: string;
  questions: ExamQuestion[];
  answers: Record<string, string>;
  correctConceptIds: string[];
  missedConceptIds: string[];
  score: number;
  createdAt: number;
}

// --- APP STATE ROOT ---
export type FontFamily = 'inter' | 'lexend' | 'prime' | 'quinta';

export interface AppSettings {
  aiEnabled?: boolean;
  geminiApiKey: string;
  groqApiKey?: string;
  aiProvider?: 'gemini' | 'groq';
  theme?: 'light' | 'dark';
  fontFamily?: FontFamily;
}

export interface AiConfig {
  provider: 'gemini' | 'groq';
  apiKey: string;
}

export interface HomeMissionItem {
  id: string;
  text: string;
  completed: boolean;
  targetView?: 'biblioteca' | 'aprendizaje' | 'warlog' | 'examen' | 'journal' | 'canvas' | 'dashboard';
}

export interface HomeGoal {
  title: string;
  institution: string;
  currentWeek: number;
  totalWeeks: number;
  progressPercent: number;
}

export interface HomeRecommendation {
  subject: string;
  message: string;
  steps: string[];
  estimatedMinutes: number;
  targetView: 'aprendizaje' | 'examen';
}

export interface HomeEvidenceStats {
  masteredFlashcards: number;
  deepHours: number;
  masteredTopics: number;
}

export interface HomeData {
  goal: HomeGoal;
  umbralActual?: string;
  misionActual?: string;
  missions: HomeMissionItem[];
  recommendation?: HomeRecommendation;
  stats?: HomeEvidenceStats;
}

export interface AppData {
  folders: Folder[];
  notes: Note[];
  pdfs: DocumentItem[];
  canvas: CanvasData;
  flashcards: Flashcard[];
  reviewEvents?: ReviewEvent[];
  examAttempts?: ExamAttempt[];
  journal?: JournalEntry[];
  warLog: {
    entries: WarLogEntry[];
    standards: WarStandard[];
  };
  homeData?: HomeData;
  settings: AppSettings;
}
