'use client';

import { useRef, forwardRef, useImperativeHandle, useMemo, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import {
  BALL_RADIUS,
  BALL_SPEED,
  PADDLE_Y,
  PADDLE_HEIGHT,
  BALL_PADDLE_OFFSET,
  COLORS,
  MIN_BRICK_DIMENSION,
  MAX_SUBSTEPS,
  BRICK_ROWS,
} from '@/lib/constants';
import { gameAudio } from '@/lib/audio';
import { calculateSubsteps, getInitialVelocity, Velocity, Position } from '@/lib/physics';
import { checkAllCollisionsMut } from '@/lib/collision';
import { BrickData, GameStatus, ActiveEffect } from '@/lib/types';

export interface BallRef {
  reset: (currentPaddleX?: number) => void;
  launch: () => void;
  getPosition: () => Position;
  getVelocity: () => Velocity;
  setVelocity: (v: Velocity) => void;
  isStuck: () => boolean;
  launchFromSticky: () => void;
}

interface BallProps {
  paddleX: number;
  paddleVelocityRef?: MutableRefObject<number>;
  gameStatus: GameStatus;
  bricks: BrickData[];
  onBallLost: () => void;
  onBrickHit: (brickId: string, points: number) => void;
  ballSpeed?: number;
  hasSticky?: boolean;
  activeEffects?: ActiveEffect[];
  onMultiBall?: () => void;
  ballId?: string;
  initialPosition?: Position;
  initialVelocity?: Velocity;
}

const Ball = forwardRef<BallRef, BallProps>(
  ({ paddleX, paddleVelocityRef, gameStatus, bricks, onBallLost, onBrickHit, ballSpeed = BALL_SPEED, hasSticky = false, activeEffects = [], onMultiBall, ballId = 'main', initialPosition, initialVelocity }, ref) => {
    const meshRef = useRef<Mesh>(null);
    const velocity = useRef<Velocity>(initialVelocity ?? { x: 0, y: 0 });
    // For split balls with initial velocity, they should start as launched
    const isLaunched = useRef(!!initialVelocity);
    const isStuck = useRef(false);
    const stuckOffset = useRef(0);
    const isMainBall = ballId === 'main';
    // Track previous game status to detect transitions (not continuous checks)
    const prevGameStatus = useRef<GameStatus>(gameStatus);

    // Determine ball color based on active effects
    const ballColor = useMemo(() => {
      if (activeEffects.some(e => e.type === 'slow')) return '#44ff44'; // Green for slow
      if (activeEffects.some(e => e.type === 'fast')) return '#ff8844'; // Orange for fast
      return COLORS.ball; // Default yellow
    }, [activeEffects]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      reset: (currentPaddleX?: number) => {
        isLaunched.current = false;
        isStuck.current = false;
        stuckOffset.current = 0;
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
          const currentPaddleVelocity = paddleVelocityRef?.current ?? 0;
          velocity.current = getInitialVelocity(ballSpeed, currentPaddleVelocity);
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
      isStuck: () => isStuck.current,
      launchFromSticky: () => {
        if (isStuck.current) {
          isStuck.current = false;
          // Launch upward with slight angle based on offset
          const angle = (stuckOffset.current / 2) * 0.5;
          velocity.current = { x: angle, y: Math.abs(velocity.current.y) || ballSpeed };
        }
      },
    }));

    useFrame(() => {
      if (!meshRef.current) return;

      // Reset isLaunched only when TRANSITIONING to ready state (not continuously while in ready)
      // This prevents the race condition where React state update hasn't propagated yet
      const transitionedToReady = gameStatus === 'ready' && prevGameStatus.current !== 'ready';
      prevGameStatus.current = gameStatus;

      if (transitionedToReady && isMainBall) {
        isLaunched.current = false;
        isStuck.current = false;
        velocity.current = { x: 0, y: 0 };
      }

      // If not launched, stick to paddle (only main ball follows paddle)
      if (!isLaunched.current) {
        if (isMainBall) {
          meshRef.current.position.x = paddleX;
          meshRef.current.position.y = PADDLE_Y + PADDLE_HEIGHT / 2 + BALL_RADIUS + BALL_PADDLE_OFFSET;
        }
        return;
      }

      // Don't move if paused, game over, level complete, or won
      if (gameStatus === 'paused' || gameStatus === 'gameOver' || gameStatus === 'won' || gameStatus === 'levelComplete') {
        return;
      }

      // Handle sticky paddle: ball follows paddle while stuck
      if (isStuck.current) {
        meshRef.current.position.x = paddleX + stuckOffset.current;
        meshRef.current.position.y = PADDLE_Y + PADDLE_HEIGHT / 2 + BALL_RADIUS + BALL_PADDLE_OFFSET;
        return; // Don't process normal movement while stuck
      }

      // Use subdivision loop for physics updates to prevent tunneling
      const substeps = calculateSubsteps(ballSpeed, MIN_BRICK_DIMENSION, MAX_SUBSTEPS);
      const stepVelX = velocity.current.x / substeps;
      const stepVelY = velocity.current.y / substeps;

      for (let i = 0; i < substeps; i++) {
        meshRef.current.position.x += stepVelX;
        meshRef.current.position.y += stepVelY;

        const position: Position = {
          x: meshRef.current.position.x,
          y: meshRef.current.position.y,
        };

        const result = checkAllCollisionsMut(position, velocity.current, paddleX, bricks);
        // velocity.current is already mutated in place by checkAllCollisionsMut

        if (result.newPosition) {
          meshRef.current.position.x = result.newPosition.x;
          meshRef.current.position.y = result.newPosition.y;
        }

        // Play collision sounds
        if (result.hitPaddle) {
          gameAudio.playPaddleHit();

          // Handle sticky paddle: ball sticks to paddle on contact
          if (hasSticky && !isStuck.current) {
            isStuck.current = true;
            stuckOffset.current = meshRef.current.position.x - paddleX;
            return;
          }
        }

        if (result.hitWall) {
          gameAudio.playWallBounce();
        }

        if (result.hitBottom) {
          isStuck.current = false;
          isLaunched.current = false;
          onBallLost();
          return;
        }

        if (result.hitBrickIds.length > 0) {
          for (const hitBrickId of result.hitBrickIds) {
            const hitBrick = bricks.find(b => b.id === hitBrickId);
            if (hitBrick) {
              // Extract row from brick ID (format: "row-col")
              const rowIndex = parseInt(hitBrick.id.split('-')[0], 10);
              gameAudio.playBrickBreak(Math.min(rowIndex, BRICK_ROWS - 1));
              onBrickHit(hitBrick.id, hitBrick.points);
            }
          }
        }
      }
    });

    // Calculate initial position
    const defaultY = PADDLE_Y + PADDLE_HEIGHT / 2 + BALL_RADIUS + BALL_PADDLE_OFFSET;
    const startX = initialPosition?.x ?? paddleX;
    const startY = initialPosition?.y ?? defaultY;

    return (
      <mesh
        ref={meshRef}
        position={[startX, startY, 0]}
      >
        <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color={ballColor}
          emissive={ballColor}
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
