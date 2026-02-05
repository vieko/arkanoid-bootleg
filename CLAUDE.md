# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run lint` - Run ESLint

## Architecture

Three.js Arkanoid clone built with Next.js 16, React 19, TypeScript, and React Three Fiber.

### Key Technologies
- **Rendering**: Three.js via React Three Fiber + Drei helpers
- **Styling**: Tailwind CSS 4 with glassmorphism effects
- **State**: React hooks (useState, useRef, useCallback); Zustand installed but unused

### Component Structure
- `app/page.tsx` - Entry point, dynamically imports Game with `ssr: false`
- `components/Game.tsx` - Main orchestrator managing game state and score
- `components/Scene.tsx` - Three.js Canvas wrapper with orthographic camera
- `components/Ball.tsx` - Ball physics using useFrame, exposes launch/reset via forwardRef
- `components/Paddle.tsx` - Dual input (mouse tracking + keyboard arrows/A-D)
- `components/BrickGrid.tsx` - Renders active bricks, filters destroyed with useMemo
- `components/Walls.tsx`, `Brick.tsx` - Static geometry components
- `components/GameUI.tsx`, `GameOverScreen.tsx`, `WinScreen.tsx` - Overlay UI

### Utility Modules (lib/)
- `constants.ts` - Game dimensions: world 16x20, paddle 2.5x0.4, ball radius 0.3
- `physics.ts` - Velocity updates and position calculations
- `collision.ts` - AABB collision detection for walls, paddle, bricks
- `brickUtils.ts` - Brick grid generation (8x5 layout)
- `types.ts` - TypeScript interfaces (BrickData, GameState, etc.)

### Game States
`ready` → `playing` → `paused` | `gameOver` | `won`

### Input Controls
- Mouse: paddle follows cursor
- Keyboard: Arrow keys or A/D for paddle, Space to launch, ESC/P to pause, R to reset

### Rendering Notes
- All game components use `'use client'` directive
- Orthographic camera with zoom 40 for 2D-like perspective
- Ball uses emissive material for glow effect
