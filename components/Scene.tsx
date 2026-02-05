'use client';

import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { COLORS } from '@/lib/constants';

interface SceneProps {
  isPaused: boolean;
  children: React.ReactNode;
}

function PauseOverlay() {
  return (
    <mesh position={[0, 0, 5]}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial color="black" transparent opacity={0.3} />
    </mesh>
  );
}

export default function Scene({ isPaused, children }: SceneProps) {
  return (
    <Canvas
      style={{ background: COLORS.background }}
      gl={{ antialias: true }}
    >
      <OrthographicCamera
        makeDefault
        position={[0, 0, 10]}
        zoom={40}
        near={0.1}
        far={100}
      />
      <ambientLight intensity={isPaused ? 0.2 : 0.4} />
      <directionalLight position={[5, 10, 5]} intensity={isPaused ? 0.3 : 0.8} castShadow />
      <pointLight position={[0, 5, 5]} intensity={isPaused ? 0.2 : 0.5} />

      {isPaused && <PauseOverlay />}

      {children}
    </Canvas>
  );
}
