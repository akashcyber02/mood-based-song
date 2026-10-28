/**
 * 3D Rotating Vinyl Record & Audio-Reactive Waveform Ring
 * Renders in Three.js / @react-three/fiber with live frequency response.
 */

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bassLab } from '../utils/audioContext';
import { MOODS } from '../utils/constants';

function VinylDisc({ isPlaying, moodColor, artworkUrl }) {
  const vinylRef = useRef();

  useFrame((_, delta) => {
    if (vinylRef.current && isPlaying) {
      vinylRef.current.rotation.z -= delta * 1.8; // Spin vinyl
    }
  });

  return (
    <group ref={vinylRef} rotation={[0.4, 0, 0]}>
      {/* Outer Vinyl Body */}
      <mesh>
        <cylinderGeometry args={[2.2, 2.2, 0.05, 64]} />
        <meshStandardMaterial
          color="#0d0d11"
          roughness={0.35}
          metalness={0.8}
        />
      </mesh>

      {/* Grooves Rings */}
      {[1.95, 1.75, 1.55, 1.35].map((radius, i) => (
        <mesh key={i} position={[0, 0.03, 0]}>
          <ringGeometry args={[radius, radius + 0.02, 64]} />
          <meshBasicMaterial color="#1a1c23" side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Center Label Badge */}
      <mesh position={[0, 0.035, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.04, 48]} />
        <meshStandardMaterial
          color={moodColor}
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>

      {/* Center Spindle Hole */}
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.06, 32]} />
        <meshBasicMaterial color="#05070A" />
      </mesh>
    </group>
  );
}

function WaveformParticles({ isPlaying, moodColor }) {
  const particlesRef = useRef();
  const count = 48;

  // Initial circular positions
  const [positions, initialRadii] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const radii = new Float32Array(count);
    const baseRadius = 2.6;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      radii[i] = baseRadius;
      pos[i * 3] = Math.cos(angle) * baseRadius;
      pos[i * 3 + 1] = Math.sin(angle) * baseRadius;
      pos[i * 3 + 2] = 0;
    }
    return [pos, radii];
  }, [count]);

  useFrame(() => {
    if (!particlesRef.current) return;
    const freqData = bassLab.getFrequencyData();
    const posAttr = particlesRef.current.geometry.attributes.position;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const freqIndex = i % freqData.length;
      const amplitude = (freqData[freqIndex] / 255) * (isPlaying ? 0.65 : 0.1);
      const r = initialRadii[i] + amplitude;

      posAttr.setXYZ(i, Math.cos(angle) * r, Math.sin(angle) * r, 0);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={particlesRef} rotation={[0.4, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        color={moodColor}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function Vinyl3D({ isPlaying, currentTrack, selectedMood }) {
  const moodObj = MOODS[selectedMood] || MOODS.Happy;
  const moodColor = moodObj.color;

  return (
    <div className="relative w-full h-[280px] md:h-[340px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#090C12] to-[#121622] border border-white/10 shadow-2xl flex items-center justify-center">
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-25"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${moodColor} 0%, transparent 65%)`,
        }}
      />

      {/* Overlay Track Badge */}
      <div className="absolute top-4 left-6 z-10 pointer-events-none">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90 backdrop-blur-md border border-white/10">
          <span
            className={`w-2 h-2 rounded-full ${
              isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'
            }`}
          />
          {isPlaying ? 'Audio Visualizer Active' : 'Turntable Standby'}
        </span>
      </div>

      <Canvas camera={{ position: [0, 0, 5.2], fov: 48 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 8]} intensity={1.5} />
        <pointLight position={[-5, -5, -2]} color={moodColor} intensity={1.0} />

        <VinylDisc
          isPlaying={isPlaying}
          moodColor={moodColor}
          artworkUrl={currentTrack?.artwork_url}
        />
        <WaveformParticles isPlaying={isPlaying} moodColor={moodColor} />
      </Canvas>
    </div>
  );
}
