/**
 * Bass Lab Modal & DSP Studio
 * Real-time Web Audio API EQ controls & live visualizer spectrum.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Volume2, Sparkles, X, Activity, Radio } from 'lucide-react';
import { bassLab } from '../utils/audioContext';
import { EQ_PRESETS } from '../utils/constants';

export default function BassLabModal({ isOpen, onClose, currentTrack }) {
  const [bassGain, setBassGain] = useState(6);
  const [activePreset, setActivePreset] = useState('Normal');
  const [loudness, setLoudness] = useState(1.0);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const renderSpectrum = () => {
      const data = bassLab.getFrequencyData();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / data.length) * 1.5;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * canvas.height;
        // Gradient color for spectrum bars
        const hue = 320 - (i / data.length) * 140; // pink to cyan
        ctx.fillStyle = `hsl(${hue}, 90%, 60%)`;
        ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
        ctx.shadowBlur = 8;

        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }

      animFrameRef.current = requestAnimationFrame(renderSpectrum);
    };

    renderSpectrum();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBassChange = (e) => {
    const val = parseFloat(e.target.value);
    setBassGain(val);
    bassLab.setBassBoost(val);
  };

  const handlePresetSelect = (preset) => {
    setActivePreset(preset);
    bassLab.setPreset(preset);
  };

  const handleLoudnessChange = (e) => {
    const val = parseFloat(e.target.value);
    setLoudness(val);
    bassLab.setLoudness(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg p-6 bg-gradient-to-b from-[#161B26] to-[#0D111A] border border-pink-500/30 rounded-3xl shadow-2xl shadow-pink-500/10 text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-pink-500/20 text-pink-400 rounded-xl border border-pink-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                Bass Lab™ DSP Studio
              </h2>
              <p className="text-xs text-zinc-400">Web Audio API Hardware EQ & Low-Shelf Driver</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Visualizer Canvas */}
        <div className="my-5 p-3 bg-black/40 border border-white/5 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2 px-1">
            <span className="flex items-center gap-1.5 text-pink-400 font-semibold">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Frequency Analyser
            </span>
            <span>{currentTrack?.track_name ? `Playing: ${currentTrack.track_name.slice(0, 24)}...` : 'Standby Mode'}</span>
          </div>
          <canvas ref={canvasRef} width={400} height={70} className="w-full h-16 rounded-lg block" />
        </div>

        {/* Controls Grid */}
        <div className="space-y-5">
          {/* Sub-Bass Boost Slider */}
          <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-pink-400" /> Low-Shelf Sub Bass Boost
              </label>
              <span className="text-sm font-bold text-pink-400 font-mono">+{bassGain.toFixed(1)} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="18"
              step="0.5"
              value={bassGain}
              onChange={handleBassChange}
              className="w-full accent-pink-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>Flat (0 dB)</span>
              <span>Punchy (+8 dB)</span>
              <span>Earthquake (+18 dB)</span>
            </div>
          </div>

          {/* EQ Presets */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
              Acoustic EQ Presets
            </label>
            <div className="grid grid-cols-5 gap-2">
              {Object.keys(EQ_PRESETS).map((preset) => {
                const isSelected = activePreset === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => handlePresetSelect(preset)}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all text-center ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white border-pink-400 shadow-md shadow-pink-500/20'
                        : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gain / Loudness Slider */}
          <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-cyan-400" /> Preamp Gain / Loudness
              </label>
              <span className="text-sm font-bold text-cyan-400 font-mono">{Math.round(loudness * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={loudness}
              onChange={handleLoudnessChange}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
            />
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-5 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200/80 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Bass Lab Mode:</strong> Connects real-time Web Audio filters directly to the 30s studio preview and drives the 3D rotating vinyl visualizer!
          </span>
        </div>
      </div>
    </div>
  );
}
