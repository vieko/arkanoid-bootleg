'use client';

import { memo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { BRICK_WIDTH, BRICK_HEIGHT, BRICK_DEPTH } from '@/lib/constants';
import { BrickData } from '@/lib/types';

const DESTROY_ANIMATION_DURATION = 200; // ms

interface BrickProps {
  brick: BrickData;
  onDestroyComplete?: (brickId: string) => void;
}

function Brick({ brick, onDestroyComplete }: BrickProps) {
  const meshRef = useRef<Mesh>(null);
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const animationCompleted = useRef(false);

  // Reset animation state when brick becomes active again (e.g., new level)
  useEffect(() => {
    if (brick.active && !brick.destroyedAt) {
      setScale(1);
      setOpacity(1);
      animationCompleted.current = false;
    }
  }, [brick.active, brick.destroyedAt]);

  useFrame(() => {
    if (brick.destroyedAt && !animationCompleted.current) {
      const elapsed = Date.now() - brick.destroyedAt;
      const progress = Math.min(elapsed / DESTROY_ANIMATION_DURATION, 1);

      // Animate scale from 1 to 0 and opacity from 1 to 0
      const newScale = 1 - progress;
      const newOpacity = 1 - progress;

      setScale(newScale);
      setOpacity(newOpacity);

      // When animation completes, notify parent
      if (progress >= 1 && onDestroyComplete) {
        animationCompleted.current = true;
        onDestroyComplete(brick.id);
      }
    }
  });

  // Don't render if brick is fully destroyed (active: false)
  if (!brick.active) return null;

  return (
    <mesh ref={meshRef} position={brick.position} scale={[scale, scale, scale]}>
      <boxGeometry args={[BRICK_WIDTH, BRICK_HEIGHT, BRICK_DEPTH]} />
      <meshStandardMaterial
        color={brick.color}
        emissive={brick.color}
        emissiveIntensity={0.2}
        metalness={0.5}
        roughness={0.3}
        transparent={true}
        opacity={opacity}
      />
    </mesh>
  );
}

export default memo(Brick, (prev, next) => {
  return (
    prev.brick.id === next.brick.id &&
    prev.brick.active === next.brick.active &&
    prev.brick.destroyedAt === next.brick.destroyedAt &&
    prev.onDestroyComplete === next.onDestroyComplete
  );
});
