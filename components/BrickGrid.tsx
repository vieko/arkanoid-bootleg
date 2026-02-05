'use client';

import { memo, useMemo } from 'react';
import Brick from './Brick';
import { BrickData } from '@/lib/types';

interface BrickGridProps {
  bricks: BrickData[];
  onBrickDestroyComplete?: (brickId: string) => void;
}

function BrickGrid({ bricks, onBrickDestroyComplete }: BrickGridProps) {
  // Include bricks that are active OR currently animating destruction
  const visibleBricks = useMemo(() => {
    return bricks.filter(brick => brick.active || brick.destroyedAt);
  }, [bricks]);

  return (
    <group>
      {visibleBricks.map(brick => (
        <Brick key={brick.id} brick={brick} onDestroyComplete={onBrickDestroyComplete} />
      ))}
    </group>
  );
}

export default memo(BrickGrid);
