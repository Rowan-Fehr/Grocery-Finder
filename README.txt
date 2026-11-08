Recipe step pictures (Gemini) + search demo

Setup (each teammate):
1. Install Python (python.org/downloads).
2. Copy config.example.json to config.json and paste YOUR Gemini key in it. NEVER upload config.json.
3. Add a recipes.json next to these files: [{"id":"my-recipe","title":"My Recipe","tags":["keyword"],"steps":["step one","step two"]}]
4. Make all pictures ahead of time:  python generate_step_images.py   (add --limit 2 to test first)
5. Run the search demo: double-click 4_START_DEMO.bat (Windows). Keep the black window open.

Notes:
- Saved pictures load fast; recipes without saved pictures are made live and then saved.
- demo_server.py holds the key and runs on your own PC only. Do not host it publicly.
- For a public site, host the saved pictures (images_small/) and have the page load them directly.
