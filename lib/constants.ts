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

// Colors
export const COLORS = {
  paddle: '#00ffff',
  ball: '#ffff00',
  brickColors: ['#ff0055', '#ff6600', '#ffff00', '#00ff66', '#00ffff'],
  background: '#0a0a1a',
  walls: '#333366',
};
