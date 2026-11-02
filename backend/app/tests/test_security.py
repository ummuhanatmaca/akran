import pytest
import uuid
import jwt
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_unique_student(prefix="sec_user"):
    uid = uuid.uuid4().hex[:6]
    email = f"{prefix}_{uid}@ogr.sdu.edu.tr"
    pwd = "SecurePassword123!"
    res = client.post("/api/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": f"Guvenlik Test {uid}",
        "university": "Suleyman Demirel Universitesi",
        "department": "Bilgisayar Muhendisligi",
        "grade": "3. Sinif"
    })
    assert res.status_code == 201
    return res.json()["access_token"], email, pwd, res.json()["user_id"]

def get_admin_token():
    res = client.post("/api/auth/login", json={
        "email": "admin@akran.edu.tr",
        "password": "AdminAkran2026!"
    })
    assert res.status_code == 200
    return res.json()["access_token"]

# 1. Parola ve Kimlik Doğrulama Güvenliği
def test_login_wrong_password_rejected():
    token, email, _, _ = create_unique_student("wrong_pwd")
    res = client.post("/api/auth/login", json={
        "email": email,
        "password": "CompletelyWrongPassword!"
    })
    assert res.status_code == 401

def test_login_missing_fields_rejected():
    res = client.post("/api/auth/login", json={"email": "admin@akran.edu.tr"})
    assert res.status_code == 422

def test_change_password_flow_and_validation():
    token, email, old_pwd, _ = create_unique_student("chg_pwd")
    h = {"Authorization": f"Bearer {token}"}

    # Yanlış mevcut parola
    fail_res = client.post("/api/auth/change-password", headers=h, json={
        "current_password": "WrongCurrentPassword123!",
        "new_password": "BrandNewPassword2026!"
    })
    assert fail_res.status_code == 400

    # 8 karakterden kısa parola
    short_res = client.post("/api/auth/change-password", headers=h, json={
        "current_password": old_pwd,
        "new_password": "short"
    })
    assert short_res.status_code == 422

    # Aynı parola
    same_res = client.post("/api/auth/change-password", headers=h, json={
        "current_password": old_pwd,
        "new_password": old_pwd
    })
    assert same_res.status_code == 400

    # Başarılı parola değişimi
    new_pwd = "BrandNewPassword2026!"
    success_res = client.post("/api/auth/change-password", headers=h, json={
        "current_password": old_pwd,
        "new_password": new_pwd
    })
    assert success_res.status_code == 200

    # Eski parola ile giriş başarısız olmalı
    old_login = client.post("/api/auth/login", json={"email": email, "password": old_pwd})
    assert old_login.status_code == 401

    # Yeni parola ile giriş başarılı olmalı
    new_login = client.post("/api/auth/login", json={"email": email, "password": new_pwd})
    assert new_login.status_code == 200

# 2. Yetkilendirme ve Rol Ayrımı (RBAC)
def test_privilege_escalation_on_registration_prevented():
    uid = uuid.uuid4().hex[:6]
    res = client.post("/api/auth/register", json={
        "email": f"hacker_{uid}@ogr.sdu.edu.tr",
        "password": "HackerPassword123!",
        "full_name": "Privilege Escalation Tester",
        "university": "SDU",
        "department": "Bilgisayar Muhendisligi",
        "grade": "4. Sinif",
        "role": "admin"
    })
    assert res.status_code == 201
    assert res.json()["role"] == "student"

def test_student_cannot_access_admin_stats():
    token, _, _, _ = create_unique_student("rbac_stats")
    res = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_student_cannot_list_or_modify_users():
    token, _, _, user_id = create_unique_student("rbac_user")
    h = {"Authorization": f"Bearer {token}"}

    res_list = client.get("/api/admin/users", headers=h)
    assert res_list.status_code == 403

    res_mod = client.put(f"/api/admin/users/{user_id}", headers=h, json={"is_active": False})
    assert res_mod.status_code == 403

def test_student_cannot_create_courses_or_topics():
    token, _, _, _ = create_unique_student("rbac_course")
    h = {"Authorization": f"Bearer {token}"}

    res_course = client.post("/api/courses", headers=h, json={
        "code": "TEST-999",
        "name": "Yetkisiz Ders",
        "faculty": "Fake Fakulte"
    })
    assert res_course.status_code == 403

    res_topic = client.post("/api/courses/1/topics", headers=h, json={
        "name": "Yetkisiz Konu"
    })
    assert res_topic.status_code == 403

# 3. JWT Güvenliği ve Belirteç Sahteciliği
def test_missing_token_returns_401():
    res = client.get("/api/users/profile")
    assert res.status_code == 401

def test_tampered_token_rejected():
    token, _, _, _ = create_unique_student("tamper")
    tampered_token = token[:-5] + "AAAAA"
    res = client.get("/api/users/profile", headers={"Authorization": f"Bearer {tampered_token}"})
    assert res.status_code == 401

def test_forged_admin_token_rejected():
    fake_token = jwt.encode({"user_id": 1, "role": "admin"}, "fake-secret-key", algorithm="HS256")
    res = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {fake_token}"})
    assert res.status_code == 401

# 4. Kaynak Sahipliği ve Yetkisiz Silme Engelleme
def test_student_cannot_delete_another_students_material():
    token1, _, _, _ = create_unique_student("owner1")
    token2, _, _, _ = create_unique_student("owner2")
    h1 = {"Authorization": f"Bearer {token1}"}
    h2 = {"Authorization": f"Bearer {token2}"}

    courses = client.get("/api/courses").json()
    c_id = courses[0]["id"]
    upload_res = client.post(
        "/api/materials",
        headers=h1,
        data={"title": "Ogrenci 1 Ozel Notu", "course_id": c_id},
        files={"file": ("guvenli_not.pdf", b"%PDF-1.4 sample content", "application/pdf")}
    )
    assert upload_res.status_code == 201
    mat_id = upload_res.json()["id"]

    # Yetkisiz silme denemesi -> 403 Forbidden
    del_res = client.delete(f"/api/materials/{mat_id}", headers=h2)
    assert del_res.status_code == 403

    # Sahibi silebilir -> 200 OK
    owner_del_res = client.delete(f"/api/materials/{mat_id}", headers=h1)
    assert owner_del_res.status_code == 200

# 5. Dosya Yükleme Güvenliği ve Uzantı Beyaz Listesi
def test_disallowed_file_extensions_blocked():
    token, _, _, _ = create_unique_student("file_sec")
    h = {"Authorization": f"Bearer {token}"}
    courses = client.get("/api/courses").json()
    c_id = courses[0]["id"]

    disallowed_extensions = ["sample.exe", "sample.sh", "sample.bat", "sample.py"]

    for fname in disallowed_extensions:
        res = client.post(
            "/api/materials",
            headers=h,
            data={"title": f"Test {fname}", "course_id": c_id},
            files={"file": (fname, b"dummy content", "application/octet-stream")}
        )
        assert res.status_code == 400

# 6. SQL Enjeksiyonu Dayanıklılığı
def test_sql_injection_resilience():
    sql_payloads = [
        "' OR 1=1 --",
        "'; DROP TABLE users; --",
        "' UNION SELECT null, null --"
    ]

    for payload in sql_payloads:
        res_course = client.get(f"/api/courses?search={payload}")
        assert res_course.status_code == 200

        res_mat = client.get(f"/api/materials?search={payload}")
        assert res_mat.status_code == 200

        res_opp = client.get(f"/api/opportunities?search={payload}")
        assert res_opp.status_code == 200
