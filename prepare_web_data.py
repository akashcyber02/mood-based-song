"""
prepare_web_data.py
===================
Converts data/songs.csv into public/songs.json for the React + Vite web app.

Features:
- Balanced sampling across Hindi, Punjabi, and English.
- Balanced across all 6 moods (Happy, Sad, Relaxed, Energetic, Focus, Angry).
- Multi-threaded lookup for YouTube IDs (ytmusicapi) and iTunes previews (iTunes Search API).
- Caches all results in data/yt_cache.json and data/itunes_cache.json.
- Never invents IDs; sets null on failure.
"""

import os
import sys
import json
import time
import argparse
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
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

# Mood targets for classification
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
    
    best_mood = "Happy"
    min_dist = float("inf")
    for m, targets in MOOD_TARGETS.items():
        dist = (valence - targets["valence"]) ** 2 + (energy - targets["energy"]) ** 2
        if dist < min_dist:
            min_dist = dist
            best_mood = m
    return best_mood


def lookup_single_song(t_name: str, artists: str, yt_client):
    cache_key = f"{t_name.strip().lower()} - {artists.strip().lower()}"
    query = f"{t_name} {artists}"

    # 1. YouTube lookup
    yt_id = None
    if yt_client:
        try:
            results = yt_client.search(query, filter="songs")
            if results and len(results) > 0 and "videoId" in results[0]:
                yt_id = results[0]["videoId"]
            else:
                gen = yt_client.search(query)
                if gen and len(gen) > 0 and "videoId" in gen[0]:
                    yt_id = gen[0]["videoId"]
        except Exception:
            yt_id = None

    # 2. iTunes lookup
    prev_url = None
    art_url = None
    try:
        url = f"https://itunes.apple.com/search?term={urllib.parse.quote(query)}&entity=song&limit=1"
        res = requests.get(url, verify=certifi.where(), timeout=4)
        if res.status_code == 200:
            data = res.json()
            if data.get("resultCount", 0) > 0:
                item = data["results"][0]
                prev_url = item.get("previewUrl")
                art = item.get("artworkUrl100")
                if art:
                    art_url = art.replace("100x100bb.jpg", "600x600bb.jpg")
    except Exception:
        prev_url, art_url = None, None

    return cache_key, yt_id, prev_url, art_url


def main():
    parser = argparse.ArgumentParser(description="Prepare songs.json for web app")
    parser.add_argument("--per-lang", type=int, default=160, help="Number of songs per language to resolve")
    parser.add_argument("--workers", type=int, default=5, help="Number of worker threads")
    args = parser.parse_args()

    if not os.path.exists(CSV_PATH):
        print(f"[Error] {CSV_PATH} not found.")
        sys.exit(1)

    print(f"Loading {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    print(f"Total songs in CSV: {len(df):,}")

    curated_map = {}
    if os.path.exists(CURATED_CSV_PATH):
        try:
            cdf = pd.read_csv(CURATED_CSV_PATH)
            for _, r in cdf.iterrows():
                k = f"{str(r['track_name']).strip().lower()} - {str(r['artists']).strip().lower()}"
                curated_map[k] = r.get("mood")
        except Exception as e:
            print(f"[Note] Curated songs mapping note: {e}")

    yt_cache = load_json_cache(YT_CACHE_PATH)
    itunes_cache = load_json_cache(ITUNES_CACHE_PATH)
    print(f"Loaded {len(yt_cache):,} cached YouTube lookups and {len(itunes_cache):,} iTunes lookups.")

    # Select prioritized songs per language
    # Spread across moods and prioritize popularity + recent
    df["_mood_tag"] = df.apply(
        lambda r: assign_mood_tag(
            float(r.get("valence", 0.5)),
            float(r.get("energy", 0.5)),
            curated_map.get(f"{str(r['track_name']).strip().lower()} - {str(r['artists']).strip().lower()}")
        ),
        axis=1
    )

    selected_indices = set()
    for lang in ["Hindi", "Punjabi", "English"]:
        lang_df = df[df["language"] == lang]
        # For each mood in this language, select top popular tracks
        for mood in MOOD_TARGETS.keys():
            mood_sub = lang_df[lang_df["_mood_tag"] == mood].sort_values(by=["popularity", "year"], ascending=[False, False])
            # pick top 25 per mood per language = ~150 songs per language
            picks = mood_sub.head(28).index.tolist()
            selected_indices.update(picks)

    print(f"Selected {len(selected_indices)} high-priority tracks across Hindi, Punjabi, and English for lookup.")

    # Filter which ones need lookups
    needs_lookup = []
    for idx in selected_indices:
        row = df.loc[idx]
        t_name = str(row["track_name"])
        artists = str(row["artists"])
        cache_key = f"{t_name.strip().lower()} - {artists.strip().lower()}"
        yt_cached = yt_cache.get(cache_key)
        it_cached = itunes_cache.get(cache_key)

        if not yt_cached or not it_cached:
            needs_lookup.append((t_name, artists, cache_key))

    print(f"Tracks needing lookup: {len(needs_lookup)} (already cached: {len(selected_indices) - len(needs_lookup)})")

    # Run threaded lookup
    if needs_lookup:
        print(f"Starting parallel lookup with {args.workers} workers...")
        start_time = time.time()
        completed = 0

        # Create one YTMusic client per worker to avoid thread contention
        def worker_task(item):
            t_name, artists, _ = item
            local_yt = None
            try:
                local_yt = YTMusic()
            except Exception:
                pass
            return lookup_single_song(t_name, artists, local_yt)

        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            future_to_item = {executor.submit(worker_task, item): item for item in needs_lookup}
            for future in as_completed(future_to_item):
                completed += 1
                try:
                    cache_key, yt_id, prev_url, art_url = future.result()
                    if yt_id:
                        yt_cache[cache_key] = yt_id
                    if prev_url or art_url:
                        itunes_cache[cache_key] = {"preview_url": prev_url, "artwork_url": art_url}
                except Exception as e:
                    pass

                if completed % 25 == 0 or completed == len(needs_lookup):
                    elapsed = time.time() - start_time
                    print(f"  [{completed}/{len(needs_lookup)}] lookups completed ({elapsed:.1f}s)...")

        save_json_cache(yt_cache, YT_CACHE_PATH)
        save_json_cache(itunes_cache, ITUNES_CACHE_PATH)
        print("Updated cache files saved.")

    # Now assemble songs_data for public/songs.json
    songs_data = []
    for idx, row in df.iterrows():
        t_name = str(row["track_name"])
        artists = str(row["artists"])
        cache_key = f"{t_name.strip().lower()} - {artists.strip().lower()}"

        yt_id = yt_cache.get(cache_key)
        itunes_info = itunes_cache.get(cache_key)

        prev_url = None
        art_url = None
        if isinstance(itunes_info, dict):
            prev_url = itunes_info.get("preview_url")
            art_url = itunes_info.get("artwork_url")
        elif isinstance(itunes_info, str):
            prev_url = itunes_info

        curated_m = curated_map.get(cache_key)
        v = float(row.get("valence", 0.5))
        e = float(row.get("energy", 0.5))
        mood_tag = assign_mood_tag(v, e, curated_m)

        song_entry = {
            "id": f"s_{idx+1}",
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

    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(songs_data, f, ensure_ascii=False)

    size_mb = os.path.getsize(OUTPUT_JSON_PATH) / (1024 * 1024)
    print(f"\n[Done] Wrote {len(songs_data)} songs to {OUTPUT_JSON_PATH} ({size_mb:.2f} MB)")

    # Print final audit counts
    total = len(songs_data)
    with_yt = sum(1 for s in songs_data if s["youtube_id"])
    with_it = sum(1 for s in songs_data if s["itunes_preview_url"])
    with_either = sum(1 for s in songs_data if s["youtube_id"] or s["itunes_preview_url"])
    print(f"Total songs: {total}")
    print(f"Songs with YouTube ID: {with_yt} ({with_yt/total*100:.1f}%)")
    print(f"Songs with iTunes Preview: {with_it} ({with_it/total*100:.1f}%)")
    print(f"Songs with Playable Audio (either): {with_either} ({with_either/total*100:.1f}%)")

    by_lang = {}
    for s in songs_data:
        lang = s["language"]
        if lang not in by_lang:
            by_lang[lang] = {"total": 0, "yt": 0, "itunes": 0, "either": 0}
        by_lang[lang]["total"] += 1
        if s["youtube_id"]: by_lang[lang]["yt"] += 1
        if s["itunes_preview_url"]: by_lang[lang]["itunes"] += 1
        if s["youtube_id"] or s["itunes_preview_url"]: by_lang[lang]["either"] += 1

    print("\nCounts by Language:")
    for lang, st in by_lang.items():
        print(f"  {lang}: Total={st['total']}, Playable={st['either']} (YT={st['yt']}, iTunes={st['itunes']})")


if __name__ == "__main__":
    main()
