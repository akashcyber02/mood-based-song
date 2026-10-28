/**
 * Text Mood AI Detection Modal
 * Free-text emotion classifier mapping sentence to emotional mood.
 */

import React, { useState } from 'react';
import { Sparkles, X, ArrowRight, Brain } from 'lucide-react';
import { detectMoodFromText } from '../utils/textMood';
import { MOODS } from '../utils/constants';

const SUGGESTIONS = [
  'Crushed my gym workout, feeling unstoppable and hyped!',
  'Exhausted after college classes, just want to lay back and chill',
  'Coding my AI project assignment, need deep focus',
  'Super happy and celebrating a big achievement today!',
  'Heartbroken and feeling down tonight',
  'So furious at the traffic and unfair grading, pure rage',
];

export default function TextMoodModal({ isOpen, onClose, onSelectMood }) {
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState(null);

  if (!isOpen) return null;

  const handleAnalyze = (textToAnalyze) => {
    const text = textToAnalyze || inputText;
    if (!text.trim()) return;

    const result = detectMoodFromText(text);
    setAnalysis(result);
  };

  const handleApplyMood = (moodName) => {
    onSelectMood(moodName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg p-6 bg-gradient-to-b from-[#161B26] to-[#0D111A] border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-500/10 text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                How Are You Feeling Today?
              </h2>
              <p className="text-xs text-zinc-400">Natural Language Sentiment & Emotion Recommender</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Input */}
        <div className="my-5">
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type anything freely... e.g. 'I had a super long day at work, need some gentle Punjabi acoustic songs to unwind...'"
            className="w-full p-3.5 bg-black/40 border border-white/10 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none transition-colors"
          />

          <div className="flex justify-end mt-2">
            <button
              onClick={() => handleAnalyze()}
              disabled={!inputText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Detect Mood</span>
            </button>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
            Or try a sample thought:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(s);
                  handleAnalyze(s);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 hover:border-white/15 transition-colors text-left"
              >
                "{s.slice(0, 36)}..."
              </button>
            ))}
          </div>
        </div>

        {/* Result Card */}
        {analysis && (
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400">Classified Vibe:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl">{MOODS[analysis.mood]?.emoji}</span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: MOODS[analysis.mood]?.color }}
                  >
                    {analysis.mood}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    {analysis.confidence}% confidence
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">{analysis.explanation}</p>
              </div>

              <button
                onClick={() => handleApplyMood(analysis.mood)}
                className="flex items-center gap-1.5 px-3 py-2 bg-pink-500 hover:bg-pink-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-500/20 transition-all"
              >
                <span>Tune In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
