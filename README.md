## 💻 Run Locally

**Local URL:** http://localhost:5173

### Steps to run

1. Clone the repository:
   ```bash
   git clone https://github.com/akashcyber02/mood-based-song.git
   ```

2. Open the project folder:
   ```bash
   cd mood-based-song
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open the URL shown in your terminal, usually:
   http://localhost:5173

**Note:** The application must be running locally to access this URL. The port may vary depending on your configuration.


# MoodTunes 🎵 — AI Mood Music Discovery & Player

> **Pick your mood, then tap a song.** A clean, modern, Spotify-style music discovery web app. Maps human emotional states (**Happy, Sad, Relaxed, Energetic, Focus, Angry**) into multi-dimensional audio feature space, delivering personalized recommendations across **7,200+ Hindi, Punjabi, Haryanvi, and English tracks** (including recent 2024–2026 releases) with in-app audio streaming, an endless non-repeating queue, fuzzy instant search, and a dedicated Web Audio **Bass Lab™** studio.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-FF3366?style=for-the-badge&logo=githubpages&logoColor=white)](https://akashcyber02.github.io/mood-based-song/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## 🌐 Live Demo
- **GitHub Pages**: [https://akashcyber02.github.io/mood-based-song/](https://akashcyber02.github.io/mood-based-song/)
- **Zero Server Setup**: Built as a 100% static client-side application (`dist/`), deployable directly to GitHub Pages, Vercel, or Netlify with no backend server.

---

## 📸 Screenshots & Overview

| 🎵 Spotify-Style Discovery & Spinning Vinyl | 🎛️ Honest Bass Lab™ (Real Web Audio DSP) |
|:---:|:---:|
| Clean 3-zone layout with mood chips, instant search, and endless queue | Studio preview stem analyzer with +15 dB lowshelf boost & presets |

---

## ✨ Features

1. **6 Calibrated Mood Playlists**:
   - 😊 **Happy**: High valence, energetic, uplifting dance rhythms.
   - 😢 **Sad**: Low valence, acoustic, reflective melodies.
   - 🌿 **Relaxed**: Low energy, ambient, acoustic calm.
   - ⚡ **Energetic**: High energy, driving tempo, pumping workout bangers.
   - 🎯 **Focus**: Balanced valence, steady tempo, minimal variance.
   - 🔥 **Angry**: Aggressive, heavy energy, driving distortion.

2. **Multilingual Catalog (7,200+ Songs)**:
   - **Hindi (1,730+ songs)**: Bollywood chartbusters, romantic acoustics, indie hits.
   - **Punjabi (1,650+ songs)**: Diljit Dosanjh, Sidhu Moose Wala, Karan Aujla, AP Dhillon.
   - **Haryanvi (560+ songs)**: Masoom Sharma, Renuka Panwar, Gulzaar Chhaniwala, DJ bangers.
   - **English (3,330+ songs)**: Billboard pop, EDM festival hits, hip-hop, lo-fi chill.
   - **🔥 2024+ New Hits Toggle**: Filter specifically for modern 2024, 2025, and 2026 releases.

3. **Endless, Non-Repeating Queue**:
   - Samples from the top 100 most similar candidate pool using weighted random selection.
   - Tracks session-played song IDs per mood to prevent repetitions.
   - Autoplay automatically refills when the queue drops below 3 songs.
   - Previous button uses a real playback history stack.
   - "Load More Songs" for infinite browsing.

4. **Instant Fuzzy Search (`Fuse.js`)**:
   - Instant search across titles and artists debounced at 200 ms.
   - Press `/` from anywhere on the page to focus the search bar immediately.
   - Clicking any result plays it and queues matching audio twin tracks.

5. **Honest Bass Lab™ (Web Audio DSP Studio)**:
   - YouTube iframe audio cannot be intercepted due to browser cross-origin security, so normal playback remains clean and unmanipulated.
   - Clicking **"Bass Lab"** loads a 30-second studio preview stem with real Web Audio DSP:
     - 110 Hz low-shelf sub-bass booster (+0 dB to +15 dB).
     - 5 DSP EQ presets: *Normal*, *Bass Boost*, *Vocal*, *Treble*, *Club*.
     - Loudness gain multiplier (50% to 150%).
     - Real-time frequency spectrum visualizer powered by `AnalyserNode`.

6. **Interactive Presentation Polish**:
   - **First-time Welcome Overlay**: Explains the premise and unlocks browser audio permissions with one click.
   - **Surprise Me 🎲**: Picks a random mood and track instantly.
   - **Mood from Text 🧠**: Analyzes natural language sentences (e.g. *"Stressed about exams and need to code"*) to auto-select matching moods.
   - **Session Trail**: Visual breadcrumb strip tracking moods explored during the visit.
   - **Favorites ❤️**: Save tracks to persistent `localStorage`.
   - **Keyboard Shortcuts**: `Space` (play/pause), `Left`/`Right` (±10s), `N` (next), `P` (prev), `M` (mute), `/` (search).

---

## 🔬 How It Works (The ML & Audio Pipeline)

```
[User Selects Mood / Types Text Prompt]
                │
                ▼
[Russell's Circumplex Affect Target Vector in ℝ⁶]
 (Valence, Energy, Danceability, Acousticness, Instrumentalness, Tempo)
                │
                ▼
[Client-Side MinMaxScaler]
 Normalizes features to uniform [0, 1] bounds using precomputed dataset boundaries
                │
                ▼
[Vectorized Cosine Similarity Search]
 Filters database by Language (Hindi/Punjabi/Haryanvi/English) & Recency (2024+)
 Computes: Cosine_Sim(A, B) = (A · B) / (||A|| * ||B||)
                │
                ▼
[Top 100 Candidate Pool & No-Repeat Sampling]
 Filters out already-played session IDs; samples probabilistically
                │
                ▼
[In-App Streaming]
 Full YouTube IFrame Streaming OR 30s Web Audio Bass Lab Studio
```

---

## 🛠️ Tech Stack & Credits

- **Frontend**: React 18, Vite 5.4, TailwindCSS 3.4, Lucide Icons, Fuse.js
- **Audio Engines**:
  - YouTube IFrame Player API (off-screen layout host)
  - HTML5 Audio & Web Audio API (`AudioContext`, `BiquadFilterNode`, `GainNode`, `AnalyserNode`)
- **Data Pipeline**:
  - Python 3, pandas, scikit-learn
  - `ytmusicapi` for YouTube track metadata and streaming video IDs
  - Apple iTunes Search API for 30s studio preview stems and high-res artwork
  - Kaggle Spotify Tracks dataset for initial audio feature distributions

---

## ⚠️ Playback Notes & Limitations

1. **Third-Party Embedding Restrictions (Error 101/150)**: Some record labels disallow streaming inside third-party website iframes. MoodTunes intercepts these errors instantly and auto-skips to the next playable song with a toast notification.
2. **Audio Autoplay Rules**: Modern browsers require an initial user gesture before playing audio. Tapping the Welcome overlay or any song row unlocks audio playback.
3. **Web Audio Scope**: Web Audio processing is available inside **Bass Lab™** on 30s preview stems due to cross-origin security constraints on YouTube iframes.

---

## 🚀 Local Development

```bash
# Clone the repository
git clone https://github.com/akashcyber02/mood-based-song.git
cd mood-based-song

# Install dependencies
npm install

# Start Vite development server
npm run dev
# App will run on http://localhost:3000

# Build static bundle for production
npm run build
```

---

## 👥 Team (First-Year B.Tech AI Project)

- **Akash Dhakad** — Lead Architecture & Full-Stack Development
- **Team Member 2** — Audio Feature Engineering & ML Pipeline
- **Team Member 3** — Dataset Curation & Search Optimization
- **Team Member 4** — Frontend Design & Product Polish

---

## 📄 License
MIT License. Created for music lovers and AI learners.
