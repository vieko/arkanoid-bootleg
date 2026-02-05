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
