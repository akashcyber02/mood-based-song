/**
 * Playback Queue Drawer
 * Lists upcoming tracks with reorder support and one-click play.
 */

import React from 'react';
import { X, Play, Trash2, Music } from 'lucide-react';

export default function QueueDrawer({
  isOpen,
  onClose,
  queue,
  currentTrack,
  onSelectTrack,
  onRemoveTrack,
  onClearQueue,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 z-50 bg-[#10141F]/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl p-5 flex flex-col justify-between animate-in slide-in-from-right duration-200">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-pink-400" />
            <h3 className="font-bold text-white text-base">Up Next Queue</h3>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-mono text-zinc-300">
              {queue.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {queue.length > 0 && (
              <button
                onClick={onClearQueue}
                title="Clear queue"
                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Queue Items List */}
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
          {queue.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs">
              Your playback queue is empty.<br />Select a mood or click any song to fill it!
            </div>
          ) : (
            queue.map((track, i) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={`${track.id}-${i}`}
                  onClick={() => onSelectTrack(track)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-pink-500/15 border-pink-500/40 text-white'
                      : 'bg-white/[0.03] border-white/5 hover:border-white/20 text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-mono text-zinc-500 w-4">{i + 1}</span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate">{track.track_name}</h4>
                      <p className="text-[11px] text-zinc-400 truncate">{track.artists}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTrack(i);
                        }}
                        className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-white/10 text-[11px] text-zinc-500 text-center">
        Songs automatically advance when playback finishes.
      </div>
    </div>
  );
}
