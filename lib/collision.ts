import { BrickData } from './types';
import { Velocity, Position } from './physics';
import {
  BALL_RADIUS,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_Y,
  BRICK_WIDTH,
  BRICK_HEIGHT,
} from './constants';

export interface CollisionResult {
  collided: boolean;
  newVelocity: Velocity;
}

export interface BrickCollisionResult extends CollisionResult {
  hitBrickId: string | null;
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
  if (!brick.active) {
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
  for (const brick of bricks) {
    // Skip inactive bricks early
    if (!brick.active) continue;

    const result = checkSingleBrickCollision(ballPos, ballVel, brick);
    if (result.collided) {
      return {
        collided: true,
        newVelocity: result.newVelocity,
        hitBrickId: brick.id,
      };
    }
  }

  return { collided: false, newVelocity: ballVel, hitBrickId: null };
}
