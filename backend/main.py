from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Myodex API is running"}

@app.get("/muscles")
def get_muscles():
    return [
        {"id": 1, "name": "chest"},
        {"id": 2, "name": "biceps"},
        {"id": 3, "name": "triceps"},
        {"id": 4, "name": "quadriceps"},
        {"id": 5, "name": "gluteal"},
    ]