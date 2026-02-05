'use client';

import { useMemo } from 'react';
import Brick from './Brick';
import { BrickData } from '@/lib/types';

interface BrickGridProps {
  bricks: BrickData[];
}

export default function BrickGrid({ bricks }: BrickGridProps) {
  const activeBricks = useMemo(() => {
    return bricks.filter(brick => brick.active);
  }, [bricks]);

  return (
    <group>
      {activeBricks.map(brick => (
        <Brick key={brick.id} brick={brick} />
      ))}
    </group>
  );
}
