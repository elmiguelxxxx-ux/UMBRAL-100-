import React, { useState, useMemo, useEffect } from 'react';
import {
  Flashcard,
  FSRSState,
  FSRSRating,
  Folder,
  DocumentItem,
  Note,
  ReviewEvent,
  AiConfig,
} from '../types';
import {
  scheduleCard,
  getDueCards,
  getNewCards,
} from '../lib/fsrs';
import { useActivityTracker } from '../activityLogService';
import {
  Brain,
  Plus,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { FlashcardStudySession } from './flashcards/FlashcardStudySession';
import { CreateFlashcardModal } from './flashcards/CreateFlashcardModal';
import { FlashcardList } from './flashcards/FlashcardList';

interface FlashcardsViewProps {
  cards: Flashcard[];
  folders: Folder[];
  documents: DocumentItem[];
  notes: Note[];
  onUpdateCards: (cards: Flashcard[]) => void;
  reviewEvents?: ReviewEvent[];
  onAddReviewEvent?: (event: ReviewEvent) => void;
  onOpenSettings: () => void;
  initialDeckId?: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  cards,
  folders,
  documents,
  notes,
  onUpdateCards,
  reviewEvents = [],
  onAddReviewEvent,
  onOpenSettings,
  initialDeckId,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>(initialDeckId || 'all');
  const [isStudying, setIsStudying] = useState(false);
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);

  useEffect(() => {
    if (initialDeckId && initialDeckId !== selectedFolderId) {
      setSelectedFolderId(initialDeckId);
    }
  }, [initialDeckId]);

  const currentDeckName = useMemo(() => {
    if (selectedFolderId === 'all') return 'Todas las Flashcards';
    const folder = folders.find((f) => f.id === selectedFolderId);
    return folder ? folder.name : 'Colección General';
  }, [selectedFolderId, folders]);

  useActivityTracker({
    resourceType: 'flashcard_deck',
    resourceId: selectedFolderId || 'all',
    resourceTitle: currentDeckName,
    status: isStudying && currentCardIndex >= studyQueue.length && studyQueue.length > 0 ? 'completed' : 'in_progress',
    progressPct: isStudying && studyQueue.length > 0 ? Math.round((currentCardIndex / studyQueue.length) * 100) : 0,
    dependencyKey: `${selectedFolderId}:${isStudying}:${currentCardIndex}:${cards.length}`,
  });

  // Card Creation Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [frontDraft, setFrontDraft] = useState('');
  const [backDraft, setBackDraft] = useState('');
  const [targetFolderDraft, setTargetFolderDraft] = useState('root');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Filter cards by folder
  const filteredCards = cards.filter((c) => {
    if (selectedFolderId !== 'all' && c.deckId !== selectedFolderId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        (c.sourceDocTitle && c.sourceDocTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const dueCards = getDueCards(filteredCards);
  const newCards = getNewCards(filteredCards);

  // Start Study Session
  const handleStartStudy = (onlyDue = false) => {
    let pool = onlyDue ? dueCards : filteredCards;
    if (pool.length === 0) pool = filteredCards;
    if (pool.length === 0) return;

    const sorted = [...pool].sort((a, b) => {
      if (a.due <= Date.now() && b.due > Date.now()) return -1;
      if (b.due <= Date.now() && a.due > Date.now()) return 1;
      return a.due - b.due;
    });

    setStudyQueue(sorted);
    setCurrentCardIndex(0);
    setSessionCompletedCount(0);
    setIsStudying(true);
  };

  // Submit FSRS Review Rating
  const handleRateCard = (rating: FSRSRating) => {
    const currentCard = studyQueue[currentCardIndex];
    if (!currentCard) return;

    const updatedCard = scheduleCard(currentCard, rating);
    const updatedCardsList = cards.map((c) => (c.id === currentCard.id ? updatedCard : c));
    onUpdateCards(updatedCardsList);
    onAddReviewEvent?.({
      id: uid(),
      cardId: currentCard.id,
      conceptId: currentCard.conceptId,
      rating,
      reviewedAt: Date.now(),
      wasLapse: currentCard.state === FSRSState.Review && rating === FSRSRating.Again,
    });

    setSessionCompletedCount((c) => c + 1);

    if (currentCardIndex + 1 < studyQueue.length) {
      setCurrentCardIndex((i) => i + 1);
    } else {
      setIsStudying(false);
    }
  };

  // Create Card Manually
  const handleCreateCard = () => {
    if (!frontDraft.trim() || !backDraft.trim()) return;

    const newCard: Flashcard = {
      id: uid(),
      deckId: targetFolderDraft,
      front: frontDraft.trim(),
      back: backDraft.trim(),
      state: FSRSState.New,
      stability: 1.0,
      difficulty: 5.0,
      due: Date.now(),
      reps: 0,
      lapses: 0,
      createdAt: Date.now(),
    };

    onUpdateCards([...cards, newCard]);
    setFrontDraft('');
    setBackDraft('');
    setIsCreateOpen(false);
  };

  // Delete Card
  const handleDeleteCard = (cardId: string) => {
    onUpdateCards(cards.filter((c) => c.id !== cardId));
  };

  const handleEditCard = (card: Flashcard) => {
    setFrontDraft(card.front);
    setBackDraft(card.back);
    setTargetFolderDraft(card.deckId || 'root');
    handleDeleteCard(card.id);
    setIsCreateOpen(true);
  };

  const handleResetCardProgress = (card: Flashcard) => {
    const resetCard: Flashcard = {
      ...card,
      state: FSRSState.New,
      stability: 1.0,
      difficulty: 5.0,
      due: Date.now(),
      reps: 0,
      lapses: 0,
    };
    onUpdateCards(cards.map((c) => (c.id === card.id ? resetCard : c)));
  };

  // Render Active Study Session Mode
  if (isStudying) {
    const card = studyQueue[currentCardIndex];
    if (!card) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#FBFBFB] text-center">
          <div className="w-12 h-12 rounded-[8px] bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-3">
            <CheckCircle2 size={24} />
          </div>
          <h2 className="text-base font-semibold text-[#1F2328] mb-1">¡Repaso Completado!</h2>
          <p className="text-xs text-[#787774] font-normal max-w-sm mb-4 leading-relaxed">
            Has repasado {sessionCompletedCount} tarjeta(s) con el algoritmo FSRS. La repetición
            espaciada ha programado las próximas revisiones óptimas.
          </p>
          <button
            onClick={() => setIsStudying(false)}
            className="px-4 py-2 bg-[#EAEAEA] hover:bg-[#DFDFDF] text-[#1F2328] rounded-[7px] text-xs font-medium transition-colors"
          >
            Volver a Flashcards
          </button>
        </div>
      );
    }

    return (
      <FlashcardStudySession
        card={card}
        currentIndex={currentCardIndex}
        totalCards={studyQueue.length}
        onExit={() => setIsStudying(false)}
        onRateCard={(rating) => handleRateCard(rating)}
      />
    );
  }

  // Calculate stats
  const totalCards = cards.length;
  const avgStability =
    totalCards > 0
      ? (cards.reduce((acc, c) => acc + (c.stability || 1), 0) / totalCards).toFixed(1)
      : '0.0';
  const difficultCards = [...cards].filter((c) => c.lapses > 0).sort((a, b) => b.lapses - a.lapses).slice(0, 5);

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)] text-[var(--text-primary)] overflow-y-auto p-6 md:p-8 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-center text-[var(--fig-accent)]">
              <Brain size={13} />
            </div>
            <h1 className="text-base font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
              <span className="font-ailerons tracking-widest uppercase text-xs">Aprendizaje Activo</span>
              <span className="font-mono text-xs text-[var(--text-secondary)]">/ FSRS</span>
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-normal">
            Repetición espaciada algorítmica basada en intervalos de memoria y dificultad de retención.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[var(--text-primary)] text-[var(--bg-app)] border border-[var(--text-primary)] hover:opacity-90 transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>+ Nueva Flashcard</span>
          </button>
        </div>
      </div>

      {difficultCards.length > 0 && (
        <div className="mb-5 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs">
          <span className="font-semibold">Conceptos más difíciles: </span>
          {difficultCards.map((c) => `${c.front} (${c.lapses} fallos)`).join(' · ')}
        </div>
      )}

      {/* Metrics Banner */}
      <div
        className="bg-white p-5 rounded-[8px] mb-6 grid grid-cols-2 sm:grid-cols-4 gap-6"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}
      >
        <div>
          <span className="text-xs text-[#787774] font-normal block mb-1">Por repasar hoy</span>
          <div className="text-2xl font-bold font-mono text-[#1F2328]">{dueCards.length}</div>
        </div>

        <div>
          <span className="text-xs text-[#787774] font-normal block mb-1">Nuevas</span>
          <div className="text-2xl font-bold font-mono text-[#1F2328]">{newCards.length}</div>
        </div>

        <div>
          <span className="text-xs text-[#787774] font-normal block mb-1">Total tarjetas</span>
          <div className="text-2xl font-bold font-mono text-[#1F2328]">{totalCards}</div>
        </div>

        <div>
          <span className="text-xs text-[#787774] font-normal block mb-1">Estabilidad FSRS</span>
          <div className="text-2xl font-bold font-mono text-[#1F2328]">{avgStability}d</div>
        </div>
      </div>

      {/* Start Review Hero Card */}
      {filteredCards.length > 0 && (
        <div
          className="bg-white rounded-[8px] p-4 mb-6 flex flex-wrap items-center justify-between gap-4"
          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}
        >
          <div className="space-y-0.5">
            <h3 className="font-semibold text-xs text-[#1F2328]">Sesión de Repaso Espaciado</h3>
            <p className="text-xs text-[#787774] font-normal">
              {dueCards.length > 0
                ? `Tienes ${dueCards.length} tarjeta(s) vencida(s) listas para consolidar en tu memoria.`
                : 'Todas tus tarjetas están al día. Puedes iniciar un repaso libre cuando desees.'}
            </p>
          </div>
          <div className="flex gap-2">
            {dueCards.length > 0 && (
              <button
                onClick={() => handleStartStudy(true)}
                className="px-3.5 py-1.5 bg-[#EAEAEA] hover:bg-[#DFDFDF] font-medium text-xs rounded-[7px] text-[#1F2328] transition-colors"
              >
                Repasar Pendientes ({dueCards.length})
              </button>
            )}
            <button
              onClick={() => handleStartStudy(false)}
              className="px-3.5 py-1.5 bg-[#F4F3EF] hover:bg-[#EAE8E3] font-normal text-xs rounded-[7px] text-[#5A5A58] transition-colors"
            >
              Repaso Completo ({filteredCards.length})
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9A97]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar flashcards por pregunta o respuesta..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E9E8E4] rounded-lg outline-none focus:border-[#1F2328]"
            />
          </div>

          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="text-xs bg-white border border-[#E9E8E4] rounded-lg px-2.5 py-1.5 outline-none text-[#5A5A58]"
          >
            <option value="all">Todas las carpetas</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Flashcards List */}
      <FlashcardList
        cards={filteredCards}
        folders={folders}
        onDeleteCard={handleDeleteCard}
        onEditCard={handleEditCard}
        onResetCardProgress={handleResetCardProgress}
      />

      {/* Modal: Crear Flashcard Manual */}
      <CreateFlashcardModal
        isOpen={isCreateOpen}
        frontDraft={frontDraft}
        backDraft={backDraft}
        targetFolderDraft={targetFolderDraft}
        folders={folders}
        onClose={() => setIsCreateOpen(false)}
        onSetFrontDraft={setFrontDraft}
        onSetBackDraft={setBackDraft}
        onSetTargetFolderDraft={setTargetFolderDraft}
        onCreateCard={handleCreateCard}
      />
    </div>
  );
};
