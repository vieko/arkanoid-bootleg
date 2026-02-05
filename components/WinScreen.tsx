'use client';

interface WinScreenProps {
  score: number;
  onRestart: () => void;
}

export default function WinScreen({ score, onRestart }: WinScreenProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10">
      <div className="text-center">
        {/* Victory Title */}
        <div className="mb-6">
          <div className="text-2xl text-yellow-400 mb-2">CONGRATULATIONS</div>
          <h2 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 bg-clip-text text-transparent">
            YOU WIN!
          </h2>
          <div className="w-48 h-1 bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 mx-auto mt-2" />
        </div>

        {/* Final Score */}
        <div className="mb-8">
          <div className="text-gray-400 text-sm tracking-wider mb-2">FINAL SCORE</div>
          <div className="text-5xl font-mono font-bold text-white">
            {score.toString().padStart(6, '0')}
          </div>
          <div className="text-green-400 text-sm mt-2">ALL BRICKS DESTROYED!</div>
        </div>

        {/* Play Again Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRestart();
          }}
          className="pointer-events-auto px-8 py-4 bg-gradient-to-r from-green-600 to-cyan-600
                     text-white font-bold text-xl rounded-lg
                     hover:from-green-500 hover:to-cyan-500
                     transform hover:scale-105 transition-all duration-200
                     shadow-lg shadow-green-500/30 hover:shadow-green-500/50
                     border border-green-400/30"
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
