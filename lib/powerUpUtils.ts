import { PowerUp, PowerUpType } from './types';
import { DROP_CHANCE } from './constants';

// Weights for random selection
const POWERUP_WEIGHTS: Record<PowerUpType, number> = {
  expand: 20,
  shrink: 10,  // Less common (negative effect)
  slow: 15,
  fast: 10,    // Less common (can be hard)
  multi: 5,    // Rare
  laser: 5,    // Rare
  life: 3,     // Very rare
  sticky: 10,
};

/**
 * Determines if a power-up should drop from a destroyed brick
 */
export function shouldDropPowerUp(): boolean {
  return Math.random() < DROP_CHANCE;
}

/**
 * Gets a random power-up type using weighted selection
 */
export function getRandomPowerUp(): PowerUpType {
  const entries = Object.entries(POWERUP_WEIGHTS) as [PowerUpType, number][];
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);

  let random = Math.random() * totalWeight;

  for (const [type, weight] of entries) {
    random -= weight;
    if (random <= 0) {
      return type;
    }
  }

  return 'expand'; // Fallback
}

/**
 * Creates a new PowerUp object at the given position
 */
export function createPowerUp(type: PowerUpType, position: [number, number, number]): PowerUp {
  return {
    id: `powerup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    position,
    active: true,
  };
}
