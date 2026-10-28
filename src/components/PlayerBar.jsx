import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Zap,
  ListMusic,
  ChevronUp,
} from 'lucide-react';

export default function PlayerBar({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  audioSource,
  upNextSongs = [],
  onTogglePlay,
  onNext,
  onPrev,
  onJump,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onOpenBassLab,
  moodColor = '#FFD166',
}) {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const [showUpNext, setShowUpNext] = useState(false);

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setScrubValue(val);
  };

  const handleSliderMouseDown = () => {
    setIsScrubbing(true);
    setScrubValue(currentTime);
  };

  const handleSliderMouseUp = (e) => {
    setIsScrubbing(false);
    const val = parseFloat(e.target.value);
    onSeek(val);
  };

  const displayTime = isScrubbing ? scrubValue : currentTime;
  const safeDuration = duration > 0 ? duration : 30;
  const progressPercent = Math.min(100, Math.max(0, (displayTime / safeDuration) * 100));

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0E17]/95 backdrop-blur-2xl border-t border-white/10 px-4 py-3 md:py-3.5 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      {/* Up Next Mini Popover */}
      {showUpNext && (
        <div className="absolute bottom-full right-4 mb-2 w-72 md:w-80 bg-[#121622]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl animate-fadeIn text-xs text-slate-300">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 font-bold text-white">
            <span className="flex items-center gap-1.5">
              <ListMusic className="w-4 h-4 text-pink-400" />
              UP NEXT (QUEUE)
            </span>
            <button
              onClick={() => setShowUpNext(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 space-y-1.5">
            {upNextSongs.length === 0 ? (
              <p className="text-slate-500 py-2 text-center">Refilling queue automatically...</p>
            ) : (
              upNextSongs.slice(0, 3).map((song, i) => (
                <div key={song.id || i} className="flex items-center gap-2.5 p-1.5 rounded-xl bg-white/[0.03]">
                  <span className="font-mono text-[10px] text-slate-500 w-3">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate text-xs">{song.track_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{song.artists}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-white/5">
                    {song.language}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-4">
        {/* Zone 1: Current Track Info */}
        <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
          {/* Small thumbnail */}
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl overflow-hidden bg-black/50 border border-white/10 shrink-0 shadow relative flex items-center justify-center">
            {currentTrack?.artwork_url ? (
              <img
                src={currentTrack.artwork_url}
                alt={currentTrack.track_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-bold text-xs"
                style={{ backgroundColor: `${moodColor}22`, color: moodColor }}
              >
                🎵
              </div>
            )}
          </div>

          {/* Title & Artist */}
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">
              {currentTrack?.track_name || 'No song selected'}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-400 truncate">
                {currentTrack?.artists || 'Select a mood to begin'}
              </p>
              {audioSource === 'preview' && (
                <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  30s
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Zone 2: Player Controls & Seek Bar */}
        <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4">
          {/* Button Controls */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Previous */}
            <button
              onClick={onPrev}
              disabled={!currentTrack}
              className="p-2 text-slate-400 hover:text-white transition disabled:opacity-40"
              title="Previous (P)"
              aria-label="Previous"
            >
              <SkipBack className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            </button>

            {/* Jump -10s */}
            <button
              onClick={() => onJump(-10)}
              disabled={!currentTrack}
              className="p-2 text-slate-400 hover:text-white transition disabled:opacity-40"
              title="Rewind 10s (Left Arrow)"
              aria-label="Rewind 10s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Main Play / Pause Button */}
            <button
              onClick={onTogglePlay}
              disabled={!currentTrack}
              className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition disabled:opacity-40"
              title="Play / Pause (Space)"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </button>

            {/* Jump +10s */}
            <button
              onClick={() => onJump(10)}
              disabled={!currentTrack}
              className="p-2 text-slate-400 hover:text-white transition disabled:opacity-40"
              title="Forward 10s (Right Arrow)"
              aria-label="Forward 10s"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Next */}
            <button
              onClick={onNext}
              disabled={!currentTrack}
              className="p-2 text-slate-400 hover:text-white transition disabled:opacity-40"
              title="Next (N)"
              aria-label="Next"
            >
              <SkipForward className="w-4 h-4 md:w-5 md:h-5 fill-current" />
            </button>
          </div>

          {/* Seek Bar with Timestamps */}
          <div className="flex items-center gap-2.5 w-full max-w-lg text-[11px] font-mono text-slate-400 select-none">
            <span className="w-10 text-right">{formatTime(displayTime)}</span>
            <div className="relative flex-1 flex items-center h-4 group cursor-pointer">
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: moodColor,
                  }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={safeDuration}
                step={0.5}
                value={displayTime}
                onChange={handleSliderChange}
                onMouseDown={handleSliderMouseDown}
                onMouseUp={handleSliderMouseUp}
                onTouchStart={handleSliderMouseDown}
                onTouchEnd={handleSliderMouseUp}
                disabled={!currentTrack}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                aria-label="Seek track"
              />
            </div>
            <span className="w-10">{formatTime(safeDuration)}</span>
          </div>
        </div>

        {/* Zone 3: Up Next, Honest Bass Lab & Volume */}
        <div className="flex items-center justify-end gap-2.5 md:gap-3 w-full md:w-1/4">
          {/* Up Next Toggle */}
          <button
            onClick={() => setShowUpNext(!showUpNext)}
            className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1 transition ${
              showUpNext
                ? 'bg-white/20 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="View Up Next Queue"
          >
            <ListMusic className="w-4 h-4" />
            <span className="hidden xl:inline">Next</span>
          </button>

          {/* Honest Bass Lab Trigger Button */}
          <button
            onClick={onOpenBassLab}
            className="flex items-center gap-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
            title="Open Bass Lab (30s studio preview with real Web Audio DSP)"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-pink-400" />
            <span>Bass Lab</span>
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMute}
              className="text-slate-400 hover:text-white transition p-1"
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 md:w-20 accent-white h-1 bg-white/20 rounded cursor-pointer"
              aria-label="Volume slider"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
