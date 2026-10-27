# MoodTunes 🎵 — AI Mood-Based Music Recommender

> **Your vibe, your sound.** An AI-powered music recommendation web app that maps human emotions into audio feature space using Machine Learning, recommending 5,000+ Hindi, Punjabi, and English tracks tailored to how you feel.

[![Live Demo](https://img.shields.io/badge/Streamlit-Live%20Demo-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)](https://YOUR-APP-NAME.streamlit.app)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 🌐 Live Demo
Experience the application live here:  
👉 **[https://YOUR-APP-NAME.streamlit.app](https://YOUR-APP-NAME.streamlit.app)** *(Replace with your deployment link)*

---

## 📸 Screenshots

| Mood Selection & Recommendations | Affective Feature Space (Plotly 2D) |
|:---:|:---:|
| ![MoodTunes Dashboard](https://raw.githubusercontent.com/placeholder/moodtunes-ui-1.png) | ![Emotional Space](https://raw.githubusercontent.com/placeholder/moodtunes-ui-2.png) |

*(Add your application screenshots above once deployed)*

---

## ✨ Key Features

1. **6 Calibrated Emotional Moods**:
   - 😊 **Happy**: Upbeat, high-valence, energetic anthems and party hits.
   - 😢 **Sad**: Melancholic, acoustic, heart-touching ballads.
   - 🧘 **Relaxed**: Lo-Fi, ambient, acoustic, peaceful chill tracks.
   - ⚡ **Energetic**: High-BPM workout, pump-up, and dance club tracks.
   - 🎯 **Focus**: Instrumental, low-distraction rhythms for coding and study flow.
   - 😡 **Angry**: High-intensity, heavy-distortion rock, metal, and rap tracks.

2. **Extensive Multilingual Catalog (5,000+ Tracks)**:
   - 🇮🇳 **Hindi**: 1,200+ Bollywood and indie songs (Arijit Singh, Atif Aslam, Mohit Chauhan, KK, Anuv Jain, Prateek Kuhad, and recent 2023–2026 chart-toppers).
   - 🥁 **Punjabi**: 1,100+ Punjabi hits (Diljit Dosanjh, Sidhu Moose Wala, Karan Aujla, AP Dhillon, Shubh, Guru Randhawa, B Praak).
   - 🇬🇧 **English / Global**: 2,600+ international pop, rock, electronic, and ambient tracks.

3. **Smart Filters & Personalization**:
   - **Language Multiselect**: Choose any combination of English, Hindi, and Punjabi.
   - **Recent Songs Only (2022+)**: Instant toggle for latest viral and chart releases.
   - **Popularity Range Slider**: Find mainstream hits or hidden underground gems.
   - **Freshness Randomizer**: Probabilistic weighted sampling keeps suggestions fresh on every click.

4. **"More Like This" (KNN Audio Twins)**:
   - Click one button on any recommended song to find similar tracks using unsupervised k-Nearest Neighbors in feature space.

5. **Bonus: Free-Text Emotion Detection (NLP)**:
   - Type *"Had a super long day, just want to lay down and unwind"* to automatically detect emotion via a lightweight transformer with an offline rule-based fallback.

6. **Interactive 2D Affect Space Chart (Plotly)**:
   - Displays recommendations on Russell's Circumplex Model (Valence vs. Energy), plotting tracks against the target mood vector.

7. **Instant YouTube Search Links**:
   - One-click `▶️ Listen on YouTube` link button for every song.

---

## 🧠 How It Works (The ML Pipeline)

```
[User Selects Mood / Types Text]
                │
                ▼
[Russell's Circumplex Target Vector in ℝ⁶]
 (Valence, Energy, Danceability, Acousticness, Instrumentalness, Tempo)
                │
                ▼
[MinMaxScaler Normalization]
 Normalizes features to uniform [0, 1] bounds
                │
                ▼
[Vectorized Cosine Similarity Search]
 Slices database by Language & Year filters
 Computes: Cosine_Sim(u, v) = (u · v) / (||u|| ||v||)
                │
                ▼
[Weighted Probabilistic Sampling]
 Avoids deterministic repetition; surfaces top matches
                │
                ▼
[Streamlit Modern UI Cards + Plotly Visuals]
```

### Audio Feature Metrics:
- **Valence**: Musical positiveness (0.0 = sad/depressing, 1.0 = cheerful/euphoric).
- **Energy**: Perceptual speed and loudness (0.0 = calm, 1.0 = fast/intense).
- **Danceability**: Beat regularity and rhythm strength.
- **Acousticness**: Confidence measure whether the song is acoustic.
- **Instrumentalness**: Predicts whether a track contains vocals (high for Focus mode).
- **Tempo**: Beats Per Minute (BPM), rescaled to prevent feature scale dominance.

---

## 🛠️ Tech Stack

- **Frontend / UI**: [Streamlit](https://streamlit.io/) with custom dark glassmorphic CSS
- **Data Manipulation**: [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/)
- **Machine Learning**: [scikit-learn](https://scikit-learn.org/) (`MinMaxScaler`, `NearestNeighbors`, `cosine_similarity`)
- **Visualizations**: [Plotly Express & Graph Objects](https://plotly.com/)
- **Natural Language Processing**: Hugging Face Transformers pipeline (with built-in Rule-Based NLP fallback)

---

## 📊 Dataset Sources & Credits

- **Global Spotify Tracks**: 114k Tracks Dataset (Kaggle / Plotly Figure Friday).
- **Hindi Hits & Bollywood**: Curated collection across modern Indian cinema (T-Series, Sony Music India, Zee Music Co.).
- **Punjabi Pop & Folk**: Curated collection of top Punjabi streaming tracks (Speed Records, Gully Gang, Warner Music India).
- All metadata and audio features are structured in `data/songs.csv` (< 1 MB, no external API keys required).

---

## 🚀 Local Setup Guide

Follow these steps to run MoodTunes locally on your machine:

### 1. Clone the Repository
```bash
git clone https://github.com/akashcyber02/mood-based-song.git
cd "mood-based-song"
```

### 2. Create and Activate Virtual Environment
```bash
# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# Windows (Command Prompt / PowerShell)
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Streamlit Application
```bash
streamlit run app.py
```
The app will launch in your default browser at `http://localhost:8501`.

### 5. Run Automated Unit Tests
```bash
python3 -m unittest test_recommender.py
```

---

## 📁 Project Structure

```
MOOD BASED SONGS/
├── data/
│   ├── songs.csv              # Unified dataset (5,030 songs with audio features)
│   ├── curated_songs.csv      # 328 verified recent Hindi & Punjabi tracks
│   ├── hindi.csv              # 1,000+ Hindi songs with audio features
│   └── punjabi.csv            # 1,100+ Punjabi songs with audio features
├── app.py                     # Streamlit web application & modern UI dashboard
├── recommender.py             # Recommender engine (Scaling, Cosine Similarity, KNN)
├── mood_map.py                # Audio feature targets based on Russell's Circumplex
├── text_mood.py               # Free-text emotion classifier (HF + NLP fallback)
├── prepare_data.py            # Automated data normalization and merger pipeline
├── test_recommender.py        # Automated test suite (7 unit tests)
├── requirements.txt           # Pinned production dependencies
├── .gitignore                 # Standard clean repository exclusions
└── README.md                  # Project documentation & presentation guide
```

---

## 👥 The Team

Created and maintained by a team of first-year BTech AI students:

| Team Member | Role | Focus Area |
| :--- | :--- | :--- |
| **Akash Dhakad** | Project Lead & Full-Stack | Streamlit Dashboard & UI Architecture |
| **Team Member 2** | ML Engineer | Recommender Models & Feature Scaling |
| **Team Member 3** | Data Engineer | Dataset Normalization & Curation |
| **Team Member 4** | NLP / QA Engineer | Emotion Classification & Unit Testing |

---

## 🔮 Future Scope

- [ ] **Spotify OAuth Integration**: Save recommended tracks directly to the user's Spotify library.
- [ ] **Acoustic Waveform Previews**: In-app 30-second audio snippet player.
- [ ] **Multi-Mood Blends**: Slider to interpolate between moods (e.g. 70% Relaxed + 30% Focus).
- [ ] **Expanded Regional Languages**: Add Tamil, Telugu, and Bengali song collections.
- [ ] **Collaborative Filtering**: Incorporate user feedback ratings to learn preference weights.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
