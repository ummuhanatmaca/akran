import os
import uuid
from datetime import datetime, timedelta
from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.core.config import settings
from app.models.user import User, UserProfile
from app.models.academic import Course, Topic, StudentCoursePreference, StudentAvailability
from app.models.opportunity import Opportunity, GuideArticle, ProjectIdea
from app.models.study_group import StudyGroup, StudyGroupMember
from app.models.goal import LearningGoal
from app.models.material import StudyMaterial
from app.models.support import SupportRequest, SupportSession
from app.services.pdf_generator import create_study_note_pdf

# Süleyman Demirel Üniversitesi (SDÜ) Bilgisayar Mühendisliği Müfredat Dersleri (1. - 4. Sınıf)
SDU_CENG_COURSES = [
    # --- 1. SINIF GÜZ VE BAHAR ---
    {
        "code": "BIL-101",
        "name": "Algoritma ve Programlama I",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Temel algoritmik düşünme, akış diyagramları, C/Python ile veri tipleri, karar ve döngü yapıları, modüler fonksiyonlar ve diziler.",
        "topics": [
            "Algoritma Tasarımı ve Akış Şemaları",
            "Değişkenler, Sabitler ve Veri Tipleri",
            "Koşullu İfadeler (if-else, switch-case)",
            "Döngü Yapıları (for, while, do-while)",
            "Fonksiyonlar, Kapsam ve Parametre Aktarımı",
            "Tek ve İki Boyutlu Diziler (Arrays)"
        ]
    },
    {
        "code": "BIL-104",
        "name": "Algoritma ve Programlama II",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "İleri düzey yapısal programlama, işaretçiler (pointers), adres aritmetiği, dinamik bellek yönetimi (malloc/free), yapılar (struct) ve dosya I/O.",
        "topics": [
            "İşaretçiler (Pointers) ve Adres Aritmetiği",
            "Dinamik Bellek Ayırma (malloc, calloc, realloc, free)",
            "Karakter Katarları ve Katar Fonksiyonları",
            "Kullanıcı Tanımlı Tipler, Struct ve Union",
            "Dosya Yönetimi (Dosya Açma, Okuma, Yazma, Kapatma)",
            "Özyinelemeli (Recursive) Fonksiyonlar"
        ]
    },
    {
        "code": "MAT-101",
        "name": "Matematik I (Kalkülüs)",
        "faculty": "Fen Fakültesi / Temel Bilimler",
        "description": "Tek değişkenli reel fonksiyonlar, limit, süreklilik, türev alma kuralları, türev uygulamaları ve integral temelleri.",
        "topics": [
            "Fonksiyonlar, Tanım Kümeleri ve Limit Kavramı",
            "Süreklilik ve Süreksizlik Türleri",
            "Türev, Türev Alma Kuralları ve Zincir Kuralı",
            "Maksimum - Minimum Problemleri ve Grafik Çizimi",
            "L'Hopital Kuralı ve Belirsiz Formlar",
            "Belirli ve Belirsiz İntegral Temelleri"
        ]
    },
    {
        "code": "MAT-102",
        "name": "Matematik II (İleri Kalkülüs)",
        "faculty": "Fen Fakültesi / Temel Bilimler",
        "description": "Diziler, sonsuz seriler, kuvvet serileri, çok değişkenli fonksiyonlar, kısmi türevler ve çok katlı integraller.",
        "topics": [
            "Sayı Dizileri ve Sonsuz Serilerde Yakınsaklık Testleri",
            "Kuvvet Serileri ve Taylor / Maclaurin Açılımları",
            "Çok Değişkenli Fonksiyonlar ve Limit",
            "Kısmi Türevler ve Yönlü Türev (Gradyan)",
            "İki Katlı İntegraller ve Alan/Hacim Hesabı",
            "Kutupsal Koordinatlarda İntegral"
        ]
    },
    {
        "code": "FIZ-101",
        "name": "Fizik I (Mekanik)",
        "faculty": "Fen Fakültesi / Temel Bilimler",
        "description": "Vektör cebri, bir ve iki boyutta hareket, Newton hareket yasaları, iş, enerji, momentum ve dönme dinamiği.",
        "topics": [
            "Vektörler ve Koordinat Sistemleri",
            "Doğrusal ve Eğrisel Hareket (Atışlar)",
            "Newton'un Hareket Yasaları ve Sürtünme",
            "İş, Kinetik Enerji ve Potansiyel Enerji Korunumu",
            "Çizgisel Momentum ve Çarpışmalar",
            "Sabit Eksen Etrafında Dönme Hareketi ve Tork"
        ]
    },
    {
        "code": "FIZ-102",
        "name": "Fizik II (Elektrik ve Manyetizma)",
        "faculty": "Fen Fakültesi / Temel Bilimler",
        "description": "Coulomb yasası, elektrik alan, Gauss yasası, potansiyel, sığa, DC devreleri, manyetik alan ve indüksiyon.",
        "topics": [
            "Elektriksel Yük ve Coulomb Yasası",
            "Elektrik Alan ve Gauss Yasası Uygulamaları",
            "Elektriksel Potansiyel ve Sığaçlar (Kapasitörler)",
            "Akım, Direnç ve Doğru Akım (DC) Devreleri",
            "Manyetik Alan ve Manyetik Kuvvetler",
            "Faraday İndüksiyon Yasası ve Lenz Kuralı"
        ]
    },
    {
        "code": "BIL-108",
        "name": "Bilgisayar Mühendisliğine Giriş",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Bilgisayar donanım mimarisi, sayı sistemleri, işletim sistemleri, meslek etiği, telif hakları ve bilişim kariyer alanları.",
        "topics": [
            "Bilgisayar Mimarisi ve Donanım Bileşenleri",
            "İkili, Sekizli ve Onaltılı Sayı Sistemleri",
            "İşletim Sistemleri ve Yazılım Katmanları",
            "Bilgisayar Ağları ve İnternet Temelleri",
            "Mühendislik Etiği, Lisanslama ve Fikri Mülkiyet",
            "Yazılım Geliştirme Süreçleri ve Proje Yönetimi"
        ]
    },
    {
        "code": "MAT-104",
        "name": "Lineer Cebir",
        "faculty": "Fen Fakültesi / Temel Bilimler",
        "description": "Matris cebri, determinantlar, lineer denklem sistemleri, vektör uzayları, lineer bağımsızlık, taban, özdeğer ve özvektörler.",
        "topics": [
            "Matrisler ve Temel Matris İşlemleri",
            "Lineer Denklem Sistemleri ve Gauss-Jordan Eliminasyonu",
            "Determinantlar ve Ters Matris Hesabı",
            "Vektör Uzayları, Alt Uzaylar ve Lineer Bağımsızlık",
            "Taban (Baz), Boyut ve Rank Kavramı",
            "Özdeğerler (Eigenvalues) ve Özvektörler (Eigenvectors)"
        ]
    },

    # --- 2. SINIF GÜZ VE BAHAR ---
    {
        "code": "BIL-219",
        "name": "Veri Yapıları ve Algoritmaları",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Doğrusal ve hiyerarşik veri yapıları, bellek modellemesi, zaman/alan karmaşıklığı (Big-O), bağlı listeler, ağaçlar, graflar ve arama/sıralama algoritmaları.",
        "topics": [
            "Asimptotik Karmaşıklık Analizi (Big-O, Omega, Teta)",
            "Tek ve Çift Yönlü Bağlı Listeler (Linked Lists)",
            "Yığınlar (Stacks) ve Kuyruklar (Queues)",
            "İkili Ağaçlar ve İkili Arama Ağaçları (BST)",
            "Dengeli Ağaç Yapıları (AVL, Red-Black Trees)",
            "Graf Gösterimleri ve Dolaşma Algoritmaları (BFS, DFS)",
            "Sıralama Algoritmaları (Quick, Merge, Heap Sort)"
        ]
    },
    {
        "code": "BIL-206",
        "name": "Nesneye Yönelik Programlama",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Nesneye yönelik programlama felsefesi (Java/C++), sınıflar, nesneler, kapsülleme, kalıtım, çok biçimlilik, soyutlama ve tasarım şablonları.",
        "topics": [
            "Sınıflar, Nesneler ve Yapıcı/Yıkıcı Metotlar",
            "Kapsülleme (Encapsulation) ve Erişim Belirleyiciler",
            "Kalıtım (Inheritance) ve Kodun Yeniden Kullanımı",
            "Çok Biçimlilik (Polymorphism) ve Metot Ezme (Overriding)",
            "Soyut Sınıflar (Abstract Classes) ve Arayüzler (Interfaces)",
            "İstisna Yönetimi (Exception Handling) ve Koleksiyonlar"
        ]
    },
    {
        "code": "BIL-207",
        "name": "Lojik Devreler I",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Sayısal mantık tasarımı, Boole cebri, mantık kapıları, Karnaugh haritaları ile devre sadeleştirme ve birleşimsel mantık devreleri.",
        "topics": [
            "Sayı Sistemleri, İkili Kodlar (BCD, Gray) ve Dönüşümler",
            "Boole Cebri, Teoremler ve Mantık Kapıları",
            "Karnaugh Haritaları ile Mantıksal Sadeleştirme",
            "Toplayıcılar, Çıkarıcılar ve Karşılaştırıcılar",
            "Kodlayıcılar (Encoders) ve Kod Çözücüler (Decoders)",
            "Çoklayıcılar (Multiplexers) ve Demultiplexers"
        ]
    },
    {
        "code": "BIL-204",
        "name": "Lojik Devreler II",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Ardışıl mantık devreleri, flip-floplar, durum diyagramları, sayıcılar, kaydırma kaydedicileri ve sonlu durum makineleri (FSM).",
        "topics": [
            "Mandal (Latch) ve Flip-Flop Yapıları (SR, JK, D, T)",
            "Ardışıl Devrelerin Durum Tabloları ve Durum İndirgeme",
            "Senkron ve Asenkron Sayıcı Tasarımı",
            "Kaydırma Kaydedicileri (Shift Registers) ve Uygulamaları",
            "Sonlu Durum Makineleri (Mealy ve Moore FSM)",
            "Yarı İletken Bellekler (RAM, ROM) ve Programlanabilir Mantık"
        ]
    },
    {
        "code": "BIL-205",
        "name": "Ayrık Matematik",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Önermeler mantığı, ispat yöntemleri, kümeler, bağıntılar, sayma teknikleri, tekrarlama bağıntıları ve çizge teorisi temelleri.",
        "topics": [
            "Önermeler Mantığı, Yüklemler ve Doğruluk Tabloları",
            "Matematiksel İspat Yöntemleri ve Tümevarım",
            "Kümeler, Bağıntılar, Denklik ve Kısmi Sıralama",
            "Permütasyon, Kombinasyon ve Güvercin Yuvası İlkesi",
            "Tekrarlama Bağıntıları (Recurrence Relations)",
            "Çizge (Graf) Teorisi Temelleri, Yollar ve Ağaçlar"
        ]
    },
    {
        "code": "BIL-210",
        "name": "Veritabanı Yönetim Sistemleri",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "İlişkisel veritabanı tasarımı, Varlık-İlişki (ER) modelleme, SQL sorgulama, ilişkisel cebir, normalizasyon ve transaction (ACID) yönetimi.",
        "topics": [
            "Veritabanı Mimarisi ve ER (Entity-Relationship) Modelleme",
            "İlişkisel Model ve İlişkisel Cebir İşlemleri",
            "SQL Sorgulama Dili (DDL, DML, DCL, JOIN ve Alt Sorgular)",
            "Normalizasyon Kuralları (1NF, 2NF, 3NF, BCNF)",
            "İndeksleme Türleri, B-Tree Mimarisi ve Performans",
            "Transaction Yönetimi, ACID İlkeleri ve Eşzamanlılık Kontrolü"
        ]
    },
    {
        "code": "BIL-213",
        "name": "Elektrik Devre Temelleri",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Doğru akım devre analizi, Ohm ve Kirchhoff yasaları, düğüm/çevre yöntemleri, Thevenin/Norton eşdeğer devreleri ve op-amp devreleri.",
        "topics": [
            "Devre Elemanları, Direnç, Gerilim ve Akım Kaynakları",
            "Kirchhoff Akım ve Gerilim Yasaları (KCL, KVL)",
            "Düğüm Gerilimleri ve Çevre Akımları Yöntemi",
            "Thevenin ve Norton Teoremleri ile Devre Sadeleştirme",
            "Maksimum Güç Transfer Teoremi",
            "İşlemsel Yükselteçler (Op-Amp) ve Temel Devreleri"
        ]
    },
    {
        "code": "MAT-201",
        "name": "Diferansiyel Denklemler",
        "faculty": "Fen Fakültesi / Temel Bilimler",
        "description": "Birinci ve yüksek mertebeden diferansiyel denklemler, lineer denklem sistemleri, serilerle çözüm ve Laplace dönüşümleri.",
        "topics": [
            "Birinci Mertebeden Diferansiyel Denklemler (Ayrılabilir, Lineer)",
            "Tam Diferansiyel Denklemler ve İntegrasyon Çarpanı",
            "Sabit Katsayılı İkinci Mertebeden Lineer Denklemler",
            "Belirsiz Katsayılar ve Parametrelerin Değişimi Yöntemi",
            "Laplace Dönüşümü ve Başlangıç Değer Problemleri Çözümü",
            "Lineer Diferansiyel Denklem Sistemleri"
        ]
    },
    {
        "code": "IST-201",
        "name": "Olasılık ve İstatistik",
        "faculty": "Fen Fakültesi / Temel Bilimler",
        "description": "Olasılık teorisi, rastgele değişkenler, kesikli ve sürekli olasılık dağılımları, örnekleme, parametre tahmini ve hipotez testleri.",
        "topics": [
            "Örneklem Uzayı, Olaylar ve Koşullu Olasılık",
            "Toplam Olasılık Kuralı ve Bayes Teoremi",
            "Kesikli Rastgele Değişkenler (Binom, Geometrik, Poisson)",
            "Sürekli Rastgele Değişkenler (Düzgün, Üstel, Normal)",
            "Beklenen Değer, Varyans ve Kovaryans",
            "Merkezi Limit Teoremi ve Hipotez Testleri"
        ]
    },

    # --- 3. SINIF GÜZ VE BAHAR ---
    {
        "code": "BIL-307",
        "name": "İşletim Sistemleri",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "İşletim sistemi çekirdek mimarisi, süreç/iş parçacığı yönetimi, CPU planlama, senkronizasyon, kilitlenme, sanal bellek ve dosya sistemleri.",
        "topics": [
            "İşletim Sistemi Çekirdeği, Sistem Çağrıları ve Kesmeler",
            "Süreç (Process) Durumları, PCB ve Thread Mimarisi",
            "CPU Zamanlama Algoritmaları (FCFS, SJF, Priority, Round Robin)",
            "Süreç Senkronizasyonu, Yarış Durumu (Race Condition) ve Semaforlar",
            "Kilitlenme (Deadlock) Koşulları, Önleme ve Banker Algoritması",
            "Sanal Bellek, Sayfalama (Paging), Segmentasyon ve Sayfa Değiştirme (LRU)"
        ]
    },
    {
        "code": "BIL-301",
        "name": "Mikroişlemciler ve Mikrodenetleyiciler",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Mikroişlemci mimarisi, 8086/ARM komut kümesi, Assembly programlama, adresleme modları, donanım kesmeleri, zamanlayıcılar ve portlar.",
        "topics": [
            "Mikroişlemci Mimarisi, Bus Yapısı ve Kaydediciler",
            "Assembly Dili Sözdizimi ve Komut Kümesi Mimarisi",
            "Adresleme Yöntemleri ve Yığın (Stack) Operasyonları",
            "Donanımsal ve Yazılımsal Kesmeler (Interrupts / ISR)",
            "Seri ve Paralel İletişim Protokolleri (UART, SPI, I2C)",
            "Gömülü Mikrodenetleyici Uygulamaları ve Sensör Arayüzleri"
        ]
    },
    {
        "code": "BIL-326",
        "name": "Yazılım Mühendisliği",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Yazılım yaşam döngüsü, Çevik (Agile, Scrum) metodolojiler, gereksinim analizi, UML modelleme, mimari tasarım, yazılım testi ve kalite güvencesi.",
        "topics": [
            "Yazılım Yaşam Döngüsü Modelleri (Şelale, Çevik, Scrum, Kanban)",
            "Gereksinim Mühendisliği, Fonksiyonel Gereksinimler ve Kullanıcı Hikayeleri",
            "UML Diyagramları (Use Case, Sınıf, Sıralama, Aktivite)",
            "Yazılım Tasarım Prensipleri (SOLID) ve Tasarım Şablonları",
            "Yazılım Testi Metodolojileri (Birim Test, Entegrasyon, E2E)",
            "Sürüm Kontrolü (Git) ve Sürekli Entegrasyon/Dağıtım (CI/CD)"
        ]
    },
    {
        "code": "BIL-303",
        "name": "Bilgisayar Ağları ve Veri İletişimi",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "OSI ve TCP/IP referans modelleri, fiziksel katmandan uygulama katmanına ağ protokolleri, IP yönlendirme, taşıma katmanı ve soket programlama.",
        "topics": [
            "OSI ve TCP/IP Katman Mimarisi ve Protokol Yığını",
            "Veri Bağı Katmanı, Çerçeveleme, Hata Sezme (CRC) ve CSMA/CD",
            "IPv4/IPv6 Adresleme, Alt Ağlara Bölme (Subnetting) ve CIDR",
            "Yönlendirme Protokolleri (Dijkstra, Bellman-Ford, OSPF, BGP)",
            "Taşıma Katmanı: TCP (Güvenilirlik, Akış/Tıkanıklık Kontrolü) ve UDP",
            "Uygulama Katmanı Protokolleri (DNS, HTTP/HTTPS, SSH) ve Soket Programlama"
        ]
    },
    {
        "code": "BIL-306",
        "name": "Web Teknolojileri ve Programlama",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Modern web mimarileri, HTML5/CSS3, TypeScript/JavaScript ES6+, tek sayfa uygulamaları (React/Vue), RESTful API tasarımı ve web güvenliği.",
        "topics": [
            "HTML5 Semantik Etiketler ve Modern Responsive CSS (Tailwind)",
            "JavaScript ES6+, Asenkron Programlama (Promises, async/await)",
            "Modern SPA Mimarisi ve React Bileşen Yaşam Döngüsü",
            "RESTful API Mimarisi, JSON Veri Değişimi ve HTTP İstekleri",
            "Kimlik Doğrulama Mekanizmaları (JWT, Session, OAuth2)",
            "Web Güvenliği Zafiyetleri (XSS, CSRF, SQL Injection, CORS)"
        ]
    },
    {
        "code": "BIL-308",
        "name": "Biçimsel Diller ve Otomata Teorisi",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Düzenli diller, sonlu durum makineleri (DFA/NFA), düzenli ifadeler, bağlamdan bağımsız gramerler, yığıtlı otomata ve Turing makineleri.",
        "topics": [
            "Alfabeler, Dizgiler, Diller ve Düzenli İfadeler (Regex)",
            "Belirleyici Sonlu Otomata (DFA) Tasarımı ve Sadeleştirme",
            "Belirleyici Olmayan Sonlu Otomata (NFA) ve DFA Dönüşümü",
            "Bağlamdan Bağımsız Diller (CFL) ve Gramerler (CFG)",
            "Yığıtlı Otomata (Pushdown Automata - PDA)",
            "Turing Makineleri, Durma Problemi (Halting Problem) ve Hesaplanabilirlik"
        ]
    },
    {
        "code": "BIL-311",
        "name": "Veri Madenciliği",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Veri ambarları, veri ön işleme, özellik çıkarma, birliktelik kuralı madenciliği, denetimli sınıflandırma, kümeleme ve model doğrulama.",
        "topics": [
            "Veri Madenciliği Süreci (KDD) ve Veri Türleri",
            "Veri Ön İşleme: Temizleme, Eksik Veri Tamamlama ve Normalizasyon",
            "Birliktelik Kuralları (Apriori ve FP-Growth Algoritmaları)",
            "Sınıflandırma: Karar Ağaçları, k-NN ve Naive Bayes",
            "Kümeleme Analizi: K-Means, Hiyerarşik Kümeleme ve DBSCAN",
            "Model Performans Değerlendirme (Doğruluk, Hassasiyet, Anma, F1-Skor, ROC)"
        ]
    },
    {
        "code": "BIL-302",
        "name": "Sistem Programlama",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "UNIX/Linux işletim sistemi ortamında C ile düşük seviyeli programlama, sistem çağrıları, süreç oluşturma, sinyaller, boru hatları ve soketler.",
        "topics": [
            "Linux Dosya Sistemi Mimarisi ve Dosya Tanımlayıcıları (File Descriptors)",
            "Düşük Seviyeli Dosya Giriş/Çıkış Sistem Çağrıları (open, read, write, lseek)",
            "Süreç Yönetimi Sistem Çağrıları (fork, exec, wait, exit)",
            "Sinyaller (Signals), Sinyal İşleyicileri ve Zamanlayıcılar",
            "Süreçler Arası İletişim (Pipes, FIFOs, Paylaşılan Bellek)",
            "POSIX İplikleri (Pthreads) ile Çok Kanallı Eşzamanlı Programlama"
        ]
    },

    # --- 4. SINIF GÜZ VE BAHAR ---
    {
        "code": "BIL-402",
        "name": "Algoritmaların Tasarımı ve Analizi",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "İleri düzey algoritma tasarım paradigmaları: Böl ve yönet, dinamik programlama, açgözlü algoritmalar, graf algoritmaları ve NP-Tamlık teorisi.",
        "topics": [
            "Böl ve Yönet (Divide and Conquer) Yaklaşımı ve Karmaşıklık Analizi",
            "Dinamik Programlama (Knapsack, En Uzun Ortak Alt Dizi, Matris Zinciri)",
            "Açgözlü (Greedy) Algoritmalar (Huffman Kodlaması, Minimum Yayılan Ağaç)",
            "İleri Graf Algoritmaları (En Kısa Yol, Ağ Akışları, Ford-Fulkerson)",
            "Geri İzleme (Backtracking) ve Dal-Sınır (Branch and Bound) Yöntemleri",
            "Karmaşıklık Sınıfları: P, NP, NP-Tam (NP-Complete) ve NP-Zor Problemler"
        ]
    },
    {
        "code": "BIL-423",
        "name": "Yapay Zeka",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Yapay zeka temelleri, problem çözme stratejileri, sezgisel arama algoritmaları (A*), oyun teorisi, makine öğrenmesi ve yapay sinir ağları.",
        "topics": [
            "Zeki Etmenler ve Durum Uzayında Problem Temsili",
            "Kör ve Sezgisel Arama Algoritmaları (BFS, DFS, A*, Greedy Best-First)",
            "Karşıtlıklı Arama ve Oyun Teorisi (Minimax, Alfa-Beta Budama)",
            "Makine Öğrenmesi Temelleri: Doğrusal ve Lojistik Regresyon",
            "Yapay Sinir Ağları (YSA), Algılayıcı (Perceptron) ve Geri Yayılım",
            "Derin Öğrenmeye Giriş ve Modern Yapay Zeka Uygulama Alanları"
        ]
    },
    {
        "code": "BIL-425",
        "name": "Siber Güvenlik ve Ağ Güvenliği",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Bilgi güvenliği ilkeleri (CIA), klasik ve modern kriptografi, simetrik/asimetrik şifreleme, ağ saldırıları, güvenlik duvarları ve sızma testi.",
        "topics": [
            "Bilgi Güvenliği Temelleri (Gizlilik, Bütünlük, Erişilebilirlik)",
            "Simetrik Şifreleme Algoritmaları (DES, 3DES, AES)",
            "Asimetrik Şifreleme ve Açık Anahtarlı Altyapı (RSA, Diffie-Hellman)",
            "Kriptografik Özet Fonksiyonları (SHA-256) ve Dijital İmzalar",
            "Ağ Saldırı Türleri (DDoS, Ortadaki Adam - MITM, Spoofing, Phishing)",
            "Güvenlik Duvarları (Firewall), IDS/IPS Sistemleri ve Zafiyet Taraması"
        ]
    },
    {
        "code": "BIL-427",
        "name": "Mobil Uygulama Geliştirme",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Mobil işletim sistemleri, yerel ve çapraz platform (Android / Flutter / React Native) geliştirme, kullanıcı arayüzü, yerel depolama ve web servisleri.",
        "topics": [
            "Mobil Platform Mimarisi ve Uygulama Yaşam Döngüsü",
            "Mobil Kullanıcı Arayüzü (UI) Tasarımı ve Duyarlı Düzenler",
            "Durum Yönetimi (State Management) ve Veri Akışı",
            "Yerel Veri Saklama (SQLite, SharedPreferences, Room)",
            "Arka Plan Görevleri, Bildirimler ve Servis Yönetimi",
            "REST API Entegrasyonu, Asenkron Ağ İstekleri ve JSON Ayrıştırma"
        ]
    },
    {
        "code": "BIL-429",
        "name": "Bulut Bilişim ve Dağıtık Sistemler",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Dağıtık sistem mimarileri, sanallaştırma, konteynerizasyon (Docker), orkestrasyon (Kubernetes), mikroservisler ve bulut bilişim hizmet modelleri.",
        "topics": [
            "Dağıtık Sistem İlkeleri, Eşzamanlılık ve CAP Teoremi",
            "Sanallaştırma Teknolojileri ve Konteynerizasyon (Docker)",
            "Çok Katmanlı Docker İmajı Oluşturma ve Docker Compose",
            "Konteyner Orkestrasyonu Temelleri (Kubernetes Pods, Services)",
            "Monolitik Mimariden Mikroservis Mimarisine Geçiş ve API Gateway",
            "Bulut Hizmet Modelleri (IaaS, PaaS, SaaS) ve Sunucusuz (Serverless) Bilişim"
        ]
    },
    {
        "code": "BIL-431",
        "name": "Mühendislik Tasarımı I",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Bitirme projesi I: Mühendislik probleminin tanımlanması, literatür ve patent araştırması, fizibilite analizi, sistem gereksinimleri ve mimari tasarım.",
        "topics": [
            "Mühendislik Probleminin Belirlenmesi ve Özgün Değer Analizi",
            "Kapsamlı Literatür Taraması ve Mevcut Çözümlerin Değerlendirilmesi",
            "Fizibilite, Bütçe ve Kaynak Planlaması",
            "Sistem Mimarisi, Blok Diyagramlar ve Teknik Şartname Hazırlama",
            "İş Paketleri, Zaman Çizelgesi (Gantt Şeması) ve Risk Yönetimi",
            "Dönem Sonu Tasarım Raporu Hazırlama ve Akademik Sunum"
        ]
    },
    {
        "code": "BIL-440",
        "name": "Mühendislik Tasarımı II",
        "faculty": "Mühendislik ve Doğa Bilimleri Fakültesi",
        "description": "Bitirme projesi II: Tasarlanan yazılım/donanım sisteminin geliştirilmesi, test edilmesi, performans doğrulaması, sonuç raporu ve jüri savunması.",
        "topics": [
            "Sistem Geliştirme, Kodlama ve Donanım/Yazılım Entegrasyonu",
            "Birim, Entegrasyon ve Kullanıcı Kabul Testlerinin Gerçekleştirilmesi",
            "Performans Ölçümleri, Hata Analizi ve Optimizasyon",
            "Bitirme Tezi Sonuç Raporunun Akademik Standartlarda Yazımı",
            "Proje Tanıtım Videosu ve Teknik Afiş Hazırlama",
            "Akademik Jüri Önünde Proje Demosu ve Sözlü Savunma"
        ]
    }
]

# Ders Notlari (Kullanici Tarafindan Eklenecektir)
SAMPLE_STUDY_MATERIALS = []

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Admin Kullanıcısı (Platform Yöneticisi)
        admin_email = settings.INITIAL_ADMIN_EMAIL.lower()
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                hashed_password=hash_password(settings.INITIAL_ADMIN_PASSWORD),
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.flush()

            admin_profile = UserProfile(
                user_id=admin_user.id,
                full_name="Platform Yöneticisi",
                university="Süleyman Demirel Üniversitesi",
                department="Bilgisayar Mühendisliği Bölüm Başkanlığı",
                grade="Yönetim",
                bio="AKRAN — SDÜ Bilgisayar Mühendisliği Akademik Destek ve Bilgi Paylaşım Platformu Yöneticisi.",
                interests="Akademik Destek, Açık Eğitim, Sosyal İnovasyon, Bilgisayar Mühendisliği",
                is_public=True
            )
            db.add(admin_profile)
            db.flush()
            print(f"Yonetici hesabi olusturuldu: {admin_email}")
        else:
            print(f"Yonetici hesabi mevcut: {admin_email}")

        # 2. Sahte / Mock Öğrenci ve Verilerin Temizlenmesi (Reel Verilere Hazırlık)
        mock_students = db.query(User).filter(
            User.role == "student",
            User.email.like("%@universite.edu.tr")
        ).all()
        mock_user_ids = [u.id for u in mock_students]

        if mock_user_ids:
            print(f"{len(mock_user_ids)} adet mock kullanici ve iliskili verileri temizleniyor...")
            # Session reviews
            from app.models.support import SessionReview
            db.query(SessionReview).filter(
                (SessionReview.reviewer_id.in_(mock_user_ids)) | (SessionReview.reviewee_id.in_(mock_user_ids))
            ).delete(synchronize_session=False)

            # Support sessions
            db.query(SupportSession).filter(
                (SupportSession.tutor_id.in_(mock_user_ids)) | (SupportSession.student_id.in_(mock_user_ids))
            ).delete(synchronize_session=False)

            # Support requests
            db.query(SupportRequest).filter(
                (SupportRequest.requester_id.in_(mock_user_ids)) | (SupportRequest.helper_id.in_(mock_user_ids))
            ).delete(synchronize_session=False)

            # İlgili mock çalışma grubu üyeleri
            db.query(StudyGroupMember).filter(StudyGroupMember.user_id.in_(mock_user_ids)).delete(synchronize_session=False)

            # İlgili mock çalışma grupları
            db.query(StudyGroup).filter(StudyGroup.creator_id.in_(mock_user_ids)).delete(synchronize_session=False)

            # İlgili mock proje fikirleri
            db.query(ProjectIdea).filter(ProjectIdea.creator_id.in_(mock_user_ids)).delete(synchronize_session=False)

            # İlgili mock öğrenme hedefleri
            db.query(LearningGoal).filter(LearningGoal.user_id.in_(mock_user_ids)).delete(synchronize_session=False)

            # İlgili mock ders tercihleri ve müsaitlikler
            db.query(StudentCoursePreference).filter(StudentCoursePreference.user_id.in_(mock_user_ids)).delete(synchronize_session=False)
            db.query(StudentAvailability).filter(StudentAvailability.user_id.in_(mock_user_ids)).delete(synchronize_session=False)

            # İlgili mock kullanıcı profilleri ve kullanıcılar
            db.query(UserProfile).filter(UserProfile.user_id.in_(mock_user_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(mock_user_ids)).delete(synchronize_session=False)
            db.commit()
            print("Mock ogrenci verileri basariyla temizlendi.")

        # Eski CS... kodlu geçici derslerin temizlenmesi (varsa ve ilişkisizse)
        old_courses = db.query(Course).filter(Course.code.in_(["CS101", "CS201", "CS204", "CS305", "CS308", "CS320", "CS410", "MATH101"])).all()
        for oc in old_courses:
            # Bağımlı gerçek materyal veya öğrenci tercihi yoksa temizle
            pref_count = db.query(StudentCoursePreference).filter(StudentCoursePreference.course_id == oc.id).count()
            if pref_count == 0:
                db.delete(oc)
        db.commit()

        # 3. SDÜ Bilgisayar Mühendisliği Müfredat Dersleri ve Konuları
        print("SDU Bilgisayar Muhendisligi mufredat dersleri senkronize ediliyor...")
        created_courses = {}
        created_topics = {}

        for c_data in SDU_CENG_COURSES:
            course = db.query(Course).filter(Course.code == c_data["code"]).first()
            if not course:
                course = Course(
                    code=c_data["code"],
                    name=c_data["name"],
                    faculty=c_data["faculty"],
                    description=c_data["description"]
                )
                db.add(course)
                db.flush()
            else:
                course.name = c_data["name"]
                course.faculty = c_data["faculty"]
                course.description = c_data["description"]
                db.flush()

            created_courses[c_data["code"]] = course

            # Konuları senkronize et
            for t_name in c_data["topics"]:
                topic = db.query(Topic).filter(Topic.course_id == course.id, Topic.name == t_name).first()
                if not topic:
                    topic = Topic(course_id=course.id, name=t_name)
                    db.add(topic)
                    db.flush()
                created_topics[(c_data["code"], t_name)] = topic

        db.commit()
        print(f"{len(SDU_CENG_COURSES)} adet SDU Bilgisayar Muhendisligi dersi basariyla yuklendi.")

        # 4. Resmi Bilimsel Fırsatlar (TÜBİTAK 2209, TEKNOFEST vb.)
        try:
            print("Resmi bilimsel firsatlar dogrulaniyor...")
            from app.services.opportunity_verifier import verify_and_sync_opportunities
            sync_res = verify_and_sync_opportunities(db)
            print(f"Bilimsel firsatlar senkronize edildi: {sync_res.get('items_updated', 0)} eklendi/guncellendi.")
        except Exception as e:
            print(f"Firsatlar senkronizasyon uyarisi: {e}")
            db.rollback()

        # 5. Akademik Proje Rehberleri (Tohum Kılavuzlar)
        print("Akademik proje rehberleri senkronize ediliyor...")
        from app.db.guide_seed_data import ACADEMIC_GUIDES
        for g_d in ACADEMIC_GUIDES:
            existing_guide = db.query(GuideArticle).filter(GuideArticle.slug == g_d["slug"]).first()
            if not existing_guide:
                g = GuideArticle(
                    slug=g_d["slug"],
                    title=g_d["title"],
                    category=g_d["category"],
                    target_audience=g_d.get("target_audience"),
                    summary=g_d["summary"],
                    content=g_d["content"],
                    checklist_items=g_d.get("checklist_items"),
                    template_example=g_d.get("template_example"),
                    official_sources=g_d.get("official_sources"),
                    read_time_minutes=g_d["read_time_minutes"]
                )
                db.add(g)
            else:
                existing_guide.title = g_d["title"]
                existing_guide.category = g_d["category"]
                existing_guide.target_audience = g_d.get("target_audience")
                existing_guide.summary = g_d["summary"]
                existing_guide.content = g_d["content"]
                existing_guide.checklist_items = g_d.get("checklist_items")
                existing_guide.template_example = g_d.get("template_example")
                existing_guide.official_sources = g_d.get("official_sources")
                existing_guide.read_time_minutes = g_d["read_time_minutes"]
        db.commit()

        # 6. Ders Notlari (Kullanici Tarafından Eklenecektir)
        print("Ders notlari alani temiz ve hazir.")
        print("Tum gercek ders notlari ve mufredat basariyla hazirlandi!")

    except Exception as e:
        db.rollback()
        print(f"Seed hatasi: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
