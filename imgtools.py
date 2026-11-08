"""Makes small fast-loading copies of the big Gemini pictures (needs Pillow)."""
import io, os
try:
    from PIL import Image
except Exception:
    Image = None

def shrink_bytes(png_bytes, width=720, quality=80):
    if Image is None: return None
    im = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    out = io.BytesIO(); im.save(out, "JPEG", quality=quality, optimize=True, progressive=True)
    return out.getvalue()

def small_path(here, rid, n):
    return os.path.join(here, "images_small", str(rid), "step-%d.jpg" % n)

def big_path(here, rid, n):
    return os.path.join(here, "images", str(rid), "step-%d.png" % n)

def save_small(here, rid, n, png_bytes):
    b = shrink_bytes(png_bytes)
    if b is None: return False
    p = small_path(here, rid, n); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "wb").write(b); return True
