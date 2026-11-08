"""Builds the instruction we send to Gemini for each recipe step.
Written to avoid the usual AI-image giveaways: no hands/faces/people (the
things AI draws worst), no text, no blurry fake backgrounds, real food texture."""

def build_prompt(title, step, n=1, total=1):
    return (
        "Instructional cooking photo for step %d of %d of the recipe '%s'. "
        "Show exactly this moment: %s. "
        "Camera: straight-down overhead or slight 45-degree angle, close-up, one clear subject, "
        "everything in sharp focus from front to back. "
        "Setting: plain wooden counter or white marble, natural kitchen light with soft real shadows. "
        "Food must look real: uneven edges, crumbs, grains, small imperfections, natural texture, not glossy or plastic. "
        "Show only the ingredients and tools needed for this step, laid out clearly and physically plausible, "
        "nothing floating, merged together or duplicated. "
        "Strictly NO people, NO hands, NO fingers, NO faces, NO text, NO letters, NO numbers, NO labels, "
        "NO logos, NO watermark, NO caption, NO signature, NO markings on measuring tools, NO blurry background, NO illustration or cartoon style."
    ) % (n, total, title, step)
