'use client';

import { useState, useEffect } from 'react';

export default function OrientationWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;

      // Show warning only on mobile devices in portrait mode
      // Reset dismissed state when switching to landscape (so it shows again if they rotate back)
      if (!isPortrait) {
        setDismissed(false);
      }

      setShowWarning(isMobile && isPortrait && !dismissed);
    };

    // Check on mount
    checkOrientation();

    // Listen for resize and orientation changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Also use matchMedia for orientation if available
    const mediaQuery = window.matchMedia('(orientation: portrait)');
    const handleMediaChange = () => checkOrientation();
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [dismissed]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    setShowWarning(false);
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
      <div className="text-center p-8 max-w-sm">
        {/* Rotate Icon */}
        <div className="mb-6 text-7xl animate-bounce">
          <span role="img" aria-label="Rotate device">
            📱
          </span>
        </div>

        {/* Rotation Arrow Indicator */}
        <div className="mb-4 text-4xl text-cyan-400 animate-pulse">
          ↻
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-2">
          Rotate Your Device
        </h2>
        <p className="text-gray-400 mb-8">
          For the best experience, please rotate your device to landscape mode.
        </p>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600
                     text-white font-bold text-lg rounded-lg
                     hover:from-cyan-500 hover:to-blue-500
                     transform hover:scale-105 transition-all duration-200
                     shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50
                     border border-cyan-400/30"
        >
          Continue Anyway
        </button>

        {/* Hint */}
        <div className="mt-4 text-gray-500 text-sm">
          The game works better in landscape
        </div>
      </div>
    </div>
  );
}
