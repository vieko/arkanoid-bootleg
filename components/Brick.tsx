'use client';

import { BRICK_WIDTH, BRICK_HEIGHT, BRICK_DEPTH } from '@/lib/constants';
import { BrickData } from '@/lib/types';

interface BrickProps {
  brick: BrickData;
}

export default function Brick({ brick }: BrickProps) {
  if (!brick.active) return null;

  return (
    <mesh position={brick.position}>
      <boxGeometry args={[BRICK_WIDTH, BRICK_HEIGHT, BRICK_DEPTH]} />
      <meshStandardMaterial
        color={brick.color}
        emissive={brick.color}
        emissiveIntensity={0.2}
        metalness={0.5}
        roughness={0.3}
      />
    </mesh>
  );
}
