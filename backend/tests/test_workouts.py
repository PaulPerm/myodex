from fastapi.testclient import TestClient
from main import app, goal_presets

client = TestClient(app)


def gen(**body):
    return client.post("/workouts/generate", json=body)


def test_block_per_muscle():
    data = gen(muscles=["chest", "triceps"]).json()
    assert [b["muscle"] for b in data["blocks"]] == ["chest", "triceps"]


def test_exercises_target_muscle():
    exs = gen(muscles=["chest"], exercises_per_muscle=3).json()["blocks"][0]["exercises"]
    assert len(exs) == 3
    assert all(e["target"] == "chest" for e in exs)


def test_category_filter():
    data = gen(muscles=["chest", "biceps"], categories=["machine"]).json()
    for b in data["blocks"]:
        assert all(e["category"] == "machine" for e in b["exercises"])


def test_no_duplicate_exercises():
    data = gen(muscles=["lower-back", "hamstring"], exercises_per_muscle=5).json()
    names = [e["name"] for b in data["blocks"] for e in b["exercises"]]
    assert len(names) == len(set(names))


def test_compounds_first():
    exs = gen(muscles=["chest"], exercises_per_muscle=5).json()["blocks"][0]["exercises"]
    counts = [len(e["secondary"]) for e in exs]
    assert counts == sorted(counts, reverse=True)


def test_preset_matches_goal():
    data = gen(muscles=["chest"], goal="strength").json()
    assert data["preset"] == goal_presets["strength"]


def test_empty_muscles_rejected():
    assert gen(muscles=[]).status_code == 422


def test_too_many_per_muscle_rejected():
    assert gen(muscles=["chest"], exercises_per_muscle=10).status_code == 422
    