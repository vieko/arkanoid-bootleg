'use client';

interface LevelCompleteScreenProps {
  completedLevel: number;
  nextLevel: number;
  score: number;
  onContinue: () => void;
}

export default function LevelCompleteScreen({
  completedLevel,
  nextLevel,
  score,
  onContinue,
}: LevelCompleteScreenProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10">
      <div className="text-center">
        {/* Level Complete Title */}
        <div className="mb-6">
          <div className="text-2xl text-cyan-400 mb-2">CONGRATULATIONS</div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            LEVEL {completedLevel} COMPLETE!
          </h2>
          <div className="w-48 h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mx-auto mt-2" />
        </div>

        {/* Current Score */}
        <div className="mb-6">
          <div className="text-gray-400 text-sm tracking-wider mb-2">CURRENT SCORE</div>
          <div className="text-5xl font-mono font-bold text-white">
            {score.toString().padStart(6, '0')}
          </div>
        </div>

        {/* Next Level Message */}
        <div className="mb-8">
          <div className="text-xl text-blue-300">
            Get ready for Level {nextLevel}
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContinue();
          }}
          className="pointer-events-auto px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600
                     text-white font-bold text-xl rounded-lg
                     hover:from-cyan-500 hover:to-blue-500
                     transform hover:scale-105 transition-all duration-200
                     shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50
                     border border-cyan-400/30"
        >
          CONTINUE
        </button>

        {/* Keyboard hint */}
        <div className="mt-4 text-gray-500 text-sm">
          Press SPACE to continue
        </div>
      </div>
    </div>
  );
}
