import React from 'react';
import { Play, Pause, Heart, Radio, Youtube, Music } from 'lucide-react';

export default function SongRow({
  song,
  index,
  isCurrent,
  isPlaying,
  isLiked,
  onPlay,
  onToggleLike,
  moodColor = '#FFD166',
}) {
  const isPlayingThis = isCurrent && isPlaying;
  const isYoutube = Boolean(song.youtube_id);
  const isPreview = !song.youtube_id && Boolean(song.itunes_preview_url);

  return (
    <div
      onClick={() => onPlay(song)}
      className={`group flex items-center justify-between p-3.5 md:p-4 rounded-2xl transition-all cursor-pointer border ${
        isCurrent
          ? 'bg-white/[0.08] border-white/20 shadow-lg'
          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
      }`}
    >
      {/* Left: Index & Play Icon + Thumbnail + Title/Artist */}
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        {/* Track Number / Play Indicator */}
        <div className="w-8 flex items-center justify-center text-sm font-semibold text-slate-400 group-hover:text-white shrink-0">
          {isPlayingThis ? (
            <div className="flex items-end gap-0.5 h-4">
              <span className="w-1 bg-pink-400 animate-[bounce_0.6s_infinite] h-3 rounded-full" />
              <span className="w-1 bg-amber-400 animate-[bounce_0.8s_infinite] h-4 rounded-full" />
              <span className="w-1 bg-sky-400 animate-[bounce_0.5s_infinite] h-2.5 rounded-full" />
            </div>
          ) : isCurrent ? (
            <Play className="w-4 h-4 fill-white text-white" />
          ) : (
            <span className="group-hover:hidden">{index + 1}</span>
          )}
          {!isCurrent && (
            <Play className="w-4 h-4 fill-white text-white hidden group-hover:block" />
          )}
        </div>

        {/* Thumbnail Artwork */}
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 relative flex items-center justify-center shadow-md">
          {song.artwork_url ? (
            <img
              src={song.artwork_url}
              alt={song.track_name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <Music className="w-6 h-6 text-slate-500" />
          )}
        </div>

        {/* Title & Artist */}
        <div className="min-w-0 flex-1 pr-2">
          <h4
            className={`text-base md:text-lg font-bold truncate transition-colors ${
              isCurrent ? 'text-white' : 'text-slate-100 group-hover:text-white'
            }`}
            style={{ color: isCurrent ? moodColor : undefined }}
          >
            {song.track_name}
          </h4>
          <p className="text-xs md:text-sm text-slate-400 truncate mt-0.5">
            {song.artists}
          </p>
        </div>
      </div>

      {/* Middle: Badges (Language, Year, Source) */}
      <div className="hidden sm:flex items-center gap-2 shrink-0 px-2">
        {/* Language Badge */}
        {(() => {
          const lang = (song.language || 'English').toLowerCase();
          let style = 'bg-sky-500/10 text-sky-300 border-sky-500/20';
          if (lang.includes('hindi')) style = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
          else if (lang.includes('punjabi')) style = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
          else if (lang.includes('haryanvi')) style = 'bg-purple-500/10 text-purple-300 border-purple-500/20';
          return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${style}`}>
              {song.language || 'English'}
            </span>
          );
        })()}

        {/* Year Badge */}
        {song.year && (
          <span className="px-2 py-1 rounded-full text-xs font-mono text-slate-400 bg-black/20">
            {song.year}
          </span>
        )}

        {/* Audio Type Badge */}
        {isYoutube ? (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <Youtube className="w-3.5 h-3.5" />
            <span>Full Song</span>
          </span>
        ) : isPreview ? (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Radio className="w-3.5 h-3.5" />
            <span>30s Preview</span>
          </span>
        ) : (
          <span className="px-2 py-1 rounded-full text-xs text-slate-500 bg-white/5">
            Preview only
          </span>
        )}
      </div>

      {/* Right: Actions (Like & Play) */}
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike(song);
          }}
          className={`p-2.5 rounded-xl transition ${
            isLiked
              ? 'text-pink-500 bg-pink-500/10 hover:bg-pink-500/20'
              : 'text-slate-500 hover:text-white hover:bg-white/10'
          }`}
          aria-label={isLiked ? 'Unlike song' : 'Like song'}
        >
          <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isLiked ? 'fill-pink-500' : ''}`} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay(song);
          }}
          className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition shadow-md ${
            isPlayingThis
              ? 'bg-white text-black'
              : 'bg-white/10 text-white hover:bg-white hover:text-black'
          }`}
          aria-label={isPlayingThis ? 'Pause' : 'Play'}
        >
          {isPlayingThis ? (
            <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" />
          ) : (
            <Play className="w-4 h-4 md:w-5 md:h-5 fill-current ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}
