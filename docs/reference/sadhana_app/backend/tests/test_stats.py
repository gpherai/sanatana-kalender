import datetime


def test_today_stats_empty(client):
    resp = client.get("/stats/today")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_malas"] == 0
    assert data["total_mantras"] == 0


def test_streak_empty(client):
    resp = client.get("/stats/streak")
    assert resp.status_code == 200
    data = resp.json()
    assert data["current_streak"] == 0
    assert data["longest_streak"] == 0
    assert data["last_session_date"] is None


def test_streak_consecutive(client):
    today = datetime.date.today()
    for i in range(3):
        d = today - datetime.timedelta(days=i)
        client.post("/sessions", json={
            "date": d.isoformat(),
            "duration_minutes": 20,
            "mala_count": 1,
        })
    resp = client.get("/stats/streak")
    data = resp.json()
    assert data["current_streak"] == 3
    assert data["longest_streak"] >= 3


def test_overview_stats(client):
    client.post("/sessions", json={"date": "2026-04-01", "duration_minutes": 30, "mala_count": 2})
    resp = client.get("/stats/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_sessions"] >= 1
    assert data["total_malas_all_time"] >= 2


def test_calendar_stats(client):
    client.post("/sessions", json={"date": "2026-04-01", "duration_minutes": 20, "mala_count": 1})
    resp = client.get("/stats/calendar")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_goals_crud(client):
    # Create
    resp = client.post("/goals", json={"type": "daily", "target_malas": 3})
    assert resp.status_code == 201
    goal_id = resp.json()["id"]
    assert resp.json()["active"] is True

    # List
    resp2 = client.get("/goals")
    assert any(g["id"] == goal_id for g in resp2.json())

    # Update
    resp3 = client.put(f"/goals/{goal_id}", json={"target_malas": 5})
    assert resp3.json()["target_malas"] == 5

    # Delete
    resp4 = client.delete(f"/goals/{goal_id}")
    assert resp4.status_code == 204
