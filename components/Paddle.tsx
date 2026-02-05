'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh } from 'three';
import {
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_DEPTH,
  PADDLE_Y,
  PADDLE_SPEED,
  PADDLE_SMOOTHING,
  GAME_WIDTH,
  COLORS,
} from '@/lib/constants';

interface PaddleProps {
  onPositionChange?: (x: number) => void;
}

export default function Paddle({ onPositionChange }: PaddleProps) {
  const meshRef = useRef<Mesh>(null);
  const [keys, setKeys] = useState({ left: false, right: false });
  const { pointer } = useThree();
  const [useMouseControl, setUseMouseControl] = useState(true);
  const useMouseControlRef = useRef(useMouseControl);
  useEffect(() => {
    useMouseControlRef.current = useMouseControl;
  }, [useMouseControl]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setKeys(prev => ({ ...prev, left: true }));
        setUseMouseControl(false);
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setKeys(prev => ({ ...prev, right: true }));
        setUseMouseControl(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        setKeys(prev => ({ ...prev, left: false }));
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        setKeys(prev => ({ ...prev, right: false }));
      }
    };

    const handleMouseMove = () => {
      if (!useMouseControlRef.current) {
        setUseMouseControl(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;

    const halfPaddleWidth = PADDLE_WIDTH / 2;
    const maxX = GAME_WIDTH / 2 - halfPaddleWidth;

    if (useMouseControl) {
      // Mouse control - map pointer to game coordinates
      const targetX = (pointer.x * GAME_WIDTH) / 2;
      // Smoothly interpolate to target position
      meshRef.current.position.x += (targetX - meshRef.current.position.x) * PADDLE_SMOOTHING;
    } else {
      // Keyboard control
      if (keys.left) {
        meshRef.current.position.x -= PADDLE_SPEED;
      }
      if (keys.right) {
        meshRef.current.position.x += PADDLE_SPEED;
      }
    }

    // Clamp position to game boundaries
    meshRef.current.position.x = Math.max(-maxX, Math.min(maxX, meshRef.current.position.x));

    // Notify parent of position change
    if (onPositionChange) {
      onPositionChange(meshRef.current.position.x);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, PADDLE_Y, 0]}>
      <boxGeometry args={[PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_DEPTH]} />
      <meshStandardMaterial
        color={COLORS.paddle}
        emissive={COLORS.paddle}
        emissiveIntensity={0.3}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}
