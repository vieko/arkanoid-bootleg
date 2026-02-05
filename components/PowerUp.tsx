'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { PowerUp as PowerUpType } from '@/lib/types';
import { POWERUP_COLORS, POWERUP_FALL_SPEED, GAME_HEIGHT } from '@/lib/constants';

interface PowerUpProps {
  powerUp: PowerUpType;
  onCollect: (powerUp: PowerUpType) => void;
  onMiss: (powerUpId: string) => void;
  paddleX: number;
  paddleWidth: number;
}

export default function PowerUp({ powerUp, onCollect, onMiss, paddleX, paddleWidth }: PowerUpProps) {
  const meshRef = useRef<Mesh>(null);
  const collected = useRef(false);

  useFrame((_, delta) => {
    if (!meshRef.current || collected.current) return;

    // Fall down
    meshRef.current.position.y -= POWERUP_FALL_SPEED * delta * 60;

    // Rotate for visibility
    meshRef.current.rotation.z += 0.05;

    // Check paddle collision (simple box collision)
    const pos = meshRef.current.position;
    const paddleY = -4.5; // PADDLE_Y from constants
    const paddleHalfWidth = paddleWidth / 2;
    const powerUpHalfWidth = 0.4;
    const powerUpHalfHeight = 0.2;

    if (
      pos.y - powerUpHalfHeight <= paddleY + 0.15 &&
      pos.y + powerUpHalfHeight >= paddleY - 0.15 &&
      pos.x + powerUpHalfWidth >= paddleX - paddleHalfWidth &&
      pos.x - powerUpHalfWidth <= paddleX + paddleHalfWidth
    ) {
      collected.current = true;
      onCollect(powerUp);
      return;
    }

    // Check if fell off screen
    if (pos.y < -GAME_HEIGHT / 2) {
      onMiss(powerUp.id);
    }
  });

  return (
    <mesh ref={meshRef} position={[powerUp.position[0], powerUp.position[1], powerUp.position[2]]}>
      <boxGeometry args={[0.8, 0.4, 0.4]} />
      <meshStandardMaterial
        color={POWERUP_COLORS[powerUp.type]}
        emissive={POWERUP_COLORS[powerUp.type]}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}
