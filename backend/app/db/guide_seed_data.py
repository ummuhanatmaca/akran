import json
import re

ACADEMIC_GUIDES = [
    {
        "slug": "proje-fikri-gelistirme",
        "title": "Mühendislik ve Bilim Alanında Özgün Proje Fikri Geliştirme",
        "category": "Proje fikri geliştirme",
        "target_audience": "Lisans ve Ön Lisans Mühendislik Öğrencileri",
        "summary": "Tekrara düşmeyen, çözülebilir ve akademik veya sektörel değeri olan araştırma fikirleri üretme kılavuzu.",
        "content": """1. Bu Rehber Neyi Anlatıyor?
Birçok öğrenci projesi, henüz başlangıç aşamasında yeterince özgün veya uygulanabilir bir problem seçilmediği için reddedilmektedir. Bu rehber, sıradan bir yazılım veya ödev fikrini TÜBİTAK ya da yarışma standartlarında bir araştırma projesine dönüştürmenin sistematik adımlarını sunar.

2. Kimler İçin?
Özellikle ilk kez TÜBİTAK 2209, TEKNOFEST veya bitirme projesine başlayacak, henüz net bir konusu olmayan üniversite öğrencileri için hazırlanmıştır.

3. Nereden Başlamalıyım?
Gözlem ve soru sorma ile başlayın. Çevrenizde, kampüsünüzde veya sanayide verimsiz işleyen, yüksek maliyetli veya manuel yapılan bir süreci not edin. "Bu işlem neden yavaş?", "Neden çok enerji harcıyor?", "Yapay zekâ veya yeni algoritmalar burada nasıl bir fark yaratabilir?" sorularını sorun.

4. Adım Adım Süreç
1. **İlgi Alanı Matrisi Oluşturma:** Takım üyelerinin güçlü olduğu teknik alanları (örn. görüntü işleme, gömülü sistemler, optimizasyon) listeleyin.
2. **Akademik Trend Analizi:** Son iki yılda yayımlanan IEEE, ACM veya DergiPark makalelerindeki 'Gelecek Çalışmalar' (Future Work) bölümlerini tarayın.
3. **Fikir Filtreleme (SCAMPER Tekniği):** Mevcut bir çözümü değiştirin, birleştirin veya yeni bir alana uyarlayın.
4. **Fizibilite Analizi:** Fikrin 6-12 ay içinde bir öğrenci bütçesi ve laboratuvar imkânlarıyla tamamlanabilir olup olmadığını test edin.
5. **Danışman Görüşü:** Fikri 1 sayfalık özet halinde bölümünüzdeki ilgili bir öğretim üyesine sunup geribildirim alın.

5. Dikkat Edilmesi Gerekenler
- "Bir mobil uygulama veya web sitesi yapmak" tek başına bir araştırma projesi fikri değildir; bir araçtır.
- Çözümün arkasında bir algoritma, ölçülebilir bir iyileştirme veya yeni bir yöntem olmalıdır.
- Çok geniş kapsamlı ('kanser teşhisi yapan sistem') yerine dar ve derinlikli konular ('deri lezyonu görüntülerinde kenar belirleme optimizasyonu') tercih edilmelidir.

6. Kontrol Listesi
Aşağıdaki adımları tamamladığınızdan emin olun.

7. Örnek veya Şablon
**Fikir Tanımlama Şablonu:**
- **Mevcut Problem:** [Sektörde veya literatürdeki açık sorun]
- **Mevcut Yetersiz Çözüm:** [Şu an kullanılan ve aksayan yöntem]
- **Önerilen Yenilikçi Yaklaşım:** [Bizim geliştireceğimiz algoritma/donanım]
- **Beklenen Ölçülebilir Çıktı:** [%X hız artışı, %Y doğruluk veya maliyet düşüşü]

8. İlgili Kaynaklar
- TÜBİTAK Öncelikli Ar-Ge ve Yenilik Konuları: https://tubitak.gov.tr/tr/kurumsal/politikalar/tubitak-2026-2028-oncelikli-ar-ge-ve-yenilik-konulari
- DergiPark Akademik Yayın Arama: https://dergipark.org.tr
- IEEE Xplore Dijital Kütüphane: https://ieeexplore.ieee.org

9. Son Güncelleme Tarihi
Ekim 2026""",
        "checklist_items": json.dumps([
            "Problem açıkça tanımlandı ve en az 3 akademik kaynakla desteklendi.",
            "Projenin tek başına bir yazılım geliştirme değil, araştırma niteliği taşıdığı doğrulandı.",
            "12 ay içinde öğrenci imkânlarıyla tamamlanabilecek kapsam sınırlandı.",
            "Bölüm danışman hocasıyla ön görüşme yapıldı."
        ], ensure_ascii=False),
        "template_example": "Örnek Problem Beyanı:\n'Tarım alanlarında su israfını önlemek için LoRa tabanlı nem sensörleri ve adaptif Kalman filtresi ile sulama ihtiyacını dinamik tahmin eden gömülü karar destek mimarisi.'",
        "official_sources": "TÜBİTAK Ar-Ge Politikaları Belgesi (tubitak.gov.tr)"
    },
    {
        "slug": "bilimsel-arastirma-ve-literatur-taramasi",
        "title": "Akademik Literatür Taraması ve Kaynak Değerlendirme Yöntemleri",
        "category": "Bilimsel araştırma ve literatür taraması",
        "target_audience": "Tüm Üniversite Lisans ve Yüksek Lisans Öğrencileri",
        "summary": "Google Scholar, IEEE, Scopus ve DergiPark üzerinde etkili arama ve atıf yönetimi.",
        "content": """1. Bu Rehber Neyi Anlatıyor?
Literatür taraması, daha önce yapılmış çalışmaları inceleyerek tekerleği yeniden icat etmemeyi ve projenin bilimsel zeminini kurmayı sağlar. Bu rehber, arama motorlarında doğru sorgu yazma ve güvenilir makaleleri seçme tekniğini açıklar.

2. Kimler İçin?
Proje önerisi formunun 'Literatür Özeti' bölümünü hazırlamakta zorlanan veya nereden kaynak bulacağını bilmeyen tüm öğrenciler.

3. Nereden Başlamalıyım?
Konunuzla ilgili 3 ila 5 adet temel İngilizce ve Türkçe anahtar kelime belirleyin. Arama motorunu sadece genel terimlerle değil, tırnak işaretleri ve mantıksal operatörlerle kullanın.

4. Adım Adım Süreç
1. **Veritabanı Seçimi:** Google Scholar, IEEE Xplore, ScienceDirect, ACM Digital Library ve DergiPark platformlarını açın.
2. **Gelişmiş Arama Kullanımı:** `("edge computing" OR "fog computing") AND "energy optimization"` şeklinde sorgular oluşturun.
3. **Yıl Filtresi:** Temel teorik çalışmalar hariç tutulmak üzere, son 3-5 yılda yayımlanan hakemli makalelere odaklanın.
4. **Özet (Abstract) ve Sonuç Taraması:** Makalenin tamamını okumadan önce abstract ve conclusion bölümlerini okuyarak ilgi derecesini belirleyin.
5. **Kaynak Yönetimi:** Zotero veya Mendeley kurarak bulduğunuz makaleleri künyeleriyle arşivleyin.
6. **Karşılaştırma Matrisi Çıkarma:** Makalelerin yöntemlerini, veri setlerini ve doğruluk oranlarını bir Excel tablosunda yan yana koyun.

5. Dikkat Edilmesi Gerekenler
- Blog yazıları, anonim web siteleri veya Wikipedia doğrudan bilimsel kaynak olarak gösterilmemelidir.
- Sadece başkalarının ne yaptığını arka arkaya sıralamak literatür özeti değildir; çalışmalar arasındaki eksiklikleri ve sizin projenizin bu eksikliği nasıl kapatacağını açıklamalısınız.

6. Kontrol Listesi
Literatür taramanızın yeterliliğini kontrol edin.

7. Örnek veya Şablon
**Literatür Karşılaştırma Matrisi Şablonu:**
| Yazar & Yıl | İncelenen Yöntem | Kullanılan Veri Seti | Başarı Oranı | Çalışmanın Sınırlılığı / Eksikliği |
|---|---|---|---|---|
| Yılmaz vd. (2024) | CNN ResNet-50 | Özel Hastane Verisi | %91.2 | Sadece gündüz ışığında çalışıyor, kenar cihazda yavaş |
| Smith et al. (2025) | MobileNetV3 | Açık Kaggle Seti | %88.5 | Gerçek zamanlı gecikme ölçümü yapılmamış |

8. İlgili Kaynaklar
- TÜBİTAK ULAKBİM TR Dizin: https://trdizin.gov.tr
- Google Akademik: https://scholar.google.com
- Zotero Kaynakça Yönetim Aracı: https://www.zotero.org

9. Son Güncelleme Tarihi
Ekim 2026""",
        "checklist_items": json.dumps([
            "En az 10 adet uluslararası ve ulusal hakemli makale incelendi.",
            "Son 3-5 yılın yayınlarına ağırlık verildi.",
            "Literatür matrisi çıkarılarak mevcut çalışmaların eksik yönleri not edildi.",
            "Zotero/Mendeley kütüphanesi oluşturuldu ve bibtex çıktıları alındı."
        ], ensure_ascii=False),
        "template_example": "Örnek Literatür Cümlesi:\n'Literatürde X konusunda yapılan çalışmalarda (Demir vd., 2024; Chen et al., 2025) doğruluk oranı %90 seviyesine ulaşmış olsa da, gömülü sistemlerdeki yüksek bellek tüketimi çözülememiştir. Önerilen bu çalışma, kuantize ağırlıklandırma yöntemiyle bu açığı kapatmayı hedeflemektedir.'",
        "official_sources": "TÜBİTAK ULAKBİM & IEEE Guidelines"
    },
    {
        "slug": "problem-tanimi-amac-ve-arastirma-sorusu",
        "title": "Problem Tanımı, Proje Amacı ve Araştırma Sorusu Oluşturma",
        "category": "Problem tanımı, amaç ve araştırma sorusu",
        "target_audience": "Lisans Öğrencileri ve Araştırmacılar",
        "summary": "TÜBİTAK ve hakem heyetlerinin en çok dikkat ettiği 'Problem Tanımı' ve 'Hedefler' bölümünün yazımı.",
        "content": """1. Bu Rehber Neyi Anlatıyor?
Bir projenin hakemler tarafından onaylanmasının ilk şartı, çözülmek istenen problemin somut ve ölçülebilir biçimde ortaya konmasıdır. Bu rehber, amaç ve araştırma sorularını netleştirmeyi hedefler.

2. Kimler İçin?
"Projemin amacını tam ifade edemiyorum" veya "Hakemler problem tanımını yetersiz buldu" diyen tüm adaylar.

3. Nereden Başlamalıyım?
Problemi üç boyutta ele alın:
1. Problem nedir ve kimleri etkilemektedir?
2. Problem çözülmezse ne tür kayıplar (zaman, maliyet, can güvenliği, veri kaybı) oluşmaktadır?
3. Mevcut yöntemler bu problemi neden tam olarak çözememektedir?

4. Adım Adım Süreç
1. **Genel Durumdan Özel Problemi Ayıklama:** Dünyadaki genel bir sorundan başlayıp projenizin odaklandığı dar teknik probleme inin.
2. **SMART Amaç Tanımlama:** Amacınız Belirli (Specific), Ölçülebilir (Measurable), Ulaşılabilir (Achievable), İlgili (Relevant) ve Zamanlı (Time-bound) olmalıdır.
3. **Araştırma Soruları Belirleme:** "X parametresindeki %20'lik değişim sistem başarımını nasıl etkiler?", "Geliştirilen hibrit model gecikme süresini 100 ms altına indirebilir mi?" gibi test edilebilir hipotezler kurun.
4. **Başarı Ölçütleri:** Hangi değerlere ulaştığınızda projenin başarılı sayılacağını önceden yazın.

5. Dikkat Edilmesi Gerekenler
- "İnsanlığa faydalı olmak" veya "Yazılım geliştirmek" bir proje amacı değildir.
- Amaç ile yöntem birbirine karıştırılmamalıdır (Amaç: X sorununu çözmek, Yöntem: Y algoritmasını kullanmak).

6. Kontrol Listesi
Hedeflerinizin netliğini test edin.

7. Örnek veya Şablon
**Amaç ve Başarı Ölçütü Şablonu:**
- **Ana Amaç:** [Önerilen sistem ile hedeflenen nihai teknik kazanım]
- **Alt Hedef 1:** [Veri toplama ve doğrulama hedefi]
- **Alt Hedef 2:** [Model eğitimi ve optimizasyon hedefi]
- **Başarı Kriteri:** [Örn: Saniyede en az 30 kare işleme ve %92 F1-skoru]

8. İlgili Kaynaklar
- TÜBİTAK Proje Yazım Kılavuzu: https://tubitak.gov.tr

9. Son Güncelleme Tarihi
Ekim 2026""",
        "checklist_items": json.dumps([
            "Problem sayısal veriler ve istatistiklerle somutlaştırıldı.",
            "Ana amaç tek bir net cümleyle ifade edildi.",
            "En az 2 adet sınanabilir araştırma sorusu (hipotez) yazıldı.",
            "Ölçülebilir başarı kriterleri belirlendi."
        ], ensure_ascii=False),
        "template_example": "Örnek Amaç Beyanı:\n'Bu projenin amacı, endüstriyel konveyör bantları üzerinde hareket eden hatalı parçaları gerçek zamanlı tespit eden, Raspberry Pi 5 üzerinde 35 FPS hızında çalışan ve %95 üzeri doğruluk sağlayan hafifletilmiş bir nesne tespit mimarisi geliştirmektir.'",
        "official_sources": "TÜBİTAK Araştırma Destek Programları Kılavuzu"
    },
    {
        "slug": "yontem-ve-teknik-altyapi",
        "title": "Araştırma Yöntemi, Mimari Tasarım ve Teknik Altyapı Planı",
        "category": "Yöntem ve teknik altyapı",
        "target_audience": "Mühendislik ve Doğa Bilimleri Öğrencileri",
        "summary": "Sistem mimarisi, algoritma akış şemaları, veri seti seçimi ve doğrulama metrikleri.",
        "content": """1. Bu Rehber Neyi Anlatıyor?
Yöntem bölümü, hakemin "Bu öğrenciler bu projeyi gerçekten yapabilir mi ve adımları biliyorlar mı?" sorusuna yanıt aradığı yerdir. Bu rehber, teknik yöntemin detaylandırılmasını sağlar.

2. Kimler İçin?
Proje formunun yöntem kısmına sadece 'Python ve React kullanılacaktır' yazmanın yetersiz olduğunun farkında olan ve teknik derinlik katmak isteyen öğrenciler.

3. Nereden Başlamalıyım?
Projenin genel mimarisini gösteren bir sistem blok diyagramı (System Architecture Diagram) çizerek işe başlayın.

4. Adım Adım Süreç
1. **Veri Temini ve Etiketleme:** Veri nereden alınacak? Açık veri seti mi kullanılacak, deneysel ölçüm mü yapılacak? Etik kurul izni gerekiyor mu?
2. **Ön İşleme ve Özellik Çıkarımı:** Ham veri nasıl temizlenecek, gürültü nasıl filtrelenecek?
3. **Model / Donanım Seçimi:** Hangi kütüphaneler (PyTorch, TensorFlow, OpenCV) ve hangi donanımlar (mikrodenetleyici, GPU sunucu) kullanılacak? Gerekçeleri nelerdir?
4. **Deneysel Tasarım:** Kontrol grubu ve deney grubu nasıl kurulacak? Çapraz doğrulama (k-fold cross validation) kullanılacak mı?
5. **Değerlendirme Metrikleri:** Doğruluk (Accuracy), Kesinlik (Precision), Duyarlılık (Recall), Gecikme (Latency) gibi metriklerin seçimi.

5. Dikkat Edilmesi Gerekenler
- Yöntemde belirsiz ifadelerden ("gerekli kütüphaneler indirilecektir") kaçının. Spesifik kütüphane ve versiyonları belirtin.
- Donanım gereksinimlerini laboratuvar imkânlarıyla eşleştirin.

6. Kontrol Listesi
Yönteminizin teknik yeterliliğini kontrol edin.

7. Örnek veya Şablon
**Teknik Yöntem Akış Şablonu:**
1. Aşama: Veri Toplama (Açık kaynak veri seti + 500 adet laboratuvar örneği)
2. Aşama: Ön İşleme (Normalizasyon, veri artırma - Data Augmentation)
3. Aşama: Model Eğitimi (Transfer Learning tabanlı fine-tuning)
4. Aşama: Gömülü Portlama (ONNX / TensorRT optimizasyonu)
5. Aşama: Test ve Karşılaştırmalı Başarım Analizi

8. İlgili Kaynaklar
- IEEE Standard for System Architecture Descriptions: https://standards.ieee.org
- Draw.io Mimari Çizim Aracı: https://app.diagrams.net

9. Son Güncelleme Tarihi
Ekim 2026""",
        "checklist_items": json.dumps([
            "Sistem blok diyagramı ve akış şeması hazırlandı.",
            "Veri seti kaynağı ve büyüklüğü netleştirildi.",
            "Kullanılacak yazılım ve donanım bileşenleri gerekçelendirildi.",
            "Başarım değerlendirme metrikleri formüle edildi."
        ], ensure_ascii=False),
        "template_example": "Örnek Yöntem Şeması: Sensör Katmanı -> MQTT Protokolü -> Veri Ön İşleme (Pandas) -> Derin Öğrenme Modeli (PyTorch) -> Karar Arayüzü (React Dashboard).",
        "official_sources": "TÜBİTAK Proje Değerlendirme Yönergesi"
    },
    {
        "slug": "proje-yazimi-ve-basvuru-belgeleri",
        "title": "TÜBİTAK ve Yarışma Başvuru Formu Yazım Standartları",
        "category": "Proje yazımı ve başvuru belgeleri",
        "target_audience": "Başvuru Hazırlayan Üniversite Öğrencileri",
        "summary": "Akademik üslup, form formatı, iş-zaman çubuk grafiği (Gantt Şeması) ve risk analizi.",
        "content": """1. Bu Rehber Neyi Anlatıyor?
Harika bir fikir, kötü yazılmış ve eksik belgeler içeren bir başvuru formu yüzünden elenebilir. Bu rehber, biçimsel kuralları, iş paketlerini ve risk yönetimini kusursuz hazırlamayı öğretir.

2. Kimler İçin?
TÜBİTAK 2209 veya TEKNOFEST formunu doldururken hangi bölüme ne yazması gerektiğini adım adım görmek isteyen öğrenciler.

3. Nereden Başlamalıyım?
Kurumun en son yayınlanan güncel başvuru form şablonunu (Word/.docx) resmi siteden indirin. Yazı tipi, kenar boşlukları ve sayfa sınırlarını kesinlikle değiştirmeyin.

4. Adım Adım Süreç
1. **İş Paketleri (İP) Bölümleme:** Projeyi 3 ila 5 mantıksal iş paketine bölün (İP1: Literatür ve Hazırlık, İP2: Geliştirme, İP3: Test ve Doğrulama, İP4: Raporlama ve Yaygınlaştırma).
2. **Gantt Şeması Hazırlama:** Her iş paketinin başlangıç ve bitiş aylarını gösteren renkli bir çubuk grafik oluşturun.
3. **Risk Analizi ve B Planı:** Her iş paketi için oluşabilecek olası aksaklığı ve alternatif çözümünüzü (B planı) tablo halinde yazın.
4. **Akademik Üslup:** Birinci tekil şahıs ("yaptım, edeceğim") yerine üçüncü tekil şahıs veya edilgen çatı ("yapılacaktır, hedeflenmektedir") kullanın.
5. **Ek Belgeler:** Öğrenci belgesi, danışman onay yazısı ve varsa sanayi desteği yazısını PDF formatında hazırlayın.

5. Dikkat Edilmesi Gerekenler
- Başvuru formundaki karakter veya sayfa sınırını aşmayın.
- Hakemlerin yüzlerce proje okuduğunu unutmayın; paragrafları kısa tutun, önemli terimleri kalınlaştırın, diyagram ve tablolar kullanın.

6. Kontrol Listesi
Başvuru dosyanızın eksiksiz olduğunu doğrulayın.

7. Örnek veya Şablon
**Risk Yönetimi Tablosu Şablonu:**
| Risk Tanımı | Olasılık | Etki | Önleyici Tedbir / B Planı |
|---|---|---|---|
| Sensör modülünün gecikmeli teslimi | Orta | Yüksek | Yerel simülasyon yazılımı (Gazebo) üzerinden sanal testlerin yürütülmesi |
| Veri setinin yetersiz kalması | Düşük | Yüksek | Veri artırma (Data Augmentation) teknikleri ve açık sentetik veri üretimi |

8. İlgili Kaynaklar
- TÜBİTAK TYBS Başvuru Portalı: https://tybs.tubitak.gov.tr
- Gantt Şeması Oluşturma Aracı: https://www.onlinegantt.com

9. Son Güncelleme Tarihi
Ekim 2026""",
        "checklist_items": json.dumps([
            "Kurumun en güncel başvuru formu şablonu kullanıldı.",
            "İş-zaman (Gantt) çizelgesi hazırlandı.",
            "En az 3 potansiyel risk ve bunlara ait B planları yazıldı.",
            "Danışman öğretim üyesi onay yazısı ve güncel öğrenci belgeleri hazırlandı."
        ], ensure_ascii=False),
        "template_example": "Örnek İş Paketi Formatı: İP-2: Algoritma Geliştirme (Ay 3-6) | Sorumlu: Takım Kaptanı | Çıktı: Eğitilmiş ağırlık dosyası ve doğruluk raporu.",
        "official_sources": "TÜBİTAK BİDEB Başvuru Kılavuzu"
    },
    {
        "slug": "butce-ve-kaynak-planlamasi",
        "title": "Proje Bütçesi, Sarf Malzeme ve Kaynak Planlaması",
        "category": "Bütçe ve kaynak planlaması",
        "target_audience": "Hibe ve Destek Başvurusu Yapan Öğrenciler",
        "summary": "TÜBİTAK 2209 bütçe kalemleri, sarf malzeme gerekçelendirmesi ve faturalandırma kuralları.",
        "content": """1. Bu Rehber Neyi Anlatıyor?
TÜBİTAK projelerinde bütçenin reddedilmesinin en büyük nedeni, talep edilen malzemelerin projenin yöntemiyle doğrudan ilişkilendirilmemesidir. Bu rehber, kabul edilebilir bir bütçe tablosu oluşturmayı gösterir.

2. Kimler İçin?
2209-A ve 2209-B bütçe talebinde bulunacak tüm lisans ve ön lisans takımları.

3. Nereden Başlamalıyım?
Öncelikle çağrı metninde belirtilen destek üst limitini kontrol edin (2209-A için güncel üst limiti inceleyiniz). Bütçeyi kalem kalem proforma faturalar veya piyasa araştırmasıyla netleştirin.

4. Adım Adım Süreç
1. **İzin Verilen Kalemler:** Sarf malzeme (sensör, kimyasal madde, geliştirme kartı), kırtasiye, seyahat (saha çalışması için) ve hizmet alımı (analiz, 3B baskı).
2. **Yasaklı Kalemler:** Kişisel bilgisayar, cep telefonu, sabit laboratuvar demirbaşları veya genel amaçlı araçlar doğrudan hibe kapsamında karşılanamaz.
3. **Teknik Gerekçelendirme:** "1 adet Arduino alınacaktır" yazmak yerine "İP-2 kapsamındaki sıcaklık verilerinin toplanmasında kullanılmak üzere 1 adet Arduino UNO geliştirme kartı" yazılmalıdır.
4. **Piyasa Fiyat Araştırması:** En az 2-3 farklı satıcıdan ekran görüntüsü veya teklif alarak gerçekçi ortalama bir fiyat yazın.

5. Dikkat Edilmesi Gerekenler
- Bütçe toplamını destek üst limitine uydurmak için yapay ve projeyle ilgisiz malzemeler eklemeyin.
- Destek onaylandıktan sonra faturaların proje yürütücüsü adına ve tarih aralığına uygun kesilmesi gerekir.

6. Kontrol Listesi
Bütçe kalemlerinizi gözden geçirin.

7. Örnek veya Şablon
**Bütçe Tablosu Şablonu:**
| Kalem Adı | Miktar | Yaklaşık Birim Fiyat (TL) | Toplam Tutar (TL) | Gerekçe ve İlgili İş Paketi |
|---|---|---|---|---|
| ESP32-CAM Geliştirme Kartı | 2 Adet | 350 TL | 700 TL | İP-2: Görüntü yakalama ve Wi-Fi iletimi modülü için |
| Lityum Polimer Batarya (3.7V) | 2 Adet | 250 TL | 500 TL | İP-3: Saha testlerinde saha donanımının taşınabilirliği için |

8. İlgili Kaynaklar
- TÜBİTAK Harcama ve Belge Kılavuzu: https://tubitak.gov.tr

9. Son Güncelleme Tarihi
Ekim 2026""",
        "checklist_items": json.dumps([
            "Talep edilen her malzeme bir iş paketiyle eşleştirildi.",
            "Demirbaş niteliğinde (dizüstü bilgisayar, monitör vb.) yasaklı malzeme yazılmadı.",
            "Piyasa fiyat araştırması yapıldı ve makul fiyatlar yazıldı.",
            "Toplam tutar çağrı üst sınırını aşmadı."
        ], ensure_ascii=False),
        "template_example": "Örnek Bütçe Gerekçesi: 'Sistem prototipinin açık alandaki testlerinde enerji sürekliliğini sağlamak ve İP-3 doğrulamalarını yapmak için 2 adet 12V aküye ihtiyaç duyulmaktadır.'",
        "official_sources": "TÜBİTAK BİDEB İdari ve Mali Esaslar"
    },
    {
        "slug": "takim-olusturma-ve-gorev-dagilimi",
        "title": "Disiplinler Arası Takım Oluşturma ve Çevik Görev Dağılımı",
        "category": "Takım oluşturma ve görev dağılımı",
        "target_audience": "Yarışma ve Proje Takımları",
        "summary": "Mühendislik, tasarım ve yönetim rollerinin dengelenmesi ve GitHub/Trello proje yönetimi.",
        "content": """1. Bu Rehber Neyi Anlatıyor?
Başarılı projelerin ortak özelliği, yetenekleri birbirini tamamlayan dengeli bir takıma sahip olmalarıdır. Bu rehber, rol çatışmalarını önleyen görev paylaşımını açıklar.

2. Kimler İçin?
TEKNOFEST, Hackathon veya TÜBİTAK projelerinde arkadaşlarıyla takım kuran veya takım arkadaşı arayan öğrenciler.

3. Nereden Başlamalıyım?
Projenin ihtiyaç duyduğu beceri haritasını çıkarın: Yazılım, gömülü sistem, mekanik tasarım, veri analizi ve raporlama/sunum.

4. Adım Adım Süreç
1. **Rol Tanımları:** Takım Kaptanı, Teknik Lider, Test Sorumlusu ve Dokümantasyon Sorumlusu unvanlarını belirleyin.
2. **Disiplinler Arası Çeşitlilik:** Mümkünse farklı bölümlerden (örn. Bilgisayar Mühendisliği + Elektrik Elektronik + Endüstri Mühendisliği) öğrencileri bir araya getirin.
3. **İletişim ve Takip Araçları:** Görevler için Trello/Notion, kod için GitHub/GitLab, anlık iletişim için Slack/Discord kanalları oluşturun.
4. **Haftalık Senkronizasyon:** Haftada en az bir kez 30 dakikalık 'Sprint Değerlendirme' toplantısı yapın: 'Bu hafta ne yaptım?', 'Nerede takıldım?', 'Gelecek hafta ne yapacağım?'.

5. Dikkat Edilmesi Gerekenler
- Bir kişinin her şeyi yaptığı, diğerlerinin sadece adının yazıldığı 'hayalet üye' takımlar yarışma jürileri tarafından mülakatta hemen fark edilir.
- Görevler net ve kişiye atanmış olmalıdır.

6. Kontrol Listesi
Takım organizasyonunuzu kontrol edin.

7. Örnek veya Şablon
**RACI Görev Matrisi:**
- **R (Responsible - Yapan):** İşi doğrudan geliştiren kişi.
- **A (Accountable - Onaylayan):** Çıktının doğruluğundan sorumlu takım kaptanı.
- **C (Consulted - Danışılan):** Fikri sorulan akademik danışman veya uzman.
- **I (Informed - Bilgilendirilen):** Süreçten haberdar edilen takım üyeleri.

8. İlgili Kaynaklar
- AKRAN Takım Arkadaşı İlanları: /team-finder
- GitHub Öğrenci Geliştirici Paketi: https://education.github.com/pack

9. Son Güncelleme Tarihi
Ekim 2026""",
        "checklist_items": json.dumps([
            "Her üyenin yetkinlik alanına uygun görev tanımı yapıldı.",
            "Ortak GitHub deposu ve görev takip panosu kuruldu.",
            "Düzenli haftalık toplantı saati belirlendi.",
            "Akademik danışman ile iletişim takvimi oluşturuldu."
        ], ensure_ascii=False),
        "template_example": "Örnek Takım Görev Dağılımı: Kaptan (Sistem Entegrasyonu & Raporlama), Üye 1 (Görüntü İşleme Yazılımı), Üye 2 (Sensör Donanım Devresi), Üye 3 (Mobil Kullanıcı Arayüzü).",
        "official_sources": "TEKNOFEST Takım Kılavuzu"
    },
    {
        "slug": "tubitak-2209-a-2209-b-sureci",
        "title": "TÜBİTAK 2209-A ve 2209-B Adım Adım Başvuru ve Kabul Süreci",
        "category": "TÜBİTAK 2209-A / 2209-B başvuru süreci",
        "target_audience": "Ön Lisans ve Lisans Üniversite Öğrencileri",
        "summary": "TYBS sistemi üzerinden başvuru adımları, danışman onayı ve rektörlük e-imza süreci.",
        "content": """1. Bu Rehber Neyi Anlatıyor?
2209 programları, Türkiye'deki üniversite öğrencilerinin en çok başvurduğu araştırma hibeleridir. Bu rehber, başvuru ekranlarının doldurulmasından rektörlük e-imzasına kadar bürokratik süreci aydınlatır.

2. Kimler İçin?
2026 dönemi 2209-A veya 2209-B çağrısına başvuracak olan tüm öğrenciler.

3. Nereden Başlamalıyım?
TÜBİTAK ARBİS (Araştırmacı Bilgi Sistemi) kaydınızı yapın ve profil bilgilerinizi güncelleyin. Danışman hocanızın da ARBİS kaydı bulunmalıdır.

4. Adım Adım Süreç
1. **TYBS Girişi:** https://tybs.tubitak.gov.tr adresine e-Devlet şifrenizle giriş yapın.
2. **Aktif Çağrı Seçimi:** BİDEB başlığı altından '2209-A' veya '2209-B' çağrısını seçin.
3. **Proje Bilgilerinin Girilmesi:** Proje başlığı, özeti, anahtar kelimeleri ve bütçe tutarını sisteme girin.
4. **Proje Öneri Formunun Yüklenmesi:** Resmi form şablonunu PDF formatına dönüştürüp sisteme yükleyin.
5. **Akademik Danışman Onayı:** Sistemden danışman hocanıza onay isteği gönderin; hocanız kendi sistemi üzerinden projeyi onaylamalıdır.
6. **Başvuru Onayı:** Başvuruyu tamamla butonuna basarak başvuru taslağından nihai başvuru durumuna geçin.
7. **Kuruluş Yetkilisi E-İmzası:** Başvuru kapandıktan sonra üniversitenizin rektörlüğü veya TTO yetkilisi tüm projeleri toplu olarak e-imza ile onaylar (Öğrencinin e-imza almasına gerek yoktur).

5. Dikkat Edilmesi Gerekenler
- Başvuruyu son güne bırakmayın; son saatlerde TYBS sisteminde yoğunluk yaşanabilmektedir.
- 2209-B için sanayi kuruluşundan alınmış ıslak imzalı veya e-imzalı taahhütname belgesi zorunludur.

6. Kontrol Listesi
Başvuru adımlarını eksiksiz tamamlayın.

7. Örnek veya Şablon
**Başvuru Öncesi Belge Kontrolü:**
- Güncel Öğrenci Belgesi (e-Devlet'ten alınmış barkodlu)
- Bölüm Onay Formu / Danışman Kabul Beyanı
- Sanayi Ortaklığı Yazısı (Yalnızca 2209-B için)

8. İlgili Kaynaklar
- TÜBİTAK TYBS Portalı: https://tybs.tubitak.gov.tr
- TÜBİTAK 2209-A Resmi Sayfası: https://tubitak.gov.tr/tr/burslar/lisans-onlisans/destek-programlari/2209-universite-ogrencileri-arastirma-projeleri-destekleme-programi

9. Son Güncelleme Tarihi
Ekim 2026""",
        "checklist_items": json.dumps([
            "Yürütücü ve tüm takım üyelerinin ARBİS kayıtları tamamlandı.",
            "Proje öneri formu PDF olarak TYBS sistemine yüklendi.",
            "Danışman hoca sistem üzerinden projeyi onayladı.",
            "Başvuru onay belgesi indirildi ve üniversite TTO birimi bilgilendirildi."
        ], ensure_ascii=False),
        "template_example": "Örnek Sistem Bilgisi: Başvuru No: 1919B012600123 | Program: 2209-A | Durum: Danışman Onayında.",
        "official_sources": "TÜBİTAK BİDEB Resmi Çağrı Duyurusu"
    },
    {
        "slug": "teknofest-ve-ogrenci-yarismalarina-hazirlik",
        "title": "TEKNOFEST ve Üniversite Yarışmalarında Başarı Stratejisi",
        "category": "TEKNOFEST ve öğrenci yarışmalarına hazırlık",
        "target_audience": "Yarışma Takımları ve Teknoloji Kulüpleri",
        "summary": "Ön Değerlendirme Raporu (ÖDR) ve Kritik Tasarım Raporu (KTR) hazırlama rehberi.",
        "content": """1. Bu Rehber Neyi Anlatıyor?
TEKNOFEST gibi büyük yarışmalarda teknik yetkinlik kadar raporlama disiplini ve şartnameye %100 sadakat belirleyicidir. Bu rehber, elenmeden finale kalmanın kurallarını anlatır.

2. Kimler İçin?
TEKNOFEST yarışmalarına katılan üniversite takımları.

3. Nereden Başlamalıyım?
Katılacağınız yarışmanın teknik şartnamesini baştan sona en az üç kez okuyun. Şartnamenin sonundaki 'Puanlama Tablosu'nu duvarınıza asın.

4. Adım Adım Süreç
1. **Şartname Analiz Matrisi:** Şartnamede istenen her bir teknik ister için takımınızın çözümünü eşleştirin.
2. **Ön Değerlendirme Raporu (ÖDR):** Fikrin özgünlüğünü ve temel mimarisini anlatan ilk raporu şablona birebir uyarak hazırlayın.
3. **Kritik Tasarım Raporu (KTR):** Matematiksel hesaplamaları, devre şemalarını, simülasyon sonuçlarını ve prototip testlerini içeren detaylı raporu oluşturun.
4. **Test ve Kanıt Videoları:** İstenen süre ve çözünürlük standartlarına uygun, kurgusuz ve net çalışma kanıt videoları çekin.
5. **Final Sunumu Hazırlığı:** Jürinin karşısında 5-7 dakikalık net ve profesyonel slayt sunumu pratiği yapın.

5. Dikkat Edilmesi Gerekenler
- Şartnamedeki sayfa sınırı veya yazı tipi boyutuna uymayan raporlar doğrudan elenir.
- Sunumlarda teorik bilgiler yerine geliştirdiğiniz özgün prototipin canlı performansını ve aldığınız metrikleri gösterin.

6. Kontrol Listesi
Rapor tesliminden önce kontrol edin.

7. Örnek veya Şablon
**KTR Rapor Başlıkları:**
1. Proje Özeti ve Sistem Mimarisi
2. Mekanik / Donanım Tasarımı ve Dayanım Analizleri
3. Yazılım Mimarisi ve Algoritma Akış Şeması
4. Güvenlik ve Hata Önleme Mekanizmaları
5. Test Sonuçları ve Başarım Metrikleri

8. İlgili Kaynaklar
- TEKNOFEST Resmi Web Sitesi: https://teknofest.org
- T3 KYS Başvuru Sistemi: https://www.t3kys.com

9. Son Güncelleme Tarihi
Ekim 2026""",
        "checklist_items": json.dumps([
            "Yarışma şartnamesi ve puanlama kriterleri satır satır analiz edildi.",
            "Rapor şablonundaki biçimsel kurallara (font, sayfa sınırı) harfiyen uyuldu.",
            "Simülasyon veya prototip test verileri grafiklerle desteklendi.",
            "Sistem çalışma kanıt videosu YouTube/Drive üzerinden paylaşıldı."
        ], ensure_ascii=False),
        "template_example": "Örnek Jüri Sunum Akışı: Slayt 1 (Problem), Slayt 2 (Çözümümüz), Slayt 3 (Teknik Mimari), Slayt 4 (Test Verileri & Rakiplerle Karşılaştırma), Slayt 5 (Takım & İletişim).",
        "official_sources": "TEKNOFEST Yarışma Komitesi Kılavuzları"
    },
    {
        "slug": "proje-sunumu-ve-raporlama",
        "title": "Akademik Proje Sonuç Raporu Yazımı ve Jüri Sunum Teknikleri",
        "category": "Proje sunumu, raporlama ve sonuçların paylaşılması",
        "target_audience": "Proje Tamamlayan ve Savunmaya Hazırlanan Öğrenciler",
        "summary": "Sonuç raporu hazırlama, harcama belgelerinin kapatılması ve etkili akademik sunum.",
        "content": """1. Bu Rehber Neyi Anlatıyor?
Bir projenin tamamlanması, elde edilen bulguların akademik dünyaya ve topluma doğru aktarılmasıyla mümkündür. Bu rehber, TÜBİTAK sonuç raporunu yazmayı ve jüri önünde başarılı bir savunma yapmayı kapsar.

2. Kimler İçin?
TÜBİTAK 2209 projesini bitiren, bitirme tezi savunmasına girecek veya yarışma finalinde jüri karşısına çıkacak öğrenciler.

3. Nereden Başlamalıyım?
Proje süresince tuttuğunuz laboratuvar notlarını, test loglarını ve görsel kayıtları kronolojik sıraya dizin.

4. Adım Adım Süreç
1. **Sonuç Raporunun Hazırlanması:** Önerilen hedeflerle ulaşılan sonuçları karşılaştırın. Hedefe ulaşılamayan kısımlar varsa nedenlerini dürüstçe bilimsel gerekçelerle açıklayın.
2. **Yaygın Etki ve Çıktılar:** Projeden üretilen makale, bildiri, açık kaynak yazılım deposu veya patent başvurusu gibi somut çıktıları listeleyin.
3. **Mali Kapanış:** Faturaları, banka dekontlarını ve harcama pusulalarını bütçe tablosuna uygun şekilde dosyalayın.
4. **Poster / Slayt Tasarımı:** Çok fazla yazı yerine infografikler, yüksek çözünürlüklü fotoğraflar ve karşılaştırma grafikleri kullanın.
5. **Soru-Cevap Pratiği:** Jürinin sorabileceği en zor 10 teknik soruyu önceden belirleyip cevaplarını çalışın.

5. Dikkat Edilmesi Gerekenler
- Negatif veya beklenmeyen sonuçlar da bilimsel açıdan değerlidir; sonuçları saklamayın veya manipüle etmeyin.
- Sunum süresine riayet edin; 10 dakikalık sunumu 15 dakikaya uzatmak puan kaybettirir.

6. Kontrol Listesi
Proje kapanış sürecinizi kontrol edin.

7. Örnek veya Şablon
**Sonuç Raporu Çıktı Tablosu Şablonu:**
- **Planlanan Başarı Kriteri:** [%90 doğruluk] -> **Ulaşılan Sonuç:** [%93.4 doğruluk]
- **Planlanan Gecikme:** [< 150 ms] -> **Ulaşılan Sonuç:** [120 ms]
- **Üretilen Akademik Çıktı:** [SIU 2026 Konferansı Bildiri Taslağı]

8. İlgili Kaynaklar
- TÜBİTAK Proje Kapanış Esasları: https://tubitak.gov.tr

9. Son Güncelleme Tarihi
Ekim 2026""",
        "checklist_items": json.dumps([
            "Nihai sonuç raporu kurum şablonuna göre yazıldı.",
            "Tüm faturalar ve mali belgeler düzenlendi.",
            "Akademik çıktı (makale, bildiri veya açık kaynak repo) belgelendi.",
            "Savunma sunumu prova edildi ve süreye uyum sağlandı."
        ], ensure_ascii=False),
        "template_example": "Örnek Çıktı Beyanı: 'Proje kapsamında geliştirilen hafifletilmiş derin öğrenme modeli ve etiketli 1.200 adetlik veri seti, açık bilim ilkeleri doğrultusunda GitHub ve HuggingFace üzerinde kamuya açılmıştır.'",
        "official_sources": "TÜBİTAK BİDEB Sonuç Raporu Esasları"
    }
]

# Calculate real read times based on word count
for g in ACADEMIC_GUIDES:
    words = len(re.findall(r'\w+', g["content"]))
    g["read_time_minutes"] = max(3, (words // 160) + 1)
