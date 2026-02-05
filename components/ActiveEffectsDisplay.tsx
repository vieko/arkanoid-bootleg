'use client';

import { ActiveEffect, PowerUpType } from '@/lib/types';
import { POWERUP_COLORS, POWERUP_DURATIONS } from '@/lib/constants';

interface ActiveEffectsDisplayProps {
  activeEffects: ActiveEffect[];
}

const EFFECT_NAMES: Record<PowerUpType, string> = {
  expand: 'EXPAND',
  shrink: 'SHRINK',
  slow: 'SLOW',
  fast: 'FAST',
  multi: 'MULTI',
  laser: 'LASER',
  life: 'LIFE',
  sticky: 'STICKY',
};

export default function ActiveEffectsDisplay({ activeEffects }: ActiveEffectsDisplayProps) {
  if (activeEffects.length === 0) return null;

  const now = Date.now();

  return (
    <div className="absolute bottom-20 left-4 flex flex-col gap-2">
      {activeEffects.map((effect) => {
        const duration = POWERUP_DURATIONS[effect.type];
        const remaining = Math.max(0, effect.expiresAt - now);
        const progress = duration ? (remaining / duration) * 100 : 100;

        return (
          <div
            key={`${effect.type}-${effect.expiresAt}`}
            className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded"
          >
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: POWERUP_COLORS[effect.type] }}
            />
            <span className="text-white text-xs font-mono min-w-[50px]">
              {EFFECT_NAMES[effect.type]}
            </span>
            {duration && (
              <div className="w-16 h-2 bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-full transition-all duration-100"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: POWERUP_COLORS[effect.type],
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
