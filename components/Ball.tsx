'use client';

import { useRef, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import {
  BALL_RADIUS,
  BALL_SPEED,
  PADDLE_Y,
  PADDLE_HEIGHT,
  BALL_PADDLE_OFFSET,
  BALL_PADDLE_PUSH,
  COLORS,
} from '@/lib/constants';
import { checkWallCollision, getInitialVelocity, Velocity, Position } from '@/lib/physics';
import { checkPaddleCollision, checkBrickCollisions } from '@/lib/collision';
import { BrickData, GameStatus } from '@/lib/types';

export interface BallRef {
  reset: (currentPaddleX?: number) => void;
  launch: () => void;
  getPosition: () => Position;
  getVelocity: () => Velocity;
  setVelocity: (v: Velocity) => void;
}

interface BallProps {
  paddleX: number;
  gameStatus: GameStatus;
  bricks: BrickData[];
  onBallLost: () => void;
  onBrickHit: (brickId: string, points: number) => void;
}

const Ball = forwardRef<BallRef, BallProps>(
  ({ paddleX, gameStatus, bricks, onBallLost, onBrickHit }, ref) => {
    const meshRef = useRef<Mesh>(null);
    const velocity = useRef<Velocity>({ x: 0, y: 0 });
    const isLaunched = useRef(false);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      reset: (currentPaddleX?: number) => {
        isLaunched.current = false;
        velocity.current = { x: 0, y: 0 };
        if (meshRef.current) {
          const resetX = currentPaddleX ?? paddleX;
          meshRef.current.position.x = resetX;
          meshRef.current.position.y = PADDLE_Y + PADDLE_HEIGHT / 2 + BALL_RADIUS + BALL_PADDLE_OFFSET;
        }
      },
      launch: () => {
        if (!isLaunched.current) {
          isLaunched.current = true;
          velocity.current = getInitialVelocity(BALL_SPEED);
        }
      },
      getPosition: () => ({
        x: meshRef.current?.position.x ?? 0,
        y: meshRef.current?.position.y ?? 0,
      }),
      getVelocity: () => velocity.current,
      setVelocity: (v: Velocity) => {
        velocity.current = v;
      },
    }));

    useFrame(() => {
      if (!meshRef.current) return;

      // Reset isLaunched when returning to ready state
      if (gameStatus === 'ready' && isLaunched.current) {
        isLaunched.current = false;
        velocity.current = { x: 0, y: 0 };
      }

      // If not launched, stick to paddle
      if (!isLaunched.current) {
        meshRef.current.position.x = paddleX;
        meshRef.current.position.y = PADDLE_Y + PADDLE_HEIGHT / 2 + BALL_RADIUS + BALL_PADDLE_OFFSET;
        return;
      }

      // Don't move if paused or game over
      if (gameStatus === 'paused' || gameStatus === 'gameOver' || gameStatus === 'won') {
        return;
      }

      // Update position
      meshRef.current.position.x += velocity.current.x;
      meshRef.current.position.y += velocity.current.y;

      const position: Position = {
        x: meshRef.current.position.x,
        y: meshRef.current.position.y,
      };

      // Check wall collisions
      const wallResult = checkWallCollision(position, velocity.current);
      velocity.current = wallResult.velocity;

      if (wallResult.hitBottom) {
        onBallLost();
        isLaunched.current = false;
        return;
      }

      // Check paddle collision
      const paddleResult = checkPaddleCollision(position, velocity.current, paddleX);
      if (paddleResult.collided) {
        velocity.current = paddleResult.newVelocity;
        // Push ball above paddle to prevent multiple collisions
        meshRef.current.position.y = PADDLE_Y + PADDLE_HEIGHT / 2 + BALL_RADIUS + BALL_PADDLE_PUSH;
      }

      // Check brick collisions
      const brickResult = checkBrickCollisions(position, velocity.current, bricks);
      if (brickResult.collided && brickResult.hitBrickId) {
        velocity.current = brickResult.newVelocity;
        const hitBrick = bricks.find(b => b.id === brickResult.hitBrickId);
        if (hitBrick) {
          onBrickHit(hitBrick.id, hitBrick.points);
        }
      }
    });

    return (
      <mesh
        ref={meshRef}
        position={[paddleX, PADDLE_Y + PADDLE_HEIGHT / 2 + BALL_RADIUS + BALL_PADDLE_OFFSET, 0]}
      >
        <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color={COLORS.ball}
          emissive={COLORS.ball}
          emissiveIntensity={0.5}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
    );
  }
);

Ball.displayName = 'Ball';

export default Ball;
