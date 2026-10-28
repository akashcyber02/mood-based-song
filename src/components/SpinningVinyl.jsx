import React from 'react';
import { Disc3, Music2 } from 'lucide-react';

export default function SpinningVinyl({
  currentTrack,
  isPlaying,
  moodColor = '#FFD166',
  moodEmoji = '🎵',
}) {
  const artwork = currentTrack?.artwork_url;
  const trackName = currentTrack?.track_name || 'No song playing';
  const artists = currentTrack?.artists || 'Pick a vibe to start';

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden group">
      {/* Ambient background glow matching mood */}
      <div
        className="absolute w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: moodColor }}
      />

      {/* Vinyl Disc Container */}
      <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
        {/* Vinyl Disc Body */}
        <div
          className={`w-full h-full rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.8)] relative flex items-center justify-center transition-transform ${
            isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''
          }`}
          style={{
            background: `radial-gradient(circle, #1a1a24 0%, #0d0e15 30%, #151620 45%, #08090d 60%, #12131b 75%, #050608 100%)`,
            border: `2px solid rgba(255, 255, 255, 0.08)`,
            boxShadow: isPlaying ? `0 0 35px ${moodColor}33` : '0 10px 30px rgba(0,0,0,0.6)',
          }}
        >
          {/* Vinyl Grooves Rings */}
          <div className="absolute inset-3 rounded-full border border-white/[0.04] pointer-events-none" />
          <div className="absolute inset-7 rounded-full border border-white/[0.03] pointer-events-none" />
          <div className="absolute inset-11 rounded-full border border-white/[0.04] pointer-events-none" />
          <div className="absolute inset-15 rounded-full border border-white/[0.03] pointer-events-none" />

          {/* Center Record Label */}
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 flex items-center justify-center relative shadow-inner"
            style={{ borderColor: moodColor }}
          >
            {artwork ? (
              <img
                src={artwork}
                alt={trackName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center text-center p-1"
                style={{
                  background: `linear-gradient(135deg, ${moodColor}33, #0E131F)`,
                }}
              >
                <span className="text-xl md:text-2xl">{moodEmoji}</span>
              </div>
            )}

            {/* Center Spindle Hole */}
            <div className="absolute w-4 h-4 rounded-full bg-[#080B10] border border-white/20 shadow-inner" />
          </div>
        </div>

        {/* Needle / Tonearm accent */}
        <div
          className={`absolute -top-1 -right-1 w-12 h-16 pointer-events-none transition-transform duration-500 origin-top-right ${
            isPlaying ? 'rotate-12' : '-rotate-6'
          }`}
        >
          <div className="w-1.5 h-12 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full shadow-md ml-auto mr-2" />
          <div className="w-3 h-4 bg-pink-500/80 rounded-sm ml-auto mr-1 shadow-sm" />
        </div>
      </div>

      {/* Now Playing Caption */}
      <div className="mt-5 text-center max-w-[220px]">
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wider uppercase mb-1">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{
              backgroundColor: isPlaying ? moodColor : '#64748b',
              boxShadow: isPlaying ? `0 0 8px ${moodColor}` : 'none',
            }}
          />
          <span className="text-slate-400">
            {isPlaying ? 'NOW PLAYING' : 'READY TO PLAY'}
          </span>
        </div>
        <h4 className="text-sm font-bold text-white truncate">{trackName}</h4>
        <p className="text-xs text-slate-400 truncate mt-0.5">{artists}</p>
      </div>
    </div>
  );
}
