/**
 * Sticky Bottom Player Bar Component
 * Controls YouTube playback & Bass Lab previews with comprehensive media controls:
 * Seek, volume, speed, repeat, shuffle, queue, sleep timer, Media Session API.
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  ListMusic,
  Heart,
  Moon,
  Sliders,
  Gauge,
} from 'lucide-react';

export default function PlayerBar({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackRate,
  isShuffle,
  repeatMode, // 'off' | 'all' | 'one'
  isBassLabMode,
  isLiked,
  sleepTimer, // minutes remaining or null
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onRateChange,
  onToggleShuffle,
  onToggleRepeat,
  onToggleQueue,
  onToggleLike,
  onOpenBassLab,
  onSetSleepTimer,
}) {
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekChange = (e) => {
    const val = parseFloat(e.target.value);
    onSeek(val);
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0C101A]/95 border-t border-white/10 backdrop-blur-2xl shadow-2xl px-4 py-2.5 md:py-3 text-white transition-all">
      {/* Progress Bar (Full Width on Top of Bar) */}
      <div className="absolute -top-1.5 left-0 right-0 group">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.5"
          value={currentTime || 0}
          onChange={handleSeekChange}
          aria-label="Seek track position"
          className="w-full h-1.5 bg-zinc-800 accent-pink-500 cursor-pointer block appearance-none group-hover:h-2.5 transition-all"
        />
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-4">
        {/* Left: Track Info & Artwork */}
        <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
          <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 border border-white/10 shadow-md">
            {currentTrack.artwork_url ? (
              <img
                src={currentTrack.artwork_url}
                alt={currentTrack.track_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600 text-lg">
                🎵
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{currentTrack.track_name}</h4>
            <p className="text-xs text-zinc-400 truncate">{currentTrack.artists}</p>
          </div>

          <button
            onClick={() => onToggleLike(currentTrack)}
            aria-label="Like song"
            className={`p-2 rounded-full transition-all ${
              isLiked ? 'text-pink-500 bg-pink-500/10' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-500' : ''}`} />
          </button>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex flex-col items-center gap-1 w-full md:w-2/4">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Shuffle */}
            <button
              onClick={onToggleShuffle}
              aria-label="Toggle shuffle"
              className={`p-1.5 rounded-lg transition-colors ${
                isShuffle ? 'text-pink-400 bg-pink-500/10' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Skip -10s */}
            <button
              onClick={() => onSeek(Math.max(0, currentTime - 10))}
              aria-label="Skip backwards 10 seconds"
              className="p-1.5 text-zinc-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              onClick={onPrev}
              aria-label="Previous song"
              className="p-1.5 text-zinc-300 hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Main Play / Pause */}
            <button
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white rounded-full shadow-lg shadow-pink-500/25 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={onNext}
              aria-label="Next song"
              className="p-1.5 text-zinc-300 hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Skip +10s */}
            <button
              onClick={() => onSeek(currentTime + 10)}
              aria-label="Skip forwards 10 seconds"
              className="p-1.5 text-zinc-300 hover:text-white transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Repeat Mode */}
            <button
              onClick={onToggleRepeat}
              aria-label="Toggle repeat mode"
              className={`p-1.5 rounded-lg transition-colors ${
                repeatMode !== 'off' ? 'text-pink-400 bg-pink-500/10' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Time display */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
            {isBassLabMode && (
              <span className="text-[10px] text-pink-400 font-semibold uppercase tracking-wider ml-2">
                • 30s Bass Lab Mode
              </span>
            )}
          </div>
        </div>

        {/* Right: Volume, Bass Lab, Speed, Queue, Sleep Timer */}
        <div className="flex items-center justify-end gap-2.5 w-full md:w-1/4">
          {/* Bass Lab Launch Button */}
          <button
            onClick={onOpenBassLab}
            title="Open Bass Lab™ DSP Studio"
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 text-xs font-bold transition-all shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-pink-400" />
            <span>Bass Lab</span>
          </button>

          {/* Playback Speed dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsSpeedOpen(!isSpeedOpen)}
              title="Playback speed"
              className="p-1.5 text-xs font-mono font-bold text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              {playbackRate}x
            </button>
            {isSpeedOpen && (
              <div className="absolute bottom-9 right-0 p-1 bg-[#1A202C] border border-white/10 rounded-xl shadow-xl flex flex-col gap-1 z-50 min-w-16">
                {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      onRateChange(rate);
                      setIsSpeedOpen(false);
                    }}
                    className={`px-2 py-1 text-xs rounded-lg text-left ${
                      playbackRate === rate ? 'bg-pink-500 text-white font-bold' : 'text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume Control */}
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="p-1 text-zinc-400 hover:text-white"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              aria-label="Volume slider"
              className="w-16 h-1.5 bg-zinc-800 accent-pink-500 cursor-pointer"
            />
          </div>

          {/* Sleep Timer */}
          <div className="relative">
            <button
              onClick={() => setIsTimerOpen(!isTimerOpen)}
              title={sleepTimer ? `Sleep in ${sleepTimer}m` : 'Sleep Timer'}
              className={`p-1.5 rounded-lg transition-colors ${
                sleepTimer ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4" />
            </button>
            {isTimerOpen && (
              <div className="absolute bottom-9 right-0 p-2 bg-[#1A202C] border border-white/10 rounded-xl shadow-xl flex flex-col gap-1 z-50 min-w-28 text-xs">
                <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 py-0.5">Sleep Timer</span>
                {[null, 15, 30, 45, 60].map((t) => (
                  <button
                    key={t || 0}
                    onClick={() => {
                      onSetSleepTimer(t);
                      setIsTimerOpen(false);
                    }}
                    className={`px-2 py-1 rounded-lg text-left ${
                      sleepTimer === t ? 'bg-purple-600 text-white font-bold' : 'text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    {t ? `${t} Minutes` : 'Off'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Queue Drawer Toggle */}
          <button
            onClick={onToggleQueue}
            title="Up Next Queue"
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
