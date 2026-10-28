/**
 * MoodTunes - AI Mood-Based Music Experience
 * Clean, modern Spotify-like music discovery web app.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AudioEngine from './components/AudioEngine';
import PlayerBar from './components/PlayerBar';
import SongRow from './components/SongRow';
import SpinningVinyl from './components/SpinningVinyl';
import DebugPanel from './components/DebugPanel';

import { recommender } from './utils/recommender';
import { MOODS } from './utils/constants';
import { Bug, Sparkles, RefreshCw, Heart, Music2, Info } from 'lucide-react';

const MOOD_LIST = [
  { id: 'Happy', name: 'Happy', emoji: '😊', color: '#FFD166', gradient: 'from-amber-500/20 to-orange-500/10' },
  { id: 'Sad', name: 'Sad', emoji: '😢', color: '#118AB2', gradient: 'from-sky-500/20 to-blue-900/10' },
  { id: 'Relaxed', name: 'Relaxed', emoji: '🌿', color: '#06D6A0', gradient: 'from-emerald-500/20 to-teal-900/10' },
  { id: 'Energetic', name: 'Energetic', emoji: '⚡', color: '#EF476F', gradient: 'from-rose-500/20 to-pink-900/10' },
  { id: 'Focus', name: 'Focus', emoji: '🎯', color: '#8338EC', gradient: 'from-purple-500/20 to-indigo-900/10' },
  { id: 'Angry', name: 'Angry', emoji: '🔥', color: '#E63946', gradient: 'from-red-600/20 to-rose-950/10' },
];

export default function App() {
  // Catalog & Recommendation States
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState('Happy');
  const [selectedLanguage, setSelectedLanguage] = useState('All'); // 'All' | 'Hindi' | 'Punjabi' | 'English'
  const [recommendations, setRecommendations] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('moodtunes_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Playback States
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isBassEnabled, setIsBassEnabled] = useState(false);
  const [bassBoostDb, setBassBoostDb] = useState(6);

  // Audio Telemetry / Debug States
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [audioSource, setAudioSource] = useState(null); // 'youtube' | 'preview' | 'none'
  const [playerState, setPlayerState] = useState('IDLE');
  const [lastErrorCode, setLastErrorCode] = useState(null);
  const [audioContextState, setAudioContextState] = useState('uninitialized');
  const [toastMessage, setToastMessage] = useState(null);

  // Ref to AudioEngine methods
  const audioEngineRef = useRef(null);

  const currentTrack = recommendations[currentTrackIndex] || null;
  const currentMoodObj = MOOD_LIST.find((m) => m.id === selectedMood) || MOOD_LIST[0];

  // Toast helper
  const showToast = useCallback((msg, ms = 3200) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, ms);
  }, []);

  // 1. Load songs.json on mount
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('./songs.json');
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        setSongs(data);
        recommender.init(data);

        // Fetch initial recommendations for Happy
        const initial = recommender.recommendByMood('Happy', {
          limit: 12,
          languages: ['Hindi', 'Punjabi', 'English'],
          randomize: true,
        });
        setRecommendations(initial);
      } catch (err) {
        console.error('[MoodTunes] Catalog load error:', err);
        showToast('Error loading songs catalog. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, [showToast]);

  // Persist favorites
  useEffect(() => {
    try {
      localStorage.setItem('moodtunes_favorites', JSON.stringify(favorites));
    } catch (e) {}
  }, [favorites]);

  // 2. Update recommendations when mood or language filter changes
  const updateRecommendations = useCallback(
    (mood, lang = selectedLanguage) => {
      if (!recommender.isReady) return;

      const langs = lang === 'All' ? ['Hindi', 'Punjabi', 'English'] : [lang];
      const recs = recommender.recommendByMood(mood, {
        limit: 12,
        languages: langs,
        randomize: true,
      });

      setRecommendations(recs);
      setCurrentTrackIndex(0);
      setCurrentTime(0);
    },
    [selectedLanguage]
  );

  // Mood switch handler
  const handleSelectMood = (moodId) => {
    setSelectedMood(moodId);
    updateRecommendations(moodId, selectedLanguage);
    const m = MOOD_LIST.find((item) => item.id === moodId);
    showToast(`Mood: ${m?.name} ${m?.emoji}`);
  };

  // Language filter handler
  const handleSelectLanguage = (lang) => {
    setSelectedLanguage(lang);
    updateRecommendations(selectedMood, lang);
  };

  // Track play handler (from user click on row or play button)
  const handlePlaySong = (song) => {
    // Resume audio context on user interaction
    audioEngineRef.current?.resumeContext();

    const idx = recommendations.findIndex((s) => s.id === song.id);
    if (idx !== -1) {
      if (idx === currentTrackIndex && isPlaying) {
        setIsPlaying(false);
      } else {
        setCurrentTrackIndex(idx);
        setIsPlaying(true);
      }
    } else {
      // Put at head of list and play
      setRecommendations((prev) => [song, ...prev]);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
    }
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    audioEngineRef.current?.resumeContext();
    if (!currentTrack && recommendations.length > 0) {
      setCurrentTrackIndex(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying(!isPlaying);
  };

  // Next Track
  const handleNext = () => {
    if (recommendations.length === 0) return;
    const nextIdx = (currentTrackIndex + 1) % recommendations.length;
    setCurrentTrackIndex(nextIdx);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  // Previous Track
  const handlePrev = () => {
    if (recommendations.length === 0) return;
    if (currentTime > 3) {
      audioEngineRef.current?.seekTo(0);
      return;
    }
    const prevIdx = (currentTrackIndex - 1 + recommendations.length) % recommendations.length;
    setCurrentTrackIndex(prevIdx);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  // Seek handler
  const handleSeek = (newTime) => {
    setCurrentTime(newTime);
    audioEngineRef.current?.seekTo(newTime);
  };

  // Jump ±10s handler
  const handleJump = (delta) => {
    audioEngineRef.current?.jump(delta);
  };

  // Auto skip on song end
  const handleSongEnd = () => {
    handleNext();
  };

  // Error handling: Auto skip un-embeddable songs
  const handlePlayerError = (code) => {
    setLastErrorCode(code);
    showToast("This song can't play here, skipping to next...");
    setTimeout(() => {
      handleNext();
    }, 1200);
  };

  // Favorites toggle
  const handleToggleLike = (song) => {
    setFavorites((prev) => {
      const exists = prev.some((s) => s.id === song.id);
      if (exists) {
        showToast('Removed from favorites');
        return prev.filter((s) => s.id !== song.id);
      } else {
        showToast('Saved to favorites ❤️');
        return [...prev, song];
      }
    });
  };

  // Keyboard Shortcuts (Space, Left/Right arrows, N, P, M)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleJump(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleJump(10);
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
  }, [currentTrack, isPlaying, recommendations, currentTrackIndex, currentTime]);

  // Catalog counts for debug telemetry
  const catalogStats = {
    total: songs.length,
    playable: songs.filter((s) => s.youtube_id || s.itunes_preview_url).length,
  };

  return (
    <div className="min-h-screen bg-[#080B10] text-[#F0F6FC] font-sans antialiased pb-28 selection:bg-pink-500 selection:text-white relative overflow-x-hidden">
      {/* Dynamic Mood Background Gradient (Tasteful, soft, lightweight) */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000 -z-10 opacity-30"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${currentMoodObj.color}33, transparent)`,
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#161B26]/90 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-full shadow-2xl text-xs md:text-sm font-medium text-white flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ZONE A: TOP BAR (Logo + Language Filters + Debug Button) */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              MoodTunes 🎵
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Pick your mood, then tap a song.
          </p>
        </div>

        {/* Language Filter Pills & Debug Button */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <div className="flex items-center bg-white/[0.04] p-1 rounded-2xl border border-white/5">
            {['All', 'Hindi', 'Punjabi', 'English'].map((lang) => {
              const isActive = selectedLanguage === lang;
              return (
                <button
                  key={lang}
                  onClick={() => handleSelectLanguage(lang)}
                  className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition ${
                    isActive
                      ? 'bg-white text-black shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>

          {/* Debug Toggle Button */}
          <button
            onClick={() => setIsDebugOpen(!isDebugOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-mono flex items-center gap-1.5 transition border ${
              isDebugOpen
                ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/5'
            }`}
            title="Toggle Engine Telemetry"
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Debug</span>
          </button>
        </div>
      </header>

      {/* ZONE B: 6 BIG MOOD CHIPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {MOOD_LIST.map((mood) => {
            const isSelected = selectedMood === mood.id;
            return (
              <button
                key={mood.id}
                onClick={() => handleSelectMood(mood.id)}
                className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl font-bold text-sm md:text-base transition-all duration-300 shadow-md ${
                  isSelected
                    ? 'scale-[1.03] text-black shadow-lg font-extrabold ring-2 ring-white/20'
                    : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white border border-white/5'
                }`}
                style={{
                  backgroundColor: isSelected ? mood.color : undefined,
                  boxShadow: isSelected ? `0 0 25px ${mood.color}40` : undefined,
                }}
              >
                <span className="text-xl md:text-2xl">{mood.emoji}</span>
                <span>{mood.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ZONE C: MAIN CONTENT (Vinyl on left + Clean Spotify-Style Song List on right) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Desktop): Tasteful Spinning Vinyl */}
          <div className="lg:col-span-4 hidden lg:block sticky top-8">
            <SpinningVinyl
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              moodColor={currentMoodObj.color}
              moodEmoji={currentMoodObj.emoji}
            />
          </div>

          {/* Right Column: Song List */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <span>{currentMoodObj.emoji}</span>
                <span>Recommended for {currentMoodObj.name}</span>
              </h2>

              <button
                onClick={() => updateRecommendations(selectedMood)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08]"
                title="Shuffle New Recommendations"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>
            </div>

            {/* Loading Skeletons */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              /* Empty State */
              <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                <Music2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No songs found for this filter</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Try switching the language filter to "All" or picking another mood to explore more tracks.
                </p>
                <button
                  onClick={() => handleSelectLanguage('All')}
                  className="mt-4 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-slate-200 transition"
                >
                  Reset Language to All
                </button>
              </div>
            ) : (
              /* Song Rows */
              <div className="space-y-2.5">
                {recommendations.map((song, idx) => (
                  <SongRow
                    key={song.id || idx}
                    song={song}
                    index={idx}
                    isCurrent={currentTrack?.id === song.id}
                    isPlaying={isPlaying}
                    isLiked={favorites.some((f) => f.id === song.id)}
                    onPlay={handlePlaySong}
                    onToggleLike={handleToggleLike}
                    moodColor={currentMoodObj.color}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* HIDDEN / OFF-SCREEN UNIFIED AUDIO ENGINE */}
      <AudioEngine
        ref={audioEngineRef}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        volume={volume}
        isMuted={isMuted}
        isBassEnabled={isBassEnabled}
        setIsBassEnabled={setIsBassEnabled}
        bassBoostDb={bassBoostDb}
        onSongEnd={handleSongEnd}
        onPlayerError={handlePlayerError}
        onTimeUpdate={setCurrentTime}
        onDurationUpdate={setDuration}
        onAudioSourceChange={setAudioSource}
        onPlayerStateChange={setPlayerState}
        onAudioContextStateChange={setAudioContextState}
        onToast={showToast}
      />

      {/* STICKY BOTTOM PLAYER BAR */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isBassEnabled={isBassEnabled}
        bassBoostDb={bassBoostDb}
        audioSource={audioSource}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onJump={handleJump}
        onSeek={handleSeek}
        onVolumeChange={setVolume}
        onToggleMute={() => setIsMuted(!isMuted)}
        onToggleBass={() => setIsBassEnabled(!isBassEnabled)}
        onBassDbChange={setBassBoostDb}
        moodColor={currentMoodObj.color}
      />

      {/* DEBUG TELEMETRY PANEL */}
      <DebugPanel
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
        currentSong={currentTrack}
        audioSource={audioSource}
        playerState={playerState}
        lastErrorCode={lastErrorCode}
        audioContextState={audioContextState}
        bassBoostDb={bassBoostDb}
        isBassEnabled={isBassEnabled}
        catalogStats={catalogStats}
      />
    </div>
  );
}
