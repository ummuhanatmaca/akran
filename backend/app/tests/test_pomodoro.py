import pytest
import uuid
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine

Base.metadata.create_all(bind=engine)

client = TestClient(app)

def get_student_token():
    email = "test_pomodoro_student@sdu.edu.tr"
    pwd = "PomodoroPass123!"
    res = client.post("/api/auth/login", json={"email": email, "password": pwd})
    if res.status_code == 200:
        return res.json()["access_token"]
    reg = client.post("/api/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": "Test Pomodoro Student",
        "university": "SDÜ",
        "department": "Bilgisayar Mühendisliği",
        "grade": "3. Sınıf"
    })
    return reg.json()["access_token"]

def test_pomodoro_unauthorized():
    res = client.get("/api/pomodoro/sessions")
    assert res.status_code == 401

def test_pomodoro_create_and_stats():
    token = get_student_token()
    headers = {"Authorization": f"Bearer {token}"}

    started_at = datetime.utcnow()
    ended_at = started_at + timedelta(minutes=25)

    cid = f"test-uuid-pomodoro-{uuid.uuid4().hex}"
    payload = {
        "session_type": "focus",
        "planned_duration": 1500,
        "actual_duration": 1500,
        "started_at": started_at.isoformat(),
        "ended_at": ended_at.isoformat(),
        "completed": True,
        "tag": "Algoritma Analizi",
        "client_id": cid
    }

    res = client.post("/api/pomodoro/sessions", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["session_type"] == "focus"
    assert data["actual_duration"] == 1500
    session_id = data["id"]

    # 2. Check idempotent duplicate with same client_id
    res_dup = client.post("/api/pomodoro/sessions", json=payload, headers=headers)
    assert res_dup.status_code == 201
    assert res_dup.json()["id"] == session_id

    # 3. Check stats
    stats_res = client.get("/api/pomodoro/stats?daily_goal=4", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["today_sessions_count"] >= 1
    assert stats["today_focus_minutes"] >= 25
    assert stats["daily_goal"] == 4

    # 4. Check list
    list_res = client.get("/api/pomodoro/sessions", headers=headers)
    assert list_res.status_code == 200
    sessions = list_res.json()
    assert any(s["id"] == session_id for s in sessions)

    # 5. Delete session
    del_res = client.delete(f"/api/pomodoro/sessions/{session_id}", headers=headers)
    assert del_res.status_code == 200

def test_pomodoro_sync():
    token = get_student_token()
    headers = {"Authorization": f"Bearer {token}"}

    started_at = datetime.utcnow() - timedelta(minutes=30)
    ended_at = datetime.utcnow() - timedelta(minutes=5)

    sync_payload = {
        "sessions": [
            {
                "session_type": "focus",
                "planned_duration": 1500,
                "actual_duration": 1500,
                "started_at": started_at.isoformat(),
                "ended_at": ended_at.isoformat(),
                "completed": True,
                "tag": "Matematik 101",
                "client_id": f"offline-client-uuid-{uuid.uuid4().hex}"
            }
        ]
    }

    res = client.post("/api/pomodoro/sync", json=sync_payload, headers=headers)
    assert res.status_code == 200
    assert res.json()["synced_count"] >= 0

    # Sync again - duplicate should be skipped
    res2 = client.post("/api/pomodoro/sync", json=sync_payload, headers=headers)
    assert res2.status_code == 200
    assert res2.json()["synced_count"] == 0
