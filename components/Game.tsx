'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Scene from './Scene';
import Walls from './Walls';
import Paddle from './Paddle';
import Ball, { BallRef } from './Ball';
import BrickGrid from './BrickGrid';
import GameUI from './GameUI';
import GameOverScreen from './GameOverScreen';
import WinScreen from './WinScreen';
import { BrickData, GameStatus } from '@/lib/types';
import { createBricks } from '@/lib/brickUtils';
import { MAX_POINTS_PER_BRICK } from '@/lib/constants';

export default function Game() {
  const [paddleX, setPaddleX] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('ready');
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [bricks, setBricks] = useState<BrickData[]>(() => createBricks());
  const ballRef = useRef<BallRef>(null);

  const paddleXRef = useRef(paddleX);
  useEffect(() => {
    paddleXRef.current = paddleX;
  }, [paddleX]);

  const handleBallLost = useCallback(() => {
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setGameStatus('gameOver');
      } else {
        ballRef.current?.reset(paddleXRef.current);
      }
      return newLives;
    });
  }, []);

  const handleBrickHit = useCallback((brickId: string, points: number) => {
    setBricks(prev => {
      const newBricks = prev.map(brick =>
        brick.id === brickId ? { ...brick, active: false } : brick
      );

      // Check win condition
      const activeBricks = newBricks.filter(b => b.active);
      if (activeBricks.length === 0) {
        setGameStatus('won');
      }

      return newBricks;
    });
    const safePoints = Math.min(MAX_POINTS_PER_BRICK, Math.max(0, points));
    setScore(prev => prev + safePoints);
  }, []);

  const handleLaunch = useCallback(() => {
    if (gameStatus === 'ready') {
      setGameStatus('playing');
      ballRef.current?.launch();
    } else if (gameStatus === 'playing') {
      ballRef.current?.launch();
    }
  }, [gameStatus]);

  const resetGame = useCallback(() => {
    setGameStatus('ready');
    setLives(3);
    setScore(0);
    setBricks(createBricks());
    // Ball will auto-reset via useFrame when gameStatus becomes 'ready'
  }, []);

  // Keyboard controls for launch and pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameStatus === 'gameOver' || gameStatus === 'won') {
          resetGame();
        } else {
          handleLaunch();
        }
      }
      if (e.code === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameStatus === 'playing') {
          setGameStatus('paused');
        } else if (gameStatus === 'paused') {
          setGameStatus('playing');
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, handleLaunch, resetGame]);

  // Mouse click to launch (only when not showing end screens)
  const handleClick = () => {
    if (gameStatus !== 'gameOver' && gameStatus !== 'won') {
      handleLaunch();
    }
  };

  return (
    <div className="w-full h-screen" onClick={handleClick}>
      <Scene>
        <Walls />
        <Paddle onPositionChange={setPaddleX} />
        <BrickGrid bricks={bricks} />
        <Ball
          ref={ballRef}
          paddleX={paddleX}
          gameStatus={gameStatus}
          bricks={bricks}
          onBallLost={handleBallLost}
          onBrickHit={handleBrickHit}
        />
      </Scene>
      <GameUI score={score} lives={lives} gameStatus={gameStatus} />

      {/* End game screens */}
      {gameStatus === 'gameOver' && (
        <GameOverScreen score={score} onRestart={resetGame} />
      )}
      {gameStatus === 'won' && (
        <WinScreen score={score} onRestart={resetGame} />
      )}
    </div>
  );
}
