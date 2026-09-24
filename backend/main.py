from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# Get the absolute path of the directory this file is in (e.g., /opt/render/project/src/backend)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Go up one level to the project root, then into the frontend folder
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")

@app.get("/")
def home():
    # Use the absolute path to ensure it works regardless of where the server starts
    file_path = os.path.join(FRONTEND_DIR, "index.html")
    return FileResponse(file_path)

# Optional: Mount static files correctly
# app.mount("/static", StaticFiles(directory=os.path.join(FRONTEND_DIR, "static")), name="static")
