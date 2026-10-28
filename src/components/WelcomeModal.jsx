import React from 'react';
import { Play, Sparkles, Music2, Headphones } from 'lucide-react';

export default function WelcomeModal({ isOpen, onStart }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0F1420] border border-white/10 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-400 p-0.5 mx-auto mb-4 shadow-xl">
          <div className="w-full h-full bg-[#0F1420] rounded-2xl flex items-center justify-center">
            <Headphones className="w-8 h-8 text-pink-400 animate-pulse" />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Welcome to MoodTunes 🎵
        </h2>
        <p className="text-sm font-semibold text-pink-400 mt-1">
          Pick your mood, then tap a song.
        </p>

        <p className="text-xs sm:text-sm text-slate-400 mt-3 max-w-sm mx-auto leading-relaxed">
          AI-driven music discovery streaming 7,000+ songs across Hindi, Punjabi, Haryanvi, and English, calibrated to your exact emotional state.
        </p>

        <div className="grid grid-cols-3 gap-2 my-6 text-left">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-lg">😊🔥</span>
            <h4 className="text-xs font-bold text-white mt-1">6 Mood Spaces</h4>
            <p className="text-[10px] text-slate-400">Happy, Sad, Relaxed, Energetic, Focus, Angry</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-lg">🎧⚡</span>
            <h4 className="text-xs font-bold text-white mt-1">Direct In-App</h4>
            <p className="text-[10px] text-slate-400">Never leaves your tab, auto-plays endlessly</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-lg">🎛️🔊</span>
            <h4 className="text-xs font-bold text-white mt-1">Bass Lab™</h4>
            <p className="text-[10px] text-slate-400">Real Web Audio DSP on studio stems</p>
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full py-3.5 rounded-2xl bg-white text-black font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-slate-200 active:scale-95 transition shadow-xl"
        >
          <Play className="w-5 h-5 fill-black" />
          <span>Start Listening Now</span>
        </button>

        <p className="text-[11px] text-slate-500 mt-3">
          Tapping starts session & unlocks in-browser audio permissions
        </p>
      </div>
    </div>
  );
}
