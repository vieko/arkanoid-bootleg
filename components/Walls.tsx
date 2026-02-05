'use client';

import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '@/lib/constants';

export default function Walls() {
  const wallThickness = 0.3;
  const wallDepth = 1;

  return (
    <group>
      {/* Left wall */}
      <mesh position={[-GAME_WIDTH / 2 - wallThickness / 2, 0, 0]}>
        <boxGeometry args={[wallThickness, GAME_HEIGHT + wallThickness * 2, wallDepth]} />
        <meshBasicMaterial color={COLORS.walls} />
      </mesh>

      {/* Right wall */}
      <mesh position={[GAME_WIDTH / 2 + wallThickness / 2, 0, 0]}>
        <boxGeometry args={[wallThickness, GAME_HEIGHT + wallThickness * 2, wallDepth]} />
        <meshBasicMaterial color={COLORS.walls} />
      </mesh>

      {/* Top wall */}
      <mesh position={[0, GAME_HEIGHT / 2 + wallThickness / 2, 0]}>
        <boxGeometry args={[GAME_WIDTH + wallThickness * 2, wallThickness, wallDepth]} />
        <meshBasicMaterial color={COLORS.walls} />
      </mesh>

      {/* Bottom boundary (invisible, just for reference) */}
      <mesh position={[0, -GAME_HEIGHT / 2 - wallThickness / 2, 0]} visible={false}>
        <boxGeometry args={[GAME_WIDTH, wallThickness, wallDepth]} />
        <meshStandardMaterial color={COLORS.walls} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
