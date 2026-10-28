import React from 'react';
import { Bug, X, Volume2, Radio, AlertTriangle, Activity } from 'lucide-react';

export default function DebugPanel({
  isOpen,
  onClose,
  currentSong,
  audioSource,
  playerState,
  lastErrorCode,
  audioContextState,
  bassBoostDb,
  isBassEnabled,
  catalogStats,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-4 z-50 w-80 md:w-96 bg-[#0E131F]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl text-xs text-slate-300 font-mono space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2 text-pink-400 font-semibold tracking-wide">
          <Bug className="w-4 h-4" />
          <span>AUDIO & ENGINE TELEMETRY</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
          aria-label="Close Debug Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-slate-500 block">CURRENT SONG:</span>
          <span className="font-semibold text-white truncate block">
            {currentSong ? `${currentSong.track_name} — ${currentSong.artists}` : '(None loaded)'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-500 block">AUDIO SOURCE:</span>
            <span className={`font-semibold ${audioSource === 'youtube' ? 'text-red-400' : audioSource === 'preview' ? 'text-amber-400' : 'text-slate-400'}`}>
              {audioSource ? audioSource.toUpperCase() : 'NONE'}
            </span>
          </div>

          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-500 block">PLAYER STATE:</span>
            <span className={`font-semibold ${playerState.includes('PLAY') ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {playerState}
            </span>
          </div>
        </div>

        <div className="bg-black/30 p-2 rounded-lg border border-white/5 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">YOUTUBE ID:</span>
            <span className="text-slate-200 truncate max-w-[160px] text-right">
              {currentSong?.youtube_id || 'null (preview only)'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">ITUNES PREVIEW:</span>
            <span className="text-slate-200 truncate max-w-[160px] text-right">
              {currentSong?.itunes_preview_url ? 'Available (30s AAC)' : 'null'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-500 block">LAST ERROR CODE:</span>
            <span className={lastErrorCode ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {lastErrorCode ? String(lastErrorCode) : 'None'}
            </span>
          </div>

          <div className="bg-black/30 p-2 rounded-lg border border-white/5">
            <span className="text-slate-500 block">AUDIOCONTEXT:</span>
            <span className={audioContextState === 'running' ? 'text-emerald-400' : 'text-slate-400'}>
              {audioContextState}
            </span>
          </div>
        </div>

        <div className="bg-black/30 p-2 rounded-lg border border-white/5 flex items-center justify-between">
          <span className="text-slate-500">BASS BOOST (Web Audio):</span>
          <span className={isBassEnabled ? 'text-pink-400 font-semibold' : 'text-slate-400'}>
            {isBassEnabled ? `ACTIVE (+${bassBoostDb} dB)` : 'OFF'}
          </span>
        </div>

        {catalogStats && (
          <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 flex justify-between">
            <span>Catalog: {catalogStats.total} songs</span>
            <span className="text-emerald-400">{catalogStats.playable} playable</span>
          </div>
        )}
      </div>
    </div>
  );
}
