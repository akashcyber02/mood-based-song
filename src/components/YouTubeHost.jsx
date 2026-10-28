/**
 * YouTube IFrame Player Host Component
 * Renders hidden or docked mini player using window.YT.Player
 * Emits time, duration, and error events to parent player state.
 */

import React, { useEffect, useRef } from 'react';

export default function YouTubeHost({
  videoId,
  isPlaying,
  volume,
  isMuted,
  playbackRate,
  onSongEnd,
  onPlayerError,
  onTimeUpdate,
  onDurationUpdate,
  seekTarget,
}) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const timeIntervalRef = useRef(null);
  const isApiReadyRef = useRef(false);

  useEffect(() => {
    // Check if YT API is already loaded
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player('yt-hidden-player', {
        height: '100%',
        width: '100%',
        videoId: videoId || '',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            isApiReadyRef.current = true;
            event.target.setVolume(isMuted ? 0 : volume * 100);
            event.target.setPlaybackRate(playbackRate);
            if (videoId && isPlaying) {
              event.target.playVideo();
            }
          },
          onStateChange: (event) => {
            // YT.PlayerState.ENDED is 0
            if (event.data === 0) {
              if (onSongEnd) onSongEnd();
            }
          },
          onError: (event) => {
            console.warn('[YouTubeHost] Player error code:', event.data);
            // 101 or 150 = video owner does not allow embedded playback
            if (onPlayerError) onPlayerError(event.data);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // Update videoId
  useEffect(() => {
    if (playerRef.current && playerRef.current.loadVideoById && videoId) {
      playerRef.current.loadVideoById({ videoId });
      if (isPlaying) {
        playerRef.current.playVideo();
      }
    }
  }, [videoId]);

  // Handle Play/Pause
  useEffect(() => {
    if (!playerRef.current || !playerRef.current.playVideo) return;
    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  // Handle Volume / Mute
  useEffect(() => {
    if (!playerRef.current || !playerRef.current.setVolume) return;
    if (isMuted) {
      playerRef.current.mute();
    } else {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume * 100);
    }
  }, [volume, isMuted]);

  // Handle Playback Rate
  useEffect(() => {
    if (!playerRef.current || !playerRef.current.setPlaybackRate) return;
    playerRef.current.setPlaybackRate(playbackRate);
  }, [playbackRate]);

  // Handle Seek Target
  useEffect(() => {
    if (seekTarget !== null && playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(seekTarget, true);
    }
  }, [seekTarget]);

  // Poll current playback time
  useEffect(() => {
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);

    timeIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const current = playerRef.current.getCurrentTime() || 0;
          const duration = playerRef.current.getDuration() || 0;
          if (onTimeUpdate) onTimeUpdate(current);
          if (duration > 0 && onDurationUpdate) onDurationUpdate(duration);
        } catch (e) {
          // ignore
        }
      }
    }, 400);

    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    };
  }, [onTimeUpdate, onDurationUpdate]);

  return (
    <div
      ref={containerRef}
      className="fixed -bottom-96 -right-96 w-48 h-48 opacity-0 pointer-events-none overflow-hidden z-0"
      aria-hidden="true"
    >
      <div id="yt-hidden-player" />
    </div>
  );
}
