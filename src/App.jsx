/**
 * MoodTunes Main Application Component
 * React 18 + Vite + Three.js + Web Audio API + YouTube IFrame API
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import HeroScene from './components/HeroScene';
import Vinyl3D from './components/Vinyl3D';
import MoodBar from './components/MoodBar';
import SongCard from './components/SongCard';
import PlayerBar from './components/PlayerBar';
import QueueDrawer from './components/QueueDrawer';
import BassLabModal from './components/BassLabModal';
import TextMoodModal from './components/TextMoodModal';
import YouTubeHost from './components/YouTubeHost';

import { recommender } from './utils/recommender';
import { bassLab } from './utils/audioContext';
import { MOODS, LANGUAGES } from './utils/constants';
import { Sparkles, RefreshCw, Volume2, ShieldAlert } from 'lucide-react';

export default function App() {
  // Data & Recommendation States
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState('Happy');
  const [seedSong, setSeedSong] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState(['English', 'Hindi', 'Punjabi']);
  const [recentOnly, setRecentOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('moodtunes_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI View States
  const [activeView, setActiveView] = useState('hero'); // 'hero' | 'vinyl'
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isBassLabOpen, setIsBassLabOpen] = useState(false);
  const [isTextMoodOpen, setIsTextMoodOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Playback & Queue States
  const [queue, setQueue] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  const [isBassLabMode, setIsBassLabMode] = useState(false);
  const [seekTarget, setSeekTarget] = useState(null);
  const [sleepTimer, setSleepTimer] = useState(null);

  const currentTrack = queue[currentTrackIndex] || null;

  // Show temporary toast notification
  const showToast = useCallback((msg, durationMs = 3500) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, durationMs);
  }, []);

  // 1. Fetch songs.json and initialize recommender engine
  useEffect(() => {
    const loadSongs = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('./songs.json');
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        setSongs(data);
        recommender.init(data);

        // Initial recommendation for Happy
        const initialRecs = recommender.recommendByMood('Happy', {
          limit: 12,
          languages: ['English', 'Hindi', 'Punjabi'],
          recentOnly: false,
        });
        setRecommendations(initialRecs);
        setQueue(initialRecs);
      } catch (err) {
        console.error('[MoodTunes] Error loading songs.json:', err);
        showToast('Error loading songs catalog. Please refresh.', 5000);
      } finally {
        setIsLoading(false);
      }
    };

    loadSongs();
  }, [showToast]);

  // Persist favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('moodtunes_favorites', JSON.stringify(favorites));
    } catch (e) {
      // ignore
    }
  }, [favorites]);

  // Update recommendations whenever mood, languages, or recent toggle change
  const updateRecommendations = useCallback(
    (mood, langs = selectedLanguages, recent = recentOnly) => {
      if (!recommender.isReady) return;

      const recs = recommender.recommendByMood(mood, {
        limit: 16,
        languages: langs,
        recentOnly: recent,
        randomize: true,
      });

      setSeedSong(null);
      setRecommendations(recs);
    },
    [selectedLanguages, recentOnly]
  );

  const handleSelectMood = (moodName) => {
    setSelectedMood(moodName);
    updateRecommendations(moodName);
    showToast(`Vibe switched to ${moodName} ${MOODS[moodName]?.emoji || ''}`);
  };

  const handleRefreshRecommendations = () => {
    if (seedSong) {
      handleMoreLikeThis(seedSong);
    } else {
      updateRecommendations(selectedMood);
    }
  };

  // Filter handlers
  const handleToggleLanguage = (lang) => {
    let updated;
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length === 1) return; // Keep at least one
      updated = selectedLanguages.filter((l) => l !== lang);
    } else {
      updated = [...selectedLanguages, lang];
    }
    setSelectedLanguages(updated);
    updateRecommendations(selectedMood, updated, recentOnly);
  };

  const handleToggleRecentOnly = () => {
    const nextVal = !recentOnly;
    setRecentOnly(nextVal);
    updateRecommendations(selectedMood, selectedLanguages, nextVal);
  };

  // Favorites toggle
  const handleToggleLike = (song) => {
    setFavorites((prev) => {
      const exists = prev.some((s) => s.id === song.id);
      if (exists) {
        showToast(`Removed from Favorites`);
        return prev.filter((s) => s.id !== song.id);
      } else {
        showToast(`Saved to Favorites ❤️`);
        return [...prev, song];
      }
    });
  };

  // k-NN "More Like This"
  const handleMoreLikeThis = (song) => {
    if (!recommender.isReady || !song) return;
    const similar = recommender.recommendMoreLikeThis(song, {
      limit: 12,
      languages: selectedLanguages,
    });
    setSeedSong(song);
    setRecommendations(similar);
    showToast(`Found audio twins for ${song.track_name}`);
  };

  // Playback Control Handlers
  const handlePlaySong = (song) => {
    // Add to queue if not in queue
    let newQueue = [...queue];
    let idx = newQueue.findIndex((s) => s.id === song.id);

    if (idx === -1) {
      newQueue = [song, ...queue];
      idx = 0;
      setQueue(newQueue);
    }

    setCurrentTrackIndex(idx);
    setCurrentTime(0);

    if (isBassLabMode) {
      if (song.itunes_preview_url) {
        bassLab.playPreview(song, handleSongEnd);
        setIsPlaying(true);
      } else {
        showToast('30s preview unavailable for this track, playing standard version');
        setIsBassLabMode(false);
        setIsPlaying(true);
      }
    } else {
      if (!song.youtube_id && song.itunes_preview_url) {
        showToast('Full YouTube version unavailable. Playing 30s studio preview in Bass Lab mode!');
        setIsBassLabMode(true);
        bassLab.playPreview(song, handleSongEnd);
      }
      setIsPlaying(true);
    }
  };

  const handleTogglePlay = () => {
    if (!currentTrack) {
      if (recommendations.length > 0) {
        handlePlaySong(recommendations[0]);
      }
      return;
    }

    const nextState = !isPlaying;
    setIsPlaying(nextState);

    if (isBassLabMode) {
      if (nextState) {
        bassLab.resume();
      } else {
        bassLab.pause();
      }
    }
  };

  const handleNext = () => {
    if (queue.length === 0) return;

    if (isShuffle) {
      const randIdx = Math.floor(Math.random() * queue.length);
      setCurrentTrackIndex(randIdx);
    } else {
      if (currentTrackIndex < queue.length - 1) {
        setCurrentTrackIndex(currentTrackIndex + 1);
      } else if (repeatMode === 'all') {
        setCurrentTrackIndex(0);
      } else {
        setIsPlaying(false);
        return;
      }
    }
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    if (currentTime > 3) {
      handleSeek(0);
      return;
    }
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    } else {
      setCurrentTrackIndex(queue.length - 1);
    }
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleSeek = (newTime) => {
    setCurrentTime(newTime);
    setSeekTarget(newTime);
    if (isBassLabMode) {
      bassLab.seek(newTime);
    }
    // reset seek target after tick
    setTimeout(() => setSeekTarget(null), 100);
  };

  const handleSongEnd = () => {
    if (repeatMode === 'one') {
      handleSeek(0);
      if (isBassLabMode && currentTrack) {
        bassLab.playPreview(currentTrack, handleSongEnd);
      }
      setIsPlaying(true);
    } else {
      handleNext();
    }
  };

  const handlePlayerError = (errorCode) => {
    console.warn('[MoodTunes] YouTube Player error:', errorCode);
    showToast('⚠️ Video unavailable or blocked by owner. Skipping to next song...');
    setTimeout(() => {
      handleNext();
    }, 1200);
  };

  const handleToggleShuffle = () => {
    setIsShuffle(!isShuffle);
    showToast(isShuffle ? 'Shuffle Off' : 'Shuffle On');
  };

  const handleToggleRepeat = () => {
    const modes = ['off', 'all', 'one'];
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
    showToast(`Repeat: ${next.toUpperCase()}`);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeek(currentTime + 10);
          break;
        case 'KeyN':
          e.preventDefault();
          handleNext();
          break;
        case 'KeyP':
          e.preventDefault();
          handlePrev();
          break;
        case 'KeyM':
          e.preventDefault();
          setIsMuted((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, currentTrack, queue, currentTrackIndex]);

  // Media Session API Integration (Headphone & Lock-screen controls)
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.track_name,
        artist: currentTrack.artists,
        album: `MoodTunes • ${currentTrack.language || 'Music'}`,
        artwork: currentTrack.artwork_url
          ? [{ src: currentTrack.artwork_url, sizes: '512x512', type: 'image/jpeg' }]
          : [],
      });

      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNext());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrev());
      navigator.mediaSession.setActionHandler('seekbackward', () =>
        handleSeek(Math.max(0, currentTime - 10))
      );
      navigator.mediaSession.setActionHandler('seekforward', () => handleSeek(currentTime + 10));
    }
  }, [currentTrack, currentTime]);

  // Sleep Timer Interval
  useEffect(() => {
    if (!sleepTimer) return;
    const interval = setInterval(() => {
      setSleepTimer((prev) => {
        if (prev <= 1) {
          setIsPlaying(false);
          showToast('🌙 Sleep timer expired. Playback paused.');
          return null;
        }
        return prev - 1;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [sleepTimer, showToast]);

  // Displayed Song List based on Search and Favorites Filter
  const displayedSongs = recommendations.filter((song) => {
    if (showFavoritesOnly) {
      return favorites.some((f) => f.id === song.id);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = song.track_name.toLowerCase().includes(q);
      const matchArtist = song.artists.toLowerCase().includes(q);
      return matchTitle || matchArtist;
    }
    return true;
  });

  const activeMoodObj = MOODS[selectedMood] || MOODS.Happy;

  return (
    <div className="min-h-screen bg-[#080B10] text-zinc-100 pb-36 selection:bg-pink-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-xs rounded-full shadow-2xl shadow-pink-500/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLanguages={selectedLanguages}
        onToggleLanguage={handleToggleLanguage}
        recentOnly={recentOnly}
        onToggleRecentOnly={handleToggleRecentOnly}
        showFavoritesOnly={showFavoritesOnly}
        onToggleFavorites={() => setShowFavoritesOnly(!showFavoritesOnly)}
        favoritesCount={favorites.length}
        activeView={activeView}
        onChangeView={setActiveView}
        onOpenTextMoodModal={() => setIsTextMoodOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 pt-6">
        {/* 3D Scene Container (Hero Floating Orbs OR 3D Vinyl Turntable) */}
        <section className="mb-6">
          {activeView === 'hero' ? (
            <HeroScene selectedMood={selectedMood} onSelectMood={handleSelectMood} />
          ) : (
            <Vinyl3D
              isPlaying={isPlaying}
              currentTrack={currentTrack}
              selectedMood={selectedMood}
            />
          )}
        </section>

        {/* 2D Mood Bar */}
        <MoodBar selectedMood={selectedMood} onSelectMood={handleSelectMood} />

        {/* Active Mood / Seed Song Banner */}
        <div
          className="p-4 md:p-5 rounded-2xl mb-6 backdrop-blur-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl transition-all"
          style={{
            borderColor: activeMoodObj.color + '40',
            background: `linear-gradient(135deg, ${activeMoodObj.color}15 0%, rgba(22, 27, 34, 0.8) 100%)`,
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{activeMoodObj.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight" style={{ color: activeMoodObj.color }}>
                  {seedSong ? `Audio Twins: ${seedSong.track_name}` : `${selectedMood} Flow`}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
                  {displayedSongs.length} tracks
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                {seedSong
                  ? `k-NN metric distance matching audio twin profile for ${seedSong.artists}`
                  : `${activeMoodObj.description} • "${activeMoodObj.quote}"`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {seedSong && (
              <button
                onClick={() => handleSelectMood(selectedMood)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-200 transition-colors"
              >
                Clear Twins
              </button>
            )}
            <button
              onClick={handleRefreshRecommendations}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Shuffle Batch</span>
            </button>
          </div>
        </div>

        {/* Songs Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : displayedSongs.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/[0.02] border border-white/5">
            <ShieldAlert className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-zinc-300">No songs match your criteria</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Try enabling all languages (English, Hindi, Punjabi) or disabling the 2022+ recent songs filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedSongs.map((song, idx) => (
              <SongCard
                key={song.id || idx}
                song={song}
                index={idx}
                isPlaying={isPlaying && currentTrack?.id === song.id}
                isCurrentSong={currentTrack?.id === song.id}
                isLiked={favorites.some((f) => f.id === song.id)}
                onPlay={handlePlaySong}
                onToggleLike={handleToggleLike}
                onMoreLikeThis={handleMoreLikeThis}
                moodColor={activeMoodObj.color}
              />
            ))}
          </div>
        )}
      </main>

      {/* Hidden YouTube Player IFrame Host */}
      <YouTubeHost
        videoId={currentTrack?.youtube_id}
        isPlaying={isPlaying && !isBassLabMode}
        volume={volume}
        isMuted={isMuted}
        playbackRate={playbackRate}
        onSongEnd={handleSongEnd}
        onPlayerError={handlePlayerError}
        onTimeUpdate={(t) => setCurrentTime(t)}
        onDurationUpdate={(d) => setDuration(d)}
        seekTarget={seekTarget}
      />

      {/* Bottom Sticky Player Bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        playbackRate={playbackRate}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        isBassLabMode={isBassLabMode}
        isLiked={currentTrack ? favorites.some((f) => f.id === currentTrack.id) : false}
        sleepTimer={sleepTimer}
        onTogglePlay={handleTogglePlay}
        onPrev={handlePrev}
        onNext={handleNext}
        onSeek={handleSeek}
        onVolumeChange={(v) => {
          setVolume(v);
          if (isMuted) setIsMuted(false);
        }}
        onToggleMute={() => setIsMuted(!isMuted)}
        onRateChange={setPlaybackRate}
        onToggleShuffle={handleToggleShuffle}
        onToggleRepeat={handleToggleRepeat}
        onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
        onToggleLike={() => currentTrack && handleToggleLike(currentTrack)}
        onOpenBassLab={() => setIsBassLabOpen(true)}
        onSetSleepTimer={(mins) => {
          setSleepTimer(mins);
          showToast(mins ? `Sleep timer set for ${mins} minutes 🌙` : 'Sleep timer disabled');
        }}
      />

      {/* Up Next Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={queue}
        currentTrack={currentTrack}
        onSelectTrack={handlePlaySong}
        onRemoveTrack={(index) => {
          setQueue((prev) => prev.filter((_, i) => i !== index));
        }}
        onClearQueue={() => {
          setQueue(currentTrack ? [currentTrack] : []);
          showToast('Queue cleared');
        }}
      />

      {/* Bass Lab DSP Studio Modal */}
      <BassLabModal
        isOpen={isBassLabOpen}
        onClose={() => setIsBassLabOpen(false)}
        currentTrack={currentTrack}
      />

      {/* Text Emotion Detection AI Modal */}
      <TextMoodModal
        isOpen={isTextMoodOpen}
        onClose={() => setIsTextMoodOpen(false)}
        onSelectMood={handleSelectMood}
      />
    </div>
  );
}
