/**
 * Recommender Engine in JavaScript
 * Ported from MoodTunes Python / scikit-learn pipeline.
 * Implements MinMaxScaler, Vectorized Cosine Similarity, Probabilistic Candidate Sampling,
 * and k-NN audio twin matching.
 */

import { MOODS, FEATURE_KEYS } from './constants';

class RecommenderEngine {
  constructor() {
    this.songs = [];
    this.featureRanges = {};
    this.isReady = false;
  }

  /**
   * Initializes the engine with songs data and computes dataset feature boundaries.
   */
  init(songs) {
    if (!songs || songs.length === 0) return;
    this.songs = songs;

    // Compute min-max bounds for normalization
    FEATURE_KEYS.forEach((key) => {
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i < songs.length; i++) {
        const val = songs[i][key];
        if (typeof val === 'number' && !isNaN(val)) {
          if (val < min) min = val;
          if (val > max) max = val;
        }
      }
      this.featureRanges[key] = {
        min: min === Infinity ? 0 : min,
        max: max === -Infinity ? 1 : max,
      };
    });

    // Safeguard tempo range if min/max collapsed
    if (this.featureRanges.tempo.max - this.featureRanges.tempo.min < 10) {
      this.featureRanges.tempo = { min: 50, max: 220 };
    }

    this.isReady = true;
  }

  /**
   * Scales a raw feature vector into [0, 1] range.
   */
  scaleVector(vector) {
    return FEATURE_KEYS.map((key) => {
      const bounds = this.featureRanges[key] || { min: 0, max: 1 };
      const range = bounds.max - bounds.min || 1;
      const raw = vector[key] ?? 0.5;
      const scaled = (raw - bounds.min) / range;
      return Math.max(0, Math.min(1, scaled));
    });
  }

  /**
   * Extracts and scales the feature vector from a song object.
   */
  getSongVector(song) {
    return this.scaleVector(song);
  }

  /**
   * Computes Cosine Similarity between two N-dimensional scaled vectors:
   * sim(A, B) = (A · B) / (||A|| * ||B||)
   */
  cosineSimilarity(vecA, vecB) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Recommends songs by emotional mood with no-repeat played-ID tracking and endless candidate pool.
   */
  recommendByMood(moodName, options = {}) {
    if (!this.isReady || !this.songs.length) return [];

    const {
      limit = 10,
      languages = ['Hindi', 'Punjabi', 'Haryanvi', 'English'],
      recentOnly = false,
      excludeIds = new Set(),
      randomize = true,
    } = options;

    const moodProfile = MOODS[moodName] || MOODS.Happy;
    const targetScaled = this.scaleVector(moodProfile.targets);

    // 1. Filter candidates by language and recency
    const allowedLangs = new Set(languages.map((l) => l.toLowerCase()));
    let candidates = this.songs.filter((song) => {
      const lang = (song.language || 'English').toLowerCase();
      if (allowedLangs.size > 0 && !allowedLangs.has(lang)) {
        return false;
      }
      if (recentOnly && (song.year || 2020) < 2024) {
        return false;
      }
      return true;
    });

    if (candidates.length === 0) {
      candidates = this.songs;
    }

    // Prefer candidates with valid playable audio (YouTube ID or iTunes 30s preview)
    const playableCandidates = candidates.filter((s) => s.youtube_id || s.itunes_preview_url);
    if (playableCandidates.length >= limit) {
      candidates = playableCandidates;
    }

    // 2. Score similarity for every candidate
    const scored = candidates.map((song) => {
      const songVector = this.getSongVector(song);
      const sim = this.cosineSimilarity(targetScaled, songVector);
      return {
        ...song,
        matchScore: Math.round(sim * 1000) / 10,
        _rawSim: sim,
      };
    });

    // Sort descending by similarity
    scored.sort((a, b) => b.matchScore - a.matchScore);

    // 3. Take candidate pool of top 100 most similar songs
    const top100Pool = scored.slice(0, 100);

    // 4. Filter out already played songs
    const excludeSet = excludeIds instanceof Set ? excludeIds : new Set(excludeIds || []);
    let eligiblePool = top100Pool.filter((s) => !excludeSet.has(s.id));

    // If pool exhausted, reset quietly to full top 100 pool
    if (eligiblePool.length < limit) {
      eligiblePool = top100Pool;
    }

    if (!randomize || eligiblePool.length <= limit) {
      return eligiblePool.slice(0, limit);
    }

    // 5. Weighted random selection without replacement
    const minSim = eligiblePool[eligiblePool.length - 1]._rawSim;
    const weights = eligiblePool.map((s) => Math.pow(Math.max(0.01, s._rawSim - minSim + 0.1), 2));
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);

    const sampled = [];
    const usedIndices = new Set();
    const countToPick = Math.min(limit, eligiblePool.length);

    while (sampled.length < countToPick && usedIndices.size < eligiblePool.length) {
      const rand = Math.random() * totalWeight;
      let cumulative = 0;
      let picked = false;

      for (let i = 0; i < eligiblePool.length; i++) {
        cumulative += weights[i];
        if (rand <= cumulative && !usedIndices.has(i)) {
          usedIndices.add(i);
          sampled.push(eligiblePool[i]);
          picked = true;
          break;
        }
      }
      if (!picked) {
        for (let i = 0; i < eligiblePool.length; i++) {
          if (!usedIndices.has(i)) {
            usedIndices.add(i);
            sampled.push(eligiblePool[i]);
            break;
          }
        }
      }
    }

    sampled.sort((a, b) => b.matchScore - a.matchScore);
    return sampled;
  }

  /**
   * Recommends audio twin tracks given a liked seed song (k-NN).
   */
  recommendMoreLikeThis(seedSong, options = {}) {
    if (!this.isReady || !seedSong) return [];

    const { limit = 10, languages = [] } = options;
    const seedVector = this.getSongVector(seedSong);

    const allowedLangs = languages.length > 0 ? new Set(languages.map((l) => l.toLowerCase())) : null;

    const scored = [];
    for (let i = 0; i < this.songs.length; i++) {
      const candidate = this.songs[i];
      if (candidate.id === seedSong.id) continue;
      if (candidate.track_name === seedSong.track_name && candidate.artists === seedSong.artists) continue;

      if (allowedLangs) {
        const lang = (candidate.language || 'English').toLowerCase();
        if (!allowedLangs.has(lang)) continue;
      }

      const candidateVector = this.getSongVector(candidate);
      const sim = this.cosineSimilarity(seedVector, candidateVector);
      scored.push({
        ...candidate,
        matchScore: Math.round(sim * 1000) / 10,
        _rawSim: sim,
      });
    }

    scored.sort((a, b) => {
      // Prioritize playable songs
      const aPlayable = a.youtube_id || a.itunes_preview_url ? 1 : 0;
      const bPlayable = b.youtube_id || b.itunes_preview_url ? 1 : 0;
      if (bPlayable !== aPlayable) return bPlayable - aPlayable;
      return b.matchScore - a.matchScore;
    });
    return scored.slice(0, limit);
  }
}

export const recommender = new RecommenderEngine();
