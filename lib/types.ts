export type GameStatus = 'ready' | 'playing' | 'paused' | 'gameOver' | 'won' | 'levelComplete';

export interface BrickData {
  id: string;
  position: [number, number, number];
  color: string;
  points: number;
  active: boolean;
  destroyedAt?: number; // Timestamp when destruction animation started
}

/**
 * Represents a single high score entry with the score value and timestamp.
 */
export interface HighScoreEntry {
  score: number;
  date: string; // ISO date string
}

/**
 * Container for high score data including all-time best and recent scores.
 */
export interface HighScores {
  allTime: number;
  recent: HighScoreEntry[]; // Last 10 entries
}

/**
 * All available power-up types in the game.
 */
export type PowerUpType = 'expand' | 'shrink' | 'slow' | 'fast' | 'multi' | 'laser' | 'life' | 'sticky';

/**
 * Represents a power-up item that can be collected by the player.
 */
export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: [number, number, number];
  active: boolean;
}

/**
 * Represents an active power-up effect with an expiration timestamp.
 */
export interface ActiveEffect {
  type: PowerUpType;
  expiresAt: number;  // timestamp
}
