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
  POWERUP_COLORS,
} from '@/lib/constants';
import { ActiveEffect, PowerUpType } from '@/lib/types';

interface PaddleProps {
  onPositionChange?: (x: number) => void;
  onVelocityChange?: (velocity: number) => void;
  width?: number;  // Dynamic width from Game.tsx
  activeEffects?: ActiveEffect[];  // To determine glow color
  joystickDirection?: number;
}

export default function Paddle({ onPositionChange, onVelocityChange, width, activeEffects, joystickDirection = 0 }: PaddleProps) {
  const effectiveWidth = width ?? PADDLE_WIDTH;

  // Determine glow color based on active effects
  const getGlowColor = (): string => {
    if (!activeEffects || activeEffects.length === 0) return '#00ffff'; // default cyan

    // Priority order for visual feedback
    const priorityOrder: PowerUpType[] = ['laser', 'sticky', 'expand', 'shrink'];
    for (const type of priorityOrder) {
      if (activeEffects.some(e => e.type === type)) {
        return POWERUP_COLORS[type];
      }
    }
    return '#00ffff'; // default
  };
  const meshRef = useRef<Mesh>(null);
  const [keys, setKeys] = useState({ left: false, right: false });
  const { pointer } = useThree();
  const [useMouseControl, setUseMouseControl] = useState(true);
  const useMouseControlRef = useRef(useMouseControl);
  useEffect(() => {
    useMouseControlRef.current = useMouseControl;
  }, [useMouseControl]);

  // Touch control state and refs
  const [useTouchControl, setUseTouchControl] = useState(false);
  const touchX = useRef(0);
  const useTouchControlRef = useRef(useTouchControl);
  useEffect(() => {
    useTouchControlRef.current = useTouchControl;
  }, [useTouchControl]);

  // Virtual joystick ref for use in useFrame
  const joystickDirectionRef = useRef(joystickDirection);
  useEffect(() => {
    joystickDirectionRef.current = joystickDirection;
  }, [joystickDirection]);

  // Ref for tracking previous X position to calculate velocity
  const prevXRef = useRef(0);

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
      // Only re-enable mouse control if touch is not active
      if (!useMouseControlRef.current && !useTouchControlRef.current) {
        setUseMouseControl(true);
      }
    };

    // Normalize touch X coordinate from screen space to game space (-1 to 1)
    const normalizeToGameX = (clientX: number): number => {
      return (clientX / window.innerWidth) * 2 - 1;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        touchX.current = normalizeToGameX(e.touches[0].clientX);
        setUseTouchControl(true);
        setUseMouseControl(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        touchX.current = normalizeToGameX(e.touches[0].clientX);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 0) {
        setUseTouchControl(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;

    const halfPaddleWidth = effectiveWidth / 2;
    const maxX = GAME_WIDTH / 2 - halfPaddleWidth;

    // Check if virtual joystick is being used
    const joystickActive = joystickDirectionRef.current !== 0;

    if (joystickActive) {
      // Virtual joystick control - treat like keyboard input
      if (joystickDirectionRef.current < 0) {
        meshRef.current.position.x -= PADDLE_SPEED;
      }
      if (joystickDirectionRef.current > 0) {
        meshRef.current.position.x += PADDLE_SPEED;
      }
    } else if (useTouchControl) {
      // Touch control - prioritized over mouse control
      const targetX = (touchX.current * GAME_WIDTH) / 2;
      // Smoothly interpolate to target position
      meshRef.current.position.x += (targetX - meshRef.current.position.x) * PADDLE_SMOOTHING;
    } else if (useMouseControl) {
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

    // Calculate velocity as current position minus previous position
    const currentX = meshRef.current.position.x;
    const velocity = currentX - prevXRef.current;
    prevXRef.current = currentX;

    // Notify parent of position change
    if (onPositionChange) {
      onPositionChange(currentX);
    }

    // Notify parent of velocity change
    if (onVelocityChange) {
      onVelocityChange(velocity);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, PADDLE_Y, 0]}>
      <boxGeometry args={[effectiveWidth, PADDLE_HEIGHT, PADDLE_DEPTH]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive={getGlowColor()}
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}
