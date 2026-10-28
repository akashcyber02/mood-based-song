/**
 * 2D Mood Selector Grid
 * Quick-access responsive mood selection with emojis and calibrated gradients.
 */

import React from 'react';
import { MOODS } from '../utils/constants';

export default function MoodBar({ selectedMood, onSelectMood }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 my-6">
      {Object.values(MOODS).map((m) => {
        const isSelected = selectedMood === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onSelectMood(m.id)}
            style={{
              borderColor: isSelected ? m.color : 'rgba(255, 255, 255, 0.08)',
              boxShadow: isSelected ? `0 0 20px ${m.color}33` : 'none',
            }}
            className={`p-3.5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
              isSelected
                ? 'bg-white/[0.08] scale-[1.02]'
                : 'bg-[#121622]/80 hover:bg-[#161C2C] hover:border-white/20'
            }`}
          >
            {/* Background subtle radial glow */}
            <div
              className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-20 pointer-events-none blur-xl transition-opacity group-hover:opacity-40"
              style={{ backgroundColor: m.color }}
            />

            <div className="flex items-center justify-between mb-1.5">
              <span className="text-2xl">{m.emoji}</span>
              {isSelected && (
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: m.color }}
                />
              )}
            </div>

            <h4
              className="font-bold text-sm tracking-tight transition-colors"
              style={{ color: isSelected ? m.color : '#FFFFFF' }}
            >
              {m.name}
            </h4>
            <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{m.quote}</p>
          </button>
        );
      })}
    </div>
  );
}
