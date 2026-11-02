import pytest
import io
import zipfile
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def create_test_student():
    uid = uuid.uuid4().hex[:8]
    email = f"filesec_{uid}@sdu.edu.tr"
    pwd = "FileSecurityPass123!"
    res = client.post("/api/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": f"File Sec Student {uid}",
        "university": "SDÜ",
        "department": "Bilgisayar Mühendisliği",
        "grade": "2. Sınıf"
    })
    return res.json()["access_token"]

def get_admin_token():
    res = client.post("/api/auth/login", json={
        "email": "admin@akran.edu.tr",
        "password": "AdminAkran2026!"
    })
    return res.json()["access_token"]

def get_first_course_id():
    courses = client.get("/api/courses").json()
    return courses[0]["id"]

# 1. Gerçek ve Geçerli PDF Yükleme Testi
def test_valid_pdf_upload_succeeds():
    token = create_test_student()
    c_id = get_first_course_id()
    h = {"Authorization": f"Bearer {token}"}

    pdf_bytes = b"%PDF-1.5\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    res = client.post(
        "/api/materials",
        headers=h,
        data={"title": "Temiz Matematik Notu", "course_id": str(c_id)},
        files={"file": ("temiz_not.pdf", pdf_bytes, "application/pdf")}
    )
    assert res.status_code == 201
    data = res.json()
    assert data["scan_status"] == "clean"
    assert data["sha256_hash"] is not None
    assert len(data["sha256_hash"]) == 64
    mat_id = data["id"]

    # Test temizliği
    client.delete(f"/api/materials/{mat_id}", headers=h)

# 2. Sahte Uzantılı Yürütülebilir Dosya Reddedilme Testi (Magic Byte Doğrulaması)
def test_fake_extension_executable_rejected():
    token = create_test_student()
    c_id = get_first_course_id()
    h = {"Authorization": f"Bearer {token}"}

    # PDF uzantısı verilmiş fakat içeriği PE/MZ olan dosya
    fake_exe_bytes = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00This program cannot be run in DOS mode"
    res = client.post(
        "/api/materials",
        headers=h,
        data={"title": "Tuzak Dosya", "course_id": str(c_id)},
        files={"file": ("sahte_not.pdf", fake_exe_bytes, "application/pdf")}
    )
    assert res.status_code == 400
    assert "Güvenlik Uyarısı" in res.json()["detail"]

# 3. PDF İçi Aktif Zararlı JavaScript Nesnesi Engelleme Testi
def test_pdf_embedded_javascript_blocked():
    token = create_test_student()
    c_id = get_first_course_id()
    h = {"Authorization": f"Bearer {token}"}

    malicious_pdf = b"%PDF-1.4\n<< /Type /Action /S /JavaScript /JS (app.alert(1)) >>"
    res = client.post(
        "/api/materials",
        headers=h,
        data={"title": "JS Zararlısı Not", "course_id": str(c_id)},
        files={"file": ("js_not.pdf", malicious_pdf, "application/pdf")}
    )
    assert res.status_code == 400
    assert "aktif nesne" in res.json()["detail"].lower()

# 4. DOCX İçi Aktif Makro (VBA) Dosyası Engelleme Testi
def test_docx_with_vba_macro_blocked():
    token = create_test_student()
    c_id = get_first_course_id()
    h = {"Authorization": f"Bearer {token}"}

    # Geçerli zip yapısı oluşturalım fakat içine vbaProject.bin koyalım
    bio = io.BytesIO()
    with zipfile.ZipFile(bio, "w") as zf:
        zf.writestr("[Content_Types].xml", b"<Types></Types>")
        zf.writestr("word/document.xml", b"<document></document>")
        zf.writestr("word/vbaProject.bin", b"DUMMY_VBA_PAYLOAD")
    docx_bytes = bio.getvalue()

    res = client.post(
        "/api/materials",
        headers=h,
        data={"title": "Makrolu Word Belgesi", "course_id": str(c_id)},
        files={"file": ("makrolu.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    )
    assert res.status_code == 400
    assert "makro" in res.json()["detail"].lower()

# 5. Güvenli İndirme Başlıkları & Karantinadaki Dosyanın Engellenmesi
def test_quarantined_file_download_blocked_and_security_headers():
    token = create_test_student()
    admin_token = get_admin_token()
    c_id = get_first_course_id()
    h_student = {"Authorization": f"Bearer {token}"}
    h_admin = {"Authorization": f"Bearer {admin_token}"}

    # Temiz dosya yükle
    pdf_bytes = b"%PDF-1.4\nTest Security Headers Content\n%%EOF"
    upload_res = client.post(
        "/api/materials",
        headers=h_student,
        data={"title": "Karantina Test Notu", "course_id": str(c_id)},
        files={"file": ("karantina_test.pdf", pdf_bytes, "application/pdf")}
    )
    assert upload_res.status_code == 201
    mat_id = upload_res.json()["id"]

    # 1. Normal indirme: nosniff güvenlik başlıkları kontrolü
    down_res = client.get(f"/api/materials/{mat_id}/download", headers=h_student)
    assert down_res.status_code == 200
    assert down_res.headers.get("x-content-type-options") == "nosniff"
    assert "default-src 'none'" in down_res.headers.get("content-security-policy", "")

    # 2. Admin materyali karantinaya alıyor
    quar_res = client.put(f"/api/admin/materials/{mat_id}/quarantine?quarantine=true", headers=h_admin)
    assert quar_res.status_code == 200

    # 3. Normal öğrenci karantinadaki dosyayı indiremez (403 Forbidden)
    student_blocked = client.get(f"/api/materials/{mat_id}/download", headers=h_student)
    assert student_blocked.status_code == 403

    # 4. Anonim kullanıcı da indiremez (403 Forbidden)
    anon_blocked = client.get(f"/api/materials/{mat_id}/download")
    assert anon_blocked.status_code == 403

    # 5. Yönetici denetim amacıyla indirebilir (200 OK)
    admin_down = client.get(f"/api/materials/{mat_id}/download", headers=h_admin)
    assert admin_down.status_code == 200

    # 6. Admin güvenlik denetimi listesinde görüntüleyebiliyor mu?
    audit_res = client.get("/api/admin/materials/security-audit", headers=h_admin)
    assert audit_res.status_code == 200
    assert any(m["id"] == mat_id and m["scan_status"] == "quarantined" for m in audit_res.json())

    # 7. Admin yeniden tarama yapabiliyor mu?
    rescan_res = client.post(f"/api/admin/materials/{mat_id}/rescan", headers=h_admin)
    assert rescan_res.status_code == 200

    # Temizlik
    client.delete(f"/api/materials/{mat_id}", headers=h_admin)
