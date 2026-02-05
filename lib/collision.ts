import { BrickData } from './types';
import { Velocity, Position, checkWallCollision, checkWallCollisionMut } from './physics';
import {
  BALL_RADIUS,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_Y,
  BRICK_WIDTH,
  BRICK_HEIGHT,
  BALL_PADDLE_PUSH,
} from './constants';

export interface CollisionResult {
  collided: boolean;
  newVelocity: Velocity;
}

export interface BrickCollisionResult extends CollisionResult {
  hitBrickIds: string[];
}

export interface SubstepCollisionResult {
  newVelocity: Velocity;
  hitWall: boolean;
  hitBottom: boolean;
  hitPaddle: boolean;
  hitBrickIds: string[];
  newPosition?: Position; // Optional position correction (e.g., push above paddle)
}

// Mutable collision result interfaces (no velocity in return since it's mutated)
export interface SingleBrickCollisionMutResult {
  hit: boolean;
  brickId: string | null;
}

export interface BrickCollisionsMutResult {
  hitBrickIds: string[];
}

export interface AllCollisionsMutResult {
  hitBrickIds: string[];
  hitPaddle: boolean;
  hitWall: boolean;
  hitBottom: boolean;
  newPosition?: Position;
}

// Check collision between ball and paddle
export function checkPaddleCollision(
  ballPos: Position,
  ballVel: Velocity,
  paddleX: number
): CollisionResult {
  const paddleTop = PADDLE_Y + PADDLE_HEIGHT / 2;
  const paddleBottom = PADDLE_Y - PADDLE_HEIGHT / 2;
  const paddleLeft = paddleX - PADDLE_WIDTH / 2;
  const paddleRight = paddleX + PADDLE_WIDTH / 2;

  // Check if ball is in paddle's vertical range and moving downward
  if (
    ballVel.y < 0 &&
    ballPos.y - BALL_RADIUS <= paddleTop &&
    ballPos.y + BALL_RADIUS >= paddleBottom &&
    ballPos.x + BALL_RADIUS >= paddleLeft &&
    ballPos.x - BALL_RADIUS <= paddleRight
  ) {
    // Calculate hit position relative to paddle center (-1 to 1)
    const hitPosition = (ballPos.x - paddleX) / (PADDLE_WIDTH / 2);

    // Calculate new angle based on hit position
    // Center hit = straight up, edge hits = angled
    const maxAngle = Math.PI / 3; // 60 degrees max
    const angle = hitPosition * maxAngle;

    // Calculate speed from current velocity
    const speed = Math.sqrt(ballVel.x * ballVel.x + ballVel.y * ballVel.y);

    // New velocity based on angle
    const newVelocity: Velocity = {
      x: Math.sin(angle) * speed,
      y: Math.abs(Math.cos(angle) * speed), // Always bounce up
    };

    return { collided: true, newVelocity };
  }

  return { collided: false, newVelocity: ballVel };
}

// Check collision between ball and a single brick
function checkSingleBrickCollision(
  ballPos: Position,
  ballVel: Velocity,
  brick: BrickData
): CollisionResult {
  // Skip if brick is not active or is being destroyed (animating)
  if (!brick.active || brick.destroyedAt) {
    return { collided: false, newVelocity: ballVel };
  }

  const [brickX, brickY] = brick.position;
  const brickLeft = brickX - BRICK_WIDTH / 2;
  const brickRight = brickX + BRICK_WIDTH / 2;
  const brickTop = brickY + BRICK_HEIGHT / 2;
  const brickBottom = brickY - BRICK_HEIGHT / 2;

  // Find closest point on brick to ball center
  const closestX = Math.max(brickLeft, Math.min(ballPos.x, brickRight));
  const closestY = Math.max(brickBottom, Math.min(ballPos.y, brickTop));

  // Calculate distance from ball center to closest point
  const distanceX = ballPos.x - closestX;
  const distanceY = ballPos.y - closestY;
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;

  // Check if distance is less than ball radius
  if (distanceSquared < BALL_RADIUS * BALL_RADIUS) {
    const newVelocity = { ...ballVel };

    // Determine which side was hit based on ball position relative to brick
    const overlapLeft = ballPos.x + BALL_RADIUS - brickLeft;
    const overlapRight = brickRight - (ballPos.x - BALL_RADIUS);
    const overlapTop = brickTop - (ballPos.y - BALL_RADIUS);
    const overlapBottom = ballPos.y + BALL_RADIUS - brickBottom;

    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    if (minOverlapX < minOverlapY) {
      // Horizontal collision
      newVelocity.x = -newVelocity.x;
    } else {
      // Vertical collision
      newVelocity.y = -newVelocity.y;
    }

    return { collided: true, newVelocity };
  }

  return { collided: false, newVelocity: ballVel };
}

// Check collision between ball and all bricks
export function checkBrickCollisions(
  ballPos: Position,
  ballVel: Velocity,
  bricks: BrickData[]
): BrickCollisionResult {
  const collisions: Array<{ brick: BrickData; result: CollisionResult }> = [];

  for (const brick of bricks) {
    // Skip if brick is not active or is being destroyed (animating)
    if (!brick.active || brick.destroyedAt) continue;
    const result = checkSingleBrickCollision(ballPos, ballVel, brick);
    if (result.collided) {
      collisions.push({ brick, result });
    }
  }

  if (collisions.length === 0) {
    return { collided: false, newVelocity: ballVel, hitBrickIds: [] };
  }

  // Combine reflections
  let finalVelocity = { ...ballVel };
  let reflectX = false;
  let reflectY = false;

  for (const { result } of collisions) {
    if (result.newVelocity.x !== ballVel.x) reflectX = true;
    if (result.newVelocity.y !== ballVel.y) reflectY = true;
  }

  if (reflectX) finalVelocity.x = -finalVelocity.x;
  if (reflectY) finalVelocity.y = -finalVelocity.y;

  return {
    collided: true,
    newVelocity: finalVelocity,
    hitBrickIds: collisions.map((c) => c.brick.id),
  };
}

// Check all collisions (walls, paddle, bricks) for a single position
// Returns combined result for use in substep collision detection
export function checkAllCollisions(
  position: Position,
  velocity: Velocity,
  paddleX: number,
  bricks: BrickData[]
): SubstepCollisionResult {
  let currentVelocity = { ...velocity };
  let hitWall = false;
  let hitBottom = false;
  let hitPaddle = false;
  let hitBrickIds: string[] = [];
  let newPosition: Position | undefined = undefined;

  // 1. Check wall collisions first
  const wallResult = checkWallCollision(position, currentVelocity);
  if (wallResult.velocity.x !== currentVelocity.x || wallResult.velocity.y !== currentVelocity.y) {
    hitWall = true;
    currentVelocity = wallResult.velocity;
  }
  hitBottom = wallResult.hitBottom;

  // 2. Check paddle collision
  const paddleResult = checkPaddleCollision(position, currentVelocity, paddleX);
  if (paddleResult.collided) {
    hitPaddle = true;
    currentVelocity = paddleResult.newVelocity;
    // Apply paddle push correction - push ball above paddle to prevent re-collision
    const paddleTop = PADDLE_Y + PADDLE_HEIGHT / 2;
    newPosition = {
      x: position.x,
      y: paddleTop + BALL_RADIUS + BALL_PADDLE_PUSH,
    };
  }

  // 3. Check brick collisions
  const brickResult = checkBrickCollisions(position, currentVelocity, bricks);
  if (brickResult.collided) {
    hitBrickIds = brickResult.hitBrickIds;
    currentVelocity = brickResult.newVelocity;
  }

  return {
    newVelocity: currentVelocity,
    hitWall,
    hitBottom,
    hitPaddle,
    hitBrickIds,
    newPosition,
  };
}

// ============================================================================
// MUTABLE COLLISION FUNCTIONS
// These functions mutate velocity in place instead of creating new objects
// ============================================================================

// Check collision between ball and paddle - mutates velocity in place
export function checkPaddleCollisionMut(
  position: Position,
  velocity: Velocity,
  paddleX: number
): boolean {
  const paddleTop = PADDLE_Y + PADDLE_HEIGHT / 2;
  const paddleBottom = PADDLE_Y - PADDLE_HEIGHT / 2;
  const paddleLeft = paddleX - PADDLE_WIDTH / 2;
  const paddleRight = paddleX + PADDLE_WIDTH / 2;

  // Check if ball is in paddle's vertical range and moving downward
  if (
    velocity.y < 0 &&
    position.y - BALL_RADIUS <= paddleTop &&
    position.y + BALL_RADIUS >= paddleBottom &&
    position.x + BALL_RADIUS >= paddleLeft &&
    position.x - BALL_RADIUS <= paddleRight
  ) {
    // Calculate hit position relative to paddle center (-1 to 1)
    const hitPosition = (position.x - paddleX) / (PADDLE_WIDTH / 2);

    // Calculate new angle based on hit position
    // Center hit = straight up, edge hits = angled
    const maxAngle = Math.PI / 3; // 60 degrees max
    const angle = hitPosition * maxAngle;

    // Calculate speed from current velocity
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

    // Mutate velocity in place
    velocity.x = Math.sin(angle) * speed;
    velocity.y = Math.abs(Math.cos(angle) * speed); // Always bounce up

    return true;
  }

  return false;
}

// Check collision between ball and a single brick - mutates velocity in place
export function checkSingleBrickCollisionMut(
  position: Position,
  velocity: Velocity,
  brick: BrickData
): SingleBrickCollisionMutResult {
  // Skip if brick is not active or is being destroyed (animating)
  if (!brick.active || brick.destroyedAt) {
    return { hit: false, brickId: null };
  }

  const [brickX, brickY] = brick.position;
  const brickLeft = brickX - BRICK_WIDTH / 2;
  const brickRight = brickX + BRICK_WIDTH / 2;
  const brickTop = brickY + BRICK_HEIGHT / 2;
  const brickBottom = brickY - BRICK_HEIGHT / 2;

  // Find closest point on brick to ball center
  const closestX = Math.max(brickLeft, Math.min(position.x, brickRight));
  const closestY = Math.max(brickBottom, Math.min(position.y, brickTop));

  // Calculate distance from ball center to closest point
  const distanceX = position.x - closestX;
  const distanceY = position.y - closestY;
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;

  // Check if distance is less than ball radius
  if (distanceSquared < BALL_RADIUS * BALL_RADIUS) {
    // Determine which side was hit based on ball position relative to brick
    const overlapLeft = position.x + BALL_RADIUS - brickLeft;
    const overlapRight = brickRight - (position.x - BALL_RADIUS);
    const overlapTop = brickTop - (position.y - BALL_RADIUS);
    const overlapBottom = position.y + BALL_RADIUS - brickBottom;

    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    if (minOverlapX < minOverlapY) {
      // Horizontal collision - mutate velocity in place
      velocity.x = -velocity.x;
    } else {
      // Vertical collision - mutate velocity in place
      velocity.y = -velocity.y;
    }

    return { hit: true, brickId: brick.id };
  }

  return { hit: false, brickId: null };
}

// Check collision between ball and all bricks - mutates velocity in place
export function checkBrickCollisionsMut(
  position: Position,
  velocity: Velocity,
  bricks: BrickData[]
): BrickCollisionsMutResult {
  const hitBrickIds: string[] = [];
  const originalVelX = velocity.x;
  const originalVelY = velocity.y;
  let reflectX = false;
  let reflectY = false;

  for (const brick of bricks) {
    // Skip if brick is not active or is being destroyed (animating)
    if (!brick.active || brick.destroyedAt) continue;

    const [brickX, brickY] = brick.position;
    const brickLeft = brickX - BRICK_WIDTH / 2;
    const brickRight = brickX + BRICK_WIDTH / 2;
    const brickTop = brickY + BRICK_HEIGHT / 2;
    const brickBottom = brickY - BRICK_HEIGHT / 2;

    const closestX = Math.max(brickLeft, Math.min(position.x, brickRight));
    const closestY = Math.max(brickBottom, Math.min(position.y, brickTop));

    const distanceX = position.x - closestX;
    const distanceY = position.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;

    if (distanceSquared < BALL_RADIUS * BALL_RADIUS) {
      const overlapLeft = position.x + BALL_RADIUS - brickLeft;
      const overlapRight = brickRight - (position.x - BALL_RADIUS);
      const overlapTop = brickTop - (position.y - BALL_RADIUS);
      const overlapBottom = position.y + BALL_RADIUS - brickBottom;

      const minOverlapX = Math.min(overlapLeft, overlapRight);
      const minOverlapY = Math.min(overlapTop, overlapBottom);

      if (minOverlapX < minOverlapY) {
        reflectX = true;
      } else {
        reflectY = true;
      }

      hitBrickIds.push(brick.id);
    }
  }

  // Apply combined reflections by mutating velocity in place
  if (reflectX) velocity.x = -originalVelX;
  if (reflectY) velocity.y = -originalVelY;

  return { hitBrickIds };
}

// Check all collisions (walls, paddle, bricks) - mutates velocity in place
export function checkAllCollisionsMut(
  position: Position,
  velocity: Velocity,
  paddleX: number,
  bricks: BrickData[]
): AllCollisionsMutResult {
  let hitWall = false;
  let hitBottom = false;
  let hitPaddle = false;
  let hitBrickIds: string[] = [];
  let newPosition: Position | undefined = undefined;

  // Store original velocity to detect wall changes
  const originalVelX = velocity.x;
  const originalVelY = velocity.y;

  // 1. Check wall collisions first - mutates velocity in place
  const wallResult = checkWallCollisionMut(position, velocity);
  if (velocity.x !== originalVelX || velocity.y !== originalVelY) {
    hitWall = true;
  }
  hitBottom = wallResult.hitBottom;

  // 2. Check paddle collision - mutates velocity in place
  hitPaddle = checkPaddleCollisionMut(position, velocity, paddleX);
  if (hitPaddle) {
    // Apply paddle push correction - push ball above paddle to prevent re-collision
    const paddleTop = PADDLE_Y + PADDLE_HEIGHT / 2;
    newPosition = {
      x: position.x,
      y: paddleTop + BALL_RADIUS + BALL_PADDLE_PUSH,
    };
  }

  // 3. Check brick collisions - mutates velocity in place
  const brickResult = checkBrickCollisionsMut(position, velocity, bricks);
  hitBrickIds = brickResult.hitBrickIds;

  return {
    hitBrickIds,
    hitPaddle,
    hitWall,
    hitBottom,
    newPosition,
  };
}
