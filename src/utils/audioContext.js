/**
 * Web Audio API Audio Engine & Bass Lab
 * Handles 30s iTunes previews with Web Audio API DSP chain:
 * Source -> Bass Filter (lowshelf) -> Mid Filter (peaking) -> Treble Filter (highshelf) -> Gain -> Analyser -> Destination
 * Includes graceful CORS fallback for 3D visualizer.
 */

import { EQ_PRESETS } from './constants';

class BassLabAudioEngine {
  constructor() {
    this.audioContext = null;
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';

    this.sourceNode = null;
    this.bassFilter = null;
    this.midFilter = null;
    this.trebleFilter = null;
    this.gainNode = null;
    this.analyserNode = null;

    this.isCorsBlocked = false;
    this.isInitialized = false;
    this.isPlaying = false;
    this.currentTrack = null;

    this.freqDataArray = new Uint8Array(32);
    this.timeDataArray = new Uint8Array(32);

    // Default parameters
    this.bassBoostDb = 6;
    this.eqPreset = 'Normal';
    this.loudness = 1.0;
  }

  ensureContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    if (!this.isInitialized) {
      this.setupNodes();
    }
  }

  setupNodes() {
    if (this.isInitialized || !this.audioContext) return;

    try {
      this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);

      // Low shelf for bass boost
      this.bassFilter = this.audioContext.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 100;
      this.bassFilter.gain.value = this.bassBoostDb;

      // Mid peaking EQ
      this.midFilter = this.audioContext.createBiquadFilter();
      this.midFilter.type = 'peaking';
      this.midFilter.frequency.value = 1200;
      this.midFilter.Q.value = 1.0;
      this.midFilter.gain.value = 0;

      // High shelf for treble
      this.trebleFilter = this.audioContext.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 4500;
      this.trebleFilter.gain.value = 0;

      // Master Gain / Loudness
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.loudness;

      // Analyser Node for 3D reactivity
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 64;
      this.analyserNode.smoothingTimeConstant = 0.8;
      this.freqDataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.timeDataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

      // Connect DSP chain
      this.sourceNode
        .connect(this.bassFilter)
        .connect(this.midFilter)
        .connect(this.trebleFilter)
        .connect(this.gainNode)
        .connect(this.analyserNode)
        .connect(this.audioContext.destination);

      this.isInitialized = true;
      this.isCorsBlocked = false;
    } catch (err) {
      console.warn('[BassLab] Web Audio CORS limitation or node setup note:', err);
      this.isCorsBlocked = true;
    }
  }

  playPreview(track, onEndCallback = null) {
    if (!track || !track.itunes_preview_url) {
      console.warn('[BassLab] No iTunes preview URL available for track:', track?.track_name);
      return false;
    }

    this.ensureContext();
    this.currentTrack = track;
    this.audioElement.src = track.itunes_preview_url;
    this.audioElement.currentTime = 0;

    this.audioElement.onended = () => {
      this.isPlaying = false;
      if (onEndCallback) onEndCallback();
    };

    this.audioElement.onerror = (e) => {
      console.warn('[BassLab] Preview playback error:', e);
      this.isPlaying = false;
    };

    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
        })
        .catch((err) => {
          console.warn('[BassLab] Autoplay policy prevented playback:', err);
          this.isPlaying = false;
        });
    }
    return true;
  }

  pause() {
    this.audioElement.pause();
    this.isPlaying = false;
  }

  resume() {
    this.ensureContext();
    this.audioElement.play();
    this.isPlaying = true;
  }

  seek(seconds) {
    if (this.audioElement) {
      this.audioElement.currentTime = seconds;
    }
  }

  setBassBoost(db) {
    this.bassBoostDb = db;
    if (this.bassFilter && this.bassFilter.gain) {
      this.bassFilter.gain.setTargetAtTime(db, this.audioContext.currentTime, 0.05);
    }
  }

  setPreset(presetName) {
    this.eqPreset = presetName;
    const preset = EQ_PRESETS[presetName] || EQ_PRESETS.Normal;
    const now = this.audioContext ? this.audioContext.currentTime : 0;

    if (this.bassFilter && this.bassFilter.gain) {
      const combinedBass = (preset.low || 0) + this.bassBoostDb;
      this.bassFilter.gain.setTargetAtTime(combinedBass, now, 0.05);
    }
    if (this.midFilter && this.midFilter.gain) {
      this.midFilter.gain.setTargetAtTime(preset.mid || 0, now, 0.05);
    }
    if (this.trebleFilter && this.trebleFilter.gain) {
      this.trebleFilter.gain.setTargetAtTime(preset.high || 0, now, 0.05);
    }
  }

  setLoudness(val) {
    this.loudness = val;
    if (this.gainNode && this.gainNode.gain) {
      this.gainNode.gain.setTargetAtTime(val, this.audioContext.currentTime, 0.05);
    }
  }

  /**
   * Retrieves current audio frequency buffer.
   * If CORS limits access or paused, generates a smooth simulated waveform for 3D visuals.
   */
  getFrequencyData() {
    if (this.isPlaying && this.analyserNode && !this.isCorsBlocked) {
      try {
        this.analyserNode.getByteFrequencyData(this.freqDataArray);
        // Check if data is not all zeroes (which indicates CORS zeroing)
        const hasData = this.freqDataArray.some((v) => v > 0);
        if (hasData) {
          return this.freqDataArray;
        }
      } catch (e) {
        this.isCorsBlocked = true;
      }
    }

    // Procedural rhythmic animation for 3D scene when playing or idle
    const time = performance.now() * 0.003;
    const simulated = new Uint8Array(32);
    const amp = this.isPlaying ? 1.0 : 0.2;

    for (let i = 0; i < 32; i++) {
      const freq = Math.sin(time + i * 0.3) * 0.5 + 0.5;
      const beat = Math.sin(time * 2.5) * 0.5 + 0.5;
      simulated[i] = Math.floor((freq * 160 + beat * 90) * amp);
    }
    return simulated;
  }
}

export const bassLab = new BassLabAudioEngine();
