/**
 * AudioEngine.jsx
 * Unified Audio Controller handling YouTube IFrame API and HTML5 Preview Audio.
 * Features:
 * - Single persistent YouTube player instance in visible, off-screen fixed div.
 * - Single HTMLAudioElement for iTunes 30s previews.
 * - On-demand Web Audio API Bass Boost with automatic CORS fallback.
 * - Real-time error handling with auto-skip on un-embeddable songs.
 */

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

const AudioEngine = forwardRef(function AudioEngine(
  {
    currentTrack,
    isPlaying,
    setIsPlaying,
    volume,
    isMuted,
    isBassEnabled,
    setIsBassEnabled,
    bassBoostDb,
    onSongEnd,
    onPlayerError,
    onTimeUpdate,
    onDurationUpdate,
    onAudioSourceChange,
    onPlayerStateChange,
    onAudioContextStateChange,
    onToast,
  },
  ref
) {
  // References
  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);
  const audioElRef = useRef(null);
  const boostAudioElRef = useRef(null);

  // Web Audio graph refs
  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const bassFilterRef = useRef(null);
  const gainNodeRef = useRef(null);
  const webAudioConnectedRef = useRef(false);

  // Internal state
  const isYtApiReadyRef = useRef(false);
  const isYtPlayerReadyRef = useRef(false);
  const pendingVideoIdRef = useRef(null);
  const [activeEngine, setActiveEngine] = useState(null); // 'youtube' | 'preview' | null
  const progressTimerRef = useRef(null);

  // Expose control methods to parent (play, pause, seek, jump)
  useImperativeHandle(ref, () => ({
    seekTo: (timeInSeconds) => {
      if (activeEngine === 'youtube' && ytPlayerRef.current?.seekTo) {
        ytPlayerRef.current.seekTo(timeInSeconds, true);
      } else if (activeEngine === 'preview') {
        const el = isBassEnabled ? boostAudioElRef.current : audioElRef.current;
        if (el && !isNaN(el.duration)) {
          el.currentTime = Math.max(0, Math.min(el.duration, timeInSeconds));
        }
      }
    },
    jump: (deltaSeconds) => {
      if (activeEngine === 'youtube' && ytPlayerRef.current?.getCurrentTime) {
        try {
          const curr = ytPlayerRef.current.getCurrentTime() || 0;
          ytPlayerRef.current.seekTo(Math.max(0, curr + deltaSeconds), true);
        } catch (e) {}
      } else if (activeEngine === 'preview') {
        const el = isBassEnabled ? boostAudioElRef.current : audioElRef.current;
        if (el) {
          el.currentTime = Math.max(0, Math.min(el.duration || 30, el.currentTime + deltaSeconds));
        }
      }
    },
    resumeContext: () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().then(() => {
          if (onAudioContextStateChange) onAudioContextStateChange(audioCtxRef.current.state);
        });
      }
    },
  }));

  // ==========================================
  // 1. YouTube API Single Initialization
  // ==========================================
  useEffect(() => {
    const initYT = () => {
      if (ytPlayerRef.current || !window.YT || !window.YT.Player) return;

      try {
        ytPlayerRef.current = new window.YT.Player('yt-iframe-player-target', {
          width: '320',
          height: '180',
          videoId: '',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin,
            playsinline: 1,
          },
          events: {
            onReady: (event) => {
              isYtPlayerReadyRef.current = true;
              event.target.setVolume(isMuted ? 0 : Math.round(volume * 100));
              if (onPlayerStateChange) onPlayerStateChange('READY');

              // If a track was queued before player was ready, load it now
              if (pendingVideoIdRef.current) {
                event.target.loadVideoById(pendingVideoIdRef.current);
                pendingVideoIdRef.current = null;
                if (isPlaying) {
                  event.target.playVideo();
                }
              }
            },
            onStateChange: (event) => {
              const stateCode = event.data;
              let stateText = 'UNKNOWN';
              switch (stateCode) {
                case -1:
                  stateText = 'UNSTARTED';
                  break;
                case 0:
                  stateText = 'ENDED';
                  if (onSongEnd) onSongEnd();
                  break;
                case 1:
                  stateText = 'PLAYING (YouTube)';
                  setIsPlaying(true);
                  break;
                case 2:
                  stateText = 'PAUSED';
                  setIsPlaying(false);
                  break;
                case 3:
                  stateText = 'BUFFERING';
                  break;
                case 5:
                  stateText = 'CUED';
                  break;
                default:
                  stateText = `YT_${stateCode}`;
              }
              if (onPlayerStateChange) onPlayerStateChange(stateText);
            },
            onError: (event) => {
              const code = event.data;
              console.warn('[YouTube] Playback Error Code:', code);
              if (onPlayerError) onPlayerError(code);
            },
          },
        });
      } catch (err) {
        console.error('[YouTube] Init player error:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      isYtApiReadyRef.current = true;
      initYT();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        isYtApiReadyRef.current = true;
        initYT();
      };

      // Ensure script tag is present
      if (!document.getElementById('yt-iframe-sdk')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-sdk';
        tag.src = 'https://www.youtube.com/iframe_api';
        const first = document.getElementsByTagName('script')[0];
        first.parentNode.insertBefore(tag, first);
      }
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // ==========================================
  // 2. Playback Switch Logic when currentTrack changes
  // ==========================================
  useEffect(() => {
    if (!currentTrack) return;

    // Reset times
    if (onTimeUpdate) onTimeUpdate(0);

    // Stop both engines first
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
    }
    if (boostAudioElRef.current) {
      boostAudioElRef.current.pause();
      boostAudioElRef.current.currentTime = 0;
    }

    // Determine engine based on song attributes
    if (currentTrack.youtube_id) {
      // PLAY VIA YOUTUBE
      setActiveEngine('youtube');
      if (onAudioSourceChange) onAudioSourceChange('youtube');

      if (isYtPlayerReadyRef.current && ytPlayerRef.current?.loadVideoById) {
        try {
          ytPlayerRef.current.loadVideoById(currentTrack.youtube_id);
          if (isPlaying) {
            ytPlayerRef.current.playVideo();
          }
        } catch (e) {
          console.warn('[YouTube] loadVideoById error:', e);
        }
      } else {
        pendingVideoIdRef.current = currentTrack.youtube_id;
      }
    } else if (currentTrack.itunes_preview_url) {
      // PLAY VIA ITUNES PREVIEW
      setActiveEngine('preview');
      if (onAudioSourceChange) onAudioSourceChange('preview');
      if (onPlayerStateChange) onPlayerStateChange('LOADING PREVIEW');

      // Pause YouTube player if active
      if (ytPlayerRef.current?.pauseVideo) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch (e) {}
      }

      // Check whether to use bass boosted audio or plain audio
      const targetEl = isBassEnabled ? boostAudioElRef.current : audioElRef.current;
      if (targetEl) {
        targetEl.src = currentTrack.itunes_preview_url;
        targetEl.volume = isMuted ? 0 : volume;
        if (isPlaying) {
          targetEl.play().catch((err) => {
            console.warn('[PreviewAudio] Playback failed:', err);
            if (isBassEnabled) {
              // Try falling back to plain audio
              fallbackToPlainAudio();
            }
          });
        }
      }
    } else {
      // NO PLAYABLE AUDIO
      setActiveEngine(null);
      if (onAudioSourceChange) onAudioSourceChange('none');
      if (onPlayerStateChange) onPlayerStateChange('NO_AUDIO');
      if (onToast) onToast('⚠️ No playable audio stream for this song. Skipping to next...');
      if (onPlayerError) onPlayerError('NO_AUDIO_STREAM');
    }
  }, [currentTrack]);

  // ==========================================
  // 3. Play / Pause Control
  // ==========================================
  useEffect(() => {
    if (activeEngine === 'youtube') {
      if (ytPlayerRef.current) {
        try {
          if (isPlaying) {
            ytPlayerRef.current.playVideo();
          } else {
            ytPlayerRef.current.pauseVideo();
          }
        } catch (e) {}
      }
    } else if (activeEngine === 'preview') {
      const targetEl = isBassEnabled ? boostAudioElRef.current : audioElRef.current;
      if (targetEl) {
        if (isPlaying) {
          targetEl.play().catch((err) => {
            console.warn('[Audio] play error:', err);
          });
        } else {
          targetEl.pause();
        }
      }
    }
  }, [isPlaying, activeEngine, isBassEnabled]);

  // ==========================================
  // 4. Volume / Mute Control
  // ==========================================
  useEffect(() => {
    const volNum = isMuted ? 0 : volume;

    if (ytPlayerRef.current?.setVolume) {
      try {
        if (isMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(Math.round(volNum * 100));
        }
      } catch (e) {}
    }

    if (audioElRef.current) {
      audioElRef.current.volume = volNum;
    }
    if (boostAudioElRef.current) {
      boostAudioElRef.current.volume = volNum;
    }
  }, [volume, isMuted]);

  // ==========================================
  // 5. Web Audio / Bass Boost Graph Setup
  // ==========================================
  const initWebAudio = () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      if (onAudioContextStateChange) onAudioContextStateChange(ctx.state);

      if (boostAudioElRef.current && !sourceNodeRef.current) {
        sourceNodeRef.current = ctx.createMediaElementSource(boostAudioElRef.current);
        bassFilterRef.current = ctx.createBiquadFilter();
        bassFilterRef.current.type = 'lowshelf';
        bassFilterRef.current.frequency.value = 120;
        bassFilterRef.current.gain.value = bassBoostDb;

        gainNodeRef.current = ctx.createGain();
        gainNodeRef.current.gain.value = 1.0;

        sourceNodeRef.current.connect(bassFilterRef.current);
        bassFilterRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(ctx.destination);
        webAudioConnectedRef.current = true;
      }
      return true;
    } catch (err) {
      console.warn('[WebAudio] Failed to setup graph:', err);
      if (onAudioContextStateChange) onAudioContextStateChange('error');
      return false;
    }
  };

  const fallbackToPlainAudio = () => {
    if (onToast) onToast('Bass boost unavailable for this song — playing standard audio');
    setIsBassEnabled(false);
    if (boostAudioElRef.current) {
      boostAudioElRef.current.pause();
    }
    if (audioElRef.current && currentTrack?.itunes_preview_url) {
      audioElRef.current.src = currentTrack.itunes_preview_url;
      audioElRef.current.currentTime = boostAudioElRef.current?.currentTime || 0;
      audioElRef.current.volume = isMuted ? 0 : volume;
      if (isPlaying) {
        audioElRef.current.play().catch(() => {});
      }
    }
  };

  // Handle Bass Boost Toggle or DB Change
  useEffect(() => {
    if (isBassEnabled) {
      const ok = initWebAudio();
      if (!ok) {
        fallbackToPlainAudio();
        return;
      }

      if (bassFilterRef.current && audioCtxRef.current) {
        bassFilterRef.current.gain.setValueAtTime(bassBoostDb, audioCtxRef.current.currentTime);
      }

      // If playing preview, switch source element to boosted audio element
      if (activeEngine === 'preview' && currentTrack?.itunes_preview_url) {
        const currTime = audioElRef.current?.currentTime || 0;
        if (audioElRef.current) {
          audioElRef.current.pause();
        }
        if (boostAudioElRef.current) {
          boostAudioElRef.current.src = currentTrack.itunes_preview_url;
          boostAudioElRef.current.currentTime = currTime;
          boostAudioElRef.current.volume = isMuted ? 0 : volume;
          if (isPlaying) {
            boostAudioElRef.current.play().catch(() => {
              fallbackToPlainAudio();
            });
          }
        }
      }
    } else {
      // Disabling bass boost
      if (bassFilterRef.current && audioCtxRef.current) {
        bassFilterRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      }
      if (activeEngine === 'preview' && currentTrack?.itunes_preview_url) {
        const currTime = boostAudioElRef.current?.currentTime || 0;
        if (boostAudioElRef.current) {
          boostAudioElRef.current.pause();
        }
        if (audioElRef.current) {
          audioElRef.current.src = currentTrack.itunes_preview_url;
          audioElRef.current.currentTime = currTime;
          audioElRef.current.volume = isMuted ? 0 : volume;
          if (isPlaying) {
            audioElRef.current.play().catch(() => {});
          }
        }
      }
    }
  }, [isBassEnabled, bassBoostDb]);

  // ==========================================
  // 6. Time and Progress Polling
  // ==========================================
  useEffect(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    progressTimerRef.current = setInterval(() => {
      if (activeEngine === 'youtube') {
        if (ytPlayerRef.current?.getCurrentTime) {
          try {
            const curr = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            if (onTimeUpdate) onTimeUpdate(curr);
            if (dur > 0 && onDurationUpdate) onDurationUpdate(dur);
          } catch (e) {}
        }
      } else if (activeEngine === 'preview') {
        const activeEl = isBassEnabled ? boostAudioElRef.current : audioElRef.current;
        if (activeEl) {
          const curr = activeEl.currentTime || 0;
          const dur = activeEl.duration || 30;
          if (onTimeUpdate) onTimeUpdate(curr);
          if (dur > 0 && onDurationUpdate) onDurationUpdate(dur);
        }
      }
    }, 300);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [activeEngine, isBassEnabled]);

  // ==========================================
  // 7. Plain HTMLAudioElement Event Handlers
  // ==========================================
  const handleAudioPlay = () => {
    setIsPlaying(true);
    if (onPlayerStateChange) onPlayerStateChange('PLAYING (30s preview)');
  };

  const handleAudioPause = () => {
    setIsPlaying(false);
    if (onPlayerStateChange) onPlayerStateChange('PAUSED');
  };

  const handleAudioEnded = () => {
    if (onPlayerStateChange) onPlayerStateChange('ENDED');
    if (onSongEnd) onSongEnd();
  };

  const handleAudioError = (e) => {
    console.warn('[HTMLAudioElement] Audio error:', e);
    if (isBassEnabled) {
      fallbackToPlainAudio();
    } else {
      if (onToast) onToast('⚠️ Audio preview unavailable. Skipping to next song...');
      if (onPlayerError) onPlayerError('HTML_AUDIO_ERR');
    }
  };

  return (
    <>
      {/* 
        CRITICAL YOUTUBE FIX:
        Mount YouTube IFrame Player in a div that is VISIBLE to browser layout
        but moved off-screen with position: fixed; left: -9999px; width: 320px; height: 180px.
        NEVER use display: none or visibility: hidden or opacity: 0!
      */}
      <div
        ref={ytContainerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: -9999,
          width: 320,
          height: 180,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <div id="yt-iframe-player-target" />
      </div>

      {/* Plain HTML5 Audio element for 30s previews (Zero Web Audio interference) */}
      <audio
        ref={audioElRef}
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        preload="auto"
      />

      {/* Secondary Audio element dedicated to Web Audio Bass Boost (crossOrigin=anonymous) */}
      <audio
        ref={boostAudioElRef}
        crossOrigin="anonymous"
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        preload="auto"
      />
    </>
  );
});

export default AudioEngine;
