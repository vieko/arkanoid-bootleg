'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { GAME_HEIGHT } from '@/lib/constants';

export interface LaserData {
  id: string;
  position: [number, number, number];
  active: boolean;
}

interface LaserProps {
  laser: LaserData;
  onOffScreen: (laserId: string) => void;
  onPositionUpdate?: (laserId: string, x: number, y: number) => boolean; // Returns true if laser should be removed (hit something)
}

const LASER_SPEED = 0.3;

export default function Laser({ laser, onOffScreen, onPositionUpdate }: LaserProps) {
  const meshRef = useRef<Mesh>(null);
  const removedRef = useRef(false);

  useFrame((_, delta) => {
    if (!meshRef.current || removedRef.current) return;

    // Move upward
    meshRef.current.position.y += LASER_SPEED * delta * 60;

    const currentY = meshRef.current.position.y;
    const currentX = meshRef.current.position.x;

    // Check for brick collision via callback
    if (onPositionUpdate) {
      const hitBrick = onPositionUpdate(laser.id, currentX, currentY);
      if (hitBrick) {
        removedRef.current = true;
        return;
      }
    }

    // Check if off screen
    if (currentY > GAME_HEIGHT / 2) {
      removedRef.current = true;
      onOffScreen(laser.id);
    }
  });

  return (
    <mesh ref={meshRef} position={[laser.position[0], laser.position[1], laser.position[2]]}>
      <boxGeometry args={[0.1, 0.5, 0.1]} />
      <meshStandardMaterial
        color="#44ffff"
        emissive="#44ffff"
        emissiveIntensity={0.8}
      />
    </mesh>
  );
}

export function createLaser(x: number, y: number): LaserData {
  return {
    id: `laser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    position: [x, y, 0],
    active: true,
  };
}
