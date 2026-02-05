import type { PowerUpType } from './types';

// Game dimensions
export const GAME_WIDTH = 16;
export const GAME_HEIGHT = 20;
export const GAME_DEPTH = 2;

// Paddle
export const PADDLE_WIDTH = 2.5;
export const PADDLE_HEIGHT = 0.4;
export const PADDLE_DEPTH = 0.6;
export const PADDLE_Y = -GAME_HEIGHT / 2 + 1;
export const PADDLE_SPEED = 0.5;
export const PADDLE_SMOOTHING = 0.2;

// Ball
export const BALL_RADIUS = 0.3;
export const BALL_SPEED = 0.15;
export const BALL_PADDLE_OFFSET = 0.1;
export const BALL_PADDLE_PUSH = 0.05;

// Bricks
export const BRICK_WIDTH = 1.8;
export const BRICK_HEIGHT = 0.6;
export const BRICK_DEPTH = 0.6;
export const BRICK_ROWS = 5;
export const BRICK_COLS = 8;
export const BRICK_GAP = 0.15;
export const BRICK_START_Y = GAME_HEIGHT / 2 - 4;
export const MAX_POINTS_PER_BRICK = 100;

// Physics (collision detection)
export const MIN_BRICK_DIMENSION = Math.min(BRICK_WIDTH, BRICK_HEIGHT);
export const MAX_SUBSTEPS = 10;

// Colors
export const COLORS = {
  paddle: '#00ffff',
  ball: '#ffff00',
  brickColors: ['#ff0055', '#ff6600', '#ffff00', '#00ff66', '#00ffff'],
  background: '#0a0a1a',
  walls: '#202042',
};

// Power-ups
export const POWERUP_COLORS: Record<PowerUpType, string> = {
  expand: '#4488ff',   // Blue
  shrink: '#ff4444',   // Red
  slow: '#44ff44',     // Green
  fast: '#ff8844',     // Orange
  multi: '#ff44ff',    // Pink
  laser: '#44ffff',    // Cyan
  life: '#ffdd44',     // Gold
  sticky: '#aa44ff',   // Purple
};

export const POWERUP_DURATIONS: Partial<Record<PowerUpType, number>> = {
  expand: 15000,
  shrink: 15000,
  slow: 10000,
  fast: 10000,
  laser: 20000,
  sticky: 15000,
  // multi and life are permanent, no duration
};

export const POWERUP_FALL_SPEED = 0.05;  // Units per frame
export const DROP_CHANCE = 0.15;  // 15% chance per brick
export const EXPANDED_PADDLE_WIDTH = 3.5;
export const SHRUNK_PADDLE_WIDTH = 1.5;
export const SLOW_BALL_SPEED = 0.10;
export const FAST_BALL_SPEED = 0.20;
