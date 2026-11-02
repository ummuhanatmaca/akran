import pytest
import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_ten_step_e2e_flow():
    """
    Kullanıcının talep ettiği 10 kritik uçtan uca akışın eksiksiz doğrulaması:
    1. Öğrenci kaydı ve girişi
    2. Profil oluşturma ve güncelleme
    3. Ders anlatıcısı olarak profil oluşturma (tercih ve takvim ekleme)
    4. Başka bir öğrenciye ders desteği talebi gönderme
    5. Talebin kabul edilmesi ve oturum oluşturulması
    6. Ders notu yükleme, listeleme ve indirme
    7. Çalışma grubu oluşturma ve katılma
    8. Bilimsel fırsat ekleme, filtreleme ve favorilere kaydetme
    9. Başvuru durumunu güncelleme
    10. Yönetici panelinden içerik yönetimi
    """
    import uuid
    uid = uuid.uuid4().hex[:6]

    # -------------------------------------------------------------
    # ADIM 1: Öğrenci Kaydı ve Girişi
    # -------------------------------------------------------------
    student1_email = f"ogrenci1_{uid}@universite.edu.tr"
    reg1_res = client.post("/api/auth/register", json={
        "email": student1_email,
        "password": "Parola123*Secure",
        "full_name": f"Ali Demir {uid}",
        "university": "Boğaziçi Üniversitesi",
        "department": "Bilgisayar Mühendisliği",
        "grade": "3. Sınıf",
        "bio": "Veri Yapıları ve C++ meraklısı",
        "interests": "Algoritmalar, Sistem Programlama"
    })
    assert reg1_res.status_code == 201, f"Kayıt 1 başarısız: {reg1_res.text}"
    token1 = reg1_res.json()["access_token"]
    user1_id = reg1_res.json()["user_id"]
    h1 = {"Authorization": f"Bearer {token1}"}

    # Girişi doğrula
    login_res = client.post("/api/auth/login", json={
        "email": student1_email,
        "password": "Parola123*Secure"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # İkinci Öğrenciyi Kaydet (Ders desteği talep edecek öğrenci)
    student2_email = f"ogrenci2_{uid}@universite.edu.tr"
    reg2_res = client.post("/api/auth/register", json={
        "email": student2_email,
        "password": "Parola123*Secure",
        "full_name": f"Can Yılmaz {uid}",
        "university": "İTÜ",
        "department": "Yazılım Mühendisliği",
        "grade": "1. Sınıf"
    })
    assert reg2_res.status_code == 201
    token2 = reg2_res.json()["access_token"]
    user2_id = reg2_res.json()["user_id"]
    h2 = {"Authorization": f"Bearer {token2}"}

    # -------------------------------------------------------------
    # ADIM 2: Profil Oluşturma ve Güncelleme
    # -------------------------------------------------------------
    prof_update_res = client.put("/api/users/profile", headers=h1, json={
        "full_name": f"Ali Demir Güncel {uid}",
        "bio": "Veri Yapılarında 2 yıldır akran danışmanıyım.",
        "interests": "Algoritmalar, C++, Python, Açık Kaynak"
    })
    assert prof_update_res.status_code == 200
    prof_data = prof_update_res.json()
    assert prof_data["full_name"] == f"Ali Demir Güncel {uid}"
    assert "akran danışmanıyım" in prof_data["bio"]

    # -------------------------------------------------------------
    # ADIM 3: Ders Anlatıcısı Olarak Profil Oluşturma (Tercih & Takvim)
    # -------------------------------------------------------------
    courses_res = client.get("/api/courses")
    assert courses_res.status_code == 200
    courses = courses_res.json()
    assert len(courses) > 0
    course_bil219 = next(c for c in courses if c["code"] == "BIL-219")
    course_id = course_bil219["id"]

    # Ali'nin ders anlatma tercihi eklemesi
    pref_res = client.post("/api/users/preferences", headers=h1, json={
        "course_id": course_id,
        "preference_type": "teach",
        "topics_list": "Bağlı Listeler, Ağaçlar, Sıralama",
        "description": "Vize öncesi soru çözüm desteği veriyorum.",
        "mode_preference": "online"
    })
    assert pref_res.status_code == 200
    assert pref_res.json()["preference_type"] == "teach"

    # Ali'nin haftalık müsaitlik saati eklemesi
    avail_res = client.post("/api/users/availability", headers=h1, json={
        "day_of_week": "Cumartesi",
        "start_time": "14:00",
        "end_time": "17:00",
        "mode": "online"
    })
    assert avail_res.status_code == 200
    assert avail_res.json()["day_of_week"] == "Cumartesi"

    # -------------------------------------------------------------
    # ADIM 4: Başka Bir Öğrenciye Ders Desteği Talebi Gönderme
    # -------------------------------------------------------------
    # Can (Öğrenci 2), Ali'ye (Öğrenci 1) CS201 için destek talebi gönderiyor
    req_res = client.post("/api/support/requests", headers=h2, json={
        "helper_id": user1_id,
        "course_id": course_id,
        "topic_name": "Bağlı Listeler",
        "description": "Düğüm silme ve ekleme mantığında takıldım, yardımcı olur musun?",
        "preferred_schedule": "Cumartesi öğleden sonra",
        "mode": "online"
    })
    assert req_res.status_code == 201
    support_req = req_res.json()
    req_id = support_req["id"]
    assert support_req["status"] == "pending"
    assert support_req["helper_id"] == user1_id

    # Ali'nin gelen taleplerinde görünüyor mu?
    ali_received = client.get("/api/support/requests/received", headers=h1)
    assert ali_received.status_code == 200
    assert any(r["id"] == req_id for r in ali_received.json())

    # -------------------------------------------------------------
    # ADIM 5: Talebin Kabul Edilmesi ve Oturum Oluşturulması
    # -------------------------------------------------------------
    accept_res = client.put(f"/api/support/requests/{req_id}/status?status_action=accept", headers=h1)
    assert accept_res.status_code == 200

    # Oturumun oluştuğunu doğrula
    sessions_res = client.get("/api/support/sessions", headers=h1)
    assert sessions_res.status_code == 200
    ali_sessions = sessions_res.json()
    matched_session = next((s for s in ali_sessions if s["request_id"] == req_id), None)
    assert matched_session is not None
    assert matched_session["status"] == "scheduled"
    assert matched_session["meeting_link"] is not None

    # Oturumu tamamlama
    comp_res = client.put(f"/api/support/sessions/{matched_session['id']}/status?new_status=completed", headers=h1)
    assert comp_res.status_code == 200

    # Can'ın oturuma geri bildirim bırakması
    review_res = client.post(f"/api/support/sessions/{matched_session['id']}/reviews", headers=h2, json={
        "rating_clarity": 5,
        "rating_helpfulness": 5,
        "rating_punctuality": 4,
        "comment": "Bağlı listeleri çok iyi anlattı, teşekkür ederim!"
    })
    assert review_res.status_code == 201
    assert review_res.json()["rating_overall"] >= 4.5

    # -------------------------------------------------------------
    # ADIM 6: Ders Notu Yükleme, Listeleme ve İndirme
    # -------------------------------------------------------------
    dummy_pdf_bytes = b"%PDF-1.4 test dummy pdf content for akran peer support notes"
    upload_res = client.post(
        "/api/materials",
        headers=h1,
        data={
            "title": f"CS201 Bağlı Listeler Ders Özeti {uid}",
            "course_id": str(course_id),
            "description": "Vize öncesi özet formüller ve örnek kodlar"
        },
        files={
            "file": ("bagli_listeler.pdf", dummy_pdf_bytes, "application/pdf")
        }
    )
    assert upload_res.status_code == 201
    material_data = upload_res.json()
    mat_id = material_data["id"]

    # Listeleme ve arama kontrolü
    list_res = client.get(f"/api/materials?course_id={course_id}&search={uid}")
    assert list_res.status_code == 200
    assert any(m["id"] == mat_id for m in list_res.json())

    # İndirme ve sayaç kontrolü
    download_res = client.get(f"/api/materials/{mat_id}/download")
    assert download_res.status_code == 200
    assert download_res.content == dummy_pdf_bytes

    # Sayaç artmış mı kontrol et
    detail_res = client.get(f"/api/materials/{mat_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["download_count"] >= 1

    # -------------------------------------------------------------
    # ADIM 7: Çalışma Grubu Oluşturma ve Katılma
    # -------------------------------------------------------------
    # Ali bir çalışma grubu oluşturuyor
    group_res = client.post("/api/study-groups", headers=h1, json={
        "course_id": course_id,
        "title": f"CS201 Soru Çözüm Grubu {uid}",
        "topic": "Ağaçlar ve Yığınlar",
        "description": "Çıkmış vize sorularını birlikte çözeceğiz.",
        "max_members": 3,
        "mode": "online",
        "meeting_link": "https://meet.google.com/akran-test-meet"
    })
    assert group_res.status_code == 201
    group_data = group_res.json()
    group_id = group_data["id"]
    assert group_data["current_members_count"] == 1  # Kurucu dahil

    # Can gruba katılıyor
    join_res = client.post(f"/api/study-groups/{group_id}/join", headers=h2)
    assert join_res.status_code == 200

    # Üye sayısı 2 oldu mu?
    group_detail_res = client.get(f"/api/study-groups/{group_id}")
    assert group_detail_res.status_code == 200
    assert group_detail_res.json()["current_members_count"] == 2

    # -------------------------------------------------------------
    # ADIM 8: Bilimsel Fırsat Ekleme (Admin), Filtreleme ve Favorilere Ekleme
    # -------------------------------------------------------------
    # Admin girişi
    admin_login_res = client.post("/api/auth/login", json={
        "email": "admin@akran.edu.tr",
        "password": "AdminAkran2026!"
    })
    assert admin_login_res.status_code == 200
    admin_token = admin_login_res.json()["access_token"]
    h_admin = {"Authorization": f"Bearer {admin_token}"}

    # Admin yeni fırsat ekliyor
    opp_create_res = client.post("/api/admin/opportunities", headers=h_admin, json={
        "title": f"Yapay Zeka AR-GE Hackathonu {uid}",
        "organization": "TÜBİTAK BİLGEM",
        "category": "Hackathon",
        "fields": "Yapay Zeka, LLM, Veri Bilimi",
        "target_audience": "Lisans Öğrencileri",
        "application_type": "team",
        "requirements": "3-4 kişilik takımlar.",
        "prize_support": "50.000 TL",
        "official_url": "https://tubitak.gov.tr/hackathon"
    })
    assert opp_create_res.status_code == 201
    opp_id = opp_create_res.json()["id"]

    # Öğrencinin filtrelemesi
    filter_res = client.get("/api/opportunities?category=Hackathon")
    assert filter_res.status_code == 200
    assert any(o["id"] == opp_id for o in filter_res.json())

    # Can fırsatı favorilerine ekliyor
    fav_res = client.post(f"/api/opportunities/{opp_id}/favorite", headers=h2)
    assert fav_res.status_code == 200
    assert fav_res.json()["favorited"] is True

    # Favori listesinde görünüyor mu?
    my_favs_res = client.get("/api/opportunities/user/favorites", headers=h2)
    assert my_favs_res.status_code == 200
    assert any(o["id"] == opp_id for o in my_favs_res.json())

    # -------------------------------------------------------------
    # ADIM 9: Başvuru Durumunu Güncelleme (Tracking Pipeline)
    # -------------------------------------------------------------
    track_res = client.post(f"/api/opportunities/{opp_id}/tracking", headers=h2, json={
        "status": "preparing",
        "notes": "Proje raporunun özgün değer bölümü yazılıyor."
    })
    assert track_res.status_code == 200
    assert track_res.json()["status"] == "preparing"

    # Takip listesinde görünüyor mu?
    track_list_res = client.get("/api/opportunities/user/tracking", headers=h2)
    assert track_list_res.status_code == 200
    assert any(t["opportunity_id"] == opp_id and t["status"] == "preparing" for t in track_list_res.json())

    # -------------------------------------------------------------
    # ADIM 10: Yönetici Panelinden İçerik Yönetimi
    # -------------------------------------------------------------
    # İstatistikler canlı çekiliyor mu?
    stats_res = client.get("/api/admin/stats", headers=h_admin)
    assert stats_res.status_code == 200
    s_data = stats_res.json()
    assert s_data["total_users"] >= 2
    assert s_data["total_support_requests"] >= 1
    assert s_data["completed_sessions"] >= 1
    assert s_data["total_materials"] >= 1

    # Can materyale bildiri bırakıyor
    report_res = client.post(f"/api/materials/{mat_id}/report", headers=h2, json={
        "reason": "copyright",
        "details": "Örnek test bildirimi."
    })
    assert report_res.status_code == 201
    rep_id = report_res.json()["id"]

    # Admin bildirileri listeliyor
    admin_reports_res = client.get("/api/admin/reports", headers=h_admin)
    assert admin_reports_res.status_code == 200
    assert any(r["id"] == rep_id for r in admin_reports_res.json())

    # Admin bildiriyi inceliyor ve çözümlüyor (dismiss)
    resolve_res = client.put(f"/api/admin/reports/{rep_id}?action=dismiss", headers=h_admin)
    assert resolve_res.status_code == 200

    # Admin kullanıcı durumunu kısıtlama / aktifleştirme yapabiliyor mu?
    toggle_user_res = client.put(f"/api/admin/users/{user2_id}", headers=h_admin, json={
        "is_active": False
    })
    assert toggle_user_res.status_code == 200
    assert toggle_user_res.json()["is_active"] is False

    # Kısıtlanan kullanıcının oturum açması engellendi mi?
    blocked_login = client.post("/api/auth/login", json={
        "email": student2_email,
        "password": "Parola123*Secure"
    })
    assert blocked_login.status_code == 403

    # Kullanıcıyı tekrar aktifleştir
    unblock_res = client.put(f"/api/admin/users/{user2_id}", headers=h_admin, json={
        "is_active": True
    })
    assert unblock_res.status_code == 200
    assert unblock_res.json()["is_active"] is True

    # Test materyalini temizle
    client.delete(f"/api/materials/{mat_id}", headers=h1)

