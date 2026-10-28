# MoodTunes 🎵 — AI Mood Music Discovery & Player

> **Pick your mood, then tap a song.** A clean, modern, Spotify-like music discovery web app. Maps human emotional states (**Happy, Sad, Relaxed, Energetic, Focus, Angry**) into multi-dimensional audio feature space, delivering personalized recommendations across Hindi, Punjabi, and English tracks with in-app audio streaming, spinning vinyl disc, and a Web Audio Bass Boost engine.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-FF3366?style=for-the-badge&logo=githubpages&logoColor=white)](https://akashcyber02.github.io/mood-based-song/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 🌐 Live Demo & Deployment
- **GitHub Pages**: [https://akashcyber02.github.io/mood-based-song/](https://akashcyber02.github.io/mood-based-song/)
- **Zero Server Setup**: Built as a 100% static client-side bundle (`dist/`), deployable directly to GitHub Pages, Vercel, or Netlify.

---

## 🎵 Features & Architecture

### 1. Simple, Clean, Spotify-Style Design
- **One Screen, Three Clear Zones**:
  - **Top Bar**: App title, quick tagline (*"Pick your mood, then tap a song"*), language filters (**All, Hindi, Punjabi, English**), and an on-screen **Debug Telemetry** panel.
  - **Mood Bar**: 6 large interactive mood chips with emoji (**Happy 😊, Sad 😢, Relaxed 🌿, Energetic ⚡, Focus 🎯, Angry 🔥**), highlighted with mood-specific accent colors and subtle ambient gradients.
  - **Main Area**: A tasteful rotating vinyl disc beside a Spotify-style song table displaying number, album artwork, title, artists, language, release year, audio source badge, like button, and direct play trigger.
- **Sticky Bottom Player Bar**: Current track info, previous, -10s jump, play/pause, +10s jump, next, interactive seek slider with timestamps, volume slider with mute toggle, and a **Bass** boost toggle with slider (+0 dB to +15 dB).

### 2. Audio Playback Engine
- **In-App Streaming**: Songs play directly inside the tab without navigating to external websites or opening popups.
- **YouTube IFrame Streaming**: Full songs stream through a lightweight off-screen YouTube IFrame Player API host.
- **30-Second Studio Preview Fallback**: Songs without a YouTube video stream high-quality 30s AAC studio previews via HTML5 Audio.
- **Web Audio API Bass Boost**: Features a real-time low-shelf BiquadFilter (120 Hz) with gain control (+0 dB to +15 dB). Initialized strictly upon user gesture and safely falls back to unboosted plain audio if cross-origin restrictions apply so playback never drops out.
- **Error Resilience & Auto-Skip**: Automatically advances to the next playable song when a track ends or if a YouTube video owner has disabled third-party website embedding (Error codes 101, 150, 153).
- **Keyboard Shortcuts**:
  - `Space`: Play / Pause
  - `Left Arrow` / `Right Arrow`: Rewind 10s / Forward 10s
  - `N`: Next track
  - `P`: Previous track
  - `M`: Toggle Mute

---

## ⚠️ Playback Notes & Limitations
1. **YouTube Embed Permissions**: Certain record labels or video uploaders restrict playback on third-party domains (Error 101/150). When encountered, MoodTunes detects the error and automatically skips to the next track with a toast notification.
2. **Audio Autoplay Rules**: Modern browsers block unprompted audio autoplay. Audio playback begins once you tap any mood button, track row, or play control.
3. **HTTP / HTTPS Host Requirement**: YouTube embeds require serving over `http://localhost` or `https://` (embedded players will fail if opened via raw `file://` URLs).

---

## 🚀 Quickstart

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm 9+
- Python 3.9+ (only required if refreshing dataset caches)

### Running Locally
```bash
# Clone the repository
git clone https://github.com/akashcyber02/mood-based-song.git
cd mood-based-song

# Install frontend dependencies
npm install

# Start Vite dev server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Building for Production
```bash
npm run build
```
Generates an optimized static build in `dist/` ready to host anywhere.

### Running Python Dataset Pipeline (Optional)
```bash
# Update and resolve additional songs across Hindi, Punjabi, and English
python3 prepare_web_data.py --workers 6
```

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite 5, TailwindCSS 3, Lucide React Icons
- **Audio**: YouTube IFrame Player API, HTML5 Audio, Web Audio API (`AudioContext`, `BiquadFilterNode`, `GainNode`)
- **Data & ML**: Python, pandas, scikit-learn feature modeling, ytmusicapi, iTunes Search API
- **Deployment**: GitHub Actions CI/CD to GitHub Pages

---

## 📄 License
MIT License. Created for music lovers and AI learners.
