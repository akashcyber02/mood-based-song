/**
 * 3D Hero Scene with Interactive Floating Orbs
 * Renders floating mood orbs in space with ambient particles and parallax camera.
 */

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import MoodOrb from './MoodOrb';
import { MOODS } from '../utils/constants';

function CameraRig() {
  useFrame((state) => {
    // Gentle parallax following mouse pointer
    const mouseX = (state.pointer.x * Math.PI) / 10;
    const mouseY = (state.pointer.y * Math.PI) / 14;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, mouseX * 2, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, mouseY * 1.5, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene({ selectedMood, onSelectMood }) {
  const activeMoodObj = MOODS[selectedMood] || MOODS.Happy;

  return (
    <div className="relative w-full h-[400px] md:h-[460px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#0B0E14] to-[#121722] border border-white/10 shadow-2xl">
      {/* Background radial gradient glow matching selected mood */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${activeMoodObj.color} 0%, transparent 70%)`,
        }}
      />

      {/* Floating Instructions overlay */}
      <div className="absolute top-4 left-6 z-10 pointer-events-none">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-white/90 backdrop-blur-md border border-white/10">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
          Interactive 3D Universe • Click any orb to switch emotional vibe
        </span>
      </div>

      <Canvas
        camera={{ position: [0, 0, 7.2], fov: 45 }}
        dpr={[1, 2]} // Cap pixel ratio at 2 for performance on high-DPI displays
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={['#080B10']} />

        {/* Ambient & Directional Lights */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color={activeMoodObj.color} />

        {/* Background Starfield */}
        <Stars radius={40} depth={50} count={1200} factor={3} saturation={0.5} fade speed={1.2} />

        {/* Mood Orbs */}
        <Suspense fallback={null}>
          <group position={[0, -0.2, 0]}>
            {Object.values(MOODS).map((mood) => (
              <MoodOrb
                key={mood.id}
                mood={mood}
                isSelected={selectedMood === mood.id}
                onSelect={onSelectMood}
                position={mood.orbPosition}
              />
            ))}
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}
