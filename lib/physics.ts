import { GAME_WIDTH, GAME_HEIGHT, BALL_RADIUS } from './constants';

export interface Velocity {
  x: number;
  y: number;
}

export interface Position {
  x: number;
  y: number;
}

// Reflect velocity off a surface
export function reflect(velocity: Velocity, normalX: number, normalY: number): Velocity {
  const dot = velocity.x * normalX + velocity.y * normalY;
  return {
    x: velocity.x - 2 * dot * normalX,
    y: velocity.y - 2 * dot * normalY,
  };
}

// Check wall collisions and return new velocity
export function checkWallCollision(
  position: Position,
  velocity: Velocity
): { velocity: Velocity; hitBottom: boolean } {
  const newVelocity = { ...velocity };
  let hitBottom = false;

  const minX = -GAME_WIDTH / 2 + BALL_RADIUS;
  const maxX = GAME_WIDTH / 2 - BALL_RADIUS;
  const maxY = GAME_HEIGHT / 2 - BALL_RADIUS;
  const minY = -GAME_HEIGHT / 2 - BALL_RADIUS;

  // Left wall
  if (position.x <= minX && velocity.x < 0) {
    newVelocity.x = Math.abs(velocity.x);
  }

  // Right wall
  if (position.x >= maxX && velocity.x > 0) {
    newVelocity.x = -Math.abs(velocity.x);
  }

  // Top wall
  if (position.y >= maxY && velocity.y > 0) {
    newVelocity.y = -Math.abs(velocity.y);
  }

  // Bottom - ball lost
  if (position.y <= minY) {
    hitBottom = true;
  }

  return { velocity: newVelocity, hitBottom };
}

// Check wall collisions and mutate velocity in place
export function checkWallCollisionMut(
  position: Position,
  velocity: Velocity
): { hitBottom: boolean } {
  let hitBottom = false;

  const minX = -GAME_WIDTH / 2 + BALL_RADIUS;
  const maxX = GAME_WIDTH / 2 - BALL_RADIUS;
  const maxY = GAME_HEIGHT / 2 - BALL_RADIUS;
  const minY = -GAME_HEIGHT / 2 - BALL_RADIUS;

  // Left wall
  if (position.x <= minX && velocity.x < 0) {
    velocity.x = Math.abs(velocity.x);
  }

  // Right wall
  if (position.x >= maxX && velocity.x > 0) {
    velocity.x = -Math.abs(velocity.x);
  }

  // Top wall
  if (position.y >= maxY && velocity.y > 0) {
    velocity.y = -Math.abs(velocity.y);
  }

  // Bottom - ball lost
  if (position.y <= minY) {
    hitBottom = true;
  }

  return { hitBottom };
}

// Normalize velocity to maintain consistent speed
export function normalizeVelocity(velocity: Velocity, speed: number): Velocity {
  const magnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  if (magnitude === 0) return { x: 0, y: speed };
  return {
    x: (velocity.x / magnitude) * speed,
    y: (velocity.y / magnitude) * speed,
  };
}

// Get initial ball velocity (random angle upward with optional paddle velocity influence)
export function getInitialVelocity(speed: number, paddleVelocity: number = 0): Velocity {
  // Base angle should be more vertical: 75-105 degrees (narrower range for better control)
  const baseAngle = (Math.random() * 30 + 75) * (Math.PI / 180);

  // Add paddle influence: moving paddle affects launch angle
  const paddleInfluence = paddleVelocity * 0.5; // Scale factor

  return {
    x: Math.cos(baseAngle) * speed + paddleInfluence,
    y: Math.sin(baseAngle) * speed,
  };
}

/**
 * Calculate the number of physics substeps needed based on ball speed.
 * Higher speeds require more substeps to prevent tunneling through obstacles.
 * @param speed - Current ball speed (magnitude of velocity)
 * @param minObstacleSize - Smallest obstacle dimension the ball could collide with
 * @param maxSubsteps - Maximum allowed substeps to prevent performance issues
 * @returns Number of substeps to use, at least 1 and at most maxSubsteps
 */
export function calculateSubsteps(speed: number, minObstacleSize: number, maxSubsteps: number): number {
  if (speed <= 0 || minObstacleSize <= 0) {
    return 1;
  }
  const required = Math.ceil(speed / minObstacleSize);
  return Math.min(Math.max(required, 1), maxSubsteps);
}
