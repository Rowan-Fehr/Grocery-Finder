"""
Makes one picture per recipe step using the Gemini API.

- Reads recipes.json (same folder).
- Saves pictures to images/<recipe-id>/step-<n>.png
- Writes images/manifest.json so the website knows which picture goes with which step.
- Skips any picture that already exists, so each step is only paid for ONCE.
- Your key stays on your PC (config.json or GEMINI_API_KEY). Never put it in the website.

Run:  python generate_step_images.py            (all recipes)
      python generate_step_images.py --limit 3  (test with 3 pictures first)
"""
from step_prompt import build_prompt
import argparse, base64, json, os, sys, time, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = "gemini-2.5-flash-image"
URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent" % MODEL
STYLE = ("Bright, clean overhead photo of a home kitchen, appetizing and realistic, "
         "no text, no watermarks, no people's faces. Show this cooking step: ")

def load_key():
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    cfg = os.path.join(HERE, "config.json")
    if not key and os.path.exists(cfg):
        key = json.load(open(cfg)).get("gemini_api_key", "").strip()
    if not key:
        sys.exit("No key found. Put it in config.json (see config.example.json).")
    return key

def step_text(step):
    return step if isinstance(step, str) else (step.get("text") or step.get("instruction") or "")

def generate(key, recipe_title, step, n=1, total=1):
    prompt = build_prompt(recipe_title, step, n, total)
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }).encode()
    req = urllib.request.Request(URL, body, {"Content-Type": "application/json", "x-goog-api-key": key})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.load(r)
    for cand in data.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline:
                return base64.b64decode(inline["data"])
    raise RuntimeError("Gemini returned no image: " + json.dumps(data)[:300])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="stop after N new pictures (for testing)")
    args = ap.parse_args()
    key = load_key()
    recipes = json.load(open(os.path.join(HERE, "recipes.json"), encoding="utf-8"))
    if isinstance(recipes, dict):
        recipes = recipes.get("recipes", [])
    out_dir = os.path.join(HERE, "images")
    os.makedirs(out_dir, exist_ok=True)
    manifest, made, failed = {}, 0, 0
    for ri, rec in enumerate(recipes):
        rid = str(rec.get("id") or "recipe-%d" % (ri + 1))
        title = rec.get("title") or rec.get("name") or rid
        manifest[rid] = []
        os.makedirs(os.path.join(out_dir, rid), exist_ok=True)
        for si, step in enumerate(rec.get("steps", []), 1):
            rel = "%s/step-%d.png" % (rid, si)
            path = os.path.join(out_dir, rid, "step-%d.png" % si)
            if os.path.exists(path):
                manifest[rid].append(rel); continue
            if args.limit and made >= args.limit:
                continue
            for attempt in range(3):
                try:
                    png = generate(key, title, step_text(step), si, len(rec.get("steps", [])))
                    open(path, "wb").write(png)
                    manifest[rid].append(rel); made += 1
                    print("made", rel); break
                except urllib.error.HTTPError as e:
                    msg = e.read().decode(errors="replace")[:200]
                    print("  error %s on %s: %s" % (e.code, rel, msg))
                    if e.code in (400, 401, 403): sys.exit("Stopping: check your key / billing.")
                    time.sleep(5 * (attempt + 1))
                except Exception as e:
                    print("  error on %s: %s" % (rel, e)); time.sleep(5 * (attempt + 1))
            else:
                failed += 1
            time.sleep(1)
    json.dump(manifest, open(os.path.join(out_dir, "manifest.json"), "w"), indent=2)
    # Data file for viewer.html (works when double-clicked, no server needed)
    open(os.path.join(HERE, "viewer_data.js"), "w", encoding="utf-8").write(
        "var RECIPES = %s;\nvar STEP_IMAGES = %s;\n" % (json.dumps(recipes), json.dumps(manifest)))
    print("Done. New pictures: %d, failed: %d (re-run to retry failed ones)." % (made, failed))

if __name__ == "__main__":
    main()
