import React, { useState } from 'react';
import { X, Sparkles, MessageSquareHeart, ArrowRight } from 'lucide-react';
import { detectMoodFromText } from '../utils/textMood';
import { MOODS } from '../utils/constants';

export default function TextMoodModal({ isOpen, onClose, onSelectMood }) {
  const [inputText, setInputText] = useState('');
  const [detectedMood, setDetectedMood] = useState(null);

  if (!isOpen) return null;

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const res = detectMoodFromText(inputText);
    const mood = res?.mood || 'Happy';
    setDetectedMood(mood);
  };

  const handleApply = (mood) => {
    onSelectMood(mood);
    onClose();
  };

  const samplePrompts = [
    'I am stressed about exams and need to study hard',
    'Just got great news! Feeling super happy and pumped up',
    'Rough breakup, feeling lonely and sad',
    'Chilling on a rainy Sunday evening with warm tea',
    'High adrenaline workout at the gym, pump up the volume',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0F1420] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shadow-lg">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-extrabold text-white">Mood from Text 🧠</h3>
              <p className="text-xs text-slate-400">Describe how you feel in your own words</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAnalyze} className="mt-5 space-y-4">
          <div>
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setDetectedMood(null);
              }}
              placeholder="e.g. Having an exhausting day with tough deadlines, need something soothing..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/60 transition resize-none"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-full py-3 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            <span>Detect Mood & Play</span>
          </button>
        </form>

        {/* Quick prompt suggestions */}
        <div className="mt-4">
          <span className="text-[11px] font-semibold text-slate-500 block mb-2">QUICK SUGGESTIONS:</span>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => {
                  setInputText(prompt);
                  const res = detectMoodFromText(prompt);
                  setDetectedMood(res?.mood || 'Happy');
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/5 transition text-left"
              >
                "{prompt.slice(0, 32)}..."
              </button>
            ))}
          </div>
        </div>

        {/* Result banner */}
        {detectedMood && (
          <div className="mt-5 p-4 rounded-2xl bg-white/[0.04] border border-pink-500/30 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{MOODS[detectedMood]?.emoji || '🎵'}</span>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">DETECTED VIBE</span>
                <h4 className="text-base font-extrabold text-white">{detectedMood}</h4>
              </div>
            </div>

            <button
              onClick={() => handleApply(detectedMood)}
              className="px-4 py-2 rounded-xl bg-white text-black font-extrabold text-xs flex items-center gap-1.5 hover:bg-slate-200 transition shadow-lg"
            >
              <span>Play Playlist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
