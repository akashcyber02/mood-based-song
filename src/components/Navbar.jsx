/**
 * Application Navigation & Filter Bar
 */

import React from 'react';
import { Sparkles, Heart, Search, Disc, Globe2, Flame, HelpCircle } from 'lucide-react';
import { LANGUAGES } from '../utils/constants';

export default function Navbar({
  searchQuery,
  onSearchChange,
  selectedLanguages,
  onToggleLanguage,
  recentOnly,
  onToggleRecentOnly,
  showFavoritesOnly,
  onToggleFavorites,
  favoritesCount,
  activeView, // 'hero' | 'vinyl'
  onChangeView,
  onOpenTextMoodModal,
}) {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#080B10]/85 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & 3D View Selector */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-pink-500/20">
              <div className="w-full h-full bg-[#0D1117] rounded-[10px] flex items-center justify-center text-lg">
                🎵
              </div>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                MoodTunes
              </span>
              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-pink-300 border border-white/10">
                3D Web
              </span>
            </div>
          </div>

          {/* 3D Scene View Switcher */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 text-xs font-semibold">
            <button
              onClick={() => onChangeView('hero')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeView === 'hero'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🌌 3D Orbs
            </button>
            <button
              onClick={() => onChangeView('vinyl')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                activeView === 'vinyl'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Disc className="w-3.5 h-3.5" /> 3D Vinyl
            </button>
          </div>
        </div>

        {/* Search & Free-Text AI Trigger */}
        <div className="flex items-center gap-2 w-full md:w-auto md:flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by song title or artist..."
              className="w-full pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 transition-colors"
            />
          </div>

          <button
            onClick={onOpenTextMoodModal}
            title="Ask AI how you are feeling"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold whitespace-nowrap transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Mood</span>
          </button>
        </div>

        {/* Language & Recency Filters */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          {/* Languages */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            {LANGUAGES.map((lang) => {
              const active = selectedLanguages.includes(lang);
              return (
                <button
                  key={lang}
                  onClick={() => onToggleLanguage(lang)}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? 'bg-pink-500/25 text-pink-300 border border-pink-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {lang === 'Hindi' ? '🇮🇳 ' : lang === 'Punjabi' ? '🥁 ' : '🇬🇧 '}
                  {lang}
                </button>
              );
            })}
          </div>

          {/* 2022+ Recent Filter */}
          <button
            onClick={onToggleRecentOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              recentOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${recentOnly ? 'text-amber-400 fill-amber-400' : ''}`} />
            <span>2022+</span>
          </button>

          {/* Favorites Filter */}
          <button
            onClick={onToggleFavorites}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              showFavoritesOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'text-rose-400 fill-rose-400' : ''}`} />
            <span>Saved ({favoritesCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
}
