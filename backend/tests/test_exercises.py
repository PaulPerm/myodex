from fastapi.testclient import TestClient
from main import app
from seed_data import EXERCISES as exercises, GOAL_PRESETS as goal_presets

client = TestClient(app)
VALID_SLUGS = {m["slug"] for m in client.get("/muscles").json()}


# ── /muscles/{muscle}/exercises ─────────────────────────────

def test_primary_and_secondary_split():
    data = client.get("/muscles/chest/exercises").json()
    assert len(data["primary"]) > 0
    assert all(e["target"] == "chest" for e in data["primary"])
    assert all("chest" in e["secondary"] for e in data["secondary"])


def test_category_filter():
    data = client.get("/muscles/chest/exercises", params={"category": "machine"}).json()
    combined = data["primary"] + data["secondary"]
    assert len(combined) > 0
    assert all(e["category"] == "machine" for e in combined)


def test_goal_preset():
    data = client.get("/muscles/chest/exercises", params={"goal": "strength"}).json()
    assert data["preset"] == goal_presets["strength"]


def test_invalid_goal_falls_back_to_hypertrophy():
    data = client.get("/muscles/chest/exercises", params={"goal": "yoga"}).json()
    assert data["preset"] == goal_presets["hypertrophy"]


def test_case_insensitive():
    data = client.get("/muscles/CHEST/exercises").json()
    assert len(data["primary"]) > 0


def test_unknown_muscle_returns_empty():
    res = client.get("/muscles/notamuscle/exercises")
    assert res.status_code == 200
    assert res.json()["primary"] == []
    assert res.json()["secondary"] == []


# ── /exercises ──────────────────────────────────────────────

def test_difficulty_filter():
    data = client.get("/exercises", params={"difficulty": "beginner"}).json()
    assert len(data) > 0
    assert all(e["difficulty"] == "beginner" for e in data)


# ── data integrity ──────────────────────────────────────────

def test_ids_unique():
    ids = [e["id"] for e in exercises]
    assert len(ids) == len(set(ids))


def test_all_muscle_slugs_valid():
    for e in exercises:
        assert e["target"] in VALID_SLUGS, f"{e['name']}: bad target {e['target']}"
        for s in e["secondary"]:
            assert s in VALID_SLUGS, f"{e['name']}: bad secondary {s}"