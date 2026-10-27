"""
Mood Mapping Module for MoodTunes
=================================
This module defines the mapping between human emotional moods and Spotify audio features.

Underlying Theory: Russell's Circumplex Model of Affect
-------------------------------------------------------
In music psychology, emotions are commonly plotted on a 2D plane:
1. Valence (Horizontal Axis): Pleasantness vs. Unpleasantness (Positive vs. Negative)
2. Energy / Arousal (Vertical Axis): High physiological activation vs. Calm / Deactivation

Spotify Audio Feature Definitions:
----------------------------------
- valence: Positiveness of the track (0.0 = depressing/sad, 1.0 = cheerful/euphoric)
- energy: Intensity and activity (0.0 = calm/subdued, 1.0 = fast/loud/noisy)
- danceability: How suitable the track is for dancing based on tempo, rhythm, beat strength (0.0 to 1.0)
- acousticness: Confidence whether the track is acoustic (0.0 to 1.0)
- instrumentalness: Likelihood of having no vocals (0.0 to 1.0; >0.5 typically instrumental)
- tempo: Overall tempo of the track in Beats Per Minute (BPM, typically 60 - 200 BPM)
"""

from typing import Dict, Any, List

# Feature keys used for machine learning recommendation vectors
FEATURE_COLUMNS: List[str] = [
    "valence",
    "energy",
    "danceability",
    "acousticness",
    "instrumentalness",
    "tempo",
]

# Audio feature target profiles for each mood
# Tempo is stored in BPM (will be min-max scaled by recommender)
MOOD_PROFILES: Dict[str, Dict[str, Any]] = {
    "Happy": {
        "emoji": "😊",
        "description": "Upbeat, cheerful, feel-good rhythms to brighten your day.",
        "color": "#FFD166",
        "targets": {
            "valence": 0.88,
            "energy": 0.82,
            "danceability": 0.78,
            "acousticness": 0.15,
            "instrumentalness": 0.05,
            "tempo": 122.0,
        },
        "quote": "Turn up the sunshine!",
    },
    "Sad": {
        "emoji": "😢",
        "description": "Melancholic, reflective, gentle acoustic melodies for healing.",
        "color": "#118AB2",
        "targets": {
            "valence": 0.18,
            "energy": 0.25,
            "danceability": 0.35,
            "acousticness": 0.75,
            "instrumentalness": 0.15,
            "tempo": 84.0,
        },
        "quote": "Sometimes music is the only medicine the heart understands.",
    },
    "Relaxed": {
        "emoji": "🧘",
        "description": "Calm, ambient, soothing tones to unwind and de-stress.",
        "color": "#06D6A0",
        "targets": {
            "valence": 0.58,
            "energy": 0.28,
            "danceability": 0.48,
            "acousticness": 0.78,
            "instrumentalness": 0.35,
            "tempo": 92.0,
        },
        "quote": "Breathe in peace, exhale tension.",
    },
    "Energetic": {
        "emoji": "⚡",
        "description": "High-octane, pumping beats for workouts, running, or hype sessions.",
        "color": "#EF476F",
        "targets": {
            "valence": 0.72,
            "energy": 0.94,
            "danceability": 0.82,
            "acousticness": 0.08,
            "instrumentalness": 0.05,
            "tempo": 138.0,
        },
        "quote": "Feel the adrenaline surge!",
    },
    "Focus": {
        "emoji": "🎯",
        "description": "Steady, instrumental, low-distraction flows for coding and studying.",
        "color": "#7B2CBF",
        "targets": {
            "valence": 0.45,
            "energy": 0.40,
            "danceability": 0.45,
            "acousticness": 0.60,
            "instrumentalness": 0.82,
            "tempo": 105.0,
        },
        "quote": "Lock in and enter deep flow state.",
    },
    "Angry": {
        "emoji": "😡",
        "description": "Aggressive, high-distortion, raw energy to let out steam.",
        "color": "#E63946",
        "targets": {
            "valence": 0.20,
            "energy": 0.95,
            "danceability": 0.42,
            "acousticness": 0.05,
            "instrumentalness": 0.25,
            "tempo": 142.0,
        },
        "quote": "Channel that fury into pure sonic power.",
    },
}


def get_all_moods() -> List[str]:
    """Returns a list of all supported mood names."""
    return list(MOOD_PROFILES.keys())


def get_mood_profile(mood: str) -> Dict[str, Any]:
    """
    Returns the configuration dictionary for a given mood.
    Defaults to 'Happy' if mood is unrecognized.
    """
    return MOOD_PROFILES.get(mood, MOOD_PROFILES["Happy"])


def get_mood_vector(mood: str) -> List[float]:
    """
    Returns the target numerical feature vector for the selected mood
    ordered matching FEATURE_COLUMNS.
    """
    profile = get_mood_profile(mood)
    targets = profile["targets"]
    return [targets[col] for col in FEATURE_COLUMNS]
