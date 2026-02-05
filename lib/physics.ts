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

// Normalize velocity to maintain consistent speed
export function normalizeVelocity(velocity: Velocity, speed: number): Velocity {
  const magnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  if (magnitude === 0) return { x: 0, y: speed };
  return {
    x: (velocity.x / magnitude) * speed,
    y: (velocity.y / magnitude) * speed,
  };
}

// Get initial ball velocity (random angle upward)
export function getInitialVelocity(speed: number): Velocity {
  const angle = (Math.random() * 60 + 60) * (Math.PI / 180); // 60-120 degrees
  const direction = Math.random() > 0.5 ? 1 : -1;
  return {
    x: Math.cos(angle) * speed * direction,
    y: Math.sin(angle) * speed,
  };
}
