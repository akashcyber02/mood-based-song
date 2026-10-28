"""
prepare_web_data.py
===================
Converts data/songs.csv into public/songs.json for the React + Vite static web app.

Features:
- Prioritizes Hindi, Punjabi, recent (2022+), and high-popularity songs.
- Resolves youtube_id using free ytmusicapi in batches with rate-limiting and resume support.
- Resolves itunes_preview_url & album artwork via the free iTunes Search API.
- Caches all lookups in data/yt_cache.json and data/itunes_cache.json.
- Never invents IDs; sets null on failure.
- Computes mood tags based on curated tags or closest mood vector.
"""

import os
import sys
import json
import time
import argparse
import urllib.parse
import pandas as pd
import numpy as np
import requests
import certifi

try:
    from ytmusicapi import YTMusic
    ytmusic = YTMusic()
except Exception as e:
    print(f"[Warning] ytmusicapi initialization note: {e}")
    ytmusic = None

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(PROJECT_DIR, "data")
PUBLIC_DIR = os.path.join(PROJECT_DIR, "public")
os.makedirs(PUBLIC_DIR, exist_ok=True)

CSV_PATH = os.path.join(DATA_DIR, "songs.csv")
CURATED_CSV_PATH = os.path.join(DATA_DIR, "curated_songs.csv")
YT_CACHE_PATH = os.path.join(DATA_DIR, "yt_cache.json")
ITUNES_CACHE_PATH = os.path.join(DATA_DIR, "itunes_cache.json")
OUTPUT_JSON_PATH = os.path.join(PUBLIC_DIR, "songs.json")

# Mood targets for audio feature classification fallback
MOOD_TARGETS = {
    "Happy": {"valence": 0.88, "energy": 0.82},
    "Sad": {"valence": 0.18, "energy": 0.25},
    "Relaxed": {"valence": 0.58, "energy": 0.28},
    "Energetic": {"valence": 0.72, "energy": 0.94},
    "Focus": {"valence": 0.45, "energy": 0.40},
    "Angry": {"valence": 0.20, "energy": 0.95},
}


def load_json_cache(filepath: str) -> dict:
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_json_cache(data: dict, filepath: str):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def assign_mood_tag(valence: float, energy: float, curated_mood: str = None) -> str:
    if curated_mood and str(curated_mood).strip() in MOOD_TARGETS:
        return str(curated_mood).strip()
    
    # Distance to target in 2D Valence-Energy space
    best_mood = "Happy"
    min_dist = float("inf")
    for m, targets in MOOD_TARGETS.items():
        dist = (valence - targets["valence"]) ** 2 + (energy - targets["energy"]) ** 2
        if dist < min_dist:
            min_dist = dist
            best_mood = m
    return best_mood


def resolve_youtube_id(track_name: str, artists: str, yt_cache: dict) -> str:
    key = f"{track_name.strip().lower()} - {artists.strip().lower()}"
    if key in yt_cache:
        return yt_cache[key]
    
    if ytmusic is None:
        return None

    query = f"{track_name} {artists}"
    try:
        results = ytmusic.search(query, filter="songs")
        if results and len(results) > 0 and "videoId" in results[0]:
            vid = results[0]["videoId"]
            yt_cache[key] = vid
            return vid
        
        # Fallback to general search if songs filter yielded nothing
        gen_results = ytmusic.search(query)
        if gen_results and len(gen_results) > 0 and "videoId" in gen_results[0]:
            vid = gen_results[0]["videoId"]
            yt_cache[key] = vid
            return vid
    except Exception as e:
        # Avoid crashing on network error or temporary block
        pass
    
    yt_cache[key] = None
    return None


def resolve_itunes_preview(track_name: str, artists: str, itunes_cache: dict) -> tuple:
    """Returns (preview_url, artwork_url)"""
    key = f"{track_name.strip().lower()} - {artists.strip().lower()}"
    if key in itunes_cache:
        cached = itunes_cache[key]
        if isinstance(cached, dict):
            return cached.get("preview_url"), cached.get("artwork_url")
        return cached, None

    query = f"{track_name} {artists}"
    url = f"https://itunes.apple.com/search?term={urllib.parse.quote(query)}&entity=song&limit=1"
    try:
        res = requests.get(url, verify=certifi.where(), timeout=4)
        if res.status_code == 200:
            data = res.json()
            if data.get("resultCount", 0) > 0:
                item = data["results"][0]
                prev = item.get("previewUrl")
                art = item.get("artworkUrl100")
                if art:
                    art = art.replace("100x100bb.jpg", "600x600bb.jpg")  # High-res album art
                itunes_cache[key] = {"preview_url": prev, "artwork_url": art}
                return prev, art
    except Exception:
        pass

    itunes_cache[key] = {"preview_url": None, "artwork_url": None}
    return None, None


def main():
    parser = argparse.ArgumentParser(description="Prepare songs.json for web app")
    parser.add_argument("--batch-limit", type=int, default=300, help="Maximum new lookups to perform per run")
    parser.add_argument("--delay", type=float, default=0.25, help="Delay between API requests in seconds")
    args = parser.parse_args()

    if not os.path.exists(CSV_PATH):
        print(f"[Error] {CSV_PATH} not found.")
        sys.exit(1)

    print(f"Loading {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    print(f"Total songs in CSV: {len(df):,}")

    # Load curated moods if present
    curated_map = {}
    if os.path.exists(CURATED_CSV_PATH):
        try:
            cdf = pd.read_csv(CURATED_CSV_PATH)
            for _, r in cdf.iterrows():
                k = f"{str(r['track_name']).strip().lower()} - {str(r['artists']).strip().lower()}"
                curated_map[k] = r.get("mood")
        except Exception as e:
            print(f"[Note] Curated songs mapping note: {e}")

    # Load caches
    yt_cache = load_json_cache(YT_CACHE_PATH)
    itunes_cache = load_json_cache(ITUNES_CACHE_PATH)
    print(f"Loaded {len(yt_cache):,} cached YouTube lookups and {len(itunes_cache):,} iTunes lookups.")

    # Prioritize:
    # 1. Hindi and Punjabi songs first
    # 2. Recent songs (year >= 2022)
    # 3. High popularity
    def priority_score(row):
        score = 0
        lang = str(row.get("language", "")).lower()
        if "hindi" in lang:
            score += 1000
        elif "punjabi" in lang:
            score += 900
        else:
            score += 100
        
        yr = row.get("year", 2020)
        if yr >= 2023:
            score += 300
        elif yr >= 2022:
            score += 200

        score += int(row.get("popularity", 50))
        return score

    df["_priority"] = df.apply(priority_score, axis=1)
    df_sorted = df.sort_values(by="_priority", ascending=False).reset_index(drop=True)

    lookup_count = 0
    songs_data = []

    print(f"\nResolving YouTube IDs & iTunes previews (batch limit: {args.batch_limit})...")
    for idx, row in df_sorted.iterrows():
        t_name = str(row["track_name"])
        artists = str(row["artists"])
        cache_key = f"{t_name.strip().lower()} - {artists.strip().lower()}"

        # YouTube lookup
        yt_id = yt_cache.get(cache_key)
        if yt_id is None and cache_key not in yt_cache and lookup_count < args.batch_limit:
            yt_id = resolve_youtube_id(t_name, artists, yt_cache)
            lookup_count += 1
            if args.delay > 0:
                time.sleep(args.delay)

        # iTunes lookup
        itunes_info = itunes_cache.get(cache_key)
        if itunes_info is None and cache_key not in itunes_cache and lookup_count < args.batch_limit:
            prev_url, art_url = resolve_itunes_preview(t_name, artists, itunes_cache)
            lookup_count += 1
            if args.delay > 0:
                time.sleep(args.delay)
        else:
            if isinstance(itunes_info, dict):
                prev_url = itunes_info.get("preview_url")
                art_url = itunes_info.get("artwork_url")
            else:
                prev_url, art_url = itunes_info, None

        # Mood tag
        curated_m = curated_map.get(cache_key)
        v = float(row.get("valence", 0.5))
        e = float(row.get("energy", 0.5))
        mood_tag = assign_mood_tag(v, e, curated_m)

        # Stable ID
        song_id = f"s_{idx+1}"

        song_entry = {
            "id": song_id,
            "track_name": t_name,
            "artists": artists,
            "language": str(row.get("language", "English")),
            "year": int(row.get("year", 2020)),
            "popularity": int(row.get("popularity", 50)),
            "mood": mood_tag,
            "valence": round(v, 4),
            "energy": round(e, 4),
            "danceability": round(float(row.get("danceability", 0.5)), 4),
            "acousticness": round(float(row.get("acousticness", 0.5)), 4),
            "instrumentalness": round(float(row.get("instrumentalness", 0.0)), 4),
            "tempo": round(float(row.get("tempo", 120.0)), 2),
            "youtube_id": yt_id if yt_id else None,
            "itunes_preview_url": prev_url if prev_url else None,
            "artwork_url": art_url if art_url else None,
        }
        songs_data.append(song_entry)

        if (idx + 1) % 500 == 0 or idx == len(df_sorted) - 1:
            print(f"Processed {idx + 1}/{len(df_sorted)} songs (new lookups: {lookup_count})...")

    # Save caches
    save_json_cache(yt_cache, YT_CACHE_PATH)
    save_json_cache(itunes_cache, ITUNES_CACHE_PATH)
    print("Saved caches to data/yt_cache.json and data/itunes_cache.json.")

    # Save to public/songs.json
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(songs_data, f, ensure_ascii=False, indent=None)

    file_size_mb = os.path.getsize(OUTPUT_JSON_PATH) / (1024 * 1024)
    print(f"\n[Success] Generated {OUTPUT_JSON_PATH} ({len(songs_data):,} songs, {file_size_mb:.2f} MB)")

    # Print preview stats
    with_yt = sum(1 for s in songs_data if s["youtube_id"])
    with_itunes = sum(1 for s in songs_data if s["itunes_preview_url"])
    print(f"Songs with YouTube ID: {with_yt:,}")
    print(f"Songs with iTunes 30s Preview: {with_itunes:,}")


if __name__ == "__main__":
    main()
