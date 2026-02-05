import { describe, it, expect } from 'vitest';
import { createBricks, getBrickBounds } from '../lib/brickUtils';
import {
  BRICK_ROWS,
  BRICK_COLS,
  BRICK_WIDTH,
  BRICK_HEIGHT,
  BRICK_GAP,
  BRICK_START_Y,
  COLORS,
} from '../lib/constants';
import { BrickData } from '../lib/types';

describe('createBricks', () => {
  describe('correct number of bricks created', () => {
    it('creates exactly BRICK_ROWS * BRICK_COLS bricks', () => {
      const bricks = createBricks();
      expect(bricks.length).toBe(BRICK_ROWS * BRICK_COLS);
    });

    it('creates 40 bricks with default 5 rows and 8 columns', () => {
      const bricks = createBricks();
      // Verify constants match expected defaults
      expect(BRICK_ROWS).toBe(5);
      expect(BRICK_COLS).toBe(8);
      expect(bricks.length).toBe(40);
    });
  });

  describe('correct brick positioning', () => {
    it('positions bricks starting from BRICK_START_Y', () => {
      const bricks = createBricks();
      // First row should be at BRICK_START_Y
      const firstRowBricks = bricks.filter((b) => b.id.startsWith('brick-0-'));
      firstRowBricks.forEach((brick) => {
        expect(brick.position[1]).toBe(BRICK_START_Y);
      });
    });

    it('calculates correct y positions for each row', () => {
      const bricks = createBricks();
      for (let row = 0; row < BRICK_ROWS; row++) {
        const expectedY = BRICK_START_Y - row * (BRICK_HEIGHT + BRICK_GAP);
        const rowBricks = bricks.filter((b) => b.id.startsWith(`brick-${row}-`));
        rowBricks.forEach((brick) => {
          expect(brick.position[1]).toBe(expectedY);
        });
      }
    });

    it('calculates correct x positions for bricks in each column', () => {
      const bricks = createBricks();
      const totalWidth = BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_GAP;
      const startX = -totalWidth / 2 + BRICK_WIDTH / 2;

      for (let col = 0; col < BRICK_COLS; col++) {
        const expectedX = startX + col * (BRICK_WIDTH + BRICK_GAP);
        const colBricks = bricks.filter((b) => b.id.endsWith(`-${col}`));
        colBricks.forEach((brick) => {
          expect(brick.position[0]).toBeCloseTo(expectedX, 5);
        });
      }
    });

    it('all bricks have z position of 0', () => {
      const bricks = createBricks();
      bricks.forEach((brick) => {
        expect(brick.position[2]).toBe(0);
      });
    });

    it('bricks are horizontally centered around origin', () => {
      const bricks = createBricks();
      // Get first row for easier testing
      const firstRowBricks = bricks.filter((b) => b.id.startsWith('brick-0-'));
      const firstX = firstRowBricks[0].position[0];
      const lastX = firstRowBricks[firstRowBricks.length - 1].position[0];
      // First and last should be equidistant from center
      expect(Math.abs(firstX + lastX)).toBeLessThan(0.001);
    });
  });

  describe('correct colors per row', () => {
    it('assigns color from COLORS.brickColors based on row index', () => {
      const bricks = createBricks();
      for (let row = 0; row < BRICK_ROWS; row++) {
        const expectedColor = COLORS.brickColors[row % COLORS.brickColors.length];
        const rowBricks = bricks.filter((b) => b.id.startsWith(`brick-${row}-`));
        rowBricks.forEach((brick) => {
          expect(brick.color).toBe(expectedColor);
        });
      }
    });

    it('all bricks in the same row have the same color', () => {
      const bricks = createBricks();
      for (let row = 0; row < BRICK_ROWS; row++) {
        const rowBricks = bricks.filter((b) => b.id.startsWith(`brick-${row}-`));
        const firstColor = rowBricks[0].color;
        rowBricks.forEach((brick) => {
          expect(brick.color).toBe(firstColor);
        });
      }
    });

    it('row 0 gets first color from brickColors array', () => {
      const bricks = createBricks();
      const row0Bricks = bricks.filter((b) => b.id.startsWith('brick-0-'));
      row0Bricks.forEach((brick) => {
        expect(brick.color).toBe(COLORS.brickColors[0]);
      });
    });

    it('colors cycle if more rows than colors', () => {
      // This tests the modulo behavior for future-proofing
      const bricks = createBricks();
      const numColors = COLORS.brickColors.length;
      // Verify that color cycling would work if there were more rows
      for (let row = 0; row < BRICK_ROWS; row++) {
        const expectedColor = COLORS.brickColors[row % numColors];
        const rowBricks = bricks.filter((b) => b.id.startsWith(`brick-${row}-`));
        expect(rowBricks[0].color).toBe(expectedColor);
      }
    });
  });

  describe('correct point values (higher rows = more points)', () => {
    it('top row (row 0) has highest points', () => {
      const bricks = createBricks();
      const row0Bricks = bricks.filter((b) => b.id.startsWith('brick-0-'));
      const expectedPoints = BRICK_ROWS * 10;
      row0Bricks.forEach((brick) => {
        expect(brick.points).toBe(expectedPoints);
      });
    });

    it('bottom row (last row) has lowest points', () => {
      const bricks = createBricks();
      const lastRowBricks = bricks.filter((b) =>
        b.id.startsWith(`brick-${BRICK_ROWS - 1}-`)
      );
      const expectedPoints = 10; // (BRICK_ROWS - (BRICK_ROWS - 1)) * 10 = 1 * 10
      lastRowBricks.forEach((brick) => {
        expect(brick.points).toBe(expectedPoints);
      });
    });

    it('calculates points as (BRICK_ROWS - row) * 10', () => {
      const bricks = createBricks();
      for (let row = 0; row < BRICK_ROWS; row++) {
        const expectedPoints = (BRICK_ROWS - row) * 10;
        const rowBricks = bricks.filter((b) => b.id.startsWith(`brick-${row}-`));
        rowBricks.forEach((brick) => {
          expect(brick.points).toBe(expectedPoints);
        });
      }
    });

    it('all bricks in the same row have the same points', () => {
      const bricks = createBricks();
      for (let row = 0; row < BRICK_ROWS; row++) {
        const rowBricks = bricks.filter((b) => b.id.startsWith(`brick-${row}-`));
        const firstPoints = rowBricks[0].points;
        rowBricks.forEach((brick) => {
          expect(brick.points).toBe(firstPoints);
        });
      }
    });

    it('points decrease by 10 for each lower row', () => {
      const bricks = createBricks();
      for (let row = 0; row < BRICK_ROWS - 1; row++) {
        const currentRowBrick = bricks.find((b) => b.id === `brick-${row}-0`);
        const nextRowBrick = bricks.find((b) => b.id === `brick-${row + 1}-0`);
        expect(currentRowBrick!.points - nextRowBrick!.points).toBe(10);
      }
    });
  });

  describe('all bricks start as active', () => {
    it('all created bricks have active set to true', () => {
      const bricks = createBricks();
      bricks.forEach((brick) => {
        expect(brick.active).toBe(true);
      });
    });

    it('no bricks start as inactive', () => {
      const bricks = createBricks();
      const inactiveBricks = bricks.filter((b) => !b.active);
      expect(inactiveBricks.length).toBe(0);
    });
  });

  describe('unique IDs for all bricks', () => {
    it('all bricks have unique IDs', () => {
      const bricks = createBricks();
      const ids = bricks.map((brick) => brick.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(bricks.length);
    });

    it('IDs follow brick-row-col format', () => {
      const bricks = createBricks();
      bricks.forEach((brick) => {
        expect(brick.id).toMatch(/^brick-\d+-\d+$/);
      });
    });

    it('each row-col combination has exactly one brick', () => {
      const bricks = createBricks();
      for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
          const expectedId = `brick-${row}-${col}`;
          const matchingBricks = bricks.filter((b) => b.id === expectedId);
          expect(matchingBricks.length).toBe(1);
        }
      }
    });

    it('brick at row 0, col 0 has id brick-0-0', () => {
      const bricks = createBricks();
      const brick = bricks.find((b) => b.id === 'brick-0-0');
      expect(brick).toBeDefined();
    });

    it('brick at last row, last col has correct id', () => {
      const bricks = createBricks();
      const expectedId = `brick-${BRICK_ROWS - 1}-${BRICK_COLS - 1}`;
      const brick = bricks.find((b) => b.id === expectedId);
      expect(brick).toBeDefined();
    });
  });
});

describe('getBrickBounds', () => {
  // Helper to create a test brick
  function createTestBrick(x: number, y: number, z: number = 0): BrickData {
    return {
      id: 'test-brick',
      position: [x, y, z],
      color: '#ff0055',
      points: 100,
      active: true,
    };
  }

  describe('bounds for brick at origin (0, 0, 0)', () => {
    it('returns correct left bound', () => {
      const brick = createTestBrick(0, 0, 0);
      const bounds = getBrickBounds(brick);
      expect(bounds.left).toBe(-BRICK_WIDTH / 2);
    });

    it('returns correct right bound', () => {
      const brick = createTestBrick(0, 0, 0);
      const bounds = getBrickBounds(brick);
      expect(bounds.right).toBe(BRICK_WIDTH / 2);
    });

    it('returns correct top bound', () => {
      const brick = createTestBrick(0, 0, 0);
      const bounds = getBrickBounds(brick);
      expect(bounds.top).toBe(BRICK_HEIGHT / 2);
    });

    it('returns correct bottom bound', () => {
      const brick = createTestBrick(0, 0, 0);
      const bounds = getBrickBounds(brick);
      expect(bounds.bottom).toBe(-BRICK_HEIGHT / 2);
    });

    it('bounds are symmetric around origin', () => {
      const brick = createTestBrick(0, 0, 0);
      const bounds = getBrickBounds(brick);
      expect(bounds.left).toBe(-bounds.right);
      expect(bounds.bottom).toBe(-bounds.top);
    });
  });

  describe('bounds for brick at various positions', () => {
    it('returns correct bounds for brick at positive x, y', () => {
      const brick = createTestBrick(5, 3, 0);
      const bounds = getBrickBounds(brick);
      expect(bounds.left).toBe(5 - BRICK_WIDTH / 2);
      expect(bounds.right).toBe(5 + BRICK_WIDTH / 2);
      expect(bounds.top).toBe(3 + BRICK_HEIGHT / 2);
      expect(bounds.bottom).toBe(3 - BRICK_HEIGHT / 2);
    });

    it('returns correct bounds for brick at negative x, y', () => {
      const brick = createTestBrick(-4, -2, 0);
      const bounds = getBrickBounds(brick);
      expect(bounds.left).toBe(-4 - BRICK_WIDTH / 2);
      expect(bounds.right).toBe(-4 + BRICK_WIDTH / 2);
      expect(bounds.top).toBe(-2 + BRICK_HEIGHT / 2);
      expect(bounds.bottom).toBe(-2 - BRICK_HEIGHT / 2);
    });

    it('returns correct bounds for brick at mixed x, y', () => {
      const brick = createTestBrick(3, -5, 0);
      const bounds = getBrickBounds(brick);
      expect(bounds.left).toBe(3 - BRICK_WIDTH / 2);
      expect(bounds.right).toBe(3 + BRICK_WIDTH / 2);
      expect(bounds.top).toBe(-5 + BRICK_HEIGHT / 2);
      expect(bounds.bottom).toBe(-5 - BRICK_HEIGHT / 2);
    });

    it('returns correct bounds for brick with floating point position', () => {
      const brick = createTestBrick(1.5, 2.75, 0);
      const bounds = getBrickBounds(brick);
      expect(bounds.left).toBeCloseTo(1.5 - BRICK_WIDTH / 2, 5);
      expect(bounds.right).toBeCloseTo(1.5 + BRICK_WIDTH / 2, 5);
      expect(bounds.top).toBeCloseTo(2.75 + BRICK_HEIGHT / 2, 5);
      expect(bounds.bottom).toBeCloseTo(2.75 - BRICK_HEIGHT / 2, 5);
    });

    it('z position does not affect bounds', () => {
      const brickZ0 = createTestBrick(2, 3, 0);
      const brickZ5 = createTestBrick(2, 3, 5);
      const boundsZ0 = getBrickBounds(brickZ0);
      const boundsZ5 = getBrickBounds(brickZ5);
      expect(boundsZ0.left).toBe(boundsZ5.left);
      expect(boundsZ0.right).toBe(boundsZ5.right);
      expect(boundsZ0.top).toBe(boundsZ5.top);
      expect(boundsZ0.bottom).toBe(boundsZ5.bottom);
    });
  });

  describe('bounds calculations use BRICK_WIDTH and BRICK_HEIGHT constants', () => {
    it('width of bounds equals BRICK_WIDTH', () => {
      const brick = createTestBrick(0, 0, 0);
      const bounds = getBrickBounds(brick);
      const width = bounds.right - bounds.left;
      expect(width).toBe(BRICK_WIDTH);
    });

    it('height of bounds equals BRICK_HEIGHT', () => {
      const brick = createTestBrick(0, 0, 0);
      const bounds = getBrickBounds(brick);
      const height = bounds.top - bounds.bottom;
      expect(height).toBe(BRICK_HEIGHT);
    });

    it('bounds width is consistent across different positions', () => {
      const positions = [
        [0, 0],
        [5, 3],
        [-4, -2],
        [1.5, 2.75],
      ];
      positions.forEach(([x, y]) => {
        const brick = createTestBrick(x, y, 0);
        const bounds = getBrickBounds(brick);
        const width = bounds.right - bounds.left;
        expect(width).toBeCloseTo(BRICK_WIDTH, 5);
      });
    });

    it('bounds height is consistent across different positions', () => {
      const positions = [
        [0, 0],
        [5, 3],
        [-4, -2],
        [1.5, 2.75],
      ];
      positions.forEach(([x, y]) => {
        const brick = createTestBrick(x, y, 0);
        const bounds = getBrickBounds(brick);
        const height = bounds.top - bounds.bottom;
        expect(height).toBeCloseTo(BRICK_HEIGHT, 5);
      });
    });
  });

  describe('correct left, right, top, bottom bounds', () => {
    it('left is always less than right', () => {
      const brick = createTestBrick(10, 5, 0);
      const bounds = getBrickBounds(brick);
      expect(bounds.left).toBeLessThan(bounds.right);
    });

    it('bottom is always less than top', () => {
      const brick = createTestBrick(10, 5, 0);
      const bounds = getBrickBounds(brick);
      expect(bounds.bottom).toBeLessThan(bounds.top);
    });

    it('brick center is between left and right bounds', () => {
      const x = 7;
      const brick = createTestBrick(x, 0, 0);
      const bounds = getBrickBounds(brick);
      expect(x).toBeGreaterThan(bounds.left);
      expect(x).toBeLessThan(bounds.right);
    });

    it('brick center is between top and bottom bounds', () => {
      const y = 4;
      const brick = createTestBrick(0, y, 0);
      const bounds = getBrickBounds(brick);
      expect(y).toBeGreaterThan(bounds.bottom);
      expect(y).toBeLessThan(bounds.top);
    });
  });

  describe('getBrickBounds with actual game bricks', () => {
    it('returns valid bounds for bricks created by createBricks', () => {
      const bricks = createBricks();
      bricks.forEach((brick) => {
        const bounds = getBrickBounds(brick);
        expect(bounds.left).toBeLessThan(bounds.right);
        expect(bounds.bottom).toBeLessThan(bounds.top);
        expect(bounds.right - bounds.left).toBeCloseTo(BRICK_WIDTH, 5);
        expect(bounds.top - bounds.bottom).toBeCloseTo(BRICK_HEIGHT, 5);
      });
    });

    it('adjacent bricks do not overlap', () => {
      const bricks = createBricks();
      // Check horizontal neighbors (same row, adjacent columns)
      for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS - 1; col++) {
          const currentBrick = bricks.find((b) => b.id === `brick-${row}-${col}`);
          const nextBrick = bricks.find((b) => b.id === `brick-${row}-${col + 1}`);
          const currentBounds = getBrickBounds(currentBrick!);
          const nextBounds = getBrickBounds(nextBrick!);
          // Right edge of current should not overlap left edge of next
          expect(currentBounds.right).toBeLessThan(nextBounds.left);
        }
      }
    });

    it('vertically adjacent bricks do not overlap', () => {
      const bricks = createBricks();
      // Check vertical neighbors (same column, adjacent rows)
      for (let row = 0; row < BRICK_ROWS - 1; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
          const currentBrick = bricks.find((b) => b.id === `brick-${row}-${col}`);
          const nextBrick = bricks.find((b) => b.id === `brick-${row + 1}-${col}`);
          const currentBounds = getBrickBounds(currentBrick!);
          const nextBounds = getBrickBounds(nextBrick!);
          // Bottom edge of current should not overlap top edge of next
          // (since higher rows have higher y values)
          expect(currentBounds.bottom).toBeGreaterThan(nextBounds.top);
        }
      }
    });

    it('gap between horizontal bricks equals BRICK_GAP', () => {
      const bricks = createBricks();
      const brick0 = bricks.find((b) => b.id === 'brick-0-0');
      const brick1 = bricks.find((b) => b.id === 'brick-0-1');
      const bounds0 = getBrickBounds(brick0!);
      const bounds1 = getBrickBounds(brick1!);
      const gap = bounds1.left - bounds0.right;
      expect(gap).toBeCloseTo(BRICK_GAP, 5);
    });

    it('gap between vertical bricks equals BRICK_GAP', () => {
      const bricks = createBricks();
      const brickRow0 = bricks.find((b) => b.id === 'brick-0-0');
      const brickRow1 = bricks.find((b) => b.id === 'brick-1-0');
      const boundsRow0 = getBrickBounds(brickRow0!);
      const boundsRow1 = getBrickBounds(brickRow1!);
      const gap = boundsRow0.bottom - boundsRow1.top;
      expect(gap).toBeCloseTo(BRICK_GAP, 5);
    });
  });
});
