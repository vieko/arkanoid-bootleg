'use client';

import { GameStatus } from '@/lib/types';

const INITIAL_LIVES = 3;

interface GameUIProps {
  score: number;
  lives: number;
  gameStatus: GameStatus;
}

export default function GameUI({ score, lives, gameStatus }: GameUIProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top bar with score and lives */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
        {/* Score */}
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-cyan-500/30">
          <div className="text-cyan-400 text-xs font-bold tracking-wider mb-1">SCORE</div>
          <div className="text-white text-2xl font-mono font-bold tracking-wider">
            {score.toString().padStart(6, '0')}
          </div>
        </div>

        {/* Game title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-yellow-400 to-pink-500 bg-clip-text text-transparent drop-shadow-lg">
            ARKANOID
          </h1>
          <div className="text-xs text-gray-400 mt-1">THREE.JS EDITION</div>
        </div>

        {/* Lives */}
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-pink-500/30">
          <div className="text-pink-400 text-xs font-bold tracking-wider mb-1">LIVES</div>
          <div className="flex gap-1">
            {Array.from({ length: Math.max(lives, INITIAL_LIVES) }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full ${
                  i < lives
                    ? 'bg-pink-500 shadow-lg shadow-pink-500/50'
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Center messages */}
      {gameStatus === 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center animate-pulse">
            <div className="text-2xl text-white font-bold mb-2">READY</div>
            <div className="text-cyan-400">Press SPACE or CLICK to launch</div>
            <div className="text-gray-500 text-sm mt-2">
              Move: Mouse or Arrow Keys / A-D
            </div>
          </div>
        </div>
      )}

      {gameStatus === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="text-center">
            <div className="text-4xl text-yellow-400 font-bold mb-4">PAUSED</div>
            <div className="text-white">Press ESC or P to resume</div>
          </div>
        </div>
      )}

      {/* Bottom controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        <div className="text-gray-500 text-xs">
          {gameStatus === 'playing' && 'ESC/P: Pause | R: Restart'}
          {gameStatus === 'paused' && 'ESC/P: Resume | R: Restart'}
          {(gameStatus === 'ready') && 'R: Reset'}
        </div>
      </div>
    </div>
  );
}
