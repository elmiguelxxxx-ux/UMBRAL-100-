import { Flashcard, FSRSState, FSRSRating } from '../types';

// Simplified & accurate parameters for FSRS (Free Spaced Repetition Scheduler)
// Default initial stabilities per rating for new cards
const INITIAL_STABILITY = {
  [FSRSRating.Again]: 0.4, // ~10 hours
  [FSRSRating.Hard]: 1.2,  // ~1.2 days
  [FSRSRating.Good]: 3.2,  // ~3.2 days
  [FSRSRating.Easy]: 7.5,  // ~7.5 days
};

// Initial difficulty scale (1 to 10)
const INITIAL_DIFFICULTY = {
  [FSRSRating.Again]: 7.5,
  [FSRSRating.Hard]: 6.5,
  [FSRSRating.Good]: 5.0,
  [FSRSRating.Easy]: 3.5,
};

const TARGET_RETENTION = 0.9; // 90% target retention

/**
 * Calculates next interval in days based on stability and target retention
 */
export function calculateInterval(stability: number, targetRetention = TARGET_RETENTION): number {
  // Interval equation: I = S * 9 * (1/R - 1)
  // For R = 0.9, 9 * (1/0.9 - 1) = 9 * 0.1111 ≈ 1.0 -> Interval ≈ S
  const factor = 9 * (1 / targetRetention - 1);
  const interval = stability * factor;
  return Math.max(1, Math.round(interval));
}

/**
 * Updates a flashcard using FSRS principles
 */
export function scheduleCard(
  card: Flashcard,
  rating: FSRSRating,
  now = Date.now()
): Flashcard {
  const isNew = card.state === FSRSState.New;
  const isLearning = card.state === FSRSState.Learning || card.state === FSRSState.Relearning;

  let newStability = card.stability;
  let newDifficulty = card.difficulty;
  let newState = card.state;
  let newReps = card.reps + 1;
  let newLapses = card.lapses;
  let dueOffsetMs = 0;

  if (isNew) {
    newDifficulty = INITIAL_DIFFICULTY[rating];
    newStability = INITIAL_STABILITY[rating];

    if (rating === FSRSRating.Again) {
      newState = FSRSState.Learning;
      dueOffsetMs = 10 * 60 * 1000; // 10 minutes
    } else {
      newState = FSRSState.Review;
      const days = calculateInterval(newStability);
      dueOffsetMs = days * 24 * 60 * 60 * 1000;
    }
  } else if (isLearning) {
    if (rating === FSRSRating.Again) {
      newDifficulty = Math.min(10, card.difficulty + 0.4);
      newStability = Math.max(0.2, card.stability * 0.8);
      dueOffsetMs = 10 * 60 * 1000; // 10 minutes
    } else {
      newState = FSRSState.Review;
      if (rating === FSRSRating.Hard) {
        newStability = Math.max(1, card.stability * 1.2);
        newDifficulty = Math.min(10, card.difficulty + 0.3);
      } else if (rating === FSRSRating.Good) {
        newStability = Math.max(2, card.stability * 2.0);
        newDifficulty = Math.max(1, card.difficulty - 0.2);
      } else {
        // Easy
        newStability = Math.max(4, card.stability * 3.0);
        newDifficulty = Math.max(1, card.difficulty - 0.6);
      }
      const days = calculateInterval(newStability);
      dueOffsetMs = days * 24 * 60 * 60 * 1000;
    }
  } else {
    // Already in Review
    if (rating === FSRSRating.Again) {
      newLapses += 1;
      newState = FSRSState.Relearning;
      newDifficulty = Math.min(10, card.difficulty + 1.2);
      newStability = Math.max(0.4, card.stability * 0.25); // lapse penalty
      dueOffsetMs = 10 * 60 * 1000; // 10 min
    } else if (rating === FSRSRating.Hard) {
      newDifficulty = Math.min(10, card.difficulty + 0.5);
      // Hard stability multiplier: S * (1 + factor)
      const factor = Math.max(0.1, (11 - newDifficulty) / 8);
      newStability = card.stability * (1 + factor * 0.5);
      const days = Math.max(1, calculateInterval(newStability));
      dueOffsetMs = days * 24 * 60 * 60 * 1000;
    } else if (rating === FSRSRating.Good) {
      newDifficulty = Math.max(1, card.difficulty - 0.2);
      const factor = Math.max(0.4, (11 - newDifficulty) / 5);
      newStability = card.stability * (1 + factor);
      const days = Math.max(card.stability + 1, calculateInterval(newStability));
      dueOffsetMs = days * 24 * 60 * 60 * 1000;
    } else {
      // Easy
      newDifficulty = Math.max(1, card.difficulty - 0.8);
      const factor = Math.max(0.8, (11 - newDifficulty) / 3.5);
      newStability = card.stability * (1 + factor * 1.5);
      const days = Math.max(card.stability + 2, calculateInterval(newStability));
      dueOffsetMs = days * 24 * 60 * 60 * 1000;
    }
  }

  return {
    ...card,
    stability: Number(newStability.toFixed(2)),
    difficulty: Number(newDifficulty.toFixed(2)),
    state: newState,
    reps: newReps,
    lapses: newLapses,
    lastReview: now,
    due: now + dueOffsetMs,
  };
}

/**
 * Returns a human-friendly string for the predicted next interval
 */
export function formatIntervalString(card: Flashcard, rating: FSRSRating, now = Date.now()): string {
  const preview = scheduleCard(card, rating, now);
  const diffMs = preview.due - now;
  const diffMins = Math.round(diffMs / (60 * 1000));
  if (diffMins < 60) return `${Math.max(1, diffMins)}m`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d`;
  const diffMonths = Math.round(diffDays / 30);
  return `${diffMonths}mo`;
}

/**
 * Filter cards that are due for review right now
 */
export function getDueCards(cards: Flashcard[], now = Date.now()): Flashcard[] {
  return cards.filter((c) => c.state !== FSRSState.New && c.due <= now);
}

/**
 * Filter brand new unstudied cards
 */
export function getNewCards(cards: Flashcard[]): Flashcard[] {
  return cards.filter((c) => c.state === FSRSState.New);
}
