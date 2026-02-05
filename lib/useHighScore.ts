import { useState, useCallback, useRef } from 'react';
import { HighScoreEntry, HighScores } from './types';

const STORAGE_KEY = 'arkanoid-highscore';
const MAX_RECENT_ENTRIES = 10;

/**
 * Default high scores when no data is available
 */
const DEFAULT_SCORES: HighScores = {
  allTime: 0,
  recent: [],
};

/**
 * Load high scores from localStorage with error handling.
 * SSR-safe: checks for window before accessing localStorage.
 */
function loadHighScores(): HighScores {
  if (typeof window === 'undefined') {
    return DEFAULT_SCORES;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SCORES;
    }

    const parsed = JSON.parse(stored);

    // Validate the parsed data has expected structure
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.allTime !== 'number' ||
      !Array.isArray(parsed.recent)
    ) {
      return DEFAULT_SCORES;
    }

    // Validate and filter recent entries
    const validRecent: HighScoreEntry[] = parsed.recent
      .filter(
        (entry: unknown): entry is HighScoreEntry =>
          typeof entry === 'object' &&
          entry !== null &&
          typeof (entry as HighScoreEntry).score === 'number' &&
          typeof (entry as HighScoreEntry).date === 'string'
      )
      .slice(0, MAX_RECENT_ENTRIES);

    return {
      allTime: parsed.allTime,
      recent: validRecent,
    };
  } catch {
    // JSON parse error, localStorage unavailable (incognito), or other issues
    return DEFAULT_SCORES;
  }
}

/**
 * Save high scores to localStorage with error handling.
 * SSR-safe: checks for window before accessing localStorage.
 */
function saveHighScores(scores: HighScores): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // localStorage might be full or unavailable (e.g., incognito mode)
    // Silently fail - the game can continue without persistence
  }
}

/**
 * React hook for managing high score persistence via localStorage.
 *
 * Features:
 * - Persists all-time high score and recent scores (last 10)
 * - SSR-safe (checks for window before accessing localStorage)
 * - Handles localStorage unavailability gracefully (e.g., incognito mode)
 * - Handles corrupted/invalid JSON data
 *
 * @returns Object containing current high score and update function
 */
export function useHighScore(): {
  highScore: number;
  updateHighScore: (score: number) => boolean;
} {
  // Use lazy initialization to load from localStorage on first render (client-side)
  // This avoids the need for useEffect and prevents hydration mismatches
  const [highScore, setHighScore] = useState(() => {
    const scores = loadHighScores();
    return scores.allTime;
  });

  // Use ref for recent scores since they don't need to trigger re-renders
  const recentScoresRef = useRef<HighScoreEntry[] | null>(null);

  // Lazily initialize recent scores ref
  if (recentScoresRef.current === null) {
    recentScoresRef.current = loadHighScores().recent;
  }

  /**
   * Update the high score if the new score is higher.
   * Also adds the score to the recent scores list.
   *
   * @param score - The new score to check and potentially save
   * @returns true if this is a new high score, false otherwise
   */
  const updateHighScore = useCallback(
    (score: number): boolean => {
      const isNewHighScore = score > highScore;

      // Create new recent entry
      const newEntry: HighScoreEntry = {
        score,
        date: new Date().toISOString(),
      };

      // Update recent scores (add to front, keep max 10)
      const currentRecent = recentScoresRef.current ?? [];
      const updatedRecent = [newEntry, ...currentRecent].slice(
        0,
        MAX_RECENT_ENTRIES
      );
      recentScoresRef.current = updatedRecent;

      // Determine new all-time high
      const newAllTime = isNewHighScore ? score : highScore;

      // Save to localStorage
      const updatedScores: HighScores = {
        allTime: newAllTime,
        recent: updatedRecent,
      };
      saveHighScores(updatedScores);

      // Update state only if it's a new high score
      if (isNewHighScore) {
        setHighScore(score);
      }

      return isNewHighScore;
    },
    [highScore]
  );

  return { highScore, updateHighScore };
}
