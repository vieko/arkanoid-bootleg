export type GameStatus = 'ready' | 'playing' | 'paused' | 'gameOver' | 'won';

export interface BrickData {
  id: string;
  position: [number, number, number];
  color: string;
  points: number;
  active: boolean;
}

export interface GameState {
  status: 'ready' | 'playing' | 'paused' | 'gameOver' | 'won';
  score: number;
  lives: number;
  ballVelocity: { x: number; y: number };
  paddleX: number;
  bricks: BrickData[];
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'GAME_OVER' }
  | { type: 'WIN' }
  | { type: 'LOSE_LIFE' }
  | { type: 'ADD_SCORE'; points: number }
  | { type: 'DESTROY_BRICK'; id: string }
  | { type: 'RESET_GAME' }
  | { type: 'SET_PADDLE_X'; x: number }
  | { type: 'SET_BALL_VELOCITY'; velocity: { x: number; y: number } };
