# MoodTunes 🎵 — 3D AI Mood Music Experience

> **Sound meets Emotion in 3D.** An immersive web app that maps human emotional states into multi-dimensional audio feature space, delivering personalized recommendations across 5,000+ Hindi, Punjabi, and English tracks with an interactive 3D visualizer, in-app YouTube audio streaming, and a Web Audio API DSP Bass Lab.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-FF3366?style=for-the-badge&logo=githubpages&logoColor=white)](https://akashcyber02.github.io/mood-based-song/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 🌐 Live Demo & Deployment
Experience the web app live on GitHub Pages:  
👉 **[https://akashcyber02.github.io/mood-based-song/](https://akashcyber02.github.io/mood-based-song/)**  
*(Or replace with your custom domain / Vercel deployment)*

---

## 📸 Screenshots & Interactive Demo

| 🌌 3D Interactive Mood Orbs | 💽 3D Rotating Vinyl Turntable |
|:---:|:---:|
| ![Mood Orbs](https://raw.githubusercontent.com/placeholder/moodtunes-3d-hero.png) | ![Vinyl Turntable](https://raw.githubusercontent.com/placeholder/moodtunes-3d-vinyl.png) |

| 🎛️ Bass Lab™ DSP Studio (EQ & Sub Boost) | 🃏 3D Tilt Cards with Audio Metrics |
|:---:|:---:|
| ![Bass Lab Modal](https://raw.githubusercontent.com/placeholder/moodtunes-bass-lab.png) | ![Song Cards](https://raw.githubusercontent.com/placeholder/moodtunes-cards.png) |

---

## ✨ Features

### 🌌 1. Stunning 3D Canvas (Three.js & React Three Fiber)
- **Floating Mood Orbs**: 6 glowing spheres in 3D space (**Happy, Sad, Relaxed, Energetic, Focus, Angry**). Hovering triggers scale and emissive intensity; clicking triggers an orbital fly-in and selects the mood.
- **Spinning Vinyl Disc**: A realistic 3D turntable centerpiece that spins during playback, accompanied by an audio-reactive particle waveform ring.
- **Parallax Mouse Interaction & Starfield**: Responsive camera depth tracking. Capped at a 2.0 pixel ratio with reduced particle counts for smooth 60 FPS performance on mobile.

### 🎧 2. In-App YouTube Audio Streaming & Media Player
- **Never Leaves the Tab**: Integrated YouTube IFrame Player API streams full songs directly inside the application.
- **Playback Controls**: Play/Pause, Previous, Next, Seekbar, Skip $\pm 10\text{s}$, Volume & Mute, Playback Speed ($0.75\times - 1.5\times$), Shuffle, and Repeat (Off / All / One).
- **Auto-Advance & Error Resilience**: Automatically plays the next song upon completion. If a video owner restricts embedding, MoodTunes catches the error and automatically skips with a toast notice.
- **Queue Drawer**: View and manage upcoming tracks with instant song selection.
- **Media Session API**: Integrates with system lock-screen controls, Apple CarPlay, and Bluetooth headphone buttons.
- **Keyboard Shortcuts**:
  - `Space`: Play / Pause
  - `Left` / `Right Arrow`: Skip $-10\text{s}$ / $+10\text{s}$
  - `N`: Next track
  - `P`: Previous track
  - `M`: Toggle Mute
- **Sleep Timer**: Automatic playback shutdown after 15, 30, 45, or 60 minutes.

### 🎛️ 3. "Bass Lab™" Mode & Web Audio API DSP
- **Low-Shelf Sub Bass Booster**: Real-time BiquadFilter slider providing $+0\text{ dB}$ to $+18\text{ dB}$ sub-bass punch.
- **EQ Presets**: *Normal*, *Bass Boost*, *Vocal Enhancer*, *Treble Air*, and *Club Punch*.
- **Preamp Gain / Loudness**: Hardware audio multiplier ($50\% - 200\%$).
- **Live Frequency Analyser**: AnalyserNode feeds audio spectrum data directly into the 3D rotating vinyl ring (with automatic procedural fallback if CORS restricts cross-domain audio buffers).

### 🇮🇳 4. 5,000+ Multilingual Song Library
- **1,200+ Hindi Tracks**: Modern Bollywood, indie acoustic, romantic melodies, and retro classics.
- **1,100+ Punjabi Tracks**: Top trending tracks from Diljit Dosanjh, Sidhu Moose Wala, Karan Aujla, AP Dhillon, and Shubh.
- **2,600+ Global Hits**: Pop, EDM, rock, lo-fi, and neoclassical cinematic scores.
- **Filters**:
  - Multi-select language chips (`English`, `Hindi`, `Punjabi`).
  - **🔥 2022+ Recent Hits**: One-click toggle for modern chart-toppers.
  - Real-time instant title & artist search.
  - Saved Favorites (persisted via `localStorage`).

### 🧠 5. Free-Text Natural Language Mood Detection
- Express how you feel in prose (e.g., *"Had a super long day at work, need some peaceful acoustic songs to relax"*).
- Lexical NLP scoring evaluates emotional keywords and accounts for negations (*"not happy"*, *"never sad"*) to recommend the matching mood.

---

## 🔬 How It Works (The ML & Audio Pipeline)

```
[User Selects Mood / Input Prompt]
                │
                ▼
[Russell's Circumplex Affect Vector in ℝ⁶]
 (Valence, Energy, Danceability, Acousticness, Instrumentalness, Tempo)
                │
                ▼
[Client-Side MinMaxScaler]
 Normalizes features to uniform [0, 1] bounds using precomputed dataset ranges
                │
                ▼
[Vectorized Cosine Similarity Search]
 Filters database by Language (English/Hindi/Punjabi) & Recency (2022+)
 Computes: Cosine_Sim(A, B) = (A · B) / (||A|| * ||B||)
                │
                ▼
[Probabilistic Candidate Sampling]
 Top-ranked candidate pool is weighted to provide fresh suggestions on repeat clicks
                │
                ▼
[In-App Playback Engine]
 Full YouTube IFrame Streaming OR 30s Web Audio API Bass Lab Studio
```

---

## 💻 Tech Stack

- **Framework**: [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- **3D Graphics**: [Three.js](https://threejs.org/), [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber), [@react-three/drei](https://github.com/pmndrs/drei)
- **Styling & Animation**: [Tailwind CSS 3.4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **Audio Processing**: Web Audio API (`AudioContext`, `BiquadFilterNode`, `GainNode`, `AnalyserNode`)
- **Streaming**: [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference), [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/index.html)
- **Data Engineering**: Python 3, Pandas, NumPy, [ytmusicapi](https://github.com/sigma67/ytmusicapi)
- **CI/CD**: GitHub Actions (`deploy-pages`)

---

## 📊 Dataset Sources & Credits

1. **Kaggle / Plotly Spotify 114k Tracks**: Audio feature distributions and acoustic descriptors.
2. **Curated Bollywood & Punjabi Library**: Verified tracks with release years and Spotify audio metrics across T-Series, Speed Records, Sony Music, and independent labels.
3. **ytmusicapi**: Used strictly for offline metadata resolution and video ID mapping; no private API keys required.
4. All processed data resides in `public/songs.json` (`1.7 MB`), enabling instant client-side static deployment.

---

## 🛠️ Local Setup Guide

### Prerequisites
- **Node.js** (v18 or later)
- **Python** (3.9 or later, optional for regenerating dataset)

### 1. Clone the Repository
```bash
git clone https://github.com/akashcyber02/mood-based-song.git
cd "mood-based-song"
```

### 2. Install Node Dependencies
```bash
npm install
```

### 3. (Optional) Re-run Data Ingestion Pipeline
To fetch additional YouTube IDs or regenerate `public/songs.json`:
```bash
pip install -r requirements.txt
python prepare_web_data.py --batch-limit 100 --delay 0.05
```

### 4. Start the Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 5. Production Build & Static Preview
```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
mood-based-song/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages automated deployment workflow
├── data/
│   ├── songs.csv               # Unified 5,030 tracks dataset
│   ├── curated_songs.csv       # 328 verified recent Hindi & Punjabi tracks
│   ├── yt_cache.json           # Resolved YouTube video ID cache
│   └── itunes_cache.json       # Resolved iTunes preview & artwork cache
├── public/
│   └── songs.json              # Client-side static song database (1.7 MB)
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Top search, language, and view toggles
│   │   ├── HeroScene.jsx       # 3D floating glowing mood orbs scene
│   │   ├── MoodOrb.jsx         # Interactive 3D orb with physics & hover
│   │   ├── Vinyl3D.jsx         # 3D spinning vinyl disc with reactive waveform ring
│   │   ├── MoodBar.jsx         # 2D quick-access mood cards
│   │   ├── SongCard.jsx        # Glassmorphic 3D tilt song card
│   │   ├── PlayerBar.jsx       # Bottom sticky player with full controls
│   │   ├── QueueDrawer.jsx     # Up Next playlist drawer
│   │   ├── BassLabModal.jsx    # Web Audio API DSP equalizer & spectrum
│   │   ├── TextMoodModal.jsx   # Free-text AI emotion classifier modal
│   │   └── YouTubeHost.jsx     # Hidden YouTube IFrame Player API host
│   ├── utils/
│   │   ├── audioContext.js     # Web Audio API hardware engine & analyser
│   │   ├── constants.js        # Mood profiles, colors, targets, and EQ presets
│   │   ├── recommender.js      # JS Cosine Similarity, MinMaxScaler, k-NN
│   │   └── textMood.js         # Lexical emotion classifier
│   ├── App.jsx                 # Main stateful application controller
│   ├── main.jsx                # React root mount
│   └── index.css               # Tailwind CSS & custom scrollbars
├── index.html                  # HTML5 entry with YouTube API script
├── vite.config.js              # Vite configuration with relative base
├── tailwind.config.js          # Custom colors, fonts, and keyframes
├── package.json                # Project dependencies and build scripts
└── README.md                   # Project documentation
```

---

## 👥 The Team

Maintained by a team of first-year BTech Artificial Intelligence students:

| Member | Role | Focus Area |
| :--- | :--- | :--- |
| **Akash Dhakad** | Lead Full-Stack & 3D | Three.js R3F Canvas, Audio DSP & Architecture |
| **Team Member 2** | ML & Recommendation | Audio Feature Vectors, MinMaxScaler, k-NN |
| **Team Member 3** | Data Engineering | Dataset Curation, ytmusicapi & iTunes Pipeline |
| **Team Member 4** | UI/UX & Player | Glassmorphic Cards, Queue & Responsive Design |

---

## ⚠️ Limitations & Technical Notes

- **YouTube Embed Restrictions**: A small percentage of official music videos may have third-party embedding disabled by copyright holders (YouTube Player Error 101/150). When encountered, MoodTunes catches the error and automatically skips to the next track.
- **30s Audio Previews in Bass Lab**: Apple iTunes previews are capped at 30 seconds of high-fidelity AAC audio, designed for instant studio auditioning and hardware equalizer testing.
- **CORS Audio Buffers**: Web Audio API access to cross-origin media can occasionally trigger browser security policies. When active, MoodTunes automatically falls back to an audio-synchronized procedural waveform for the 3D visualizer without interrupting audio output.

---

## 🔮 Future Scope

- [ ] **Spotify OAuth Integration**: Save playlists directly to personal Spotify accounts.
- [ ] **Multi-Mood Emotion Blends**: 2D slider to interpolate between moods (e.g., $70\%$ Relaxed + $30\%$ Focus).
- [ ] **User Custom MP3 Uploads**: Drop local audio files into Bass Lab for real-time 3D visualization.
- [ ] **Expanded Regional Languages**: Add Tamil, Telugu, and Bengali acoustic datasets.
- [ ] **Collaborative Party Queue**: Real-time room sync via WebSockets / WebRTC.

---

## 📄 License
This project is open-source and released under the [MIT License](LICENSE).
