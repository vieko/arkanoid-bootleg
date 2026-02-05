'use client';

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
}

export default function GameOverScreen({ score, onRestart }: GameOverScreenProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10">
      <div className="text-center">
        {/* Game Over Title */}
        <div className="mb-6">
          <h2 className="text-6xl font-bold text-red-500 animate-pulse mb-2">
            GAME OVER
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent mx-auto" />
        </div>

        {/* Final Score */}
        <div className="mb-8">
          <div className="text-gray-400 text-sm tracking-wider mb-2">FINAL SCORE</div>
          <div className="text-5xl font-mono font-bold text-white">
            {score.toString().padStart(6, '0')}
          </div>
        </div>

        {/* Restart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRestart();
          }}
          className="pointer-events-auto px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600
                     text-white font-bold text-xl rounded-lg
                     hover:from-red-500 hover:to-pink-500
                     transform hover:scale-105 transition-all duration-200
                     shadow-lg shadow-red-500/30 hover:shadow-red-500/50
                     border border-red-400/30"
        >
          PLAY AGAIN
        </button>

        {/* Keyboard hint */}
        <div className="mt-4 text-gray-500 text-sm">
          or press SPACE to restart
        </div>
      </div>
    </div>
  );
}
