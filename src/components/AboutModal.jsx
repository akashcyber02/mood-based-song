import React from 'react';
import { X, Code2, Users, Cpu, Layers, Sparkles } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0D111A] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-extrabold text-white">About MoodTunes & Architecture</h3>
              <p className="text-xs text-slate-400">How the AI audio matching works under the hood</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Pipeline */}
        <div className="mt-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            Recommendation Pipeline
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="font-mono text-pink-400 font-bold block mb-1">01. MOOD VECTOR</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Maps 6 moods to target audio features based on Russell's Circumplex Affect Model (Valence & Energy).
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="font-mono text-amber-400 font-bold block mb-1">02. NORMALIZATION</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Client-side MinMaxScaler standardizes 6 audio dimensions into continuous [0, 1] bounds.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="font-mono text-emerald-400 font-bold block mb-1">03. COSINE SIM</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Computes cosine similarity between target vector and 7,200+ songs, extracting top 100 candidate pool.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="font-mono text-sky-400 font-bold block mb-1">04. ENDLESS QUEUE</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Samples without replacement using played-ID tracking; auto-refills when queue falls below 3 songs.
              </p>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5 mb-2">
              <Code2 className="w-4 h-4" />
              Technology Stack
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/5 font-mono text-white">React 18</span>
              <span className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/5 font-mono text-white">Vite 5.4</span>
              <span className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/5 font-mono text-white">TailwindCSS</span>
              <span className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/5 font-mono text-white">Fuse.js (Fuzzy Search)</span>
              <span className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/5 font-mono text-white">YouTube IFrame API</span>
              <span className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/5 font-mono text-white">Web Audio API DSP</span>
              <span className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/5 font-mono text-white">ytmusicapi & iTunes API</span>
            </div>
          </div>

          {/* Team Section */}
          <div className="pt-2 border-t border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5 mb-2.5">
              <Users className="w-4 h-4" />
              B.Tech AI Team (First-Year Project)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { name: 'Akash Dhakad', role: 'Lead & Full-Stack' },
                { name: 'Team Member 2', role: 'ML & Audio Modeling' },
                { name: 'Team Member 3', role: 'Data Pipeline & QA' },
                { name: 'Team Member 4', role: 'Frontend & UI Polish' },
              ].map((member, i) => (
                <div key={i} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-500/20 to-purple-500/20 text-pink-400 font-bold flex items-center justify-center mx-auto mb-1.5 text-xs">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h5 className="text-xs font-bold text-white truncate">{member.name}</h5>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
