"""
Song Recommender Engine for MoodTunes
====================================
Uses scikit-learn to recommend songs matching selected moods or seed tracks.

Algorithms:
1. Feature Normalization (MinMaxScaler):
   Audio features like 'tempo' range from ~60 to 220 BPM, while 'valence' and 'energy'
   range from 0.0 to 1.0. MinMaxScaler brings all features into [0, 1] so no single
   feature disproportionately biases the distance calculations.

2. Cosine Similarity & Nearest Neighbors (KNN):
   - Computes Cosine Similarity between the normalized mood profile vector and tracks.
   - For "More like this", uses k-Nearest Neighbors with cosine metric to find audio twins.

3. Variety & Randomization:
   Retrieves an expanded candidate pool of top similarity matches and samples from them
   proportionally to similarity scores, ensuring fresh results without losing relevance.
"""

import os
import urllib.parse
from typing import List, Dict, Optional, Tuple, Any
import numpy as np
import pandas as pd
import streamlit as st
from sklearn.preprocessing import MinMaxScaler
from sklearn.neighbors import NearestNeighbors
from sklearn.metrics.pairwise import cosine_similarity

from mood_map import FEATURE_COLUMNS, get_mood_vector, get_mood_profile

EXPECTED_COLUMNS = [
    "track_name",
    "artists",
    "language",
    "year",
    "popularity",
    "valence",
    "energy",
    "danceability",
    "acousticness",
    "instrumentalness",
    "tempo",
]


@st.cache_data
def load_songs_dataset(csv_path: str = "data/songs.csv") -> pd.DataFrame:
    """
    Loads song dataset strictly from CSV, cached via Streamlit @st.cache_data.
    Adds a unique track_id if not present for deterministic referencing.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Song dataset not found at '{csv_path}'. Please ensure 'data/songs.csv' exists.")

    df = pd.read_csv(csv_path)

    # Ensure required columns exist
    missing = [c for c in EXPECTED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing required columns: {missing}")

    # Ensure no NaN in audio features
    df[FEATURE_COLUMNS] = df[FEATURE_COLUMNS].fillna(df[FEATURE_COLUMNS].median())

    # Add stable track_id if missing
    if "track_id" not in df.columns:
        df["track_id"] = [f"track_{i}" for i in range(len(df))]

    # Ensure youtube_url exists
    if "youtube_url" not in df.columns:
        df["youtube_url"] = [
            get_youtube_url(row["track_name"], row["artists"])
            for _, row in df.iterrows()
        ]

    return df


def get_youtube_url(track_name: str, artists: str) -> str:
    """Generates a direct YouTube search URL for the song and artist."""
    query = f"{track_name} {artists}"
    return f"https://www.youtube.com/results?search_query={urllib.parse.quote_plus(query)}"


class MoodRecommender:
    """
    Core Machine Learning Recommender.
    Indexes audio features, computes cosine similarity, and builds KNN models.
    """

    def __init__(self, data_path: str = "data/songs.csv"):
        self.data_path = data_path
        self.df: pd.DataFrame = load_songs_dataset(data_path)
        self.scaler = MinMaxScaler()
        self.feature_matrix: np.ndarray = self.scaler.fit_transform(self.df[FEATURE_COLUMNS])

        # Build KNN model using cosine distance metric
        self.knn_model = NearestNeighbors(n_neighbors=min(50, len(self.df)), metric="cosine")
        self.knn_model.fit(self.feature_matrix)

    def recommend_by_mood(
        self,
        mood: str,
        n_recommendations: int = 10,
        min_popularity: int = 0,
        languages: Optional[List[str]] = None,
        recent_only: bool = False,
        randomize: bool = True,
    ) -> pd.DataFrame:
        """
        Recommends songs matching the target audio profile of the given mood,
        filtered by selected languages, recent year, and minimum popularity.

        Parameters:
        -----------
        mood : str
            Mood name ('Happy', 'Sad', 'Relaxed', 'Energetic', 'Focus', 'Angry')
        n_recommendations : int
            Number of songs to return (default: 10)
        min_popularity : int
            Minimum popularity score (0-100)
        languages : Optional[List[str]]
            List of languages to include (e.g. ['English', 'Hindi', 'Punjabi'])
        recent_only : bool
            If True, only recommends songs released in 2022 or later.
        randomize : bool
            Whether to add candidate pool randomization for freshness.

        Returns:
        --------
        pd.DataFrame of recommended songs with match_score and youtube_url.
        """
        # 1. Target mood feature vector formatted as DataFrame to preserve column names
        raw_target = pd.DataFrame([get_mood_vector(mood)], columns=FEATURE_COLUMNS)
        scaled_target = self.scaler.transform(raw_target)

        # 2. Build boolean filter mask
        mask = np.ones(len(self.df), dtype=bool)

        if languages:
            mask = mask & self.df["language"].isin(languages).values

        if recent_only and "year" in self.df.columns:
            mask = mask & (self.df["year"] >= 2022).values

        if min_popularity > 0 and "popularity" in self.df.columns:
            mask = mask & (self.df["popularity"] >= min_popularity).values

        candidate_indices = np.where(mask)[0]

        # Fallback if filters are overly restrictive: relax popularity filter first
        if len(candidate_indices) == 0 and min_popularity > 0:
            mask_relaxed = np.ones(len(self.df), dtype=bool)
            if languages:
                mask_relaxed = mask_relaxed & self.df["language"].isin(languages).values
            if recent_only and "year" in self.df.columns:
                mask_relaxed = mask_relaxed & (self.df["year"] >= 2022).values
            candidate_indices = np.where(mask_relaxed)[0]

        if len(candidate_indices) == 0:
            return pd.DataFrame()

        # 3. Compute Cosine Similarity against filtered candidates
        candidate_features = self.feature_matrix[candidate_indices]
        sim_scores = cosine_similarity(scaled_target, candidate_features)[0]

        # 4. Attach similarity score
        results_df = self.df.iloc[candidate_indices].copy()
        results_df["match_score"] = np.round(sim_scores * 100, 1)

        # 5. Sort by similarity
        results_df = results_df.sort_values(by="match_score", ascending=False)

        # 6. Candidate pool sampling for freshness
        if randomize and len(results_df) > n_recommendations:
            pool_size = min(len(results_df), max(n_recommendations * 2, 20))
            candidate_pool = results_df.head(pool_size).copy()

            # Weight by similarity score
            weights = candidate_pool["match_score"].values
            weights = (weights - weights.min() + 1.0) ** 2
            prob = weights / weights.sum()

            sampled_indices = np.random.choice(
                candidate_pool.index,
                size=min(n_recommendations, len(candidate_pool)),
                replace=False,
                p=prob
            )
            final_recs = candidate_pool.loc[sampled_indices].sort_values(by="match_score", ascending=False)
            results_df = final_recs.reset_index(drop=True)
        else:
            results_df = results_df.head(n_recommendations).reset_index(drop=True)

        return results_df

    def recommend_more_like_this(
        self,
        track_id: str,
        n_recommendations: int = 10,
    ) -> Tuple[Optional[pd.Series], pd.DataFrame]:
        """
        Recommends songs similar to a given track using KNN.

        Parameters:
        -----------
        track_id : str
            Unique ID of the seed song.
        n_recommendations : int
            Number of similar songs to return.

        Returns:
        --------
        (seed_song_row, similar_songs_df)
        """
        seed_matches = self.df[self.df["track_id"] == track_id]
        if seed_matches.empty:
            return None, pd.DataFrame()

        seed_idx = seed_matches.index[0]
        seed_song = self.df.iloc[seed_idx]
        seed_vector = self.feature_matrix[seed_idx].reshape(1, -1)

        k = min(len(self.df), n_recommendations + 1)
        distances, indices = self.knn_model.kneighbors(seed_vector, n_neighbors=k)

        neighbor_indices = indices[0]
        neighbor_distances = distances[0]

        # Exclude seed song itself
        filtered_pairs = [
            (idx, dist) for idx, dist in zip(neighbor_indices, neighbor_distances)
            if idx != seed_idx
        ][:n_recommendations]

        if not filtered_pairs:
            return seed_song, pd.DataFrame()

        rec_indices = [p[0] for p in filtered_pairs]
        rec_distances = [p[1] for p in filtered_pairs]

        rec_df = self.df.iloc[rec_indices].copy()
        rec_df["match_score"] = np.round((1.0 - np.array(rec_distances)) * 100, 1)

        return seed_song, rec_df.reset_index(drop=True)

    def get_available_languages(self) -> List[str]:
        """Returns sorted list of unique languages present in dataset."""
        if "language" not in self.df.columns:
            return ["English", "Hindi", "Punjabi"]
        langs = self.df["language"].dropna().unique().tolist()
        preferred_order = ["English", "Hindi", "Punjabi"]
        ordered = [l for l in preferred_order if l in langs] + [l for l in sorted(langs) if l not in preferred_order]
        return ordered
