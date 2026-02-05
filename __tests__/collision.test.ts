import { describe, it, expect } from 'vitest';
import {
  checkBrickCollisions,
  checkPaddleCollision,
  checkAllCollisions,
  checkPaddleCollisionMut,
  checkSingleBrickCollisionMut,
  checkBrickCollisionsMut,
  checkAllCollisionsMut,
} from '../lib/collision';
import {
  BRICK_WIDTH,
  BRICK_HEIGHT,
  BALL_RADIUS,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_Y,
  GAME_WIDTH,
  GAME_HEIGHT,
  BALL_PADDLE_PUSH,
} from '../lib/constants';
import { BrickData } from '../lib/types';

// Helper to create a test brick
function createBrick(
  id: string,
  x: number,
  y: number,
  active: boolean = true
): BrickData {
  return {
    id,
    position: [x, y, 0],
    color: '#ff0055',
    active,
    points: 100,
  };
}

describe('checkBrickCollisions', () => {
  describe('single brick collision', () => {
    it('returns the brick ID in hitBrickIds when ball hits a single brick', () => {
      const brick = createBrick('brick-1', 0, 0);
      const bricks = [brick];

      // Position ball inside the brick (center of brick)
      const ballPos = { x: 0, y: 0 };
      const ballVel = { x: 1, y: 1 };

      const result = checkBrickCollisions(ballPos, ballVel, bricks);

      expect(result.collided).toBe(true);
      expect(result.hitBrickIds).toContain('brick-1');
      expect(result.hitBrickIds).toHaveLength(1);
    });

    it('reflects velocity when hitting brick from below', () => {
      const brick = createBrick('brick-1', 0, 0);
      const bricks = [brick];

      // Position ball just inside bottom edge of brick
      const ballPos = { x: 0, y: -BRICK_HEIGHT / 2 + BALL_RADIUS * 0.5 };
      const ballVel = { x: 0, y: 1 }; // Moving upward

      const result = checkBrickCollisions(ballPos, ballVel, bricks);

      expect(result.collided).toBe(true);
      expect(result.newVelocity.y).toBe(-1); // Y should be reflected
    });
  });

  describe('two adjacent bricks at corner', () => {
    it('returns both brick IDs when ball hits corner of two adjacent bricks', () => {
      // Place two bricks side by side horizontally
      const brick1 = createBrick('brick-1', -BRICK_WIDTH / 2, 0);
      const brick2 = createBrick('brick-2', BRICK_WIDTH / 2, 0);
      const bricks = [brick1, brick2];

      // Position ball at the corner where both bricks meet (x=0)
      // Ball overlaps both bricks
      const ballPos = { x: 0, y: 0 };
      const ballVel = { x: 1, y: -1 };

      const result = checkBrickCollisions(ballPos, ballVel, bricks);

      expect(result.collided).toBe(true);
      expect(result.hitBrickIds).toContain('brick-1');
      expect(result.hitBrickIds).toContain('brick-2');
      expect(result.hitBrickIds).toHaveLength(2);
    });

    it('returns both brick IDs when ball hits corner of two vertically stacked bricks', () => {
      // Place two bricks stacked vertically
      const brick1 = createBrick('brick-top', 0, BRICK_HEIGHT / 2);
      const brick2 = createBrick('brick-bottom', 0, -BRICK_HEIGHT / 2);
      const bricks = [brick1, brick2];

      // Position ball at the seam between both bricks (y=0)
      const ballPos = { x: 0, y: 0 };
      const ballVel = { x: 1, y: 1 };

      const result = checkBrickCollisions(ballPos, ballVel, bricks);

      expect(result.collided).toBe(true);
      expect(result.hitBrickIds).toContain('brick-top');
      expect(result.hitBrickIds).toContain('brick-bottom');
      expect(result.hitBrickIds).toHaveLength(2);
    });
  });

  describe('correct diagonal reflection', () => {
    it('applies both X and Y reflections when hitting corner of two bricks', () => {
      // Position bricks diagonally - one requires X reflection, one requires Y reflection
      // Brick 1: to the right of ball (ball hits left side -> X reflection)
      // Brick 2: above the ball (ball hits bottom side -> Y reflection)
      const brick1 = createBrick('brick-right', BRICK_WIDTH / 2 + BALL_RADIUS * 0.3, 0);
      const brick2 = createBrick('brick-top', 0, BRICK_HEIGHT / 2 + BALL_RADIUS * 0.3);
      const bricks = [brick1, brick2];

      // Position ball at corner where it touches both bricks
      const ballPos = { x: BALL_RADIUS * 0.5, y: BALL_RADIUS * 0.5 };
      const ballVel = { x: 1, y: 1 }; // Moving toward both bricks

      const result = checkBrickCollisions(ballPos, ballVel, bricks);

      expect(result.collided).toBe(true);
      // Both reflections should be applied
      expect(result.newVelocity.x).toBe(-1); // X reflected
      expect(result.newVelocity.y).toBe(-1); // Y reflected
    });

    it('applies only X reflection when both bricks require X reflection', () => {
      // Two bricks stacked vertically on the right side of the ball
      // Ball will hit the left edge of both bricks simultaneously
      const brick1 = createBrick('brick-1', BRICK_WIDTH / 2 + BALL_RADIUS * 0.5, BRICK_HEIGHT / 2);
      const brick2 = createBrick('brick-2', BRICK_WIDTH / 2 + BALL_RADIUS * 0.5, -BRICK_HEIGHT / 2);
      const bricks = [brick1, brick2];

      // Ball positioned to clearly hit left edges of both bricks (horizontal collision)
      // Ball center at x=0 with radius overlapping into the brick from the left
      const ballPos = { x: 0, y: 0 };
      const ballVel = { x: 1, y: 0 };

      const result = checkBrickCollisions(ballPos, ballVel, bricks);

      expect(result.collided).toBe(true);
      expect(result.hitBrickIds).toHaveLength(2);
      expect(result.newVelocity.x).toBe(-1); // X reflected
      expect(result.newVelocity.y).toBe(0); // Y unchanged
    });
  });

  describe('three-brick corner case', () => {
    it('returns all three brick IDs when ball hits corner of three bricks', () => {
      // Create a 2x2 grid of bricks, position ball at center to hit 3 of them
      const brickTopLeft = createBrick('brick-tl', -BRICK_WIDTH / 2, BRICK_HEIGHT / 2);
      const brickTopRight = createBrick('brick-tr', BRICK_WIDTH / 2, BRICK_HEIGHT / 2);
      const brickBottomLeft = createBrick('brick-bl', -BRICK_WIDTH / 2, -BRICK_HEIGHT / 2);
      const bricks = [brickTopLeft, brickTopRight, brickBottomLeft];

      // Position ball at the corner where all three bricks meet
      const ballPos = { x: 0, y: 0 };
      const ballVel = { x: -1, y: -1 };

      const result = checkBrickCollisions(ballPos, ballVel, bricks);

      expect(result.collided).toBe(true);
      expect(result.hitBrickIds).toContain('brick-tl');
      expect(result.hitBrickIds).toContain('brick-tr');
      expect(result.hitBrickIds).toContain('brick-bl');
      expect(result.hitBrickIds).toHaveLength(3);
    });

    it('applies correct reflections when hitting three bricks at corner', () => {
      // Three bricks: one to the right (causes X reflection),
      // one above (causes Y reflection), one at corner
      // Position bricks so ball clearly hits from specific sides
      const brickRight = createBrick('brick-right', BRICK_WIDTH / 2 + BALL_RADIUS * 0.3, 0);
      const brickTop = createBrick('brick-top', 0, BRICK_HEIGHT / 2 + BALL_RADIUS * 0.3);
      const brickCorner = createBrick('brick-corner', BRICK_WIDTH / 2 + BALL_RADIUS * 0.3, BRICK_HEIGHT / 2 + BALL_RADIUS * 0.3);
      const bricks = [brickRight, brickTop, brickCorner];

      // Ball positioned to hit all three bricks
      const ballPos = { x: BALL_RADIUS * 0.4, y: BALL_RADIUS * 0.4 };
      const ballVel = { x: 1, y: 1 };

      const result = checkBrickCollisions(ballPos, ballVel, bricks);

      expect(result.collided).toBe(true);
      expect(result.hitBrickIds.length).toBeGreaterThanOrEqual(2);
      // Combined reflections from multiple bricks hitting different sides
      // At least one reflection should occur
      const xReflected = result.newVelocity.x === -1;
      const yReflected = result.newVelocity.y === -1;
      expect(xReflected || yReflected).toBe(true);
    });
  });

  describe('no collision', () => {
    it('returns empty hitBrickIds and unchanged velocity when ball does not hit any bricks', () => {
      const brick = createBrick('brick-1', 5, 5); // Far from ball
      const bricks = [brick];

      const ballPos = { x: 0, y: 0 }; // Ball at origin, far from brick
      const ballVel = { x: 1, y: 1 };

      const result = checkBrickCollisions(ballPos, ballVel, bricks);

      expect(result.collided).toBe(false);
      expect(result.hitBrickIds).toHaveLength(0);
      expect(result.newVelocity.x).toBe(1);
      expect(result.newVelocity.y).toBe(1);
    });

    it('returns no collision when bricks array is empty', () => {
      const bricks: BrickData[] = [];

      const ballPos = { x: 0, y: 0 };
      const ballVel = { x: 1, y: 1 };

      const result = checkBrickCollisions(ballPos, ballVel, bricks);

      expect(result.collided).toBe(false);
      expect(result.hitBrickIds).toHaveLength(0);
      expect(result.newVelocity.x).toBe(1);
      expect(result.newVelocity.y).toBe(1);
    });

    it('returns no collision when ball is just outside brick boundary', () => {
      const brick = createBrick('brick-1', 0, 0);
      const bricks = [brick];

      // Position ball just outside the brick (beyond BALL_RADIUS distance)
      const ballPos = { x: BRICK_WIDTH / 2 + BALL_RADIUS + 0.1, y: 0 };
      const ballVel = { x: -1, y: 0 };

      const result = checkBrickCollisions(ballPos, ballVel, bricks);

      expect(result.collided).toBe(false);
      expect(result.hitBrickIds).toHaveLength(0);
    });
  });

  describe('inactive bricks ignored', () => {
    it('does not include inactive bricks in collision detection', () => {
      const activeBrick = createBrick('brick-active', 0, 0, true);
      const inactiveBrick = createBrick('brick-inactive', 0, 0, false);
      const bricks = [activeBrick, inactiveBrick];

      const ballPos = { x: 0, y: 0 };
      const ballVel = { x: 1, y: 1 };

      const result = checkBrickCollisions(ballPos, ballVel, bricks);

      expect(result.collided).toBe(true);
      expect(result.hitBrickIds).toContain('brick-active');
      expect(result.hitBrickIds).not.toContain('brick-inactive');
      expect(result.hitBrickIds).toHaveLength(1);
    });

    it('returns no collision when all bricks are inactive', () => {
      const brick1 = createBrick('brick-1', 0, 0, false);
      const brick2 = createBrick('brick-2', 0, BRICK_HEIGHT, false);
      const bricks = [brick1, brick2];

      // Ball positioned to overlap inactive bricks
      const ballPos = { x: 0, y: 0 };
      const ballVel = { x: 1, y: 1 };

      const result = checkBrickCollisions(ballPos, ballVel, bricks);

      expect(result.collided).toBe(false);
      expect(result.hitBrickIds).toHaveLength(0);
      expect(result.newVelocity.x).toBe(1);
      expect(result.newVelocity.y).toBe(1);
    });

    it('only detects collision with active brick when mixed with inactive bricks', () => {
      // Create multiple bricks, some active and some inactive
      const brick1 = createBrick('brick-1', -BRICK_WIDTH, 0, false); // inactive
      const brick2 = createBrick('brick-2', 0, 0, true); // active - will be hit
      const brick3 = createBrick('brick-3', BRICK_WIDTH, 0, false); // inactive
      const bricks = [brick1, brick2, brick3];

      const ballPos = { x: 0, y: 0 };
      const ballVel = { x: 1, y: 1 };

      const result = checkBrickCollisions(ballPos, ballVel, bricks);

      expect(result.collided).toBe(true);
      expect(result.hitBrickIds).toEqual(['brick-2']);
    });
  });
});

describe('checkPaddleCollision', () => {
  // Paddle is centered at paddleX, with PADDLE_Y as the vertical center
  const paddleTop = PADDLE_Y + PADDLE_HEIGHT / 2;

  describe('collision when ball hits paddle center', () => {
    it('bounces straight up when ball hits paddle center', () => {
      const paddleX = 0;
      // Position ball just touching the paddle top at center
      const ballPos = { x: 0, y: paddleTop + BALL_RADIUS * 0.5 };
      const ballVel = { x: 0, y: -1 }; // Moving downward

      const result = checkPaddleCollision(ballPos, ballVel, paddleX);

      expect(result.collided).toBe(true);
      // Center hit should result in mostly vertical bounce
      expect(result.newVelocity.x).toBeCloseTo(0, 5);
      expect(result.newVelocity.y).toBeGreaterThan(0); // Bounces up
    });

    it('maintains ball speed after collision', () => {
      const paddleX = 0;
      const ballPos = { x: 0, y: paddleTop + BALL_RADIUS * 0.5 };
      const speed = 2;
      const ballVel = { x: 0, y: -speed }; // Moving downward

      const result = checkPaddleCollision(ballPos, ballVel, paddleX);

      expect(result.collided).toBe(true);
      const resultSpeed = Math.sqrt(
        result.newVelocity.x * result.newVelocity.x +
        result.newVelocity.y * result.newVelocity.y
      );
      expect(resultSpeed).toBeCloseTo(speed, 5);
    });
  });

  describe('collision when ball hits paddle left edge', () => {
    it('bounces at angle to the left when hitting left edge', () => {
      const paddleX = 0;
      const paddleLeft = paddleX - PADDLE_WIDTH / 2;
      // Position ball at left edge of paddle
      const ballPos = { x: paddleLeft + BALL_RADIUS * 0.5, y: paddleTop + BALL_RADIUS * 0.5 };
      const ballVel = { x: 0.5, y: -1 }; // Moving slightly right and down

      const result = checkPaddleCollision(ballPos, ballVel, paddleX);

      expect(result.collided).toBe(true);
      // Left edge hit should angle the ball to the left (negative x)
      expect(result.newVelocity.x).toBeLessThan(0);
      expect(result.newVelocity.y).toBeGreaterThan(0); // Bounces up
    });
  });

  describe('collision when ball hits paddle right edge', () => {
    it('bounces at angle to the right when hitting right edge', () => {
      const paddleX = 0;
      const paddleRight = paddleX + PADDLE_WIDTH / 2;
      // Position ball at right edge of paddle
      const ballPos = { x: paddleRight - BALL_RADIUS * 0.5, y: paddleTop + BALL_RADIUS * 0.5 };
      const ballVel = { x: -0.5, y: -1 }; // Moving slightly left and down

      const result = checkPaddleCollision(ballPos, ballVel, paddleX);

      expect(result.collided).toBe(true);
      // Right edge hit should angle the ball to the right (positive x)
      expect(result.newVelocity.x).toBeGreaterThan(0);
      expect(result.newVelocity.y).toBeGreaterThan(0); // Bounces up
    });
  });

  describe('no collision when ball is above paddle', () => {
    it('returns no collision when ball is far above paddle', () => {
      const paddleX = 0;
      // Position ball well above paddle
      const ballPos = { x: 0, y: paddleTop + BALL_RADIUS + 1 };
      const ballVel = { x: 0, y: -1 }; // Moving down

      const result = checkPaddleCollision(ballPos, ballVel, paddleX);

      expect(result.collided).toBe(false);
      expect(result.newVelocity).toEqual(ballVel);
    });
  });

  describe('no collision when ball is beside paddle', () => {
    it('returns no collision when ball is to the left of paddle', () => {
      const paddleX = 0;
      const paddleLeft = paddleX - PADDLE_WIDTH / 2;
      // Position ball to the left of paddle
      const ballPos = { x: paddleLeft - BALL_RADIUS - 0.1, y: paddleTop };
      const ballVel = { x: 0, y: -1 };

      const result = checkPaddleCollision(ballPos, ballVel, paddleX);

      expect(result.collided).toBe(false);
      expect(result.newVelocity).toEqual(ballVel);
    });

    it('returns no collision when ball is to the right of paddle', () => {
      const paddleX = 0;
      const paddleRight = paddleX + PADDLE_WIDTH / 2;
      // Position ball to the right of paddle
      const ballPos = { x: paddleRight + BALL_RADIUS + 0.1, y: paddleTop };
      const ballVel = { x: 0, y: -1 };

      const result = checkPaddleCollision(ballPos, ballVel, paddleX);

      expect(result.collided).toBe(false);
      expect(result.newVelocity).toEqual(ballVel);
    });
  });

  describe('no collision when ball is moving upward', () => {
    it('returns no collision when ball has positive y velocity', () => {
      const paddleX = 0;
      // Position ball overlapping paddle but moving up
      const ballPos = { x: 0, y: paddleTop };
      const ballVel = { x: 0, y: 1 }; // Moving upward (positive y)

      const result = checkPaddleCollision(ballPos, ballVel, paddleX);

      expect(result.collided).toBe(false);
      expect(result.newVelocity).toEqual(ballVel);
    });

    it('returns no collision when ball has zero y velocity', () => {
      const paddleX = 0;
      const ballPos = { x: 0, y: paddleTop };
      const ballVel = { x: 1, y: 0 }; // Moving horizontally (y = 0)

      const result = checkPaddleCollision(ballPos, ballVel, paddleX);

      expect(result.collided).toBe(false);
      expect(result.newVelocity).toEqual(ballVel);
    });
  });

  describe('edge cases', () => {
    it('detects collision with offset paddle position', () => {
      const paddleX = 3; // Paddle offset to the right
      const ballPos = { x: 3, y: paddleTop + BALL_RADIUS * 0.5 };
      const ballVel = { x: 0, y: -1 };

      const result = checkPaddleCollision(ballPos, ballVel, paddleX);

      expect(result.collided).toBe(true);
      expect(result.newVelocity.y).toBeGreaterThan(0);
    });

    it('detects collision with negative paddle position', () => {
      const paddleX = -3; // Paddle offset to the left
      const ballPos = { x: -3, y: paddleTop + BALL_RADIUS * 0.5 };
      const ballVel = { x: 0, y: -1 };

      const result = checkPaddleCollision(ballPos, ballVel, paddleX);

      expect(result.collided).toBe(true);
      expect(result.newVelocity.y).toBeGreaterThan(0);
    });
  });
});

describe('checkAllCollisions', () => {
  const paddleTop = PADDLE_Y + PADDLE_HEIGHT / 2;

  describe('wall collision detection', () => {
    it('detects left wall collision', () => {
      const position = { x: -GAME_WIDTH / 2 + BALL_RADIUS - 0.1, y: 0 };
      const velocity = { x: -1, y: 0 };
      const paddleX = 0;
      const bricks: BrickData[] = [];

      const result = checkAllCollisions(position, velocity, paddleX, bricks);

      expect(result.hitWall).toBe(true);
      expect(result.newVelocity.x).toBeGreaterThan(0); // Reflected
    });

    it('detects right wall collision', () => {
      const position = { x: GAME_WIDTH / 2 - BALL_RADIUS + 0.1, y: 0 };
      const velocity = { x: 1, y: 0 };
      const paddleX = 0;
      const bricks: BrickData[] = [];

      const result = checkAllCollisions(position, velocity, paddleX, bricks);

      expect(result.hitWall).toBe(true);
      expect(result.newVelocity.x).toBeLessThan(0); // Reflected
    });

    it('detects top wall collision', () => {
      const position = { x: 0, y: GAME_HEIGHT / 2 - BALL_RADIUS + 0.1 };
      const velocity = { x: 0, y: 1 };
      const paddleX = 0;
      const bricks: BrickData[] = [];

      const result = checkAllCollisions(position, velocity, paddleX, bricks);

      expect(result.hitWall).toBe(true);
      expect(result.newVelocity.y).toBeLessThan(0); // Reflected
    });
  });

  describe('paddle collision and position correction', () => {
    it('detects paddle collision and returns corrected position', () => {
      const paddleX = 0;
      const position = { x: 0, y: paddleTop + BALL_RADIUS * 0.5 };
      const velocity = { x: 0, y: -1 };
      const bricks: BrickData[] = [];

      const result = checkAllCollisions(position, velocity, paddleX, bricks);

      expect(result.hitPaddle).toBe(true);
      expect(result.newPosition).toBeDefined();
      expect(result.newPosition!.y).toBe(paddleTop + BALL_RADIUS + BALL_PADDLE_PUSH);
    });

    it('preserves x position during paddle collision correction', () => {
      const paddleX = 0;
      const position = { x: 0.5, y: paddleTop + BALL_RADIUS * 0.5 };
      const velocity = { x: 0, y: -1 };
      const bricks: BrickData[] = [];

      const result = checkAllCollisions(position, velocity, paddleX, bricks);

      expect(result.hitPaddle).toBe(true);
      expect(result.newPosition!.x).toBe(0.5);
    });
  });

  describe('brick collision and ID collection', () => {
    it('detects brick collision and returns brick IDs', () => {
      const paddleX = 0;
      const position = { x: 0, y: 5 }; // Away from paddle
      const velocity = { x: 0, y: 1 };
      const bricks = [createBrick('brick-1', 0, 5)];

      const result = checkAllCollisions(position, velocity, paddleX, bricks);

      expect(result.hitBrickIds).toContain('brick-1');
      expect(result.hitBrickIds).toHaveLength(1);
    });

    it('collects multiple brick IDs when hitting multiple bricks', () => {
      const paddleX = 0;
      const position = { x: 0, y: 5 };
      const velocity = { x: 1, y: 1 };
      // Two bricks at same position
      const brick1 = createBrick('brick-1', -BRICK_WIDTH / 2, 5);
      const brick2 = createBrick('brick-2', BRICK_WIDTH / 2, 5);
      const bricks = [brick1, brick2];

      const result = checkAllCollisions(position, velocity, paddleX, bricks);

      expect(result.hitBrickIds.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('hitBottom flag propagation', () => {
    it('sets hitBottom true when ball falls below game area', () => {
      const position = { x: 0, y: -GAME_HEIGHT / 2 - BALL_RADIUS - 0.1 };
      const velocity = { x: 0, y: -1 };
      const paddleX = 0;
      const bricks: BrickData[] = [];

      const result = checkAllCollisions(position, velocity, paddleX, bricks);

      expect(result.hitBottom).toBe(true);
    });

    it('sets hitBottom false when ball is above bottom', () => {
      const position = { x: 0, y: 0 };
      const velocity = { x: 0, y: -1 };
      const paddleX = 0;
      const bricks: BrickData[] = [];

      const result = checkAllCollisions(position, velocity, paddleX, bricks);

      expect(result.hitBottom).toBe(false);
    });
  });

  describe('combined collision scenarios', () => {
    it('handles wall collision while moving toward paddle area', () => {
      const paddleX = 0;
      // Position where ball hits left wall
      const position = { x: -GAME_WIDTH / 2 + BALL_RADIUS - 0.1, y: 0 };
      const velocity = { x: -1, y: -1 };
      const bricks: BrickData[] = [];

      const result = checkAllCollisions(position, velocity, paddleX, bricks);

      // Should detect wall collision
      expect(result.hitWall).toBe(true);
      expect(result.newVelocity.x).toBeGreaterThan(0); // X reflected
    });

    it('returns no collisions when ball is in open space', () => {
      const position = { x: 0, y: 0 };
      const velocity = { x: 1, y: 1 };
      const paddleX = 0;
      const bricks: BrickData[] = [];

      const result = checkAllCollisions(position, velocity, paddleX, bricks);

      expect(result.hitWall).toBe(false);
      expect(result.hitPaddle).toBe(false);
      expect(result.hitBottom).toBe(false);
      expect(result.hitBrickIds).toHaveLength(0);
    });
  });
});

describe('checkPaddleCollisionMut', () => {
  const paddleTop = PADDLE_Y + PADDLE_HEIGHT / 2;

  describe('velocity mutation in place', () => {
    it('mutates velocity object when collision occurs', () => {
      const paddleX = 0;
      const position = { x: 0, y: paddleTop + BALL_RADIUS * 0.5 };
      const velocity = { x: 0, y: -1 };

      const hit = checkPaddleCollisionMut(position, velocity, paddleX);

      expect(hit).toBe(true);
      // Velocity should be mutated - y should be positive after bounce
      expect(velocity.y).toBeGreaterThan(0);
    });

    it('does not mutate velocity when no collision', () => {
      const paddleX = 0;
      const position = { x: 0, y: paddleTop + BALL_RADIUS + 1 };
      const originalVel = { x: 0.5, y: -1 };
      const velocity = { ...originalVel };

      const hit = checkPaddleCollisionMut(position, velocity, paddleX);

      expect(hit).toBe(false);
      expect(velocity.x).toBe(originalVel.x);
      expect(velocity.y).toBe(originalVel.y);
    });
  });

  describe('return value correctness', () => {
    it('returns true when collision occurs', () => {
      const paddleX = 0;
      const position = { x: 0, y: paddleTop + BALL_RADIUS * 0.5 };
      const velocity = { x: 0, y: -1 };

      const hit = checkPaddleCollisionMut(position, velocity, paddleX);

      expect(hit).toBe(true);
    });

    it('returns false when ball is moving up', () => {
      const paddleX = 0;
      const position = { x: 0, y: paddleTop };
      const velocity = { x: 0, y: 1 };

      const hit = checkPaddleCollisionMut(position, velocity, paddleX);

      expect(hit).toBe(false);
    });

    it('returns false when ball misses paddle horizontally', () => {
      const paddleX = 0;
      const position = { x: PADDLE_WIDTH, y: paddleTop };
      const velocity = { x: 0, y: -1 };

      const hit = checkPaddleCollisionMut(position, velocity, paddleX);

      expect(hit).toBe(false);
    });
  });

  describe('same collision logic as immutable version', () => {
    it('produces same result as immutable checkPaddleCollision', () => {
      const paddleX = 0;
      const position = { x: 0.5, y: paddleTop + BALL_RADIUS * 0.5 };
      const velocity1 = { x: 0.5, y: -1 };
      const velocity2 = { x: 0.5, y: -1 };

      const immutableResult = checkPaddleCollision(position, velocity1, paddleX);
      checkPaddleCollisionMut(position, velocity2, paddleX);

      expect(velocity2.x).toBeCloseTo(immutableResult.newVelocity.x, 10);
      expect(velocity2.y).toBeCloseTo(immutableResult.newVelocity.y, 10);
    });

    it('applies same angle calculation at paddle edges', () => {
      const paddleX = 0;
      const paddleRight = paddleX + PADDLE_WIDTH / 2;
      const position = { x: paddleRight - BALL_RADIUS * 0.5, y: paddleTop + BALL_RADIUS * 0.5 };
      const velocity1 = { x: -0.5, y: -1 };
      const velocity2 = { x: -0.5, y: -1 };

      const immutableResult = checkPaddleCollision(position, velocity1, paddleX);
      checkPaddleCollisionMut(position, velocity2, paddleX);

      expect(velocity2.x).toBeCloseTo(immutableResult.newVelocity.x, 10);
      expect(velocity2.y).toBeCloseTo(immutableResult.newVelocity.y, 10);
    });
  });
});

describe('checkSingleBrickCollisionMut', () => {
  describe('velocity mutation in place', () => {
    it('mutates velocity when hitting brick horizontally', () => {
      const brick = createBrick('brick-1', BRICK_WIDTH / 2 + BALL_RADIUS * 0.5, 0);
      const position = { x: 0, y: 0 };
      const velocity = { x: 1, y: 0 };

      const result = checkSingleBrickCollisionMut(position, velocity, brick);

      expect(result.hit).toBe(true);
      expect(velocity.x).toBe(-1); // X reflected
      expect(velocity.y).toBe(0); // Y unchanged
    });

    it('mutates velocity when hitting brick vertically', () => {
      const brick = createBrick('brick-1', 0, BRICK_HEIGHT / 2 + BALL_RADIUS * 0.5);
      const position = { x: 0, y: 0 };
      const velocity = { x: 0, y: 1 };

      const result = checkSingleBrickCollisionMut(position, velocity, brick);

      expect(result.hit).toBe(true);
      expect(velocity.x).toBe(0); // X unchanged
      expect(velocity.y).toBe(-1); // Y reflected
    });

    it('does not mutate velocity when no collision', () => {
      const brick = createBrick('brick-1', 10, 10); // Far away
      const position = { x: 0, y: 0 };
      const velocity = { x: 1, y: 1 };

      const result = checkSingleBrickCollisionMut(position, velocity, brick);

      expect(result.hit).toBe(false);
      expect(velocity.x).toBe(1);
      expect(velocity.y).toBe(1);
    });
  });

  describe('return value correctness', () => {
    it('returns correct brickId when hit', () => {
      const brick = createBrick('test-brick-123', 0, 0);
      const position = { x: 0, y: 0 };
      const velocity = { x: 1, y: 1 };

      const result = checkSingleBrickCollisionMut(position, velocity, brick);

      expect(result.hit).toBe(true);
      expect(result.brickId).toBe('test-brick-123');
    });

    it('returns null brickId when no hit', () => {
      const brick = createBrick('brick-1', 10, 10);
      const position = { x: 0, y: 0 };
      const velocity = { x: 1, y: 1 };

      const result = checkSingleBrickCollisionMut(position, velocity, brick);

      expect(result.hit).toBe(false);
      expect(result.brickId).toBeNull();
    });

    it('returns no hit for inactive bricks', () => {
      const brick = createBrick('brick-1', 0, 0, false);
      const position = { x: 0, y: 0 };
      const velocity = { x: 1, y: 1 };

      const result = checkSingleBrickCollisionMut(position, velocity, brick);

      expect(result.hit).toBe(false);
      expect(result.brickId).toBeNull();
    });
  });
});

describe('checkBrickCollisionsMut', () => {
  describe('velocity mutation in place', () => {
    it('mutates velocity when hitting single brick', () => {
      const brick = createBrick('brick-1', 0, 0);
      const bricks = [brick];
      const position = { x: 0, y: -BRICK_HEIGHT / 2 + BALL_RADIUS * 0.5 };
      const velocity = { x: 0, y: 1 };

      const result = checkBrickCollisionsMut(position, velocity, bricks);

      expect(result.hitBrickIds).toContain('brick-1');
      expect(velocity.y).toBe(-1); // Y reflected
    });

    it('applies combined reflections for multiple brick hits', () => {
      // Brick requiring X reflection
      const brick1 = createBrick('brick-1', BRICK_WIDTH / 2 + BALL_RADIUS * 0.3, 0);
      // Brick requiring Y reflection
      const brick2 = createBrick('brick-2', 0, BRICK_HEIGHT / 2 + BALL_RADIUS * 0.3);
      const bricks = [brick1, brick2];
      const position = { x: BALL_RADIUS * 0.5, y: BALL_RADIUS * 0.5 };
      const velocity = { x: 1, y: 1 };

      const result = checkBrickCollisionsMut(position, velocity, bricks);

      expect(result.hitBrickIds.length).toBeGreaterThanOrEqual(2);
      expect(velocity.x).toBe(-1); // X reflected
      expect(velocity.y).toBe(-1); // Y reflected
    });

    it('does not mutate velocity when no bricks hit', () => {
      const brick = createBrick('brick-1', 10, 10);
      const bricks = [brick];
      const position = { x: 0, y: 0 };
      const velocity = { x: 1, y: 1 };

      const result = checkBrickCollisionsMut(position, velocity, bricks);

      expect(result.hitBrickIds).toHaveLength(0);
      expect(velocity.x).toBe(1);
      expect(velocity.y).toBe(1);
    });
  });

  describe('return value correctness', () => {
    it('returns all hit brick IDs', () => {
      const brick1 = createBrick('brick-1', -BRICK_WIDTH / 2, 0);
      const brick2 = createBrick('brick-2', BRICK_WIDTH / 2, 0);
      const bricks = [brick1, brick2];
      const position = { x: 0, y: 0 };
      const velocity = { x: 1, y: 1 };

      const result = checkBrickCollisionsMut(position, velocity, bricks);

      expect(result.hitBrickIds).toContain('brick-1');
      expect(result.hitBrickIds).toContain('brick-2');
    });

    it('excludes inactive bricks from results', () => {
      const activeBrick = createBrick('active', 0, 0, true);
      const inactiveBrick = createBrick('inactive', 0, 0, false);
      const bricks = [activeBrick, inactiveBrick];
      const position = { x: 0, y: 0 };
      const velocity = { x: 1, y: 1 };

      const result = checkBrickCollisionsMut(position, velocity, bricks);

      expect(result.hitBrickIds).toContain('active');
      expect(result.hitBrickIds).not.toContain('inactive');
    });
  });

  describe('same collision logic as immutable version', () => {
    it('produces same hit brick IDs as immutable checkBrickCollisions', () => {
      const brick1 = createBrick('brick-1', -BRICK_WIDTH / 2, 0);
      const brick2 = createBrick('brick-2', BRICK_WIDTH / 2, 0);
      const bricks = [brick1, brick2];
      const position = { x: 0, y: 0 };
      const velocity1 = { x: 1, y: -1 };
      const velocity2 = { x: 1, y: -1 };

      const immutableResult = checkBrickCollisions(position, velocity1, bricks);
      const mutableResult = checkBrickCollisionsMut(position, velocity2, bricks);

      expect(mutableResult.hitBrickIds.sort()).toEqual(immutableResult.hitBrickIds.sort());
    });

    it('produces same velocity changes as immutable version', () => {
      const brick = createBrick('brick-1', 0, 0);
      const bricks = [brick];
      const position = { x: 0, y: -BRICK_HEIGHT / 2 + BALL_RADIUS * 0.5 };
      const velocity1 = { x: 0.5, y: 1 };
      const velocity2 = { x: 0.5, y: 1 };

      const immutableResult = checkBrickCollisions(position, velocity1, bricks);
      checkBrickCollisionsMut(position, velocity2, bricks);

      expect(velocity2.x).toBe(immutableResult.newVelocity.x);
      expect(velocity2.y).toBe(immutableResult.newVelocity.y);
    });
  });
});

describe('checkAllCollisionsMut', () => {
  const paddleTop = PADDLE_Y + PADDLE_HEIGHT / 2;

  describe('velocity mutation in place', () => {
    it('mutates velocity for wall collision', () => {
      const position = { x: -GAME_WIDTH / 2 + BALL_RADIUS - 0.1, y: 0 };
      const velocity = { x: -1, y: 0 };
      const paddleX = 0;
      const bricks: BrickData[] = [];

      const result = checkAllCollisionsMut(position, velocity, paddleX, bricks);

      expect(result.hitWall).toBe(true);
      expect(velocity.x).toBeGreaterThan(0); // Reflected
    });

    it('mutates velocity for paddle collision', () => {
      const paddleX = 0;
      const position = { x: 0, y: paddleTop + BALL_RADIUS * 0.5 };
      const velocity = { x: 0, y: -1 };
      const bricks: BrickData[] = [];

      const result = checkAllCollisionsMut(position, velocity, paddleX, bricks);

      expect(result.hitPaddle).toBe(true);
      expect(velocity.y).toBeGreaterThan(0); // Bounced up
    });

    it('mutates velocity for brick collision', () => {
      const paddleX = 0;
      const brick = createBrick('brick-1', 0, 5);
      const bricks = [brick];
      const position = { x: 0, y: 5 - BRICK_HEIGHT / 2 + BALL_RADIUS * 0.5 };
      const velocity = { x: 0, y: 1 };

      const result = checkAllCollisionsMut(position, velocity, paddleX, bricks);

      expect(result.hitBrickIds).toContain('brick-1');
      expect(velocity.y).toBe(-1); // Reflected
    });
  });

  describe('return value correctness', () => {
    it('returns correct hitBottom flag', () => {
      const position = { x: 0, y: -GAME_HEIGHT / 2 - BALL_RADIUS - 0.1 };
      const velocity = { x: 0, y: -1 };
      const paddleX = 0;
      const bricks: BrickData[] = [];

      const result = checkAllCollisionsMut(position, velocity, paddleX, bricks);

      expect(result.hitBottom).toBe(true);
    });

    it('returns newPosition for paddle collision', () => {
      const paddleX = 0;
      const position = { x: 0.5, y: paddleTop + BALL_RADIUS * 0.5 };
      const velocity = { x: 0, y: -1 };
      const bricks: BrickData[] = [];

      const result = checkAllCollisionsMut(position, velocity, paddleX, bricks);

      expect(result.hitPaddle).toBe(true);
      expect(result.newPosition).toBeDefined();
      expect(result.newPosition!.x).toBe(0.5);
      expect(result.newPosition!.y).toBe(paddleTop + BALL_RADIUS + BALL_PADDLE_PUSH);
    });

    it('returns all hit brick IDs', () => {
      const paddleX = 0;
      const brick1 = createBrick('brick-1', -BRICK_WIDTH / 2, 5);
      const brick2 = createBrick('brick-2', BRICK_WIDTH / 2, 5);
      const bricks = [brick1, brick2];
      const position = { x: 0, y: 5 };
      const velocity = { x: 1, y: 1 };

      const result = checkAllCollisionsMut(position, velocity, paddleX, bricks);

      expect(result.hitBrickIds.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('same collision logic as immutable version', () => {
    it('produces same results as immutable checkAllCollisions for wall collision', () => {
      const position = { x: GAME_WIDTH / 2 - BALL_RADIUS + 0.1, y: 0 };
      const velocity1 = { x: 1, y: 0 };
      const velocity2 = { x: 1, y: 0 };
      const paddleX = 0;
      const bricks: BrickData[] = [];

      const immutableResult = checkAllCollisions(position, velocity1, paddleX, bricks);
      const mutableResult = checkAllCollisionsMut(position, velocity2, paddleX, bricks);

      expect(mutableResult.hitWall).toBe(immutableResult.hitWall);
      expect(velocity2.x).toBe(immutableResult.newVelocity.x);
      expect(velocity2.y).toBe(immutableResult.newVelocity.y);
    });

    it('produces same results as immutable checkAllCollisions for paddle collision', () => {
      const paddleX = 2;
      const position = { x: 2, y: paddleTop + BALL_RADIUS * 0.5 };
      const velocity1 = { x: 0.3, y: -1 };
      const velocity2 = { x: 0.3, y: -1 };
      const bricks: BrickData[] = [];

      const immutableResult = checkAllCollisions(position, velocity1, paddleX, bricks);
      const mutableResult = checkAllCollisionsMut(position, velocity2, paddleX, bricks);

      expect(mutableResult.hitPaddle).toBe(immutableResult.hitPaddle);
      expect(velocity2.x).toBeCloseTo(immutableResult.newVelocity.x, 10);
      expect(velocity2.y).toBeCloseTo(immutableResult.newVelocity.y, 10);
    });

    it('produces same results for brick collision', () => {
      const paddleX = 0;
      const brick = createBrick('brick-1', 0, 5);
      const bricks = [brick];
      const position = { x: 0, y: 5 };
      const velocity1 = { x: 0.5, y: 0.5 };
      const velocity2 = { x: 0.5, y: 0.5 };

      const immutableResult = checkAllCollisions(position, velocity1, paddleX, bricks);
      const mutableResult = checkAllCollisionsMut(position, velocity2, paddleX, bricks);

      expect(mutableResult.hitBrickIds).toEqual(immutableResult.hitBrickIds);
      expect(velocity2.x).toBe(immutableResult.newVelocity.x);
      expect(velocity2.y).toBe(immutableResult.newVelocity.y);
    });
  });

  describe('combined collision scenarios', () => {
    it('handles wall and paddle collision together', () => {
      const paddleX = -GAME_WIDTH / 2 + PADDLE_WIDTH / 2 + 0.5;
      const position = { x: -GAME_WIDTH / 2 + BALL_RADIUS - 0.1, y: paddleTop + BALL_RADIUS * 0.5 };
      const velocity = { x: -1, y: -1 };
      const bricks: BrickData[] = [];

      const result = checkAllCollisionsMut(position, velocity, paddleX, bricks);

      expect(result.hitWall).toBe(true);
      expect(result.hitPaddle).toBe(true);
    });

    it('returns no collisions when ball is in open space', () => {
      const position = { x: 0, y: 0 };
      const velocity = { x: 1, y: 1 };
      const paddleX = 0;
      const bricks: BrickData[] = [];

      const result = checkAllCollisionsMut(position, velocity, paddleX, bricks);

      expect(result.hitWall).toBe(false);
      expect(result.hitPaddle).toBe(false);
      expect(result.hitBottom).toBe(false);
      expect(result.hitBrickIds).toHaveLength(0);
      // Velocity should be unchanged
      expect(velocity.x).toBe(1);
      expect(velocity.y).toBe(1);
    });
  });
});
