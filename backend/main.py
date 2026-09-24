from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# This tells FastAPI to show your HTML file when someone visits the homepage
@app.get("/")
def home():
     return FileResponse("frontend/index.html")

# (Optional but recommended) This lets you use CSS or JS files later
# app.mount("/static", StaticFiles(directory="static"), name="static")
