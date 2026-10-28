/**
 * Glassmorphic Song Card with 3D Tilt-on-Hover
 * Displays track metadata, match percentage, audio bars, like button, and player triggers.
 */

import React, { useRef, useState } from 'react';
import { Play, Pause, Heart, Sparkles, Youtube, Radio, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SongCard({
  song,
  index,
  isPlaying,
  isCurrentSong,
  isLiked,
  onPlay,
  onToggleLike,
  onMoreLikeThis,
  moodColor = '#FFD166',
}) {
  const cardRef = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // 3D Tilt calculation
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 7; // Max tilt 7 deg
    const rotY = ((x - centerX) / centerX) * 7;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const handleLikeClick = (e) => {
    e.stopPropagation();
    onToggleLike(song);
    if (!isLiked) {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.8 },
        colors: ['#FF3366', '#FFD166', '#06D6A0'],
      });
    }
  };

  const lang = song.language || 'English';
  const getLangBadge = () => {
    const l = lang.toLowerCase();
    if (l.includes('hindi')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
          🇮🇳 Hindi
        </span>
      );
    }
    if (l.includes('punjabi')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
          🥁 Punjabi
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
        🇬🇧 English
      </span>
    );
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${
          isHovered ? 1.02 : 1
        }, ${isHovered ? 1.02 : 1}, 1)`,
        transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.4s ease',
      }}
      className={`relative group p-4 rounded-2xl backdrop-blur-xl border transition-colors flex flex-col justify-between ${
        isCurrentSong
          ? 'bg-white/[0.08] border-pink-500/60 shadow-xl shadow-pink-500/10'
          : 'bg-[#121622]/80 border-white/[0.08] hover:border-white/20 hover:bg-[#161C2C]/90'
      }`}
    >
      {/* Top row: Track Info & Badges */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white truncate group-hover:text-pink-300 transition-colors">
              <span className="text-zinc-500 mr-1.5 font-mono text-xs">#{index + 1}</span>
              {song.track_name}
            </h3>
            <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artists}</p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {song.matchScore || 95}%
            </span>
            <button
              onClick={handleLikeClick}
              aria-label="Like song"
              className={`p-1.5 rounded-full transition-all ${
                isLiked
                  ? 'text-pink-500 bg-pink-500/10 scale-110'
                  : 'text-zinc-500 hover:text-pink-400 hover:bg-white/5'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Badges: Language, Year, Popularity */}
        <div className="flex items-center gap-2 mb-3 text-[11px] text-zinc-400">
          {getLangBadge()}
          <span className="px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 font-mono">
            {song.year || 2023}
          </span>
          {song.youtube_id ? (
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
              <Youtube className="w-3 h-3" /> Full Song
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-zinc-700/30 text-zinc-400 border border-white/5 flex items-center gap-1">
              <Radio className="w-3 h-3" /> 30s Preview
            </span>
          )}
        </div>

        {/* Feature Meter Bars */}
        <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-xl bg-black/30 border border-white/5 text-[10px] text-zinc-400 mb-3.5">
          <div>
            <div className="flex justify-between mb-1">
              <span>Energy</span>
              <span className="text-white font-mono">{Math.round((song.energy || 0.5) * 100)}%</span>
            </div>
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full"
                style={{ width: `${Math.round((song.energy || 0.5) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Valence</span>
              <span className="text-white font-mono">{Math.round((song.valence || 0.5) * 100)}%</span>
            </div>
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full"
                style={{ width: `${Math.round((song.valence || 0.5) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Dance</span>
              <span className="text-white font-mono">{Math.round((song.danceability || 0.5) * 100)}%</span>
            </div>
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                style={{ width: `${Math.round((song.danceability || 0.5) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
        <button
          onClick={() => onPlay(song)}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
            isCurrentSong && isPlaying
              ? 'bg-amber-400 text-black shadow-amber-400/20'
              : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white shadow-pink-500/20'
          }`}
        >
          {isCurrentSong && isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" /> Pause
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" /> Play Now
            </>
          )}
        </button>

        <button
          onClick={() => onMoreLikeThis(song)}
          title="Find audio twin songs using k-NN"
          className="py-2 px-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span className="hidden sm:inline">Twins</span>
        </button>
      </div>
    </div>
  );
}
