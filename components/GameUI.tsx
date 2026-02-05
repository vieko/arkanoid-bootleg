'use client';

import { GameStatus, ActiveEffect } from '@/lib/types';
import { POWERUP_COLORS } from '@/lib/constants';

const INITIAL_LIVES = 3;

interface GameUIProps {
  score: number;
  highScore: number;
  lives: number;
  currentLevel: number;
  levelName?: string;
  gameStatus: GameStatus;
  isMuted: boolean;
  onToggleMute: () => void;
  activeEffects?: ActiveEffect[];
}

export default function GameUI({ score, highScore, lives, currentLevel, levelName, gameStatus, isMuted, onToggleMute, activeEffects = [] }: GameUIProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top bar with score and lives */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
        {/* Score, High Score, and Level */}
        <div className="flex gap-2">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-cyan-500/30">
            <div className="text-cyan-400 text-xs font-bold tracking-wider mb-1">SCORE</div>
            <div className="text-white text-2xl font-mono font-bold tracking-wider">
              {score.toString().padStart(6, '0')}
            </div>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-yellow-500/30">
            <div className="text-yellow-400 text-xs font-bold tracking-wider mb-1">BEST</div>
            <div className="text-white text-2xl font-mono font-bold tracking-wider">
              {highScore.toString().padStart(6, '0')}
            </div>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-green-500/30">
            <div className="text-green-400 text-xs font-bold tracking-wider mb-1">LEVEL</div>
            <div className="flex items-baseline gap-2">
              <span className="text-white text-2xl font-mono font-bold tracking-wider">
                {currentLevel.toString().padStart(2, '0')}
              </span>
              {levelName && (
                <span className="text-cyan-300 text-xs font-bold tracking-wider truncate max-w-[80px]">
                  {levelName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Game title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-yellow-400 to-pink-500 bg-clip-text text-transparent drop-shadow-lg">
            ARKANOID
          </h1>
          <div className="text-xs text-gray-400 mt-1">THREE.JS EDITION</div>
        </div>

        {/* Mute button */}
        <button
          onClick={onToggleMute}
          className="pointer-events-auto bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-yellow-500/30 hover:bg-black/70 hover:border-yellow-500/50 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isMuted ? 'text-gray-500' : 'text-yellow-400'}
          >
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            {isMuted ? (
              <line x1="23" y1="1" x2="1" y2="23" />
            ) : (
              <>
                <path d="M15.54 8.46a5 5 0 010 7.07" />
                <path d="M19.07 4.93a10 10 0 010 14.14" />
              </>
            )}
          </svg>
        </button>

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

      {/* Active effects display */}
      {activeEffects.length > 0 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
          {activeEffects.map((effect, index) => {
            const remainingMs = effect.expiresAt - Date.now();
            const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
            return (
              <div
                key={`${effect.type}-${index}`}
                className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1 border flex items-center gap-2"
                style={{ borderColor: POWERUP_COLORS[effect.type] }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: POWERUP_COLORS[effect.type] }}
                />
                <span className="text-white text-xs font-bold uppercase">{effect.type}</span>
                <span className="text-gray-400 text-xs">{remainingSec}s</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        <div className="text-gray-500 text-xs">
          {gameStatus === 'playing' && 'ESC/P: Pause | R: Restart | L: Laser'}
          {gameStatus === 'paused' && 'ESC/P: Resume | R: Restart'}
          {(gameStatus === 'ready') && 'R: Reset'}
        </div>
      </div>
    </div>
  );
}
