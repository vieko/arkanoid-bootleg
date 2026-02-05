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
import LevelCompleteScreen from './LevelCompleteScreen';
import VirtualJoystick from './VirtualJoystick';
import OrientationWarning from './OrientationWarning';
import { BrickData, GameStatus, PowerUp as PowerUpData, ActiveEffect, PowerUpType } from '@/lib/types';
import { Position, Velocity } from '@/lib/physics';

// State for tracking multiple balls
interface BallState {
  id: string;
  active: boolean;
  initialPosition?: Position;
  initialVelocity?: Velocity;
}

// Helper function to rotate a velocity vector by an angle in degrees
function rotateVelocity(vx: number, vy: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: vx * Math.cos(rad) - vy * Math.sin(rad),
    y: vx * Math.sin(rad) + vy * Math.cos(rad),
  };
}
import { createBricksFromLayout } from '@/lib/brickUtils';
import { levels } from '@/lib/levels';
import { shouldDropPowerUp, getRandomPowerUp, createPowerUp } from '@/lib/powerUpUtils';
import { MAX_POINTS_PER_BRICK, BALL_SPEED, PADDLE_WIDTH, POWERUP_DURATIONS, EXPANDED_PADDLE_WIDTH, SHRUNK_PADDLE_WIDTH, SLOW_BALL_SPEED, FAST_BALL_SPEED, PADDLE_Y, BRICK_WIDTH, BRICK_HEIGHT } from '@/lib/constants';
import { gameAudio } from '@/lib/audio';
import { useHighScore } from '@/lib/useHighScore';
import PowerUp from './PowerUp';
import Laser, { LaserData, createLaser } from './Laser';

export default function Game() {
  const [paddleX, setPaddleX] = useState(0);
  const paddleVelocityRef = useRef(0);
  const [joystickDirection, setJoystickDirection] = useState(0);
  const [gameStatus, setGameStatus] = useState<GameStatus>('ready');
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [bricks, setBricks] = useState<BrickData[]>(() => createBricksFromLayout(levels[0].layout));
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const { highScore, updateHighScore } = useHighScore();
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('arkanoid-audio-muted') === 'true';
    }
    return false;
  });
  const ballRef = useRef<BallRef>(null);
  const audioInitialized = useRef(false);

  // Multi-ball state
  const [balls, setBalls] = useState<BallState[]>([{ id: 'main', active: true }]);
  const ballRefs = useRef<Map<string, BallRef>>(new Map());

  // Power-up state
  const [powerUps, setPowerUps] = useState<PowerUpData[]>([]);
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const [lasers, setLasers] = useState<LaserData[]>([]);
  const powerUpsRef = useRef<PowerUpData[]>([]);
  const activeEffectsRef = useRef<ActiveEffect[]>([]);
  const lasersRef = useRef<LaserData[]>([]);

  // Ref for bricks to use in collision detection without stale closures
  const bricksRef = useRef<BrickData[]>(bricks);

  // Sync refs with state
  useEffect(() => { powerUpsRef.current = powerUps; }, [powerUps]);
  useEffect(() => { activeEffectsRef.current = activeEffects; }, [activeEffects]);
  useEffect(() => { lasersRef.current = lasers; }, [lasers]);
  useEffect(() => { bricksRef.current = bricks; }, [bricks]);

  const paddleXRef = useRef(paddleX);
  useEffect(() => {
    paddleXRef.current = paddleX;
  }, [paddleX]);

  // Handler for paddle velocity changes
  const handlePaddleVelocityChange = useCallback((velocity: number) => {
    paddleVelocityRef.current = velocity;
  }, []);

  const scoreRef = useRef(score);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    gameAudio.setEnabled(!isMuted);
    if (typeof window !== 'undefined') {
      localStorage.setItem('arkanoid-audio-muted', String(isMuted));
    }
  }, [isMuted]);

  // Get current level configuration for difficulty parameters
  const currentLevelConfig = levels[currentLevel - 1];

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Check if an effect is currently active
  const hasEffect = useCallback((type: PowerUpType): boolean => {
    return activeEffectsRef.current.some(e => e.type === type);
  }, []);

  // Get effective paddle width based on active effects
  const getEffectivePaddleWidth = useCallback((): number => {
    if (hasEffect('expand')) return EXPANDED_PADDLE_WIDTH;
    if (hasEffect('shrink')) return SHRUNK_PADDLE_WIDTH;
    return currentLevelConfig?.paddleWidth ?? PADDLE_WIDTH;
  }, [hasEffect, currentLevelConfig]);

  // Get effective ball speed based on active effects
  const getEffectiveBallSpeed = useCallback((): number => {
    if (hasEffect('slow')) return SLOW_BALL_SPEED;
    if (hasEffect('fast')) return FAST_BALL_SPEED;
    return currentLevelConfig?.ballSpeed ?? BALL_SPEED;
  }, [hasEffect, currentLevelConfig]);

  // Handle power-up collection
  const handlePowerUpCollect = useCallback((powerUp: PowerUpData) => {
    // Remove from active power-ups
    setPowerUps(prev => prev.filter(p => p.id !== powerUp.id));

    // Play sound
    gameAudio.playPowerUpCollect();

    // Apply effect based on type
    const duration = POWERUP_DURATIONS[powerUp.type];

    switch (powerUp.type) {
      case 'life':
        setLives(prev => Math.min(prev + 1, 9));
        gameAudio.playExtraLife();
        break;
      case 'multi':
        // Get current ball velocity and position from main ball or first active ball
        const mainBall = ballRefs.current.get('main') || ballRef.current;
        if (mainBall) {
          const vel = mainBall.getVelocity?.() || { x: 0, y: 0.15 };
          const pos = mainBall.getPosition?.() || { x: 0, y: 0 };

          // Rotate velocity by +30 and -30 degrees for new balls
          const vel1 = rotateVelocity(vel.x, vel.y, 30);
          const vel2 = rotateVelocity(vel.x, vel.y, -30);

          // Create two additional balls with rotated velocities
          const timestamp = Date.now();
          const newBalls: BallState[] = [
            {
              id: `split-${timestamp}-1`,
              active: true,
              initialPosition: { x: pos.x, y: pos.y },
              initialVelocity: vel1,
            },
            {
              id: `split-${timestamp}-2`,
              active: true,
              initialPosition: { x: pos.x, y: pos.y },
              initialVelocity: vel2,
            },
          ];

          setBalls(prev => [...prev, ...newBalls]);
        }
        break;
      case 'expand':
      case 'shrink':
      case 'slow':
      case 'fast':
      case 'laser':
      case 'sticky':
        if (duration) {
          // Remove any existing effect of same type, then add new
          setActiveEffects(prev => [
            ...prev.filter(e => e.type !== powerUp.type),
            { type: powerUp.type, expiresAt: Date.now() + duration }
          ]);
        }
        break;
    }
  }, []);

  const handlePowerUpMiss = useCallback((powerUpId: string) => {
    setPowerUps(prev => prev.filter(p => p.id !== powerUpId));
  }, []);

  // Handle shooting lasers when laser effect is active
  const shootLaser = useCallback(() => {
    if (!hasEffect('laser')) return;
    if (gameStatus !== 'playing') return;

    const currentPaddleX = paddleXRef.current;

    // Create two lasers from paddle edges
    const leftLaser = createLaser(currentPaddleX - 0.8, PADDLE_Y + 0.3);
    const rightLaser = createLaser(currentPaddleX + 0.8, PADDLE_Y + 0.3);

    setLasers(prev => [...prev, leftLaser, rightLaser]);
    gameAudio.playLaserShoot();
  }, [gameStatus, hasEffect]);

  const handleLaserOffScreen = useCallback((laserId: string) => {
    setLasers(prev => prev.filter(l => l.id !== laserId));
  }, []);

  // Check laser-brick collision for a single laser at given position
  // Returns true if the laser hit a brick (and should be removed)
  const checkLaserBrickCollision = useCallback((laserId: string, laserX: number, laserY: number): boolean => {
    const currentBricks = bricksRef.current;

    // Laser dimensions (half-sizes for AABB collision)
    const laserHalfWidth = 0.05;
    const laserHalfHeight = 0.25;

    // Brick half-sizes from constants
    const brickHalfWidth = BRICK_WIDTH / 2;
    const brickHalfHeight = BRICK_HEIGHT / 2;

    for (const brick of currentBricks) {
      // Skip if brick is not active or already being destroyed
      if (!brick.active || brick.destroyedAt) continue;

      const brickX = brick.position[0];
      const brickY = brick.position[1];

      // AABB collision detection
      if (
        laserX + laserHalfWidth >= brickX - brickHalfWidth &&
        laserX - laserHalfWidth <= brickX + brickHalfWidth &&
        laserY + laserHalfHeight >= brickY - brickHalfHeight &&
        laserY - laserHalfHeight <= brickY + brickHalfHeight
      ) {
        // Hit! Remove the laser and destroy the brick
        setLasers(prev => prev.filter(l => l.id !== laserId));

        // Trigger brick destruction with points (reuse handleBrickHit logic)
        // We need to call handleBrickHit with the brick's id and points
        const hitBrickId = brick.id;
        const hitBrickPoints = brick.points;

        // Use setTimeout to avoid calling during render
        setTimeout(() => {
          // Play brick break sound - extract row from brick ID (format: "row-col")
          const rowIndex = parseInt(hitBrickId.split('-')[0], 10) || 0;
          gameAudio.playBrickBreak(rowIndex);

          // Get the brick for power-up spawn check
          const hitBrick = bricksRef.current.find(b => b.id === hitBrickId);

          setBricks(prev => {
            // Start destruction animation by setting destroyedAt timestamp
            const newBricks = prev.map(b =>
              b.id === hitBrickId ? { ...b, destroyedAt: Date.now() } : b
            );

            // Check win condition - count bricks not yet destroying and not already destroyed
            const activeBricks = newBricks.filter(b => b.active && !b.destroyedAt);
            if (activeBricks.length === 0) {
              gameAudio.playLevelWin();
              setCurrentLevel(current => {
                if (current < levels.length) {
                  setGameStatus('levelComplete');
                } else {
                  setGameStatus('won');
                  const finalScore = scoreRef.current + hitBrickPoints;
                  const isNew = updateHighScore(finalScore);
                  setIsNewHighScore(isNew);
                }
                return current;
              });
            }

            return newBricks;
          });

          setScore(prev => prev + hitBrickPoints);

          // Check for power-up drop
          if (hitBrick && shouldDropPowerUp()) {
            const powerUpType = getRandomPowerUp();
            const newPowerUp = createPowerUp(powerUpType, hitBrick.position);
            setPowerUps(prev => [...prev, newPowerUp]);
          }
        }, 0);

        return true; // Laser hit a brick
      }
    }

    return false; // No collision
  }, [updateHighScore]);

  // Handle a single ball being lost (for multi-ball support)
  const handleSingleBallLost = useCallback((ballId: string) => {
    gameAudio.playBallLost();

    setBalls(prev => {
      const updated = prev.map(b => (b.id === ballId ? { ...b, active: false } : b));
      const activeBalls = updated.filter(b => b.active);

      if (activeBalls.length === 0) {
        // All balls lost - lose a life
        setLives(currentLives => {
          const newLives = currentLives - 1;
          if (newLives <= 0) {
            setGameStatus('gameOver');
            gameAudio.playGameOver();
            const isNew = updateHighScore(scoreRef.current);
            setIsNewHighScore(isNew);
          } else {
            // Reset to single ball
            setBalls([{ id: 'main', active: true }]);
            ballRef.current?.reset(paddleXRef.current);
          }
          return newLives;
        });
      }

      return updated;
    });
  }, [updateHighScore]);

  // Original handleBallLost for backward compatibility (used by main ball)
  const handleBallLost = useCallback(() => {
    handleSingleBallLost('main');
  }, [handleSingleBallLost]);

  // Handle brick destruction animation completion - set active: false to remove from rendering
  const handleBrickDestroyComplete = useCallback((brickId: string) => {
    setBricks(prev => prev.map(brick =>
      brick.id === brickId ? { ...brick, active: false, destroyedAt: undefined } : brick
    ));
  }, []);

  const handleBrickHit = useCallback((brickId: string, points: number) => {
    const safePoints = Math.min(MAX_POINTS_PER_BRICK, Math.max(0, points));

    // Get the brick position for potential power-up spawn before updating state
    const hitBrick = bricks.find(b => b.id === brickId);

    setBricks(prev => {
      // Start destruction animation by setting destroyedAt timestamp
      const newBricks = prev.map(brick =>
        brick.id === brickId ? { ...brick, destroyedAt: Date.now() } : brick
      );

      // Check win condition - count bricks not yet destroying and not already destroyed
      const activeBricks = newBricks.filter(b => b.active && !b.destroyedAt);
      if (activeBricks.length === 0) {
        gameAudio.playLevelWin();
        // Check if there are more levels
        setCurrentLevel(current => {
          if (current < levels.length) {
            // More levels available - show level complete screen
            setGameStatus('levelComplete');
          } else {
            // Final level completed - show win screen
            setGameStatus('won');
            // Calculate final score including this brick's points
            const finalScore = scoreRef.current + safePoints;
            const isNew = updateHighScore(finalScore);
            setIsNewHighScore(isNew);
          }
          return current;
        });
      }

      return newBricks;
    });
    setScore(prev => prev + safePoints);

    // Check for power-up drop after brick is destroyed
    if (hitBrick && shouldDropPowerUp()) {
      const powerUpType = getRandomPowerUp();
      const newPowerUp = createPowerUp(powerUpType, hitBrick.position);
      setPowerUps(prev => [...prev, newPowerUp]);
    }
  }, [updateHighScore, bricks]);

  const handleLaunch = useCallback(() => {
    if (gameStatus === 'ready') {
      gameAudio.playGameStart();
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
    setCurrentLevel(1);
    setBricks(createBricksFromLayout(levels[0].layout));
    setIsNewHighScore(false);
    // Reset power-up state
    setPowerUps([]);
    setActiveEffects([]);
    setLasers([]);
    // Reset to single ball
    setBalls([{ id: 'main', active: true }]);
    // Ball will auto-reset via useFrame when gameStatus becomes 'ready'
  }, []);

  const handleContinueToNextLevel = useCallback(() => {
    setCurrentLevel(prev => {
      const nextLevel = prev + 1;
      // Load bricks from the next level (nextLevel - 1 is the array index)
      setBricks(createBricksFromLayout(levels[nextLevel - 1].layout));
      return nextLevel;
    });
    // Reset ball position
    ballRef.current?.reset(paddleXRef.current);
    // Clear power-ups on level change
    setPowerUps([]);
    setActiveEffects([]);
    setLasers([]);
    // Reset to single ball
    setBalls([{ id: 'main', active: true }]);
    setGameStatus('ready');
  }, []);

  // Keyboard controls for launch and pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!audioInitialized.current) {
        gameAudio.initialize();
        audioInitialized.current = true;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        // Check if ball is stuck and release it
        if (ballRef.current?.isStuck?.()) {
          ballRef.current.launchFromSticky();
          return;
        }
        if (gameStatus === 'gameOver' || gameStatus === 'won') {
          resetGame();
        } else if (gameStatus === 'levelComplete') {
          handleContinueToNextLevel();
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
      // Laser shooting with 'l' key or left shift
      if (e.key === 'l' || e.key === 'L' || e.code === 'ShiftLeft') {
        shootLaser();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, handleLaunch, resetGame, handleContinueToNextLevel, shootLaser]);

  // Timer to expire effects
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const interval = setInterval(() => {
      const now = Date.now();
      setActiveEffects(prev => prev.filter(e => e.expiresAt > now));
    }, 100);

    return () => clearInterval(interval);
  }, [gameStatus]);

  // Mouse click to launch (only when not showing end screens)
  const handleClick = () => {
    // Initialize audio on first interaction
    if (!audioInitialized.current) {
      gameAudio.initialize();
      audioInitialized.current = true;
    }
    // If ball is stuck, launch from sticky
    if (ballRef.current?.isStuck?.()) {
      ballRef.current.launchFromSticky();
      return;
    }
    if (gameStatus !== 'gameOver' && gameStatus !== 'won' && gameStatus !== 'levelComplete') {
      handleLaunch();
    }
  };

  // Touch handler for launching ball on mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent double-firing with click events
    e.preventDefault();
    // Initialize audio on first interaction
    if (!audioInitialized.current) {
      gameAudio.initialize();
      audioInitialized.current = true;
    }
    // If ball is stuck, launch from sticky
    if (ballRef.current?.isStuck?.()) {
      ballRef.current.launchFromSticky();
      return;
    }
    if (gameStatus !== 'gameOver' && gameStatus !== 'won' && gameStatus !== 'levelComplete') {
      handleLaunch();
    }
  };

  return (
    <div className="game-container w-full h-screen" onClick={handleClick} onTouchStart={handleTouchStart}>
      {/* Orientation warning for mobile portrait mode */}
      <OrientationWarning />
      <Scene isPaused={gameStatus === 'paused'}>
        <Walls />
        <Paddle onPositionChange={setPaddleX} onVelocityChange={handlePaddleVelocityChange} width={getEffectivePaddleWidth()} activeEffects={activeEffects} joystickDirection={joystickDirection} />
        <BrickGrid bricks={bricks} onBrickDestroyComplete={handleBrickDestroyComplete} />
        {/* Render all active balls */}
        {balls.filter(b => b.active).map(ball => (
          <Ball
            key={ball.id}
            ref={(ref) => {
              if (ref) {
                ballRefs.current.set(ball.id, ref);
                // Also set the main ballRef for backward compatibility
                if (ball.id === 'main') {
                  (ballRef as React.MutableRefObject<BallRef | null>).current = ref;
                }
              } else {
                ballRefs.current.delete(ball.id);
              }
            }}
            ballId={ball.id}
            paddleX={paddleX}
            paddleVelocityRef={paddleVelocityRef}
            gameStatus={gameStatus}
            bricks={bricks}
            onBallLost={() => handleSingleBallLost(ball.id)}
            onBrickHit={handleBrickHit}
            ballSpeed={getEffectiveBallSpeed()}
            hasSticky={hasEffect('sticky')}
            activeEffects={activeEffects}
            initialPosition={ball.initialPosition}
            initialVelocity={ball.initialVelocity}
          />
        ))}

        {/* Power-ups */}
        {powerUps.filter(p => p.active).map(p => (
          <PowerUp
            key={p.id}
            powerUp={p}
            onCollect={handlePowerUpCollect}
            onMiss={handlePowerUpMiss}
            paddleX={paddleX}
            paddleWidth={getEffectivePaddleWidth()}
          />
        ))}

        {/* Lasers */}
        {lasers.filter(l => l.active).map(l => (
          <Laser
            key={l.id}
            laser={l}
            onOffScreen={handleLaserOffScreen}
            onPositionUpdate={checkLaserBrickCollision}
          />
        ))}
      </Scene>
      <GameUI
        score={score}
        lives={lives}
        currentLevel={currentLevel}
        levelName={levels[currentLevel - 1]?.name}
        gameStatus={gameStatus}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        highScore={highScore}
        activeEffects={activeEffects}
      />

      {/* End game screens */}
      {gameStatus === 'gameOver' && (
        <GameOverScreen score={score} onRestart={resetGame} isNewHighScore={isNewHighScore} />
      )}
      {gameStatus === 'won' && (
        <WinScreen score={score} onRestart={resetGame} isNewHighScore={isNewHighScore} totalLevels={levels.length} />
      )}
      {gameStatus === 'levelComplete' && (
        <LevelCompleteScreen
          completedLevel={currentLevel}
          nextLevel={currentLevel + 1}
          score={score}
          onContinue={handleContinueToNextLevel}
        />
      )}

      {/* Virtual joystick for mobile - only show when game is active */}
      {gameStatus !== 'gameOver' && gameStatus !== 'won' && gameStatus !== 'levelComplete' && (
        <VirtualJoystick onMove={setJoystickDirection} />
      )}
    </div>
  );
}
