from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# Get the absolute path of the directory this file is in
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Point to the 'dist' folder inside 'frontend'
FRONTEND_DIST_DIR = os.path.join(BASE_DIR, "..", "frontend", "dist")

# 1. Serve the BUILT index.html
@app.get("/")
def home():
    return FileResponse(os.path.join(FRONTEND_DIST_DIR, "index.html"))

# 2. Mount the assets folder (this is where Vite puts the compiled JS/CSS)
app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST_DIR, "assets")), name="assets")
