'use client';

import dynamic from 'next/dynamic';

const Game = dynamic(() => import('@/components/Game'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-[#0a0a1a] text-white">
      <div className="text-2xl">Loading Arkanoid...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden">
      <Game />
    </main>
  );
}
