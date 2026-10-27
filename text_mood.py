"""
Text-to-Mood Emotion Detection Module for MoodTunes
===================================================
Detects mood from user-provided free-text sentences like:
- "I had an exhausting day, just want to lay down and unwind" -> Relaxed
- "Crushed my morning workout, feeling unstoppable!" -> Energetic
- "Studying for my AI midterms, need to lock in" -> Focus
- "Can't believe my friend canceled on me last minute, so annoyed" -> Angry
- "Got an A+ on my project, feeling over the moon!" -> Happy
- "Missing my home and feeling down today" -> Sad

Architecture:
1. Transformer Pipeline:
   Attempts to use a lightweight Hugging Face emotion classifier
   (e.g., 'bhadresh-psavani/distilbert-base-uncased-emotion').
2. Robust Fallback Engine:
   If HuggingFace transformers or PyTorch are unavailable or offline,
   a rule-based keyword & lexical analyzer activates seamlessly.
   This guarantees 100% uptime during college viva demonstrations!
"""

import re
from typing import Dict, Tuple, Optional, List

# Keyword lexicon with associated weights for the fallback NLP engine
MOOD_LEXICON: Dict[str, Dict[str, List[str]]] = {
    "Happy": {
        "strong": [
            "happy", "joy", "excited", "thrilled", "ecstatic", "delighted", "grateful",
            "blessed", "wonderful", "celebrating", "smile", "smiling", "fun", "cheerful",
            "amazing", "awesome", "fantastic", "elated", "overjoyed", "love this day"
        ],
        "mild": [
            "good", "nice", "content", "glad", "fine", "pleased", "sunny", "laugh", "sweet"
        ],
    },
    "Sad": {
        "strong": [
            "sad", "depressed", "heartbroken", "crying", "tears", "hopeless", "devastated",
            "grief", "miserable", "lonely", "alone", "unhappy", "hurting", "lost", "empty"
        ],
        "mild": [
            "down", "gloomy", "melancholy", "low", "blue", "disappointed", "miss", "sigh"
        ],
    },
    "Relaxed": {
        "strong": [
            "relaxed", "chill", "peaceful", "calm", "serene", "unwind", "meditate", "tranquil",
            "de-stress", "laid-back", "restful", "soothing", "lazy afternoon", "slow down"
        ],
        "mild": [
            "easy", "breathe", "quiet", "cozy", "soft", "sleepy", "comfortable", "gentle", "tea"
        ],
    },
    "Energetic": {
        "strong": [
            "energetic", "hyper", "pumped", "hyped", "workout", "gym", "running", "sprint",
            "adrenaline", "party", "dance", "electrified", "unstoppable", "beast mode", "fire"
        ],
        "mild": [
            "active", "motivated", "fast", "jump", "power", "go", "boost", "vibrant", "drive"
        ],
    },
    "Focus": {
        "strong": [
            "focus", "studying", "study", "coding", "code", "programming", "homework",
            "assignment", "exam", "reading", "concentrate", "concentration", "deep work",
            "flow state", "lock in", "prep"
        ],
        "mild": [
            "work", "project", "task", "reading", "learn", "office", "deadline", "busy", "notes"
        ],
    },
    "Angry": {
        "strong": [
            "angry", "furious", "mad", "rage", "enraged", "pissed", "livid", "hate",
            "screaming", "irritated", "frustrated", "infuriating", "outraged"
        ],
        "mild": [
            "annoyed", "upset", "bothered", "cranky", "grouchy", "bitter", "bad mood"
        ],
    },
}

# Negation words that invert or diminish sentiment
NEGATIONS = {"not", "never", "no", "hardly", "barely", "scarcely", "cannot", "can't", "don't", "won't"}

# Global cache for the HuggingFace pipeline to avoid reloading weights repeatedly
_HF_PIPELINE = None
_HF_TRIED = False


def _get_huggingface_pipeline():
    """Lazily loads Hugging Face emotion classifier pipeline if transformers is installed."""
    global _HF_PIPELINE, _HF_TRIED
    if _HF_TRIED:
        return _HF_PIPELINE

    _HF_TRIED = True
    try:
        from transformers import pipeline
        # Use lightweight DistilBERT emotion model (~250MB)
        _HF_PIPELINE = pipeline(
            "text-classification",
            model="bhadresh-psavani/distilbert-base-uncased-emotion",
            top_k=None,
        )
        print("[MoodTunes] Hugging Face Emotion Transformer pipeline loaded successfully.")
    except Exception as e:
        print(f"[MoodTunes] Hugging Face pipeline unavailable ({e}). Using Rule-Based NLP engine.")
        _HF_PIPELINE = None

    return _HF_PIPELINE


def rule_based_emotion_detector(text: str) -> Tuple[str, float, List[str]]:
    """
    Analyzes text using rule-based sentiment lexicon, handling negations and keyword weights.

    Returns:
    --------
    (predicted_mood, confidence_score, matched_keywords)
    """
    clean_text = text.lower()
    # Tokenize words while preserving apostrophes
    words = re.findall(r"\b[a-z']+\b", clean_text)

    scores: Dict[str, float] = {mood: 0.0 for mood in MOOD_LEXICON.keys()}
    matches: Dict[str, List[str]] = {mood: [] for mood in MOOD_LEXICON.keys()}

    for i, word in enumerate(words):
        # Check if preceded by a negation word within 2 words
        is_negated = any(words[j] in NEGATIONS for j in range(max(0, i - 2), i))

        for mood, categories in MOOD_LEXICON.items():
            if word in categories["strong"]:
                weight = 3.0
                if is_negated:
                    scores[mood] -= 2.0
                else:
                    scores[mood] += weight
                    matches[mood].append(word)

            elif word in categories["mild"]:
                weight = 1.5
                if is_negated:
                    scores[mood] -= 1.0
                else:
                    scores[mood] += weight
                    matches[mood].append(word)

    # Find highest scoring mood
    best_mood = max(scores, key=lambda m: scores[m])
    max_score = scores[best_mood]

    if max_score <= 0.0:
        # Default fallback if no keywords found: 'Relaxed' or 'Happy'
        return "Relaxed", 50.0, ["neutral context"]

    # Calculate pseudo confidence percentage
    total_score = sum(max(0, s) for s in scores.values())
    confidence = min(98.0, round((max_score / total_score) * 100, 1))

    return best_mood, confidence, matches[best_mood]


def detect_mood_from_text(text: str) -> Dict[str, any]:
    """
    Primary API function to classify emotion from free text.

    Returns a dictionary with:
    - mood: Detected mood name
    - confidence: Confidence percentage (0-100%)
    - engine: 'Hugging Face Transformer' or 'Rule-Based NLP Engine'
    - explanation: Explanatory note or matched keywords
    """
    if not text or not text.strip():
        return {
            "mood": "Happy",
            "confidence": 50.0,
            "engine": "Default",
            "explanation": "No text provided, defaulted to Happy.",
        }

    hf_pipe = _get_huggingface_pipeline()

    if hf_pipe is not None:
        try:
            raw_results = hf_pipe(text)
            # Example HuggingFace output: [[{'label': 'joy', 'score': 0.88}, ...]]
            if isinstance(raw_results, list) and len(raw_results) > 0:
                top_preds = raw_results[0]
                best_pred = top_preds[0]
                label = best_pred["label"].lower()
                conf = round(best_pred["score"] * 100, 1)

                # Map HuggingFace emotion labels to MoodTunes moods
                hf_mood_map = {
                    "joy": "Happy",
                    "love": "Happy",
                    "sadness": "Sad",
                    "anger": "Angry",
                    "fear": "Focus",      # Anxious/fearful maps to calming focus
                    "surprise": "Energetic",
                }
                detected = hf_mood_map.get(label, "Relaxed")
                return {
                    "mood": detected,
                    "confidence": conf,
                    "engine": "Hugging Face DistilBERT Emotion Model",
                    "explanation": f"Classified primary emotion as '{label}' with {conf}% confidence.",
                }
        except Exception as err:
            print(f"[MoodTunes] Transformer inference error: {err}. Falling back to Rule-Based.")

    # Rule-based fallback
    mood, confidence, matched_words = rule_based_emotion_detector(text)
    matched_str = ", ".join(matched_words) if matched_words else "contextual tone"
    return {
        "mood": mood,
        "confidence": confidence,
        "engine": "Rule-Based NLP Keyword Engine (High Reliability Fallback)",
        "explanation": f"Matched keywords: [{matched_str}]",
    }
