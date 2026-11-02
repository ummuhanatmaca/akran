import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_or_create_test_student():
    email = "test_student_api@sdu.edu.tr"
    pwd = "StudentPassword123!"
    res = client.post("/api/auth/login", json={"email": email, "password": pwd})
    if res.status_code == 200:
        return res.json()["access_token"], email, pwd
    reg = client.post("/api/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": "Test Öğrenci",
        "university": "Süleyman Demirel Üniversitesi",
        "department": "Bilgisayar Mühendisliği",
        "grade": "3. Sınıf"
    })
    return reg.json()["access_token"], email, pwd

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "AKRAN" in data["app"]

def test_login_demo_admin():
    response = client.post("/api/auth/login", json={
        "email": "admin@akran.edu.tr",
        "password": "AdminAkran2026!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "admin"

def test_login_demo_student():
    token, email, pwd = get_or_create_test_student()
    response = client.post("/api/auth/login", json={
        "email": email,
        "password": pwd
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "student"

def test_invalid_login():
    response = client.post("/api/auth/login", json={
        "email": "nonexistent@sdu.edu.tr",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401

def test_unauthorized_access_blocked():
    response = client.get("/api/users/profile")
    assert response.status_code == 401

def test_admin_only_access_blocked_for_student():
    token, _, _ = get_or_create_test_student()
    headers = {"Authorization": f"Bearer {token}"}
    stats_res = client.get("/api/admin/stats", headers=headers)
    assert stats_res.status_code == 403

def test_courses_list():
    response = client.get("/api/courses")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 30
    first_course = data[0]
    assert "topics" in first_course

def test_tutors_search_and_matching():
    token, _, _ = get_or_create_test_student()
    headers = {"Authorization": f"Bearer {token}"}
    courses_res = client.get("/api/courses")
    bil219 = next(c for c in courses_res.json() if c["code"] == "BIL-219")

    # Set tutor preference
    client.post("/api/users/preferences", headers=headers, json={
        "course_id": bil219["id"],
        "preference_type": "teach",
        "topics_list": "Tek ve Çift Yönlü Bağlı Listeler (Linked Lists)",
        "mode_preference": "both"
    })

    search_res = client.get(f"/api/users/tutors/search?course_id={bil219['id']}&topic=Bağlı")
    assert search_res.status_code == 200
    results = search_res.json()
    assert len(results) > 0
    top_match = results[0]
    assert top_match["match_score"] >= 50
    assert "Bağlı" in top_match["match_explanation"]

def test_opportunities_list_and_filter():
    response = client.get("/api/opportunities?category=TÜBİTAK")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert all(o["category"] == "TÜBİTAK" for o in data)

def test_guides_list():
    response = client.get("/api/opportunities/guides")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3

def test_study_groups_list():
    token, _, _ = get_or_create_test_student()
    headers = {"Authorization": f"Bearer {token}"}
    courses_res = client.get("/api/courses")
    course = courses_res.json()[0]

    # Create a test group
    create_res = client.post("/api/study-groups", headers=headers, json={
        "course_id": course["id"],
        "title": "SDÜ Test Çalışma Grubu",
        "topic": "Soru Çözümü",
        "description": "Vize öncesi soru çözümü",
        "max_members": 5,
        "mode": "online",
        "scheduled_at": "2026-11-10T14:00:00"
    })
    assert create_res.status_code in [201, 200]

    response = client.get("/api/study-groups")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["current_members_count"] >= 1

def test_user_registration_flow():
    import uuid
    rand_email = f"test_{uuid.uuid4().hex[:8]}@ogr.sdu.edu.tr"
    reg_res = client.post("/api/auth/register", json={
        "email": rand_email,
        "password": "Password123!",
        "full_name": "Test Öğrenci",
        "university": "Süleyman Demirel Üniversitesi",
        "department": "Bilgisayar Mühendisliği",
        "grade": "2. Sınıf"
    })
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    assert token is not None
