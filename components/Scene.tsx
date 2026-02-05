'use client';

import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { COLORS } from '@/lib/constants';

interface SceneProps {
  children: React.ReactNode;
}

export default function Scene({ children }: SceneProps) {
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
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[0, 0, 5]} intensity={0.5} color="#ffffff" />
      {children}
    </Canvas>
  );
}
