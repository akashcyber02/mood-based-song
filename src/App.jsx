/**
 * MoodTunes - AI Mood-Based Music Discovery & Streaming Web App
 * Final Polish: Endless No-Repeat Queue, Fuse.js Search, Honest Bass Lab,
 * Welcome Overlay, About Modal, Surprise Me, Favorites, and Session History.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Fuse from 'fuse.js';

import AudioEngine from './components/AudioEngine';
import PlayerBar from './components/PlayerBar';
import SongRow from './components/SongRow';
import SpinningVinyl from './components/SpinningVinyl';
import DebugPanel from './components/DebugPanel';
import BassLabModal from './components/BassLabModal';
import WelcomeModal from './components/WelcomeModal';
import AboutModal from './components/AboutModal';
import TextMoodModal from './components/TextMoodModal';

import { recommender } from './utils/recommender';
import { MOODS } from './utils/constants';
import {
  Search,
  Sparkles,
  RefreshCw,
  Heart,
  Music2,
  Bug,
  HelpCircle,
  Dices,
  Flame,
  MessageSquareHeart,
  ChevronDown,
} from 'lucide-react';

const MOOD_LIST = [
  { id: 'Happy', name: 'Happy', emoji: '😊', color: '#FFD166' },
  { id: 'Sad', name: 'Sad', emoji: '😢', color: '#118AB2' },
  { id: 'Relaxed', name: 'Relaxed', emoji: '🌿', color: '#06D6A0' },
  { id: 'Energetic', name: 'Energetic', emoji: '⚡', color: '#EF476F' },
  { id: 'Focus', name: 'Focus', emoji: '🎯', color: '#8338EC' },
  { id: 'Angry', name: 'Angry', emoji: '🔥', color: '#E63946' },
];

const LANGUAGES = ['All', 'Hindi', 'Punjabi', 'Haryanvi', 'English'];

export default function App() {
  // Catalog & Recommendation States
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState('Happy');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [recentOnly, setRecentOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Recommendations & Queue
  const [recommendations, setRecommendations] = useState([]);
  const [displayCount, setDisplayCount] = useState(10);
  const [queue, setQueue] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [historyStack, setHistoryStack] = useState([]);

  // Session History (moods visited)
  const [moodHistory, setMoodHistory] = useState(['Happy']);

  // Played IDs per mood (persisted in localStorage)
  const [playedIdsByMood, setPlayedIdsByMood] = useState(() => {
    try {
      const saved = localStorage.getItem('moodtunes_played_ids');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Favorites
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('moodtunes_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchInputRef = useRef(null);

  // Playback States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  // Modals & Panels
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => {
    return !localStorage.getItem('moodtunes_welcomed');
  });
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isBassLabOpen, setIsBassLabOpen] = useState(false);
  const [isTextMoodOpen, setIsTextMoodOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  // Audio Telemetry
  const [audioSource, setAudioSource] = useState(null);
  const [playerState, setPlayerState] = useState('IDLE');
  const [lastErrorCode, setLastErrorCode] = useState(null);
  const [audioContextState, setAudioContextState] = useState('uninitialized');
  const [toastMessage, setToastMessage] = useState(null);

  const audioEngineRef = useRef(null);
  const fuseRef = useRef(null);

  const currentTrack = queue[currentTrackIndex] || recommendations[0] || null;
  const currentMoodObj = MOOD_LIST.find((m) => m.id === selectedMood) || MOOD_LIST[0];

  const showToast = useCallback((msg, ms = 3200) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, ms);
  }, []);

  // 1. Fetch songs.json on mount and initialize Fuse.js
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('./songs.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSongs(data);
        recommender.init(data);

        // Initialize Fuse for fuzzy search
        fuseRef.current = new Fuse(data, {
          keys: ['track_name', 'artists'],
          threshold: 0.35,
          ignoreLocation: true,
          minMatchCharLength: 2,
        });

        // Initial recommendation for Happy
        const playedForMood = playedIdsByMood['Happy'] || [];
        const initial = recommender.recommendByMood('Happy', {
          limit: 20,
          languages: ['Hindi', 'Punjabi', 'Haryanvi', 'English'],
          recentOnly: false,
          excludeIds: new Set(playedForMood),
          randomize: true,
        });

        setRecommendations(initial);
        setQueue(initial);
      } catch (err) {
        console.error('[MoodTunes] Catalog load error:', err);
        showToast('Error loading songs catalog. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalog();
  }, [showToast]);

  // Debounce search query by 200ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Persist played IDs & favorites
  useEffect(() => {
    try {
      localStorage.setItem('moodtunes_played_ids', JSON.stringify(playedIdsByMood));
    } catch (e) {}
  }, [playedIdsByMood]);

  useEffect(() => {
    try {
      localStorage.setItem('moodtunes_favorites', JSON.stringify(favorites));
    } catch (e) {}
  }, [favorites]);

  // 2. Fetch fresh recommendations for mood & filters
  const loadMoodRecommendations = useCallback(
    (mood, lang = selectedLanguage, isRecent = recentOnly, append = false) => {
      if (!recommender.isReady) return;

      const langs = lang === 'All' ? ['Hindi', 'Punjabi', 'Haryanvi', 'English'] : [lang];
      const currentPlayed = playedIdsByMood[mood] || [];

      const newRecs = recommender.recommendByMood(mood, {
        limit: 15,
        languages: langs,
        recentOnly: isRecent,
        excludeIds: new Set(currentPlayed),
        randomize: true,
      });

      if (append) {
        setRecommendations((prev) => [...prev, ...newRecs]);
        setQueue((prev) => [...prev, ...newRecs]);
      } else {
        setRecommendations(newRecs);
        setQueue(newRecs);
        setCurrentTrackIndex(0);
        setCurrentTime(0);
        setDisplayCount(10);
      }
    },
    [selectedLanguage, recentOnly, playedIdsByMood]
  );

  // Switch Mood
  const handleSelectMood = (moodId) => {
    setShowFavoritesOnly(false);
    setSelectedMood(moodId);
    setSearchQuery('');
    setMoodHistory((prev) => (prev[prev.length - 1] === moodId ? prev : [...prev.slice(-4), moodId]));
    loadMoodRecommendations(moodId, selectedLanguage, recentOnly, false);
    const m = MOOD_LIST.find((item) => item.id === moodId);
    showToast(`Mood: ${m?.name} ${m?.emoji}`);
  };

  // Switch Language
  const handleSelectLanguage = (lang) => {
    setSelectedLanguage(lang);
    if (!showFavoritesOnly && !debouncedQuery) {
      loadMoodRecommendations(selectedMood, lang, recentOnly, false);
    }
  };

  // Toggle Recent Only
  const handleToggleRecentOnly = () => {
    const nextVal = !recentOnly;
    setRecentOnly(nextVal);
    if (!showFavoritesOnly && !debouncedQuery) {
      loadMoodRecommendations(selectedMood, selectedLanguage, nextVal, false);
    }
    showToast(nextVal ? 'Filtering 2024+ releases 🔥' : 'Showing all release years');
  };

  // Surprise Me handler
  const handleSurpriseMe = () => {
    const randomMood = MOOD_LIST[Math.floor(Math.random() * MOOD_LIST.length)];
    setSelectedMood(randomMood.id);
    setShowFavoritesOnly(false);
    setSearchQuery('');

    const langs = selectedLanguage === 'All' ? ['Hindi', 'Punjabi', 'Haryanvi', 'English'] : [selectedLanguage];
    const recs = recommender.recommendByMood(randomMood.id, {
      limit: 15,
      languages: langs,
      randomize: true,
    });

    setRecommendations(recs);
    setQueue(recs);
    setCurrentTrackIndex(0);
    setCurrentTime(0);
    setIsPlaying(true);
    showToast(`Surprise Vibe: ${randomMood.name} ${randomMood.emoji}! 🎲`);
  };

  // Record track as played in session
  const markAsPlayed = (song) => {
    if (!song) return;
    setPlayedIdsByMood((prev) => {
      const existing = prev[selectedMood] || [];
      if (existing.includes(song.id)) return prev;
      return { ...prev, [selectedMood]: [...existing.slice(-80), song.id] };
    });
  };

  // Play a song from row click
  const handlePlaySong = (song) => {
    audioEngineRef.current?.resumeContext();

    if (currentTrack && currentTrack.id !== song.id) {
      setHistoryStack((prev) => [...prev, currentTrack]);
    }

    markAsPlayed(song);

    // If song is from search or recommendations, ensure it is in queue
    const idx = queue.findIndex((s) => s.id === song.id);
    if (idx !== -1) {
      if (idx === currentTrackIndex && isPlaying) {
        setIsPlaying(false);
      } else {
        setCurrentTrackIndex(idx);
        setIsPlaying(true);
      }
    } else {
      // Create new queue starting with this song, followed by audio twin recommendations
      const twins = recommender.recommendMoreLikeThis(song, {
        limit: 10,
        languages: selectedLanguage === 'All' ? ['Hindi', 'Punjabi', 'Haryanvi', 'English'] : [selectedLanguage],
      });
      setQueue([song, ...twins]);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
    }
  };

  // Play / Pause toggle
  const handleTogglePlay = () => {
    audioEngineRef.current?.resumeContext();
    if (!currentTrack && recommendations.length > 0) {
      handlePlaySong(recommendations[0]);
      return;
    }
    setIsPlaying(!isPlaying);
  };

  // Next Track (Autoplay Queue)
  const handleNext = () => {
    if (queue.length === 0) return;

    if (currentTrack) {
      setHistoryStack((prev) => [...prev, currentTrack]);
      markAsPlayed(currentTrack);
    }

    const nextIdx = currentTrackIndex + 1;

    // Autoplay refilling: if fewer than 3 songs left in queue, fetch more unplayed songs
    if (queue.length - nextIdx < 3) {
      loadMoodRecommendations(selectedMood, selectedLanguage, recentOnly, true);
    }

    if (nextIdx < queue.length) {
      setCurrentTrackIndex(nextIdx);
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      // Loop or refill
      loadMoodRecommendations(selectedMood, selectedLanguage, recentOnly, false);
      setCurrentTrackIndex(0);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  // Previous Track (with History Stack)
  const handlePrev = () => {
    if (currentTime > 3) {
      audioEngineRef.current?.seekTo(0);
      return;
    }

    if (historyStack.length > 0) {
      const prevSong = historyStack[historyStack.length - 1];
      setHistoryStack((prev) => prev.slice(0, -1));

      // Put at head of queue
      setQueue((prev) => [prevSong, ...prev.filter((s) => s.id !== prevSong.id)]);
      setCurrentTrackIndex(0);
      setCurrentTime(0);
      setIsPlaying(true);
      return;
    }

    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  // Error auto-skip
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

  // Load More Songs handler
  const handleLoadMore = () => {
    if (displayCount < recommendations.length) {
      setDisplayCount((prev) => prev + 10);
    } else {
      loadMoodRecommendations(selectedMood, selectedLanguage, recentOnly, true);
      setDisplayCount((prev) => prev + 10);
    }
  };

  // Search Results computation via Fuse.js
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim() || !fuseRef.current) return null;
    const raw = fuseRef.current.search(debouncedQuery.trim(), { limit: 40 }).map((r) => r.item);
    if (selectedLanguage === 'All') return raw;
    return raw.filter((s) => (s.language || '').toLowerCase() === selectedLanguage.toLowerCase());
  }, [debouncedQuery, selectedLanguage]);

  // Items to display in the main list
  const displaySongs = useMemo(() => {
    if (searchResults !== null) {
      return searchResults;
    }
    if (showFavoritesOnly) {
      if (selectedLanguage === 'All') return favorites;
      return favorites.filter((s) => (s.language || '').toLowerCase() === selectedLanguage.toLowerCase());
    }
    return recommendations.slice(0, displayCount);
  }, [searchResults, showFavoritesOnly, favorites, selectedLanguage, recommendations, displayCount]);

  // Keyboard Shortcuts (Space, Left/Right arrows, N, P, M, '/')
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';

      if (e.key === '/' && tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (tag === 'input' || tag === 'textarea') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          audioEngineRef.current?.jump(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          audioEngineRef.current?.jump(10);
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
  }, [currentTrack, isPlaying, queue, currentTrackIndex, currentTime, historyStack]);

  const catalogStats = {
    total: songs.length,
    playable: songs.filter((s) => s.youtube_id || s.itunes_preview_url).length,
  };

  const upNextSongs = queue.slice(currentTrackIndex + 1, currentTrackIndex + 4);

  return (
    <div className="min-h-screen bg-[#080B10] text-[#F0F6FC] font-sans antialiased pb-28 selection:bg-pink-500 selection:text-white relative overflow-x-hidden">
      {/* Soft Mood Ambient Background Glow */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000 -z-10 opacity-30"
        style={{
          background: `radial-gradient(ellipse 85% 55% at 50% -10%, ${currentMoodObj.color}38, transparent)`,
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#161B26]/95 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-full shadow-2xl text-xs md:text-sm font-medium text-white flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ZONE A: TOP BAR (Logo + Search Bar + Filters + Modals) */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-4 space-y-4 border-b border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Pitch */}
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

          {/* Prominent Search Bar (Fuzzy Fuse.js, "/" shortcut) */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 7,200+ songs or artists... (Press /)"
              className="w-full bg-white/[0.05] border border-white/10 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/60 transition shadow-inner"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            ) : (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-slate-500 border border-white/10 px-1.5 py-0.5 rounded">
                /
              </span>
            )}
          </div>

          {/* Top Utilities (Surprise Me, Text Mood, About, Debug) */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Surprise Me Button */}
            <button
              onClick={handleSurpriseMe}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/20 to-pink-500/20 text-amber-300 border border-amber-500/30 hover:scale-105 transition flex items-center gap-1.5"
              title="Surprise me with a random mood and track"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Surprise Me</span>
            </button>

            {/* Mood from Text */}
            <button
              onClick={() => setIsTextMoodOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/10 border border-white/5 transition flex items-center gap-1.5"
              title="Analyze mood from free text"
            >
              <MessageSquareHeart className="w-3.5 h-3.5 text-pink-400" />
              <span>Mood from Text</span>
            </button>

            {/* About / How It Works */}
            <button
              onClick={() => setIsAboutOpen(true)}
              className="p-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition border border-white/5"
              title="About & Architecture"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Debug Telemetry */}
            <button
              onClick={() => setIsDebugOpen(!isDebugOpen)}
              className={`p-2 rounded-xl text-xs font-mono transition border ${
                isDebugOpen
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/5'
              }`}
              title="Toggle Audio Debug Telemetry"
            >
              <Bug className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Strip: Language Pills, 2024+ Toggle, Favorites Tab */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Languages */}
          <div className="flex items-center bg-white/[0.04] p-1 rounded-2xl border border-white/5 flex-wrap">
            {LANGUAGES.map((lang) => {
              const isActive = selectedLanguage === lang && !showFavoritesOnly;
              return (
                <button
                  key={lang}
                  onClick={() => {
                    setShowFavoritesOnly(false);
                    handleSelectLanguage(lang);
                  }}
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

          {/* Quick Filters: 2024+ Hits and Favorites */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleRecentOnly}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                recentOnly
                  ? 'bg-rose-500 text-white shadow-lg border-rose-400'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/5'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>2024+ New Hits</span>
            </button>

            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                showFavoritesOnly
                  ? 'bg-pink-500 text-white shadow-lg border-pink-400'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white border-white/5'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-white' : ''}`} />
              <span>Favorites ({favorites.length})</span>
            </button>
          </div>
        </div>

        {/* Session Mood History Strip */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 overflow-x-auto pb-1 scrollbar-none">
          <span className="font-semibold text-slate-500 shrink-0">Session Trail:</span>
          {moodHistory.map((mId, i) => {
            const m = MOOD_LIST.find((item) => item.id === mId);
            return (
              <span key={i} className="flex items-center gap-1 shrink-0 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/5">
                <span>{m?.emoji}</span>
                <span>{m?.name}</span>
                {i < moodHistory.length - 1 && <span className="text-slate-600">→</span>}
              </span>
            );
          })}
        </div>
      </header>

      {/* ZONE B: 6 BIG MOOD CHIPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {MOOD_LIST.map((mood) => {
            const isSelected = selectedMood === mood.id && !showFavoritesOnly && !debouncedQuery;
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
          {/* Left Column (Desktop): Spinning Vinyl */}
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
            {/* List Heading */}
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                {searchResults !== null ? (
                  <>
                    <Search className="w-5 h-5 text-pink-400" />
                    <span>Search Results for "{debouncedQuery}"</span>
                  </>
                ) : showFavoritesOnly ? (
                  <>
                    <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />
                    <span>Your Favorite Tracks</span>
                  </>
                ) : (
                  <>
                    <span>{currentMoodObj.emoji}</span>
                    <span>Tuned for {currentMoodObj.name} {recentOnly ? '(2024+)' : ''}</span>
                  </>
                )}
              </h2>

              {!searchResults && !showFavoritesOnly && (
                <button
                  onClick={() => loadMoodRecommendations(selectedMood, selectedLanguage, recentOnly, false)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08]"
                  title="Reshuffle pool"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Shuffle</span>
                </button>
              )}
            </div>

            {/* Loading Skeletons */}
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : displaySongs.length === 0 ? (
              /* Empty State */
              <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                <Music2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">
                  {searchResults !== null ? 'No songs found. Try another name.' : 'No songs found in this selection.'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchResults !== null
                    ? 'Check spelling or try searching by artist name.'
                    : 'Switch language to "All" or explore other moods.'}
                </p>
                {searchResults && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-slate-200 transition"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              /* Song Rows */
              <div className="space-y-2.5">
                {displaySongs.map((song, idx) => (
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

                {/* "Load More Songs" Button (Endless Queue) */}
                {!searchResults && !showFavoritesOnly && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={handleLoadMore}
                      className="px-6 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-slate-300 hover:text-white border border-white/10 transition shadow flex items-center gap-2 mx-auto"
                    >
                      <ChevronDown className="w-4 h-4" />
                      <span>Load More Songs</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* HIDDEN / OFF-SCREEN AUDIO ENGINE */}
      <AudioEngine
        ref={audioEngineRef}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        volume={volume}
        isMuted={isMuted}
        onSongEnd={handleNext}
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
        audioSource={audioSource}
        upNextSongs={upNextSongs}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onJump={(delta) => audioEngineRef.current?.jump(delta)}
        onSeek={(newTime) => {
          setCurrentTime(newTime);
          audioEngineRef.current?.seekTo(newTime);
        }}
        onVolumeChange={setVolume}
        onToggleMute={() => setIsMuted(!isMuted)}
        onOpenBassLab={() => setIsBassLabOpen(true)}
        moodColor={currentMoodObj.color}
      />

      {/* HONEST BASS LAB MODAL */}
      <BassLabModal
        isOpen={isBassLabOpen}
        onClose={() => setIsBassLabOpen(false)}
        currentTrack={currentTrack}
        moodColor={currentMoodObj.color}
        onPauseMainAudio={() => setIsPlaying(false)}
      />

      {/* FIRST-TIME WELCOME OVERLAY */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onStart={() => {
          localStorage.setItem('moodtunes_welcomed', 'true');
          setIsWelcomeOpen(false);
          audioEngineRef.current?.resumeContext();
          if (recommendations.length > 0) {
            handlePlaySong(recommendations[0]);
          }
        }}
      />

      {/* ABOUT / HOW IT WORKS MODAL */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* MOOD FROM TEXT MODAL */}
      <TextMoodModal
        isOpen={isTextMoodOpen}
        onClose={() => setIsTextMoodOpen(false)}
        onSelectMood={handleSelectMood}
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
        bassBoostDb={8}
        isBassEnabled={isBassLabOpen}
        catalogStats={catalogStats}
      />
    </div>
  );
}
