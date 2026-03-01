#!/usr/bin/env python3
"""
Mixamo Bulk Downloader
Downloads characters with Idle, Walking, Running, and Jumping animations as FBX.

Usage:
  1. Log into mixamo.com in your browser
  2. Open DevTools (F12) > Network tab
  3. Click any character, find a request to mixamo.com/api/
  4. Copy the Authorization header (Bearer ...)
  5. Run with the venv:
     scripts/.venv/bin/python scripts/download_mixamo.py "Bearer eyJhb..."
"""

import os
import sys
import time
import json
import requests

# ── Config ──────────────────────────────────────────────────────
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'models', 'Charecters')
BASE_URL = 'https://www.mixamo.com/api/v1'

# Animations to download for each character
ANIM_QUERIES = {
    'Idle': 'idle',
    'Walking': 'walking',
    'Running': 'running',
    'Jumping': 'jumping',
}

# ── API helpers ─────────────────────────────────────────────────
session = requests.Session()

def set_auth(token):
    session.headers.update({
        'Authorization': token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Api-Key': 'mixamo2',
    })

def get_characters():
    """Fetch all available characters (returns a list directly)."""
    r = session.get(f'{BASE_URL}/characters')
    r.raise_for_status()
    return r.json()  # Returns a list, not {results: [...]}

def search_animations(query, character_id):
    """Search for animations matching a query for a specific character."""
    r = session.get(f'{BASE_URL}/products', params={
        'page': 1,
        'limit': 24,
        'type': 'Motion',
        'query': query,
        'character_id': character_id,
    })
    r.raise_for_status()
    return r.json()  # Returns {results: [...], pagination: {...}}

def get_animation_details(anim_id, character_id):
    """Get animation details including gms_hash with correct model-id."""
    r = session.get(f'{BASE_URL}/products/{anim_id}', params={
        'character_id': character_id,
    })
    r.raise_for_status()
    return r.json()

def request_export(character_id, gms_hash, character_name):
    """Request an FBX export for a character + animation combo."""
    body = {
        'character_id': character_id,
        'gms_hash': [gms_hash],
        'preferences': {
            'format': 'fbx7',
            'skin': 'true',
            'fps': '30',
            'reducekf': '0',
        },
        'type': 'Motion',
        'product_name': character_name,
    }
    r = session.post(f'{BASE_URL}/animations/export', json=body)
    r.raise_for_status()
    return r.json()

def poll_export(character_id, max_wait=120):
    """Poll the character monitor until export is ready, return download URL."""
    for i in range(max_wait // 3):
        r = session.get(f'{BASE_URL}/characters/{character_id}/monitor')
        r.raise_for_status()
        data = r.json()
        status = data.get('status', '')

        if status == 'completed':
            job_result = data.get('job_result', '')
            if isinstance(job_result, str) and job_result.startswith('http'):
                return job_result
            elif isinstance(job_result, dict):
                return job_result.get('url', '')
            return ''
        elif status == 'failed':
            job_result = data.get('job_result', '')
            msg = json.dumps(job_result) if isinstance(job_result, dict) else str(job_result)
            raise Exception(f'Export failed: {msg}')

        time.sleep(3)

    raise Exception('Export timed out')

def build_gms_hash(detail):
    """Build a gms_hash object from animation detail response."""
    gms_raw = detail.get('details', {}).get('gms_hash', {})
    if not gms_raw:
        return None

    # Convert params from [[name, value], ...] to comma-separated values string
    raw_params = gms_raw.get('params', [])
    if isinstance(raw_params, list):
        param_values = ','.join(str(p[1]) for p in raw_params if isinstance(p, list))
    else:
        param_values = str(raw_params)

    return {
        'model-id': gms_raw['model-id'],
        'mirror': gms_raw.get('mirror', False),
        'trim': [0, 100],
        'overdrive': 0,
        'params': param_values,
        'arm-space': gms_raw.get('arm-space', 0),
        'inplace': gms_raw.get('inplace', False),
    }

def download_file(url, filepath):
    """Download a file from URL to filepath."""
    r = requests.get(url, stream=True)
    r.raise_for_status()
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'wb') as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)

def find_best_animation(results, query):
    """Pick the best animation match from search results."""
    # Prefer exact match first
    for a in results:
        if a['name'].lower() == query.lower():
            return a
    # Then prefer simple name without "to" (avoid transitions)
    for a in results:
        name = a['name'].lower()
        if query.lower() in name and ' to ' not in name:
            return a
    # Fallback to first result
    return results[0] if results else None

# ── Main ────────────────────────────────────────────────────────
def main():
    if len(sys.argv) < 2:
        print('Usage: scripts/.venv/bin/python scripts/download_mixamo.py "Bearer eyJhb..."')
        print('\nGet the token from browser DevTools > Network tab on mixamo.com')
        sys.exit(1)

    token = sys.argv[1]
    set_auth(token)

    # Get existing character folders to skip
    existing = set()
    if os.path.exists(OUTPUT_DIR):
        existing = set(os.listdir(OUTPUT_DIR))

    print(f'Output directory: {os.path.abspath(OUTPUT_DIR)}')
    print(f'Already downloaded: {len(existing)} characters')
    print()

    # Fetch character list (returns a flat list)
    print('Fetching character list...')
    characters = get_characters()
    print(f'Found {len(characters)} characters\n')

    downloaded = 0
    skipped = 0
    errors = 0

    for char in characters:
        char_id = char.get('uuid', '')
        char_name = char.get('name', 'Unknown').strip()

        # Skip if already downloaded
        if char_name in existing:
            print(f'  [SKIP] {char_name} (already exists)')
            skipped += 1
            continue

        # Skip characters that aren't ready
        if char.get('status') != 'ready':
            print(f'  [SKIP] {char_name} (status: {char.get("status")})')
            continue

        print(f'[{downloaded + skipped + 1}] Downloading: {char_name}')
        char_dir = os.path.join(OUTPUT_DIR, char_name)
        os.makedirs(char_dir, exist_ok=True)

        anim_count = 0
        for anim_label, search_query in ANIM_QUERIES.items():
            filepath = os.path.join(char_dir, f'{anim_label}.fbx')
            if os.path.exists(filepath):
                print(f'    {anim_label}.fbx already exists, skipping')
                anim_count += 1
                continue

            try:
                # Search for the animation
                search_data = search_animations(search_query, char_id)
                anims = search_data.get('results', [])

                if not anims:
                    print(f'    [WARN] No "{search_query}" animation found, skipping')
                    continue

                # Pick best match
                anim = find_best_animation(anims, search_query)
                if not anim:
                    print(f'    [WARN] No suitable "{search_query}" animation, skipping')
                    continue

                anim_id = anim.get('id', '')

                # Get animation details for proper gms_hash
                detail = get_animation_details(anim_id, char_id)
                gms_hash = build_gms_hash(detail)
                if not gms_hash:
                    print(f'    [WARN] No gms_hash for {anim_label}, skipping')
                    continue

                # Request export
                print(f'    Exporting {anim_label}...', end='', flush=True)
                request_export(char_id, gms_hash, char_name)

                # Poll for download URL
                url = poll_export(char_id)

                if not url:
                    print(' failed (no download URL)')
                    continue

                # Download
                download_file(url, filepath)
                size_kb = os.path.getsize(filepath) / 1024
                print(f' done ({size_kb:.0f} KB)')
                anim_count += 1

                # Small delay to be nice to the API
                time.sleep(1)

            except Exception as e:
                print(f' error: {e}')
                errors += 1
                time.sleep(2)
                continue

        if anim_count > 0:
            downloaded += 1
            print(f'  -> {char_name}: {anim_count}/4 animations\n')
        else:
            # Remove empty directory
            try:
                os.rmdir(char_dir)
            except:
                pass
            print(f'  -> {char_name}: no animations downloaded\n')

    print(f'\nDone! Downloaded {downloaded} new characters, skipped {skipped} existing, {errors} errors.')
    print(f'Files saved to: {os.path.abspath(OUTPUT_DIR)}')

if __name__ == '__main__':
    main()
