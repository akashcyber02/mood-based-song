/**
 * 3D Interactive Mood Orb Component
 * Floating, glowing, reactive sphere in Three.js / @react-three/fiber.
 */

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

export default function MoodOrb({
  mood,
  isSelected,
  onSelect,
  position = [0, 0, 0],
}) {
  const meshRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Parse color hex into THREE.Color
  const primaryColor = new THREE.Color(mood.color);
  const secondaryColor = new THREE.Color(mood.secondaryColor || mood.color);

  // Floating & breathing physics
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    const phaseOffset = position[0] * 0.8;

    // Gentle levitation
    meshRef.current.position.y = position[1] + Math.sin(t * 1.5 + phaseOffset) * 0.15;
    meshRef.current.position.x = position[0] + Math.cos(t * 0.8 + phaseOffset) * 0.05;

    // Subtle slow rotation
    meshRef.current.rotation.y += delta * 0.3;
    meshRef.current.rotation.x += delta * 0.15;

    // Smooth hover/selected scaling
    const targetScale = isSelected ? 1.3 : hovered ? 1.18 : 1.0;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    // Dynamic glow pulse
    if (glowRef.current) {
      glowRef.current.scale.setScalar(
        targetScale * (1.2 + Math.sin(t * 3 + phaseOffset) * 0.08)
      );
    }
  });

  return (
    <group position={position}>
      {/* Outer Halo Glow Mesh */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.9, 24, 24]} />
        <meshBasicMaterial
          color={primaryColor}
          transparent
          opacity={isSelected ? 0.35 : hovered ? 0.25 : 0.08}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main Glassmorphic Sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(mood.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.72, 36, 36]} />
        <meshStandardMaterial
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={isSelected ? 0.75 : hovered ? 0.55 : 0.25}
          roughness={0.2}
          metalness={0.7}
          wireframe={false}
        />
      </mesh>

      {/* HTML Label for Sharp Crisp Typography */}
      <Html position={[0, -1.05, 0]} center distanceFactor={10} pointerEvents="none">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide backdrop-blur-md transition-all duration-300 select-none shadow-lg whitespace-nowrap ${
            isSelected
              ? 'bg-white/20 text-white border border-white/40 shadow-xl'
              : hovered
              ? 'bg-black/70 text-white border border-white/20'
              : 'bg-black/50 text-zinc-300 border border-white/10'
          }`}
          style={{
            borderColor: isSelected || hovered ? mood.color : 'rgba(255,255,255,0.1)',
            boxShadow: isSelected ? `0 0 16px ${mood.color}` : 'none',
          }}
        >
          <span className="text-base">{mood.emoji}</span>
          <span>{mood.name}</span>
        </div>
      </Html>
    </group>
  );
}
