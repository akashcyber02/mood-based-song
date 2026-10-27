"""
Unit Tests for MoodTunes Recommender Engine & NLP Module
========================================================
Run with:
    python3 -m unittest test_recommender.py
"""

import unittest
import pandas as pd
from recommender import MoodRecommender
from mood_map import MOOD_PROFILES, FEATURE_COLUMNS, get_all_moods
from text_mood import detect_mood_from_text, rule_based_emotion_detector


class TestMoodTunesRecommender(unittest.TestCase):
    """Test suite verifying recommendation algorithms, data loading, and filters."""

    @classmethod
    def setUpClass(cls):
        """Initializes the recommender once for all tests."""
        cls.recommender = MoodRecommender("data/songs.csv")

    def test_dataset_loaded(self):
        """Verify the dataset is loaded with valid dimensions and columns."""
        self.assertFalse(self.recommender.df.empty, "Dataset should not be empty")
        self.assertGreaterEqual(len(self.recommender.df), 5000, "Should have at least 5000 songs")

        for col in ["track_name", "artists", "language", "year", "youtube_url"] + FEATURE_COLUMNS:
            self.assertIn(col, self.recommender.df.columns, f"Column '{col}' must exist")

    def test_language_representation(self):
        """Verify Hindi and Punjabi both have at least 800 tracks."""
        hindi_count = len(self.recommender.df[self.recommender.df["language"] == "Hindi"])
        punjabi_count = len(self.recommender.df[self.recommender.df["language"] == "Punjabi"])
        self.assertGreaterEqual(hindi_count, 800, f"Expected >= 800 Hindi songs, got {hindi_count}")
        self.assertGreaterEqual(punjabi_count, 800, f"Expected >= 800 Punjabi songs, got {punjabi_count}")

    def test_all_moods_recommendation(self):
        """Verify every defined mood returns valid recommendations."""
        for mood in get_all_moods():
            recs = self.recommender.recommend_by_mood(mood, n_recommendations=10, randomize=False)
            self.assertIsInstance(recs, pd.DataFrame)
            self.assertEqual(len(recs), 10, f"Mood {mood} should return exactly 10 songs")
            self.assertIn("match_score", recs.columns)
            self.assertIn("youtube_url", recs.columns)
            self.assertTrue(all(recs["match_score"] >= 0.0))
            self.assertTrue(all(recs["match_score"] <= 100.0))

    def test_language_filter(self):
        """Verify language filter strictly returns chosen languages."""
        recs_hindi = self.recommender.recommend_by_mood("Happy", n_recommendations=5, languages=["Hindi"])
        self.assertTrue(all(recs_hindi["language"] == "Hindi"))

        recs_punjabi = self.recommender.recommend_by_mood("Energetic", n_recommendations=5, languages=["Punjabi"])
        self.assertTrue(all(recs_punjabi["language"] == "Punjabi"))

    def test_recent_songs_filter(self):
        """Verify recent songs toggle filters songs from 2022 onwards."""
        recs_recent = self.recommender.recommend_by_mood("Happy", n_recommendations=10, recent_only=True)
        if not recs_recent.empty:
            self.assertTrue(all(recs_recent["year"] >= 2022))

    def test_recommend_more_like_this(self):
        """Verify 'more like this' returns songs similar to seed track excluding the seed."""
        seed_track_id = self.recommender.df.iloc[0]["track_id"]
        seed_song, similar_df = self.recommender.recommend_more_like_this(seed_track_id, n_recommendations=5)

        self.assertIsNotNone(seed_song)
        self.assertEqual(seed_song["track_id"], seed_track_id)
        self.assertEqual(len(similar_df), 5)
        self.assertNotIn(seed_track_id, similar_df["track_id"].values, "Seed song must not appear in recommendations")
        self.assertIn("match_score", similar_df.columns)
        self.assertIn("youtube_url", similar_df.columns)

    def test_text_mood_detection(self):
        """Verify text-to-mood classification on sample test sentences."""
        test_cases = [
            ("I am feeling so joyful and happy today, celebrating with friends!", "Happy"),
            ("Everything feels hopeless and I have been crying all evening", "Sad"),
            ("Time to lock in and code my AI project assignment", "Focus"),
            ("Going for a heavy gym workout session, feeling unstoppable and hyped!", "Energetic"),
            ("Need to unwind, breathe deeply, and have some peaceful chamomile tea", "Relaxed"),
            ("I am so furious and angry at this unfair treatment, absolute rage", "Angry"),
        ]

        for sentence, expected_mood in test_cases:
            result = detect_mood_from_text(sentence)
            self.assertEqual(
                result["mood"],
                expected_mood,
                f"Sentence '{sentence}' expected '{expected_mood}', got '{result['mood']}'"
            )


if __name__ == "__main__":
    unittest.main()
