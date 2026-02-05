'use client';

import { TouchEvent } from 'react';

interface VirtualJoystickProps {
  onMove: (dx: number) => void;
}

export default function VirtualJoystick({ onMove }: VirtualJoystickProps) {
  const handleTouchStart = (direction: number) => (e: TouchEvent) => {
    e.preventDefault();
    onMove(direction);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    onMove(0);
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-8 md:hidden z-50">
      <button
        className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl font-bold border border-white/30 active:bg-white/40 active:scale-95 transition-all select-none touch-none"
        onTouchStart={handleTouchStart(-1)}
        onTouchEnd={handleTouchEnd}
        aria-label="Move paddle left"
      >
        <span className="pointer-events-none">&larr;</span>
      </button>
      <button
        className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl font-bold border border-white/30 active:bg-white/40 active:scale-95 transition-all select-none touch-none"
        onTouchStart={handleTouchStart(1)}
        onTouchEnd={handleTouchEnd}
        aria-label="Move paddle right"
      >
        <span className="pointer-events-none">&rarr;</span>
      </button>
    </div>
  );
}
