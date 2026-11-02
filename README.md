# AKRAN — Üniversite Öğrencileri İçin Ücretsiz Akademik Destek ve Bilgi Paylaşım Platformu

> **Bilgisayar Mühendisliği Bitirme Projesi**  
> Sosyal Fayda Odaklı, Gönüllülük Esaslı Açık Akran Eğitimi ve Bilimsel Proje İş Birliği Web Platformu

---

## 1. Projenin Amacı ve Çözülen Problemler

Üniversite eğitimi boyunca öğrenciler üç kritik akademik engelle karşılaşmaktadır:
1. **Ücretsiz Akademik Destek Eksikliği:** Zorlanılan derslerde özel derslerin fahiş ücretleri ve akademik danışmanlara erişim kısıtları nedeniyle öğrencilerin akran dayanışmasına ihtiyaç duyması.
2. **Dağınık ve Güvensiz Ders Notları:** Ders notlarının WhatsApp, Telegram veya forumlarda dağınık, silinmeye açık ve telif riski taşıyan biçimlerde paylaşılması.
3. **Bilimsel Fırsatlara ve Takımlara Erişememe:** TÜBİTAK 2209-A/B, TEKNOFEST ve Hackathon gibi kritik programların başvuru süreçleri, şartnameleri ve disiplinler arası takım arkadaşı bulma ihtiyacının tek bir merkezde karşılanamaması.

**AKRAN**, *"Her öğrenci hem öğrenen hem de öğretendir"* ilkesini benimser. Örneğin; Matematik dersinde desteğe ihtiyaç duyan bir öğrenci, iyi bildiği Programlama veya Veri Yapıları konusunda akranlarına ücretsiz destek vererek eğitimde fırsat eşitliğine katkı sağlar.

---

## 2. Teknoloji Yığını

| Katman | Teknoloji | Açıklama |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite | Modern bileşen mimarisi ve yüksek performanslı SPA |
| **Stil & UI** | Tailwind CSS v4, Lucide Icons | Lacivert kurumsal startup kimliği, responsive ve erişilebilir arayüz |
| **Routing** | React Router v7 | Korumalı rotalar (Protected & Admin Only Routes) |
| **Backend** | Python 3.12+, FastAPI | Yüksek performanslı asenkron RESTful mimari, OpenAPI/Swagger |
| **Veritabanı & ORM** | PostgreSQL / SQLite, SQLAlchemy v2 | İlişkisel model, cascade kuralları, unique constraint ve indeksler |
| **Kimlik Doğrulama** | JWT (JSON Web Tokens), Bcrypt | Güvenli parola hash'leme ve rol tabanlı yetkilendirme (RBAC) |
| **Dosya Depolama** | Yerel Depolama (Configurable Storage) | Uzantı/MIME kontrolü, UUID sanitizasyonu, indirme sayacı |
| **Test Altyapısı** | Pytest, HTTPX, FastAPI TestClient | 12 adet uçtan uca entegrasyon ve yetkilendirme testi (%100 Başarı) |
| **Konteynerizasyon** | Docker, Docker Compose, Nginx | Çok katmanlı (multi-stage) üretim dağıtım mimarisi |

---

## 3. Kural Tabanlı Akran Eşleştirme Algoritması

Sistemde destek arayan bir öğrenci için en alakalı ders anlatıcılarını sıralayan 5 adımlı kural tabanlı bir eşleştirme algoritması (`app/services/matching.py`) çalışmaktadır:

1. **Ders Uyumu (Temel Puan: 50):** İlgili derste anlatıcı olarak kayıtlı olan aktif öğrenciler listelenir.
2. **Konu Yetkinliği (+30 Puan):** Destek istenen alt konu (örn. *"Bağlı Listeler"*), anlatıcının belirttiği yetkinlik listesinde tam/kısmi geçiyorsa yüksek öncelik verilir.
3. **Görüşme Biçimi Uyumu (+15 Puan):** Öğrencinin çevrim içi veya yüz yüze tercihiyle anlatıcının tercihinin örtüşmesi doğrulanır.
4. **Haftalık Müsaitlik Uyumu (+20 Puan):** Öğrencinin talep ettiği gün (örn. *"Cumartesi"*), anlatıcının `student_availability` takviminde kayıtlıysa puanlanır.
5. **Aktif Yük Kapasitesi Kontrolü (-15 Puan):** Halihazırda 5'ten fazla planlanmış aktif oturumu olan yoğun anlatıcıların önceliği dengelenir.

> **Şeffaf Gerekçelendirme:** Algoritma öğrenciye sadece bir yüzde puanı değil, *"Veri Yapıları dersinde bağlı listeler konusunda destek veriyor ve Cumartesi günü müsait"* şeklinde insan dilinde açık gerekçe sunar.

---

## 4. Kullanıcı Rolleri ve Demo Giriş Bilgileri

Sistem reel verilerin kaydedilmesine hazır hale getirilmiş, SDÜ Bilgisayar Mühendisliği lisans müfredatının 32 dersi ve örnek ders notları yüklenmiştir:

| Rol | E-Posta | Parola | Tanım / Yetkinlik |
| :--- | :--- | :--- | :--- |
| **Yönetici (Admin)** | `admin@akran.edu.tr` | `AdminAkran2026!` | İstatistikler, kullanıcı askıya alma, fırsat ve moderasyon yönetimi |
| **Öğrenci (Kayıtlı)** | `l2211012032@ogr.sdu.edu.tr` | *(Kullanıcı parolası)* | SDÜ Bilgisayar Mühendisliği Öğrenci Hesabı |

*(Giriş ekranında yönetici paneline tek tıkla erişebileceğiniz **"Yönetici Hızlı Girişi"** butonu mevcuttur; yeni öğrenciler ise **"Kayıt Ol"** ekranından anında hesap oluşturabilir.)*

---

## 5. Projeyi Çalıştırma Adımları

### Seçenek A: Doğrudan Yerel Geliştirme (Tavsiye Edilen)

#### 1. Backend'i Başlatma:
```powershell
# Proje kök dizininde:
$env:PYTHONPATH="backend"
.\venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```
Backend `http://localhost:8000` adresinde çalışır. İlk açılışta `akran.db` veritabanı otomatik oluşturulur ve tüm demo veriler yüklenir.
- **Swagger API Dokümantasyonu:** `http://localhost:8000/docs`
- **Sağlık Kontrolü:** `http://localhost:8000/api/health`

#### 2. Frontend'i Başlatma:
```powershell
# Ayrı bir terminalde:
cd frontend
npm run dev
```
Uygulama `http://localhost:5173` adresinde açılır.

---

### Seçenek B: Docker Compose ile Çalıştırma (PostgreSQL ile)

Sisteminizde Docker Desktop çalışıyorsa tek bir komutla tüm yığını ayağa kaldırabilirsiniz:

```bash
docker compose up --build
```
Bu komut sırasıyla:
- `akran_postgres`: PostgreSQL 16 veritabanını başlatır ve sağlık durumunu doğrular.
- `akran_backend`: FastAPI backend servisini PostgreSQL'e bağlar, tabloları oluşturup seed eder.
- `akran_frontend`: Nginx üzerinde optimize edilmiş React uygulamasını `http://localhost:5173` üzerinde yayına alır.

---

## 6. Güvenlik ve Dosya Doğrulama Önlemleri

1. **Parola Güvenliği:** Parolalar asla düz metin saklanmaz; endüstri standardı `Bcrypt` algoritması ile salt'lanarak hash'lenir.
2. **Kimlik Doğrulama & Yetkilendirme:** İstekler sunucu tarafında doğrulanmış `HMAC-SHA256 (JWT)` belirteçleriyle korunur. Öğrenci rolleri yönetici işlemlerine erişemez (HTTP 403 Forbidden).
3. **Güvenli Dosya Depolama:** 
   - Yalnızca izinli uzantılara (`.pdf`, `.docx`, `.png`, `.jpg`, `.jpeg`) izin verilir.
   - Dosya boyutları sunucu tarafında 15 MB ile sınırlandırılmıştır.
   - Orijinal dosya adları dizin atlama (path traversal) açıklarına karşı `UUID.hex` ile dönüştürülerek güvenli alanda tutulur.
   - İndirmeler yetkilendirilmiş API üzerinden sayaç artırılarak güvenle sunulur.
4. **İçerik Moderasyonu & Raporlama:** Telif hakkı ihlali veya uygunsuz içerikler için her materyal kartında bildiri butonu bulunur; yönetici bu bildirimleri onaylayıp içeriği anında kaldırabilir.

---

## 7. Testleri Çalıştırma

Projede yer alan kimlik doğrulama, rol yetkileri, eşleştirme algoritması, ders/materyal/grup akışlarını test etmek için:

```powershell
$env:PYTHONPATH="backend"
.\venv\Scripts\pytest backend/app/tests/test_api.py -v
```

**Test Sonuçları:**
```
backend/app/tests/test_api.py::test_health_check PASSED                  [  8%]
backend/app/tests/test_api.py::test_login_demo_admin PASSED              [ 16%]
backend/app/tests/test_api.py::test_login_demo_student PASSED            [ 25%]
backend/app/tests/test_api.py::test_invalid_login PASSED                 [ 33%]
backend/app/tests/test_api.py::test_unauthorized_access_blocked PASSED   [ 41%]
backend/app/tests/test_api.py::test_admin_only_access_blocked_for_student PASSED [ 50%]
backend/app/tests/test_api.py::test_courses_list PASSED                  [ 58%]
backend/app/tests/test_api.py::test_tutors_search_and_matching PASSED    [ 66%]
backend/app/tests/test_api.py::test_opportunities_list_and_filter PASSED [ 75%]
backend/app/tests/test_api.py::test_guides_list PASSED                   [ 83%]
backend/app/tests/test_api.py::test_study_groups_list PASSED             [ 91%]
backend/app/tests/test_api.py::test_user_registration_flow PASSED        [100%]

======================= 12 passed in 3.58s =======================
```

---

## 8. Modüller ve Sayfa Haritası

- **`/` — Ana Sayfa:** Hero alanı, 4 ana değer önerisi, ikili çağrı alanı, ders kataloğu önizleme, bilimsel fırsatlar ve sosyal fayda manifestosu.
- **`/login` & `/register`:** E-posta/parola validasyonlu kayıt ve tek tıkla test kullanıcısı seçici.
- **`/dashboard` — Öğrenci Paneli:** Yaklaşan ders oturumları (Google Meet entegrasyonu), bekleyen talepler uyarısı, fırsat boru hattı ve öğrenme hedefleri.
- **`/tutors` — Akran Eğitmen Keşfi:** Kural tabanlı eşleştirme, % uygunluk puanı ve gerekçe açıklaması.
- **`/courses` & `/courses/:id`:** Mühendislik dersleri müfredat konuları, ders materyalleri ve ilgili anlatıcılar.
- **`/materials` & `/materials/upload`:** Ders notu indirme/arama merkezi, telif bildirme ve güvenli dosya yükleme.
- **`/study-groups`:** Kontenjan kontrollü açık çalışma grupları kurma ve katılma.
- **`/sessions`:** Planlanan/tamamlanan oturumlar ve 3 kriterli (açıklık, fayda, zamanlama) yıldızlı geri bildirim sistemi.
- **`/opportunities`:** TÜBİTAK 2209-A/B, TEKNOFEST ve Hackathon listesi, favorilere ekleme ve kişisel takip durumları.
- **`/guides`:** Proje önerisi yazma, TEKNOFEST şartname analizi ve akademik literatür tarama rehberleri.
- **`/team-finder`:** Proje fikri yayınlama ve yeteneklere göre takıma başvurma havuzu.
- **`/goals`:** Hedef tarihli konu tamamlama listesi ve ilerleme çubuğu.
- **`/notifications`:** Oturum ve talep durumlarına özel uygulama içi bildirimler.
- **`/admin` — Yönetici Paneli:** Gerçek veritabanı sorgularından üretilen canlı metrikler, kullanıcı hesabı yönetimi, fırsat ekleme/silme ve moderasyon incelemesi.

---

## 9. Lisans ve Akademik Etik

Bu proje, açık kaynak prensipleri ve eğitimde dayanışma vizyonuyla hazırlanmış bir Bilgisayar Mühendisliği bitirme projesidir. Platformda herhangi bir ticari kazanç, ücretli ders veya paralı kaynak satışı yapılamaz.
