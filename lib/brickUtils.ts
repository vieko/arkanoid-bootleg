import { BrickData } from './types';
import {
  BRICK_WIDTH,
  BRICK_HEIGHT,
  BRICK_COLS,
  BRICK_ROWS,
  BRICK_GAP,
  BRICK_START_Y,
  COLORS,
} from './constants';

export function createBricks(): BrickData[] {
  const bricks: BrickData[] = [];

  // Calculate total width of all bricks in a row
  const totalWidth = BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_GAP;
  const startX = -totalWidth / 2 + BRICK_WIDTH / 2;

  for (let row = 0; row < BRICK_ROWS; row++) {
    const color = COLORS.brickColors[row % COLORS.brickColors.length];
    // Higher rows give more points
    const points = (BRICK_ROWS - row) * 10;

    for (let col = 0; col < BRICK_COLS; col++) {
      const x = startX + col * (BRICK_WIDTH + BRICK_GAP);
      const y = BRICK_START_Y - row * (BRICK_HEIGHT + BRICK_GAP);

      bricks.push({
        id: `brick-${row}-${col}`,
        position: [x, y, 0],
        color,
        points,
        active: true,
      });
    }
  }

  return bricks;
}

export function getBrickBounds(brick: BrickData) {
  const [x, y] = brick.position;
  return {
    left: x - BRICK_WIDTH / 2,
    right: x + BRICK_WIDTH / 2,
    top: y + BRICK_HEIGHT / 2,
    bottom: y - BRICK_HEIGHT / 2,
  };
}

/**
 * Calculate brick position based on row and column indices.
 * Uses the provided column count to center bricks horizontally.
 */
function calculatePosition(row: number, col: number, cols: number): [number, number, number] {
  const totalWidth = cols * BRICK_WIDTH + (cols - 1) * BRICK_GAP;
  const startX = -totalWidth / 2 + BRICK_WIDTH / 2;
  const x = startX + col * (BRICK_WIDTH + BRICK_GAP);
  const y = BRICK_START_Y - row * (BRICK_HEIGHT + BRICK_GAP);
  return [x, y, 0];
}

/**
 * Create bricks from a 2D layout array.
 * Each cell value represents the brick type (0 = empty, 1-5 = brick types).
 * Points are calculated as type * 10.
 */
export function createBricksFromLayout(layout: number[][]): BrickData[] {
  const bricks: BrickData[] = [];

  for (let row = 0; row < layout.length; row++) {
    const cols = layout[row].length;
    for (let col = 0; col < cols; col++) {
      const type = layout[row][col];
      if (type === 0) continue;

      bricks.push({
        id: `${row}-${col}`,
        position: calculatePosition(row, col, cols),
        color: COLORS.brickColors[(type - 1) % COLORS.brickColors.length],
        points: type * 10,
        active: true,
      });
    }
  }

  return bricks;
}
