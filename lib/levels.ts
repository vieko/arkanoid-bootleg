/**
 * Level configuration for Arkanoid game levels.
 * Each level defines a brick layout and optional gameplay modifiers.
 */
export interface LevelConfig {
  /** Unique identifier for the level */
  id: number;
  /** Display name for the level */
  name: string;
  /**
   * 2D array defining brick layout.
   * - 8 columns (matching BRICK_COLS)
   * - Values: 0 = empty, 1-5 = brick type by points (1=highest points, 5=lowest)
   */
  layout: number[][];
  /** Optional ball speed override (default: 0.15) */
  ballSpeed?: number;
  /** Optional paddle width override (default: 2.5) */
  paddleWidth?: number;
}

/**
 * Predefined game levels.
 * Layout values correspond to brick types:
 * - 0: empty space
 * - 1: red brick (50 points)
 * - 2: orange brick (40 points)
 * - 3: yellow brick (30 points)
 * - 4: green brick (20 points)
 * - 5: cyan brick (10 points)
 */
export const levels: LevelConfig[] = [
  {
    id: 1,
    name: 'Classic',
    layout: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 3, 3, 3],
      [4, 4, 4, 4, 4, 4, 4, 4],
      [5, 5, 5, 5, 5, 5, 5, 5],
    ],
  },
  {
    id: 2,
    name: 'Pyramid',
    ballSpeed: 0.17,
    layout: [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 2, 2, 2, 2, 0, 0],
      [0, 3, 3, 3, 3, 3, 3, 0],
      [4, 4, 4, 4, 4, 4, 4, 4],
      [5, 5, 5, 5, 5, 5, 5, 5],
    ],
  },
  {
    id: 3,
    name: 'Checkerboard',
    layout: [
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 2, 0, 2, 0, 2, 0, 2],
      [3, 0, 3, 0, 3, 0, 3, 0],
      [0, 4, 0, 4, 0, 4, 0, 4],
      [5, 0, 5, 0, 5, 0, 5, 0],
    ],
  },
  {
    id: 4,
    name: 'Fortress',
    ballSpeed: 0.17,
    layout: [
      [4, 4, 4, 4, 4, 4, 4, 4],
      [4, 0, 0, 0, 0, 0, 0, 4],
      [4, 0, 1, 1, 1, 1, 0, 4],
      [4, 0, 1, 2, 2, 1, 0, 4],
      [4, 0, 1, 1, 1, 1, 0, 4],
      [4, 0, 0, 0, 0, 0, 0, 4],
      [4, 4, 4, 4, 4, 4, 4, 4],
    ],
  },
  {
    id: 5,
    name: 'Invaders',
    ballSpeed: 0.17,
    layout: [
      [0, 1, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 0, 1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 0, 0, 1, 0, 1],
      [0, 1, 0, 0, 0, 0, 1, 0],
    ],
  },
  {
    id: 6,
    name: 'Diamond',
    ballSpeed: 0.17,
    layout: [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 2, 2, 2, 2, 0, 0],
      [0, 3, 3, 3, 3, 3, 3, 0],
      [4, 4, 4, 4, 4, 4, 4, 4],
      [0, 3, 3, 3, 3, 3, 3, 0],
      [0, 0, 2, 2, 2, 2, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
    ],
  },
  {
    id: 7,
    name: 'Stripes',
    ballSpeed: 0.18,
    paddleWidth: 2.3,
    layout: [
      [1, 0, 2, 0, 3, 0, 4, 0],
      [1, 0, 2, 0, 3, 0, 4, 0],
      [1, 0, 2, 0, 3, 0, 4, 0],
      [1, 0, 2, 0, 3, 0, 4, 0],
      [1, 0, 2, 0, 3, 0, 4, 0],
      [1, 0, 2, 0, 3, 0, 4, 0],
      [1, 0, 2, 0, 3, 0, 4, 0],
    ],
  },
  {
    id: 8,
    name: 'Heart',
    ballSpeed: 0.18,
    paddleWidth: 2.3,
    layout: [
      [0, 2, 2, 0, 0, 2, 2, 0],
      [2, 1, 1, 2, 2, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 2],
      [0, 2, 1, 1, 1, 1, 2, 0],
      [0, 0, 2, 1, 1, 2, 0, 0],
      [0, 0, 0, 2, 2, 0, 0, 0],
    ],
  },
  {
    id: 9,
    name: 'Maze',
    ballSpeed: 0.18,
    paddleWidth: 2.3,
    layout: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 2],
      [3, 3, 3, 3, 3, 3, 0, 2],
      [3, 0, 0, 0, 0, 0, 0, 2],
      [3, 0, 4, 4, 4, 4, 4, 4],
      [3, 0, 0, 0, 0, 0, 0, 0],
      [3, 5, 5, 5, 5, 5, 5, 5],
    ],
  },
  {
    id: 10,
    name: 'Boss',
    ballSpeed: 0.20,
    paddleWidth: 2.0,
    layout: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 3, 3, 3, 3, 2, 1],
      [1, 2, 3, 4, 4, 3, 2, 1],
      [1, 2, 3, 4, 4, 3, 2, 1],
      [1, 2, 3, 3, 3, 3, 2, 1],
      [1, 2, 2, 2, 2, 2, 2, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
];
