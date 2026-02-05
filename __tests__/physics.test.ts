import { describe, it, expect } from 'vitest';
import {
  reflect,
  checkWallCollision,
  checkWallCollisionMut,
  normalizeVelocity,
  getInitialVelocity,
  calculateSubsteps,
} from '../lib/physics';
import { GAME_WIDTH, GAME_HEIGHT, BALL_RADIUS, MIN_BRICK_DIMENSION, MAX_SUBSTEPS } from '../lib/constants';

describe('reflect', () => {
  describe('horizontal surface reflection', () => {
    it('reflects velocity off horizontal surface with normal (0, 1)', () => {
      const velocity = { x: 1, y: -1 };
      const result = reflect(velocity, 0, 1);
      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(1);
    });

    it('reflects velocity off horizontal surface with normal (0, -1)', () => {
      const velocity = { x: 1, y: 1 };
      const result = reflect(velocity, 0, -1);
      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(-1);
    });

    it('reflects pure vertical velocity off horizontal surface', () => {
      const velocity = { x: 0, y: -5 };
      const result = reflect(velocity, 0, 1);
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(5);
    });
  });

  describe('vertical surface reflection', () => {
    it('reflects velocity off vertical surface with normal (1, 0)', () => {
      const velocity = { x: -1, y: 1 };
      const result = reflect(velocity, 1, 0);
      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(1);
    });

    it('reflects velocity off vertical surface with normal (-1, 0)', () => {
      const velocity = { x: 1, y: 1 };
      const result = reflect(velocity, -1, 0);
      expect(result.x).toBeCloseTo(-1);
      expect(result.y).toBeCloseTo(1);
    });

    it('reflects pure horizontal velocity off vertical surface', () => {
      const velocity = { x: 5, y: 0 };
      const result = reflect(velocity, -1, 0);
      expect(result.x).toBeCloseTo(-5);
      expect(result.y).toBeCloseTo(0);
    });
  });

  describe('diagonal velocity reflection', () => {
    it('reflects diagonal velocity at 45 degrees off horizontal', () => {
      const velocity = { x: 1, y: -1 };
      const result = reflect(velocity, 0, 1);
      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(1);
    });

    it('reflects diagonal velocity at 45 degrees off vertical', () => {
      const velocity = { x: -1, y: 1 };
      const result = reflect(velocity, 1, 0);
      expect(result.x).toBeCloseTo(1);
      expect(result.y).toBeCloseTo(1);
    });

    it('reflects diagonal velocity off diagonal normal', () => {
      // Normal at 45 degrees (normalized)
      const normalX = Math.SQRT1_2;
      const normalY = Math.SQRT1_2;
      const velocity = { x: 1, y: 0 };
      const result = reflect(velocity, normalX, normalY);
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(-1);
    });
  });

  describe('speed magnitude preservation', () => {
    it('preserves speed magnitude after horizontal reflection', () => {
      const velocity = { x: 3, y: 4 };
      const originalSpeed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      const result = reflect(velocity, 0, 1);
      const newSpeed = Math.sqrt(result.x ** 2 + result.y ** 2);
      expect(newSpeed).toBeCloseTo(originalSpeed);
    });

    it('preserves speed magnitude after vertical reflection', () => {
      const velocity = { x: 3, y: 4 };
      const originalSpeed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      const result = reflect(velocity, 1, 0);
      const newSpeed = Math.sqrt(result.x ** 2 + result.y ** 2);
      expect(newSpeed).toBeCloseTo(originalSpeed);
    });

    it('preserves speed magnitude after diagonal reflection', () => {
      const velocity = { x: 3, y: 4 };
      const originalSpeed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      const normalX = Math.SQRT1_2;
      const normalY = Math.SQRT1_2;
      const result = reflect(velocity, normalX, normalY);
      const newSpeed = Math.sqrt(result.x ** 2 + result.y ** 2);
      expect(newSpeed).toBeCloseTo(originalSpeed);
    });

    it('preserves speed magnitude with arbitrary velocity and normal', () => {
      const velocity = { x: 2.5, y: -3.7 };
      const originalSpeed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      // Normalize the normal vector
      const rawNormal = { x: 0.6, y: 0.8 };
      const normalMag = Math.sqrt(rawNormal.x ** 2 + rawNormal.y ** 2);
      const result = reflect(velocity, rawNormal.x / normalMag, rawNormal.y / normalMag);
      const newSpeed = Math.sqrt(result.x ** 2 + result.y ** 2);
      expect(newSpeed).toBeCloseTo(originalSpeed);
    });
  });
});

describe('checkWallCollision', () => {
  const minX = -GAME_WIDTH / 2 + BALL_RADIUS;
  const maxX = GAME_WIDTH / 2 - BALL_RADIUS;
  const maxY = GAME_HEIGHT / 2 - BALL_RADIUS;
  const minY = -GAME_HEIGHT / 2 - BALL_RADIUS;

  describe('left wall collision', () => {
    it('reflects velocity when hitting left wall', () => {
      const position = { x: minX, y: 0 };
      const velocity = { x: -5, y: 2 };
      const result = checkWallCollision(position, velocity);
      expect(result.velocity.x).toBe(5);
      expect(result.velocity.y).toBe(2);
      expect(result.hitBottom).toBe(false);
    });

    it('does not reflect when moving away from left wall', () => {
      const position = { x: minX, y: 0 };
      const velocity = { x: 5, y: 2 };
      const result = checkWallCollision(position, velocity);
      expect(result.velocity.x).toBe(5);
      expect(result.velocity.y).toBe(2);
    });

    it('reflects when past left wall boundary', () => {
      const position = { x: minX - 1, y: 0 };
      const velocity = { x: -3, y: 1 };
      const result = checkWallCollision(position, velocity);
      expect(result.velocity.x).toBe(3);
    });
  });

  describe('right wall collision', () => {
    it('reflects velocity when hitting right wall', () => {
      const position = { x: maxX, y: 0 };
      const velocity = { x: 5, y: 2 };
      const result = checkWallCollision(position, velocity);
      expect(result.velocity.x).toBe(-5);
      expect(result.velocity.y).toBe(2);
      expect(result.hitBottom).toBe(false);
    });

    it('does not reflect when moving away from right wall', () => {
      const position = { x: maxX, y: 0 };
      const velocity = { x: -5, y: 2 };
      const result = checkWallCollision(position, velocity);
      expect(result.velocity.x).toBe(-5);
      expect(result.velocity.y).toBe(2);
    });

    it('reflects when past right wall boundary', () => {
      const position = { x: maxX + 1, y: 0 };
      const velocity = { x: 3, y: 1 };
      const result = checkWallCollision(position, velocity);
      expect(result.velocity.x).toBe(-3);
    });
  });

  describe('top wall collision', () => {
    it('reflects velocity when hitting top wall', () => {
      const position = { x: 0, y: maxY };
      const velocity = { x: 2, y: 5 };
      const result = checkWallCollision(position, velocity);
      expect(result.velocity.x).toBe(2);
      expect(result.velocity.y).toBe(-5);
      expect(result.hitBottom).toBe(false);
    });

    it('does not reflect when moving away from top wall', () => {
      const position = { x: 0, y: maxY };
      const velocity = { x: 2, y: -5 };
      const result = checkWallCollision(position, velocity);
      expect(result.velocity.x).toBe(2);
      expect(result.velocity.y).toBe(-5);
    });

    it('reflects when past top wall boundary', () => {
      const position = { x: 0, y: maxY + 1 };
      const velocity = { x: 1, y: 3 };
      const result = checkWallCollision(position, velocity);
      expect(result.velocity.y).toBe(-3);
    });
  });

  describe('bottom boundary detection', () => {
    it('sets hitBottom flag when ball reaches bottom', () => {
      const position = { x: 0, y: minY };
      const velocity = { x: 2, y: -5 };
      const result = checkWallCollision(position, velocity);
      expect(result.hitBottom).toBe(true);
    });

    it('sets hitBottom flag when ball is past bottom', () => {
      const position = { x: 0, y: minY - 1 };
      const velocity = { x: 2, y: -5 };
      const result = checkWallCollision(position, velocity);
      expect(result.hitBottom).toBe(true);
    });

    it('does not set hitBottom flag when ball is above bottom', () => {
      const position = { x: 0, y: minY + 1 };
      const velocity = { x: 2, y: -5 };
      const result = checkWallCollision(position, velocity);
      expect(result.hitBottom).toBe(false);
    });
  });

  describe('no collision in play area', () => {
    it('returns unchanged velocity when ball is in center', () => {
      const position = { x: 0, y: 0 };
      const velocity = { x: 3, y: 4 };
      const result = checkWallCollision(position, velocity);
      expect(result.velocity.x).toBe(3);
      expect(result.velocity.y).toBe(4);
      expect(result.hitBottom).toBe(false);
    });

    it('returns unchanged velocity when ball is in play area moving around', () => {
      const position = { x: 2, y: 3 };
      const velocity = { x: -1, y: -2 };
      const result = checkWallCollision(position, velocity);
      expect(result.velocity.x).toBe(-1);
      expect(result.velocity.y).toBe(-2);
      expect(result.hitBottom).toBe(false);
    });
  });

  describe('corner collision handling', () => {
    it('handles top-left corner collision', () => {
      const position = { x: minX, y: maxY };
      const velocity = { x: -3, y: 4 };
      const result = checkWallCollision(position, velocity);
      expect(result.velocity.x).toBe(3);
      expect(result.velocity.y).toBe(-4);
    });

    it('handles top-right corner collision', () => {
      const position = { x: maxX, y: maxY };
      const velocity = { x: 3, y: 4 };
      const result = checkWallCollision(position, velocity);
      expect(result.velocity.x).toBe(-3);
      expect(result.velocity.y).toBe(-4);
    });
  });

  describe('immutability', () => {
    it('does not mutate the original velocity object', () => {
      const position = { x: minX, y: 0 };
      const velocity = { x: -5, y: 2 };
      const originalVelocityX = velocity.x;
      const originalVelocityY = velocity.y;
      checkWallCollision(position, velocity);
      expect(velocity.x).toBe(originalVelocityX);
      expect(velocity.y).toBe(originalVelocityY);
    });
  });
});

describe('checkWallCollisionMut', () => {
  const minX = -GAME_WIDTH / 2 + BALL_RADIUS;
  const maxX = GAME_WIDTH / 2 - BALL_RADIUS;
  const maxY = GAME_HEIGHT / 2 - BALL_RADIUS;
  const minY = -GAME_HEIGHT / 2 - BALL_RADIUS;

  describe('velocity mutation', () => {
    it('mutates velocity in place for left wall collision', () => {
      const position = { x: minX, y: 0 };
      const velocity = { x: -5, y: 2 };
      checkWallCollisionMut(position, velocity);
      expect(velocity.x).toBe(5);
      expect(velocity.y).toBe(2);
    });

    it('mutates velocity in place for right wall collision', () => {
      const position = { x: maxX, y: 0 };
      const velocity = { x: 5, y: 2 };
      checkWallCollisionMut(position, velocity);
      expect(velocity.x).toBe(-5);
      expect(velocity.y).toBe(2);
    });

    it('mutates velocity in place for top wall collision', () => {
      const position = { x: 0, y: maxY };
      const velocity = { x: 2, y: 5 };
      checkWallCollisionMut(position, velocity);
      expect(velocity.x).toBe(2);
      expect(velocity.y).toBe(-5);
    });

    it('mutates both x and y for corner collision', () => {
      const position = { x: maxX, y: maxY };
      const velocity = { x: 3, y: 4 };
      checkWallCollisionMut(position, velocity);
      expect(velocity.x).toBe(-3);
      expect(velocity.y).toBe(-4);
    });
  });

  describe('same collision scenarios as checkWallCollision', () => {
    it('handles left wall collision', () => {
      const position = { x: minX, y: 0 };
      const velocity = { x: -5, y: 2 };
      const result = checkWallCollisionMut(position, velocity);
      expect(velocity.x).toBe(5);
      expect(result.hitBottom).toBe(false);
    });

    it('handles right wall collision', () => {
      const position = { x: maxX, y: 0 };
      const velocity = { x: 5, y: 2 };
      const result = checkWallCollisionMut(position, velocity);
      expect(velocity.x).toBe(-5);
      expect(result.hitBottom).toBe(false);
    });

    it('handles top wall collision', () => {
      const position = { x: 0, y: maxY };
      const velocity = { x: 2, y: 5 };
      const result = checkWallCollisionMut(position, velocity);
      expect(velocity.y).toBe(-5);
      expect(result.hitBottom).toBe(false);
    });

    it('handles bottom boundary detection', () => {
      const position = { x: 0, y: minY };
      const velocity = { x: 2, y: -5 };
      const result = checkWallCollisionMut(position, velocity);
      expect(result.hitBottom).toBe(true);
    });

    it('no collision in play area', () => {
      const position = { x: 0, y: 0 };
      const velocity = { x: 3, y: 4 };
      const originalX = velocity.x;
      const originalY = velocity.y;
      const result = checkWallCollisionMut(position, velocity);
      expect(velocity.x).toBe(originalX);
      expect(velocity.y).toBe(originalY);
      expect(result.hitBottom).toBe(false);
    });
  });

  describe('return value', () => {
    it('only returns hitBottom flag, not velocity', () => {
      const position = { x: minX, y: 0 };
      const velocity = { x: -5, y: 2 };
      const result = checkWallCollisionMut(position, velocity);
      expect(result).toHaveProperty('hitBottom');
      expect(result).not.toHaveProperty('velocity');
    });
  });
});

describe('normalizeVelocity', () => {
  describe('direction preservation', () => {
    it('maintains direction when normalizing rightward velocity', () => {
      const velocity = { x: 3, y: 4 };
      const speed = 10;
      const result = normalizeVelocity(velocity, speed);
      // Direction ratio should be preserved
      const originalRatio = velocity.y / velocity.x;
      const newRatio = result.y / result.x;
      expect(newRatio).toBeCloseTo(originalRatio);
    });

    it('maintains direction when normalizing leftward velocity', () => {
      const velocity = { x: -3, y: 4 };
      const speed = 10;
      const result = normalizeVelocity(velocity, speed);
      // Direction ratio should be preserved
      const originalRatio = velocity.y / velocity.x;
      const newRatio = result.y / result.x;
      expect(newRatio).toBeCloseTo(originalRatio);
    });

    it('maintains direction when normalizing downward velocity', () => {
      const velocity = { x: 3, y: -4 };
      const speed = 10;
      const result = normalizeVelocity(velocity, speed);
      expect(Math.sign(result.x)).toBe(Math.sign(velocity.x));
      expect(Math.sign(result.y)).toBe(Math.sign(velocity.y));
    });

    it('preserves sign of components', () => {
      const velocity = { x: -5, y: -12 };
      const speed = 13;
      const result = normalizeVelocity(velocity, speed);
      expect(result.x).toBeLessThan(0);
      expect(result.y).toBeLessThan(0);
    });
  });

  describe('magnitude normalization', () => {
    it('sets correct magnitude for 3-4-5 triangle velocity', () => {
      const velocity = { x: 3, y: 4 }; // magnitude 5
      const speed = 10;
      const result = normalizeVelocity(velocity, speed);
      const newMagnitude = Math.sqrt(result.x ** 2 + result.y ** 2);
      expect(newMagnitude).toBeCloseTo(10);
    });

    it('sets correct magnitude for arbitrary velocity', () => {
      const velocity = { x: 7, y: 24 }; // magnitude 25
      const speed = 5;
      const result = normalizeVelocity(velocity, speed);
      const newMagnitude = Math.sqrt(result.x ** 2 + result.y ** 2);
      expect(newMagnitude).toBeCloseTo(5);
    });

    it('scales up small velocity to target speed', () => {
      const velocity = { x: 0.1, y: 0.1 };
      const speed = 10;
      const result = normalizeVelocity(velocity, speed);
      const newMagnitude = Math.sqrt(result.x ** 2 + result.y ** 2);
      expect(newMagnitude).toBeCloseTo(10);
    });

    it('scales down large velocity to target speed', () => {
      const velocity = { x: 100, y: 100 };
      const speed = 1;
      const result = normalizeVelocity(velocity, speed);
      const newMagnitude = Math.sqrt(result.x ** 2 + result.y ** 2);
      expect(newMagnitude).toBeCloseTo(1);
    });

    it('correctly normalizes purely horizontal velocity', () => {
      const velocity = { x: 5, y: 0 };
      const speed = 10;
      const result = normalizeVelocity(velocity, speed);
      expect(result.x).toBeCloseTo(10);
      expect(result.y).toBeCloseTo(0);
    });

    it('correctly normalizes purely vertical velocity', () => {
      const velocity = { x: 0, y: 5 };
      const speed = 10;
      const result = normalizeVelocity(velocity, speed);
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(10);
    });
  });

  describe('zero velocity edge case', () => {
    it('returns upward velocity when input is zero', () => {
      const velocity = { x: 0, y: 0 };
      const speed = 5;
      const result = normalizeVelocity(velocity, speed);
      expect(result.x).toBe(0);
      expect(result.y).toBe(5);
    });

    it('handles zero velocity with different speed values', () => {
      const velocity = { x: 0, y: 0 };
      const speed = 15;
      const result = normalizeVelocity(velocity, speed);
      expect(result.x).toBe(0);
      expect(result.y).toBe(15);
    });
  });

  describe('immutability', () => {
    it('does not mutate the original velocity object', () => {
      const velocity = { x: 3, y: 4 };
      const originalX = velocity.x;
      const originalY = velocity.y;
      normalizeVelocity(velocity, 10);
      expect(velocity.x).toBe(originalX);
      expect(velocity.y).toBe(originalY);
    });
  });
});

describe('getInitialVelocity', () => {
  describe('velocity magnitude', () => {
    it('returns velocity with magnitude equal to input speed', () => {
      const speed = 0.15;
      // Run multiple times to account for randomness
      for (let i = 0; i < 10; i++) {
        const result = getInitialVelocity(speed);
        const magnitude = Math.sqrt(result.x ** 2 + result.y ** 2);
        expect(magnitude).toBeCloseTo(speed, 5);
      }
    });

    it('returns velocity with correct magnitude for different speeds', () => {
      const speeds = [0.1, 0.5, 1.0, 5.0];
      for (const speed of speeds) {
        const result = getInitialVelocity(speed);
        const magnitude = Math.sqrt(result.x ** 2 + result.y ** 2);
        expect(magnitude).toBeCloseTo(speed, 5);
      }
    });

    it('handles zero speed', () => {
      const result = getInitialVelocity(0);
      // Use toBeCloseTo to handle -0 vs 0 (JavaScript negative zero)
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(0);
    });
  });

  describe('upward direction', () => {
    it('y component is always positive (upward)', () => {
      // Run multiple times to account for randomness
      for (let i = 0; i < 20; i++) {
        const result = getInitialVelocity(0.15);
        expect(result.y).toBeGreaterThan(0);
      }
    });

    it('y component is positive for various speeds', () => {
      const speeds = [0.1, 0.5, 1.0, 2.0];
      for (const speed of speeds) {
        for (let i = 0; i < 5; i++) {
          const result = getInitialVelocity(speed);
          expect(result.y).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('angle range', () => {
    it('generates angles within expected range (60-120 degrees)', () => {
      // Run multiple times and check angles
      for (let i = 0; i < 50; i++) {
        const speed = 1;
        const result = getInitialVelocity(speed);
        // Calculate the angle from the velocity
        const angle = Math.atan2(result.y, Math.abs(result.x)) * (180 / Math.PI);
        // Angle should be between 60 and 120 degrees (measured from positive x-axis)
        expect(angle).toBeGreaterThanOrEqual(59); // Allow small floating point margin
        expect(angle).toBeLessThanOrEqual(121);
      }
    });
  });

  describe('randomness', () => {
    it('generates both left and right directions over multiple calls', () => {
      let hasLeft = false;
      let hasRight = false;
      // Run many times to statistically ensure both directions
      for (let i = 0; i < 100; i++) {
        const result = getInitialVelocity(1);
        if (result.x < 0) hasLeft = true;
        if (result.x > 0) hasRight = true;
        if (hasLeft && hasRight) break;
      }
      expect(hasLeft).toBe(true);
      expect(hasRight).toBe(true);
    });

    it('generates varied angles over multiple calls', () => {
      const angles = new Set<number>();
      for (let i = 0; i < 50; i++) {
        const result = getInitialVelocity(1);
        // Round to avoid floating point uniqueness issues
        const angle = Math.round(Math.atan2(result.y, Math.abs(result.x)) * 100);
        angles.add(angle);
      }
      // Should have multiple distinct angles
      expect(angles.size).toBeGreaterThan(5);
    });
  });
});

describe('calculateSubsteps', () => {
  describe('basic functionality', () => {
    it('returns 1 for speed 0', () => {
      const result = calculateSubsteps(0, MIN_BRICK_DIMENSION, MAX_SUBSTEPS);
      expect(result).toBe(1);
    });

    it('returns 1 for speed equal to minObstacleSize', () => {
      const minObstacleSize = 10;
      const result = calculateSubsteps(10, minObstacleSize, MAX_SUBSTEPS);
      expect(result).toBe(1);
    });

    it('returns 2 for speed double the minObstacleSize', () => {
      const minObstacleSize = 10;
      const result = calculateSubsteps(20, minObstacleSize, MAX_SUBSTEPS);
      expect(result).toBe(2);
    });

    it('returns 3 for speed triple the minObstacleSize', () => {
      const minObstacleSize = 10;
      const result = calculateSubsteps(30, minObstacleSize, MAX_SUBSTEPS);
      expect(result).toBe(3);
    });

    it('rounds up when speed is not an exact multiple', () => {
      const minObstacleSize = 10;
      // 15 / 10 = 1.5, should round up to 2
      const result = calculateSubsteps(15, minObstacleSize, MAX_SUBSTEPS);
      expect(result).toBe(2);
    });

    it('calculates correctly for speed slightly above minObstacleSize', () => {
      const minObstacleSize = 10;
      // 10.1 / 10 = 1.01, should round up to 2
      const result = calculateSubsteps(10.1, minObstacleSize, MAX_SUBSTEPS);
      expect(result).toBe(2);
    });
  });

  describe('max substeps cap', () => {
    it('caps result at maxSubsteps when speed would require more', () => {
      const minObstacleSize = 10;
      const maxSubsteps = 5;
      // 100 / 10 = 10, but max is 5
      const result = calculateSubsteps(100, minObstacleSize, maxSubsteps);
      expect(result).toBe(5);
    });

    it('caps at MAX_SUBSTEPS constant for very high speeds', () => {
      // Use actual MIN_BRICK_DIMENSION to test realistic scenario
      const veryHighSpeed = MIN_BRICK_DIMENSION * 100;
      const result = calculateSubsteps(veryHighSpeed, MIN_BRICK_DIMENSION, MAX_SUBSTEPS);
      expect(result).toBe(MAX_SUBSTEPS);
    });

    it('returns maxSubsteps exactly at the boundary', () => {
      const minObstacleSize = 10;
      const maxSubsteps = 5;
      // 50 / 10 = 5, exactly at max
      const result = calculateSubsteps(50, minObstacleSize, maxSubsteps);
      expect(result).toBe(5);
    });

    it('returns uncapped value when below maxSubsteps', () => {
      const minObstacleSize = 10;
      const maxSubsteps = 10;
      // 30 / 10 = 3, below max of 10
      const result = calculateSubsteps(30, minObstacleSize, maxSubsteps);
      expect(result).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('returns 1 for negative speed', () => {
      const result = calculateSubsteps(-10, MIN_BRICK_DIMENSION, MAX_SUBSTEPS);
      expect(result).toBe(1);
    });

    it('returns 1 for negative minObstacleSize', () => {
      const result = calculateSubsteps(10, -5, MAX_SUBSTEPS);
      expect(result).toBe(1);
    });

    it('returns 1 for both negative values', () => {
      const result = calculateSubsteps(-10, -5, MAX_SUBSTEPS);
      expect(result).toBe(1);
    });

    it('returns 1 for minObstacleSize of 0', () => {
      const result = calculateSubsteps(10, 0, MAX_SUBSTEPS);
      expect(result).toBe(1);
    });

    it('handles very small positive speed', () => {
      const minObstacleSize = 10;
      // 0.001 / 10 = 0.0001, rounds up to 1
      const result = calculateSubsteps(0.001, minObstacleSize, MAX_SUBSTEPS);
      expect(result).toBe(1);
    });

    it('handles very large speed values', () => {
      const minObstacleSize = 10;
      const maxSubsteps = 10;
      const result = calculateSubsteps(1000000, minObstacleSize, maxSubsteps);
      expect(result).toBe(10); // Should be capped
    });

    it('handles very small minObstacleSize', () => {
      const minObstacleSize = 0.001;
      const maxSubsteps = 100;
      // 10 / 0.001 = 10000, but capped at 100
      const result = calculateSubsteps(10, minObstacleSize, maxSubsteps);
      expect(result).toBe(100);
    });

    it('handles speed equal to minObstacleSize (boundary)', () => {
      const minObstacleSize = 5;
      // 5 / 5 = 1, exactly 1 substep needed
      const result = calculateSubsteps(5, minObstacleSize, MAX_SUBSTEPS);
      expect(result).toBe(1);
    });

    it('handles speed slightly less than minObstacleSize', () => {
      const minObstacleSize = 10;
      // 9.9 / 10 = 0.99, rounds up to 1
      const result = calculateSubsteps(9.9, minObstacleSize, MAX_SUBSTEPS);
      expect(result).toBe(1);
    });
  });

  describe('realistic game scenarios', () => {
    it('uses actual game constants correctly', () => {
      // MIN_BRICK_DIMENSION is 0.6 (min of BRICK_WIDTH=1.8 and BRICK_HEIGHT=0.6)
      // BALL_SPEED is 0.15
      // At normal speed: 0.15 / 0.6 = 0.25, rounds up to 1
      const normalBallSpeed = 0.15;
      const result = calculateSubsteps(normalBallSpeed, MIN_BRICK_DIMENSION, MAX_SUBSTEPS);
      expect(result).toBe(1);
    });

    it('requires more substeps at higher game speeds', () => {
      // If ball speed is increased to 1.2 (8x normal)
      // 1.2 / 0.6 = 2 substeps needed
      const fastBallSpeed = 1.2;
      const result = calculateSubsteps(fastBallSpeed, MIN_BRICK_DIMENSION, MAX_SUBSTEPS);
      expect(result).toBe(2);
    });

    it('caps at MAX_SUBSTEPS for extreme speeds', () => {
      // If ball speed is extremely fast (e.g., 10)
      // 10 / 0.6 = 16.67, but should be capped at MAX_SUBSTEPS (10)
      const extremeSpeed = 10;
      const result = calculateSubsteps(extremeSpeed, MIN_BRICK_DIMENSION, MAX_SUBSTEPS);
      expect(result).toBe(MAX_SUBSTEPS);
    });
  });
});
