import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Zap, Volume2, AlertCircle, Sparkles } from 'lucide-react';
import { EQ_PRESETS } from '../utils/constants';

export default function BassLabModal({
  isOpen,
  onClose,
  currentTrack,
  moodColor = '#FFD166',
  onPauseMainAudio,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // DSP parameters
  const [bassBoostDb, setBassBoostDb] = useState(8);
  const [activePreset, setActivePreset] = useState('Bass Boost');
  const [loudness, setLoudness] = useState(1.0);

  // Web Audio refs
  const audioElRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const bassFilterRef = useRef(null);
  const midFilterRef = useRef(null);
  const trebleFilterRef = useRef(null);
  const gainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Fetch or resolve preview URL whenever track changes or modal opens
  useEffect(() => {
    if (!isOpen || !currentTrack) return;

    // Pause main YouTube player to avoid audio clash
    if (onPauseMainAudio) onPauseMainAudio();

    setErrorMessage(null);
    setIsPlaying(false);

    if (currentTrack.itunes_preview_url) {
      setPreviewUrl(currentTrack.itunes_preview_url);
    } else {
      // Lookup dynamically via iTunes Search API
      const cached = localStorage.getItem(`itunes_prev_${currentTrack.track_name}_${currentTrack.artists}`);
      if (cached) {
        setPreviewUrl(cached);
      } else {
        setIsLoadingPreview(true);
        const query = `${currentTrack.track_name} ${currentTrack.artists}`;
        fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`)
          .then((res) => res.json())
          .then((data) => {
            if (data.results && data.results.length > 0 && data.results[0].previewUrl) {
              const url = data.results[0].previewUrl;
              setPreviewUrl(url);
              try {
                localStorage.setItem(`itunes_prev_${currentTrack.track_name}_${currentTrack.artists}`, url);
              } catch (e) {}
            } else {
              setErrorMessage('Studio 30s preview is unavailable for this specific track.');
            }
          })
          .catch(() => {
            setErrorMessage('Could not load studio preview over network.');
          })
          .finally(() => {
            setIsLoadingPreview(false);
          });
      }
    }

    return () => {
      // Stop preview audio when unmounting/closing
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.currentTime = 0;
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, currentTrack]);

  // Setup Web Audio graph on first user interaction
  const initWebAudio = () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return true;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const audio = audioElRef.current;
      if (!audio) return false;

      const src = ctx.createMediaElementSource(audio);
      sourceNodeRef.current = src;

      // Bass Lowshelf filter
      const bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 110;
      bass.gain.value = bassBoostDb;
      bassFilterRef.current = bass;

      // Mid Peaking filter
      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1200;
      mid.Q.value = 1.0;
      mid.gain.value = EQ_PRESETS[activePreset]?.mid || 0;
      midFilterRef.current = mid;

      // Treble Highshelf filter
      const treble = ctx.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 4500;
      treble.gain.value = EQ_PRESETS[activePreset]?.high || 0;
      trebleFilterRef.current = treble;

      // Master Gain
      const gain = ctx.createGain();
      gain.gain.value = loudness;
      gainNodeRef.current = gain;

      // Analyser Node
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect graph
      src.connect(bass)
        .connect(mid)
        .connect(treble)
        .connect(gain)
        .connect(analyser)
        .connect(ctx.destination);

      return true;
    } catch (err) {
      console.warn('[BassLab] Web Audio init note:', err);
      return false;
    }
  };

  // Canvas visualizer loop
  const startVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.8;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

        // Gradient from pink to moodColor
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#ec4899');
        gradient.addColorStop(1, moodColor || '#38bdf8');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 3;
      }
    };

    draw();
  };

  const handlePlayToggle = () => {
    if (!previewUrl) return;

    if (isPlaying) {
      if (audioElRef.current) audioElRef.current.pause();
      setIsPlaying(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      initWebAudio();
      if (audioElRef.current) {
        audioElRef.current.play()
          .then(() => {
            setIsPlaying(true);
            startVisualizer();
          })
          .catch((err) => {
            console.warn('[BassLab] Play error:', err);
            setErrorMessage('Playback failed due to audio CORS restriction on this preview.');
          });
      }
    }
  };

  // Preset switch
  const handleApplyPreset = (presetName) => {
    setActivePreset(presetName);
    const p = EQ_PRESETS[presetName] || EQ_PRESETS.Normal;
    setBassBoostDb(p.low);

    if (audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      if (bassFilterRef.current) bassFilterRef.current.gain.setValueAtTime(p.low, now);
      if (midFilterRef.current) midFilterRef.current.gain.setValueAtTime(p.mid, now);
      if (trebleFilterRef.current) trebleFilterRef.current.gain.setValueAtTime(p.high, now);
    }
  };

  // Bass slider change
  const handleBassChange = (val) => {
    setBassBoostDb(val);
    if (bassFilterRef.current && audioCtxRef.current) {
      bassFilterRef.current.gain.setValueAtTime(val, audioCtxRef.current.currentTime);
    }
  };

  // Loudness change
  const handleLoudnessChange = (val) => {
    setLoudness(val);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(val, audioCtxRef.current.currentTime);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      {/* Hidden Audio element with crossOrigin for Web Audio DSP */}
      {previewUrl && (
        <audio
          ref={audioElRef}
          src={previewUrl}
          crossOrigin="anonymous"
          onEnded={() => setIsPlaying(false)}
          onError={() => setErrorMessage('Audio stream failed to load with Web Audio CORS headers.')}
        />
      )}

      <div className="w-full max-w-xl bg-[#0D111A] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-extrabold text-white">Bass Lab™ DSP Studio</h3>
              <p className="text-xs text-pink-400 font-medium">
                30 sec preview. Bass boost works only in Bass Lab.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
            aria-label="Close Bass Lab"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Track Banner */}
        <div className="mt-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
            {currentTrack?.artwork_url ? (
              <img src={currentTrack.artwork_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold">🎵</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{currentTrack?.track_name}</h4>
            <p className="text-xs text-slate-400 truncate">{currentTrack?.artists}</p>
          </div>
          <button
            onClick={handlePlayToggle}
            disabled={!previewUrl || isLoadingPreview}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg ${
              isPlaying
                ? 'bg-pink-500 text-white'
                : 'bg-white text-black hover:bg-slate-200 disabled:opacity-40'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>{isLoadingPreview ? 'Loading...' : 'Play Preview'}</span>
              </>
            )}
          </button>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Frequency Spectrum Visualizer */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-mono">
            <span>REAL-TIME SPECTRUM</span>
            <span className={isPlaying ? 'text-emerald-400' : 'text-slate-500'}>
              {isPlaying ? 'DSP ACTIVE (120Hz Lowshelf)' : 'IDLE'}
            </span>
          </div>
          <div className="h-20 w-full bg-black/40 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center relative">
            <canvas ref={canvasRef} width={480} height={80} className="w-full h-full" />
            {!isPlaying && (
              <span className="absolute text-xs text-slate-500">Tap "Play Preview" to activate DSP visualizer</span>
            )}
          </div>
        </div>

        {/* DSP Controls */}
        <div className="mt-5 space-y-4">
          {/* Lowshelf Bass Boost Slider */}
          <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-white flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-pink-400" />
                Sub-Bass Boost (110 Hz Lowshelf)
              </span>
              <span className="font-mono text-pink-400 text-sm">+{bassBoostDb} dB</span>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              step={1}
              value={bassBoostDb}
              onChange={(e) => handleBassChange(parseFloat(e.target.value))}
              className="w-full accent-pink-500 h-1.5 bg-white/20 rounded cursor-pointer"
            />
          </div>

          {/* EQ Presets */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">DSP PRESETS</span>
            <div className="grid grid-cols-5 gap-2">
              {Object.keys(EQ_PRESETS).map((preset) => {
                const isSelected = activePreset === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => handleApplyPreset(preset)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition text-center ${
                      isSelected
                        ? 'bg-pink-500 text-white shadow-md'
                        : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/5'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loudness Gain Control */}
          <div className="flex items-center justify-between bg-white/[0.02] px-4 py-2.5 rounded-xl border border-white/5 text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Volume2 className="w-4 h-4 text-slate-400" />
              Loudness Multiplier
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={loudness}
                onChange={(e) => handleLoudnessChange(parseFloat(e.target.value))}
                className="w-24 accent-white h-1 bg-white/20 rounded cursor-pointer"
              />
              <span className="font-mono text-slate-300 w-10 text-right">{Math.round(loudness * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-5 pt-3 border-t border-white/5 text-[11px] text-slate-500 text-center">
          Normal playback streams the full song over YouTube. Bass Lab runs real Web Audio DSP on studio preview stems.
        </div>
      </div>
    </div>
  );
}
