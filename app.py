"""
MoodTunes - AI Mood-Based Song Recommender
=========================================
A modern, aesthetic Streamlit web application powered by scikit-learn and NLP.
Built for first-year BTech AI students to showcase:
- Audio feature vector mapping (Russell's Circumplex Model of Affect)
- MinMax feature scaling & Cosine Similarity search
- Multilingual filtering (Hindi, Punjabi, English)
- Recency filter (2022+ Recent Hits)
- k-Nearest Neighbors (KNN) content-based filtering
- Emotion analysis from text (Hugging Face / Rule-Based NLP engine)
- Interactive Plotly 2D Valence-Energy emotional space visualization
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go

from mood_map import (
    MOOD_PROFILES,
    FEATURE_COLUMNS,
    get_all_moods,
    get_mood_profile,
    get_mood_vector,
)
from recommender import MoodRecommender
from text_mood import detect_mood_from_text

# -----------------------------------------------------------------------------
# 1. Page Configuration & Custom CSS Styling (Dark Theme & Glassmorphism)
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="MoodTunes | AI Music Recommender",
    page_icon="🎵",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif;
    }

    /* Overall dark modern background */
    .stApp {
        background: radial-gradient(circle at 10% 20%, #0d1117 0%, #161b22 90%);
        color: #f0f6fc;
    }

    /* Hero title styling */
    .hero-title {
        background: linear-gradient(135deg, #FF6B6B 0%, #FFA07A 25%, #9B5DE5 50%, #00F5D4 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 800;
        font-size: 3.2rem !important;
        letter-spacing: -0.03em;
        margin-bottom: 4px;
        line-height: 1.1;
    }

    .hero-sub {
        color: #8b949e;
        font-size: 1.15rem;
        margin-bottom: 24px;
        font-weight: 400;
    }

    /* Language badges */
    .lang-badge-hindi {
        display: inline-block;
        padding: 3px 9px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
        background: linear-gradient(135deg, #FF9933, #E65100);
        color: #FFFFFF;
        box-shadow: 0 2px 6px rgba(255, 153, 51, 0.3);
    }

    .lang-badge-punjabi {
        display: inline-block;
        padding: 3px 9px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
        background: linear-gradient(135deg, #00B4D8, #0077B6);
        color: #FFFFFF;
        box-shadow: 0 2px 6px rgba(0, 180, 216, 0.3);
    }

    .lang-badge-english {
        display: inline-block;
        padding: 3px 9px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
        background: linear-gradient(135deg, #7B2CBF, #5A189A);
        color: #FFFFFF;
        box-shadow: 0 2px 6px rgba(123, 44, 191, 0.3);
    }

    .lang-badge-other {
        display: inline-block;
        padding: 3px 9px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
        background: #30363d;
        color: #c9d1d9;
    }

    .year-pill {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 600;
        background: rgba(255, 255, 255, 0.08);
        color: #8b949e;
        margin-left: 5px;
    }

    .match-pill {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 0.82rem;
        font-weight: 800;
        background: linear-gradient(90deg, #10B981, #059669);
        color: white;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
    }

    /* Glassmorphism song cards */
    .song-card {
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        background: rgba(22, 27, 34, 0.75);
        border: 1px solid rgba(240, 246, 252, 0.1);
        border-left: 6px solid #FF6B6B;
        backdrop-filter: blur(12px);
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .song-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
        border-color: rgba(240, 246, 252, 0.2);
    }

    /* Active mood banner */
    .mood-banner {
        border-radius: 14px;
        padding: 16px 20px;
        margin: 12px 0 24px 0;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }

    /* Sidebar stats pill */
    .stat-box {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 10px;
        padding: 10px 14px;
        margin-bottom: 8px;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# -----------------------------------------------------------------------------
# 2. Recommender Initialization & Session State
# -----------------------------------------------------------------------------
@st.cache_resource
def get_recommender() -> MoodRecommender:
    """Initializes and caches the Recommender model singleton."""
    return MoodRecommender("data/songs.csv")


try:
    recommender = get_recommender()
except Exception as e:
    st.error(f"❌ Error initializing recommender: {e}")
    st.stop()

# Initialize session state variables
if "selected_mood" not in st.session_state:
    st.session_state.selected_mood = "Happy"
if "seed_song" not in st.session_state:
    st.session_state.seed_song = None
if "mode" not in st.session_state:
    st.session_state.mode = "mood"  # 'mood', 'text', 'more_like_this'
if "recommendations" not in st.session_state:
    st.session_state.recommendations = recommender.recommend_by_mood("Happy", n_recommendations=10)


# -----------------------------------------------------------------------------
# 3. Sidebar Filters & Configuration
# -----------------------------------------------------------------------------
with st.sidebar:
    st.markdown("### 🎛️ Recommender Filters")
    st.caption("Customize your music discovery preferences")

    # Language Multiselect (English, Hindi, Punjabi)
    available_langs = recommender.get_available_languages()
    selected_languages = st.multiselect(
        "Languages",
        options=available_langs,
        default=available_langs,
        help="Filter songs strictly by language (English, Hindi, Punjabi)",
    )
    if not selected_languages:
        selected_languages = available_langs

    # Recent Songs Only (2022+)
    recent_only = st.toggle(
        "🔥 Recent Songs Only (2022+)",
        value=False,
        help="Limit recommendations to recent hits released in 2022 or later.",
    )

    # Number of songs
    num_songs = st.slider(
        "Number of recommendations",
        min_value=5,
        max_value=25,
        value=10,
        step=1,
        help="How many matching songs to retrieve",
    )

    # Minimum Popularity Slider
    min_popularity = st.slider(
        "Minimum Popularity (0 - 100)",
        min_value=0,
        max_value=90,
        value=0,
        step=5,
        help="Filter tracks by Spotify popularity score",
    )

    # Shuffle Candidates
    randomize = st.checkbox(
        "🎲 Shuffle Candidate Pool (Freshness)",
        value=True,
        help="Adds slight probabilistic variety to top similarity results so you discover fresh gems on each click.",
    )

    st.markdown("---")
    st.markdown("### 📊 Dataset Library")
    st.markdown(
        f"""
        <div class="stat-box">🎵 <strong>Total Songs:</strong> {len(recommender.df):,}</div>
        <div class="stat-box">🇮🇳 <strong>Hindi Tracks:</strong> {len(recommender.df[recommender.df['language'] == 'Hindi']):,}</div>
        <div class="stat-box">🥁 <strong>Punjabi Tracks:</strong> {len(recommender.df[recommender.df['language'] == 'Punjabi']):,}</div>
        <div class="stat-box">🌍 <strong>English / Other:</strong> {len(recommender.df[recommender.df['language'] == 'English']):,}</div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown("---")
    st.caption("🚀 **MoodTunes v2.0** • Team of 4 BTech AI Students 🎓")


# -----------------------------------------------------------------------------
# 4. Header & Hero Section
# -----------------------------------------------------------------------------
st.markdown('<h1 class="hero-title">MoodTunes 🎵</h1>', unsafe_allow_html=True)
st.markdown(
    '<p class="hero-sub">AI-Powered Mood-to-Music Recommender • Featuring 5,000+ Hindi, Punjabi & Global Tracks</p>',
    unsafe_allow_html=True,
)


# -----------------------------------------------------------------------------
# 5. Mood Selector Buttons (Interactive Colorful Grid)
# -----------------------------------------------------------------------------
st.markdown("### 1. Select Your Mood")
mood_names = get_all_moods()
cols = st.columns(len(mood_names))

for idx, m_name in enumerate(mood_names):
    profile = get_mood_profile(m_name)
    with cols[idx]:
        is_active = (st.session_state.selected_mood == m_name and st.session_state.mode == "mood")
        btn_label = f"{profile['emoji']} {m_name}"

        if st.button(
            btn_label,
            key=f"btn_mood_{m_name}",
            use_container_width=True,
            type="primary" if is_active else "secondary",
        ):
            st.session_state.selected_mood = m_name
            st.session_state.mode = "mood"
            st.session_state.seed_song = None
            st.session_state.recommendations = recommender.recommend_by_mood(
                mood=m_name,
                n_recommendations=num_songs,
                min_popularity=min_popularity,
                languages=selected_languages,
                recent_only=recent_only,
                randomize=randomize,
            )
            st.rerun()


# -----------------------------------------------------------------------------
# 6. Bonus Feature: "How are you feeling today?" Free-Text Emotion Detector
# -----------------------------------------------------------------------------
with st.expander("✨ Bonus: Tell us how you feel in words (Free-Text AI Mood Detection)", expanded=False):
    st.caption("Express yourself freely. Our NLP engine classifies your emotion into one of the 6 moods and recommends songs instantly.")
    user_text = st.text_input(
        "How are you feeling today?",
        placeholder="e.g., Had an exhausting day, just want to listen to some chill acoustic Punjabi vibes...",
    )

    if st.button("🔍 Detect Emotion from Text", type="primary"):
        if user_text.strip():
            detection = detect_mood_from_text(user_text)
            detected_mood = detection["mood"]
            st.session_state.selected_mood = detected_mood
            st.session_state.mode = "text"
            st.session_state.seed_song = None
            st.session_state.recommendations = recommender.recommend_by_mood(
                mood=detected_mood,
                n_recommendations=num_songs,
                min_popularity=min_popularity,
                languages=selected_languages,
                recent_only=recent_only,
                randomize=randomize,
            )

            st.success(
                f"Detected Mood: **{detected_mood}** {get_mood_profile(detected_mood)['emoji']} "
                f"({detection['confidence']}% confidence) • *{detection['engine']}*"
            )
            st.info(f"💡 {detection['explanation']}")
            st.rerun()
        else:
            st.warning("Please type a sentence first!")


# -----------------------------------------------------------------------------
# 7. Active Mood Banner & Seed Song Notice
# -----------------------------------------------------------------------------
active_mood = st.session_state.selected_mood
active_profile = get_mood_profile(active_mood)

if st.session_state.mode == "more_like_this" and st.session_state.seed_song is not None:
    seed = st.session_state.seed_song
    st.info(
        f"🎧 **Audio Twins for:** *{seed['track_name']}* by **{seed['artists']}** "
        f"({seed.get('language', 'Music')} • {seed.get('year', '')}) — Found via k-Nearest Neighbors"
    )
else:
    active_filters_str = ", ".join(selected_languages)
    if recent_only:
        active_filters_str += " • 2022+ Only"

    st.markdown(
        f"""
        <div class="mood-banner" style="border-left: 6px solid {active_profile['color']};">
            <span style="font-size: 1.6rem; margin-right: 8px;">{active_profile['emoji']}</span>
            <strong style="font-size: 1.25rem; color: {active_profile['color']};">{active_mood} Mood</strong>
            <span style="color: #8b949e; font-size: 0.9rem; margin-left: 12px;">[{active_filters_str}]</span>
            <p style="margin: 6px 0 0 0; color: #c9d1d9; font-size: 0.96rem;">{active_profile['description']} — <em>"{active_profile['quote']}"</em></p>
        </div>
        """,
        unsafe_allow_html=True,
    )


# -----------------------------------------------------------------------------
# 8. Main Content: Recommendations & 2D Affect Space Chart
# -----------------------------------------------------------------------------
recs_df = st.session_state.recommendations

if recs_df.empty:
    st.warning("⚠️ No songs found matching your filter criteria. Try expanding the selected languages or lowering the popularity slider!")
else:
    col_left, col_right = st.columns([1.15, 0.85], gap="large")

    # --- LEFT COLUMN: Song Cards ---
    with col_left:
        st.markdown(f"### 🎶 Top Recommendations ({len(recs_df)} tracks)")

        for idx, row in recs_df.iterrows():
            song_title = row.get("track_name", "Unknown Title")
            artists = row.get("artists", "Unknown Artist")
            lang = row.get("language", "English")
            year = row.get("year", 2022)
            pop = row.get("popularity", 50)
            score = row.get("match_score", 95.0)
            yt_url = row.get("youtube_url", "#")
            track_id = row.get("track_id", f"track_{idx}")

            card_border_color = active_profile["color"]

            # Select language badge CSS class
            lang_lower = str(lang).lower()
            if "hindi" in lang_lower:
                lang_badge_html = f'<span class="lang-badge-hindi">🇮🇳 {lang}</span>'
            elif "punjabi" in lang_lower:
                lang_badge_html = f'<span class="lang-badge-punjabi">🥁 {lang}</span>'
            elif "english" in lang_lower:
                lang_badge_html = f'<span class="lang-badge-english">🇬🇧 {lang}</span>'
            else:
                lang_badge_html = f'<span class="lang-badge-other">🌐 {lang}</span>'

            with st.container():
                st.markdown(
                    f"""
                    <div class="song-card" style="border-left-color: {card_border_color};">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h4 style="margin: 0; font-size: 1.15rem; color: #FFFFFF; font-weight: 700;">{idx + 1}. {song_title}</h4>
                                <p style="margin: 3px 0 6px 0; color: #8b949e; font-size: 0.95rem;">👤 {artists}</p>
                            </div>
                            <div style="text-align: right;">
                                <span class="match-pill">{score}% Match</span>
                                <div style="margin-top: 5px;">
                                    {lang_badge_html}
                                    <span class="year-pill">📅 {year}</span>
                                </div>
                            </div>
                        </div>
                        <div style="margin-top: 10px; font-size: 0.84rem; color: #8b949e;">
                            <span>⚡ Energy: <strong style="color: #c9d1d9;">{int(row['energy'] * 100)}%</strong></span> &nbsp;•&nbsp;
                            <span>😊 Valence: <strong style="color: #c9d1d9;">{int(row['valence'] * 100)}%</strong></span> &nbsp;•&nbsp;
                            <span>💃 Dance: <strong style="color: #c9d1d9;">{int(row['danceability'] * 100)}%</strong></span> &nbsp;•&nbsp;
                            <span>🔥 Popularity: <strong style="color: #c9d1d9;">{pop}/100</strong></span>
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

                # Action buttons: YouTube & More Like This
                btn_c1, btn_c2 = st.columns([0.48, 0.52])
                with btn_c1:
                    st.link_button("▶️ Listen on YouTube", yt_url, use_container_width=True)
                with btn_c2:
                    if st.button("🎵 More Like This (KNN)", key=f"mlt_{track_id}_{idx}", use_container_width=True):
                        seed_song, similar_df = recommender.recommend_more_like_this(
                            track_id=track_id,
                            n_recommendations=num_songs,
                        )
                        st.session_state.seed_song = seed_song
                        st.session_state.mode = "more_like_this"
                        st.session_state.recommendations = similar_df
                        st.rerun()

                st.write("")

    # --- RIGHT COLUMN: 2D Affect Space Chart (Russell's Circumplex Model) ---
    with col_right:
        st.markdown("### 🌌 Emotional Feature Space")
        st.caption("Tracks positioned on Russell's Circumplex Plane: **Valence** (Positiveness) vs **Energy** (Arousal).")

        fig = px.scatter(
            recs_df,
            x="valence",
            y="energy",
            hover_name="track_name",
            hover_data={
                "artists": True,
                "language": True,
                "year": True,
                "match_score": True,
                "valence": ":.2f",
                "energy": ":.2f",
                "popularity": True,
            },
            color="match_score",
            color_continuous_scale="Viridis",
            labels={"valence": "Valence (Musical Positiveness)", "energy": "Energy (Arousal & Intensity)"},
            title=f"Distribution of Recommendations for {active_mood}",
        )

        # Target mood centroid point
        target_vec = get_mood_profile(active_mood)["targets"]
        fig.add_trace(
            go.Scatter(
                x=[target_vec["valence"]],
                y=[target_vec["energy"]],
                mode="markers+text",
                marker=dict(size=18, color=active_profile["color"], symbol="star-diamond", line=dict(width=2, color="white")),
                text=[f"🎯 {active_mood} Target"],
                textposition="top center",
                name="Mood Target Vector",
            )
        )

        # Quadrant dashed reference lines at 0.5
        fig.add_hline(y=0.5, line_dash="dot", line_color="rgba(255,255,255,0.2)")
        fig.add_vline(x=0.5, line_dash="dot", line_color="rgba(255,255,255,0.2)")

        fig.update_layout(
            xaxis=dict(range=[0, 1.05], gridcolor="rgba(255,255,255,0.08)"),
            yaxis=dict(range=[0, 1.05], gridcolor="rgba(255,255,255,0.08)"),
            plot_bgcolor="rgba(0,0,0,0)",
            paper_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#E2E8F0"),
            height=460,
            margin=dict(l=20, r=20, t=50, b=20),
        )

        st.plotly_chart(fig, use_container_width=True)

        # Theoretical ML Guide for Presentation / Viva
        with st.container():
            st.markdown(
                r"""
                > **🧠 AI / Machine Learning Insights for Viva:**
                > - **Vector Space Model:** Every track is an $N$-dimensional vector in $\mathbb{R}^6$ (Valence, Energy, Danceability, Acousticness, Instrumentalness, Tempo).
                > - **MinMax Normalization:** Rescales tempo (BPM) from $[60, 220]$ to $[0, 1]$ to ensure balanced Euclidean/Cosine contributions.
                > - **Cosine Similarity:** Measures angular directional alignment:
                >   $$\text{Cosine Sim}(\vec{u}, \vec{v}) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\| \|\vec{v}\|}$$
                > - **KNN Neighborhood:** Instant audio twin lookups in sub-millisecond latency.
                """
            )
