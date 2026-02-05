import { describe, it, expect } from 'vitest';
import { levels, LevelConfig } from '../lib/levels';
import { createBricksFromLayout } from '../lib/brickUtils';
import { BRICK_WIDTH, BRICK_HEIGHT, BRICK_GAP, BRICK_START_Y } from '../lib/constants';

describe('Level System', () => {
  describe('level data structure integrity', () => {
    it('has at least 10 levels', () => {
      expect(levels.length).toBeGreaterThanOrEqual(10);
    });

    it('all levels have sequential IDs starting from 1', () => {
      levels.forEach((level, index) => {
        expect(level.id).toBe(index + 1);
      });
    });

    it('all levels have names', () => {
      levels.forEach((level) => {
        expect(level.name).toBeDefined();
        expect(typeof level.name).toBe('string');
        expect(level.name.length).toBeGreaterThan(0);
      });
    });

    it('all layouts have 8 columns', () => {
      levels.forEach((level) => {
        level.layout.forEach((row, rowIndex) => {
          expect(row.length).toBe(8);
        });
      });
    });

    it('all levels have at least one row in their layout', () => {
      levels.forEach((level) => {
        expect(level.layout.length).toBeGreaterThan(0);
      });
    });
  });

  describe('valid brick types', () => {
    it('all layout values are between 0-5', () => {
      levels.forEach((level) => {
        level.layout.forEach((row, rowIndex) => {
          row.forEach((cell, colIndex) => {
            expect(cell).toBeGreaterThanOrEqual(0);
            expect(cell).toBeLessThanOrEqual(5);
          });
        });
      });
    });

    it('each level has at least one non-zero brick', () => {
      levels.forEach((level) => {
        const hasNonZeroBrick = level.layout.some((row) =>
          row.some((cell) => cell !== 0)
        );
        expect(hasNonZeroBrick).toBe(true);
      });
    });

    it('all layout values are integers', () => {
      levels.forEach((level) => {
        level.layout.forEach((row) => {
          row.forEach((cell) => {
            expect(Number.isInteger(cell)).toBe(true);
          });
        });
      });
    });
  });

  describe('createBricksFromLayout', () => {
    describe('correct brick count', () => {
      it('creates correct number of bricks matching non-zero cells', () => {
        const layout = [
          [1, 1, 1, 0, 0, 0, 0, 0],
          [0, 2, 2, 2, 0, 0, 0, 0],
          [0, 0, 3, 3, 3, 0, 0, 0],
        ];
        const bricks = createBricksFromLayout(layout);
        // 3 + 3 + 3 = 9 non-zero cells
        expect(bricks.length).toBe(9);
      });

      it('creates zero bricks for all-zero layout', () => {
        const layout = [
          [0, 0, 0, 0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0, 0, 0],
        ];
        const bricks = createBricksFromLayout(layout);
        expect(bricks.length).toBe(0);
      });

      it('creates bricks for all cells in a full layout', () => {
        const layout = [
          [1, 1, 1, 1, 1, 1, 1, 1],
          [2, 2, 2, 2, 2, 2, 2, 2],
        ];
        const bricks = createBricksFromLayout(layout);
        expect(bricks.length).toBe(16);
      });

      it('creates correct brick count for actual game levels', () => {
        levels.forEach((level) => {
          const expectedCount = level.layout.reduce(
            (total, row) => total + row.filter((cell) => cell !== 0).length,
            0
          );
          const bricks = createBricksFromLayout(level.layout);
          expect(bricks.length).toBe(expectedCount);
        });
      });
    });

    describe('correct points calculation', () => {
      it('calculates points as type * 10 for type 1', () => {
        const layout = [[1, 0, 0, 0, 0, 0, 0, 0]];
        const bricks = createBricksFromLayout(layout);
        expect(bricks[0].points).toBe(10);
      });

      it('calculates points as type * 10 for type 2', () => {
        const layout = [[2, 0, 0, 0, 0, 0, 0, 0]];
        const bricks = createBricksFromLayout(layout);
        expect(bricks[0].points).toBe(20);
      });

      it('calculates points as type * 10 for type 3', () => {
        const layout = [[3, 0, 0, 0, 0, 0, 0, 0]];
        const bricks = createBricksFromLayout(layout);
        expect(bricks[0].points).toBe(30);
      });

      it('calculates points as type * 10 for type 4', () => {
        const layout = [[4, 0, 0, 0, 0, 0, 0, 0]];
        const bricks = createBricksFromLayout(layout);
        expect(bricks[0].points).toBe(40);
      });

      it('calculates points as type * 10 for type 5', () => {
        const layout = [[5, 0, 0, 0, 0, 0, 0, 0]];
        const bricks = createBricksFromLayout(layout);
        expect(bricks[0].points).toBe(50);
      });

      it('calculates points correctly for all brick types in a row', () => {
        const layout = [[1, 2, 3, 4, 5, 0, 0, 0]];
        const bricks = createBricksFromLayout(layout);
        expect(bricks[0].points).toBe(10);
        expect(bricks[1].points).toBe(20);
        expect(bricks[2].points).toBe(30);
        expect(bricks[3].points).toBe(40);
        expect(bricks[4].points).toBe(50);
      });
    });

    describe('empty cells handling', () => {
      it('skips cells with value 0', () => {
        const layout = [
          [0, 1, 0, 2, 0, 3, 0, 4],
        ];
        const bricks = createBricksFromLayout(layout);
        expect(bricks.length).toBe(4);
        // Verify no brick has position at columns 0, 2, 4, 6
        const brickCols = bricks.map((b) => {
          // Calculate column from x position
          const totalWidth = 8 * BRICK_WIDTH + 7 * BRICK_GAP;
          const startX = -totalWidth / 2 + BRICK_WIDTH / 2;
          return Math.round((b.position[0] - startX) / (BRICK_WIDTH + BRICK_GAP));
        });
        expect(brickCols).toEqual([1, 3, 5, 7]);
      });

      it('handles layout with scattered empty cells', () => {
        const layout = [
          [1, 0, 1, 0, 1, 0, 1, 0],
          [0, 2, 0, 2, 0, 2, 0, 2],
        ];
        const bricks = createBricksFromLayout(layout);
        expect(bricks.length).toBe(8);
      });

      it('handles empty rows correctly', () => {
        const layout = [
          [1, 1, 1, 1, 1, 1, 1, 1],
          [0, 0, 0, 0, 0, 0, 0, 0],
          [2, 2, 2, 2, 2, 2, 2, 2],
        ];
        const bricks = createBricksFromLayout(layout);
        expect(bricks.length).toBe(16);
      });
    });

    describe('brick position calculations', () => {
      it('calculates correct x positions for bricks', () => {
        const layout = [[1, 1, 1, 1, 1, 1, 1, 1]];
        const bricks = createBricksFromLayout(layout);

        const cols = 8;
        const totalWidth = cols * BRICK_WIDTH + (cols - 1) * BRICK_GAP;
        const startX = -totalWidth / 2 + BRICK_WIDTH / 2;

        bricks.forEach((brick, index) => {
          const expectedX = startX + index * (BRICK_WIDTH + BRICK_GAP);
          expect(brick.position[0]).toBeCloseTo(expectedX, 5);
        });
      });

      it('calculates correct y positions for bricks in different rows', () => {
        const layout = [
          [1, 0, 0, 0, 0, 0, 0, 0],
          [2, 0, 0, 0, 0, 0, 0, 0],
          [3, 0, 0, 0, 0, 0, 0, 0],
        ];
        const bricks = createBricksFromLayout(layout);

        expect(bricks[0].position[1]).toBe(BRICK_START_Y);
        expect(bricks[1].position[1]).toBe(BRICK_START_Y - (BRICK_HEIGHT + BRICK_GAP));
        expect(bricks[2].position[1]).toBe(BRICK_START_Y - 2 * (BRICK_HEIGHT + BRICK_GAP));
      });

      it('all bricks have z position of 0', () => {
        const layout = [
          [1, 2, 3, 4, 5, 1, 2, 3],
          [4, 5, 1, 2, 3, 4, 5, 1],
        ];
        const bricks = createBricksFromLayout(layout);
        bricks.forEach((brick) => {
          expect(brick.position[2]).toBe(0);
        });
      });

      it('bricks are horizontally centered', () => {
        const layout = [[1, 1, 1, 1, 1, 1, 1, 1]];
        const bricks = createBricksFromLayout(layout);

        // The first and last brick should be equidistant from center
        const firstX = bricks[0].position[0];
        const lastX = bricks[bricks.length - 1].position[0];
        expect(Math.abs(firstX + lastX)).toBeLessThan(0.001);
      });
    });

    describe('brick properties', () => {
      it('all created bricks have active set to true', () => {
        const layout = [
          [1, 2, 3, 4, 5, 1, 2, 3],
        ];
        const bricks = createBricksFromLayout(layout);
        bricks.forEach((brick) => {
          expect(brick.active).toBe(true);
        });
      });

      it('all created bricks have unique IDs', () => {
        const layout = [
          [1, 2, 3, 4, 5, 1, 2, 3],
          [4, 5, 1, 2, 3, 4, 5, 1],
        ];
        const bricks = createBricksFromLayout(layout);
        const ids = bricks.map((brick) => brick.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(bricks.length);
      });

      it('all created bricks have valid color strings', () => {
        const layout = [
          [1, 2, 3, 4, 5, 1, 2, 3],
        ];
        const bricks = createBricksFromLayout(layout);
        bricks.forEach((brick) => {
          expect(typeof brick.color).toBe('string');
          expect(brick.color.length).toBeGreaterThan(0);
        });
      });

      it('brick IDs follow row-col format', () => {
        const layout = [
          [1, 0, 2, 0, 0, 0, 0, 0],
          [0, 3, 0, 4, 0, 0, 0, 0],
        ];
        const bricks = createBricksFromLayout(layout);
        expect(bricks[0].id).toBe('0-0');
        expect(bricks[1].id).toBe('0-2');
        expect(bricks[2].id).toBe('1-1');
        expect(bricks[3].id).toBe('1-3');
      });
    });
  });

  describe('level-specific tests', () => {
    it('Level 1 (Classic) has full rows of each brick type', () => {
      const classicLevel = levels.find((l) => l.id === 1);
      expect(classicLevel).toBeDefined();
      expect(classicLevel!.name).toBe('Classic');

      const bricks = createBricksFromLayout(classicLevel!.layout);
      // 5 rows * 8 columns = 40 bricks
      expect(bricks.length).toBe(40);
    });

    it('Level 3 (Checkerboard) has alternating pattern', () => {
      const checkerLevel = levels.find((l) => l.id === 3);
      expect(checkerLevel).toBeDefined();

      const bricks = createBricksFromLayout(checkerLevel!.layout);
      // Checkerboard has half the cells filled
      expect(bricks.length).toBe(20);
    });

    it('Level 10 (Boss) is the hardest with most bricks', () => {
      const bossLevel = levels.find((l) => l.id === 10);
      expect(bossLevel).toBeDefined();
      expect(bossLevel!.name).toBe('Boss');

      const bricks = createBricksFromLayout(bossLevel!.layout);
      // Boss level is 8x8 fully filled
      expect(bricks.length).toBe(64);
    });

    it('later levels have faster ball speeds', () => {
      const level1 = levels.find((l) => l.id === 1);
      const level10 = levels.find((l) => l.id === 10);

      // Level 1 has no ballSpeed override (uses default 0.15)
      expect(level1!.ballSpeed).toBeUndefined();
      // Level 10 has faster ball speed
      expect(level10!.ballSpeed).toBe(0.20);
    });
  });
});
