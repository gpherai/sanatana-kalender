import datetime


def test_create_session(client):
    resp = client.post("/sessions", json={
        "date": "2026-04-01",
        "duration_minutes": 30,
        "mala_count": 2,
        "notes": "test sessie",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["mala_count"] == 2
    assert data["mantra_count"] == 216
    assert data["duration_minutes"] == 30
    assert data["notes"] == "test sessie"


def test_list_sessions(client):
    client.post("/sessions", json={"date": "2026-04-02", "duration_minutes": 20, "mala_count": 1})
    client.post("/sessions", json={"date": "2026-04-03", "duration_minutes": 25, "mala_count": 2})
    resp = client.get("/sessions")
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


def test_list_sessions_date_filter(client):
    client.post("/sessions", json={"date": "2026-03-01", "duration_minutes": 10, "mala_count": 1})
    resp = client.get("/sessions?from=2026-04-01&to=2026-04-30")
    assert resp.status_code == 200
    for s in resp.json():
        d = datetime.date.fromisoformat(s["date"])
        assert datetime.date(2026, 4, 1) <= d <= datetime.date(2026, 4, 30)


def test_get_session(client):
    resp = client.post("/sessions", json={"date": "2026-04-05", "duration_minutes": 15, "mala_count": 1})
    session_id = resp.json()["id"]
    resp2 = client.get(f"/sessions/{session_id}")
    assert resp2.status_code == 200
    assert resp2.json()["id"] == session_id


def test_get_session_not_found(client):
    resp = client.get("/sessions/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


def test_update_session(client):
    resp = client.post("/sessions", json={"date": "2026-04-06", "duration_minutes": 20, "mala_count": 1})
    session_id = resp.json()["id"]
    resp2 = client.put(f"/sessions/{session_id}", json={"mala_count": 3, "notes": "bijgewerkt"})
    assert resp2.status_code == 200
    assert resp2.json()["mala_count"] == 3
    assert resp2.json()["mantra_count"] == 324
    assert resp2.json()["notes"] == "bijgewerkt"


def test_delete_session(client):
    resp = client.post("/sessions", json={"date": "2026-04-07", "duration_minutes": 10, "mala_count": 1})
    session_id = resp.json()["id"]
    resp2 = client.delete(f"/sessions/{session_id}")
    assert resp2.status_code == 204
    resp3 = client.get(f"/sessions/{session_id}")
    assert resp3.status_code == 404
