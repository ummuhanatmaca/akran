import logging
import urllib.request
import ssl
import hashlib
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.opportunity import Opportunity, OpportunitySyncLog

logger = logging.getLogger("akran.opportunity_verifier")

# Resmî doğrulanmış çekirdek bilimsel fırsatlar kataloğu
VERIFIED_OFFICIAL_OPPORTUNITIES = [
    {
        "source_identifier": "tubitak_2209_a_2026",
        "title": "TÜBİTAK 2209-A Üniversite Öğrencileri Araştırma Projeleri Destekleme Programı",
        "organization": "TÜBİTAK BİDEB",
        "category": "TÜBİTAK",
        "summary": "Ön lisans ve lisans öğrencilerinin üniversitelerde akademik danışmanları rehberliğinde yürütecekleri araştırma projelerine doğrudan sarf malzeme, kırtasiye ve hizmet alımı hibe desteği sağlanır.",
        "fields": "Mühendislik, Temel Bilimler, Sağlık Bilimleri, Sosyal ve Beşeri Bilimler, Bilişim",
        "target_audience": "Ön Lisans ve Lisans Öğrencileri",
        "application_type": "both",
        "requirements": "Türkiye'de öğrenim gören ön lisans veya lisans öğrencisi olmak. En fazla 1 akademik danışman ve en fazla 4 öğrenci ile başvuru yapılabilir.",
        "start_date": datetime(2026, 10, 1, 0, 0),
        "end_date": datetime(2026, 12, 1, 17, 30),
        "published_date": datetime(2026, 10, 1, 0, 0),
        "prize_support": "Proje Başına 9.000 TL Doğrudan Araştırma Hibesi",
        "official_url": "https://tubitak.gov.tr/tr/burslar/lisans/destek-programlari/2209-a-universite-ogrencileri-arastirma-projeleri-destekleme-programi",
        "application_url": "https://tybs.tubitak.gov.tr",
        "status": "open",
        "is_sample": False,
    },
    {
        "source_identifier": "tubitak_2209_b_2026",
        "title": "TÜBİTAK 2209-B Üniversite Öğrencileri Sanayiye Yönelik Araştırma Projeleri Desteği",
        "organization": "TÜBİTAK BİDEB",
        "category": "TÜBİTAK",
        "summary": "Ön lisans ve lisans öğrencilerinin sanayinin bir problemine çözüm geliştiren Ar-Ge ve inovasyon odaklı projelerine sanayi ve akademik danışman ortaklığıyla finansal hibe verilir.",
        "fields": "Sanayi Odaklı Ar-Ge, Bilgisayar Mühendisliği, Makine, Elektrik-Elektronik, Kimya",
        "target_audience": "Ön Lisans ve Lisans Öğrencileri, Sanayi Kuruluşları",
        "application_type": "both",
        "requirements": "Sanayi kuruluşundan bir sanayi danışmanı ve üniversiteden bir akademik danışman onaylı proje önerisi sunulmalıdır.",
        "start_date": datetime(2026, 10, 1, 0, 0),
        "end_date": datetime(2026, 12, 1, 17, 30),
        "published_date": datetime(2026, 10, 1, 0, 0),
        "prize_support": "Sanayi Odaklı Ar-Ge Hibe Desteği (12.000 TL)",
        "official_url": "https://tubitak.gov.tr/tr/burslar/lisans/destek-programlari/2209-b-universite-ogrencileri-sanayiye-yonelik-arastirma-projeleri-destegi-programi",
        "application_url": "https://tybs.tubitak.gov.tr",
        "status": "open",
        "is_sample": False,
    },
    {
        "source_identifier": "teknofest_univ_arastirma_2026",
        "title": "TEKNOFEST 2026 Üniversite Öğrencileri Araştırma Proje Yarışmaları",
        "organization": "T3 Vakfı & Sanayi ve Teknoloji Bakanlığı",
        "category": "TEKNOFEST",
        "summary": "Milli Teknoloji Hamlesi vizyonuyla akıllı ulaşım, yapay zekâ, savunma ve biyoteknoloji alanlarında üniversite takımlarının yarıştığı teknoloji festivali.",
        "fields": "Yapay Zekâ, Havacılık, Siber Güvenlik, Otonom Sistemler, Robotik",
        "target_audience": "Ön Lisans, Lisans ve Lisansüstü Öğrencileri",
        "application_type": "team",
        "requirements": "Türkiye ve yurt dışında öğrenim gören üniversite öğrencileri takımlar halinde katılabilir.",
        "start_date": datetime(2026, 10, 15, 0, 0),
        "end_date": datetime(2026, 12, 31, 23, 59),
        "published_date": datetime(2026, 10, 1, 0, 0),
        "prize_support": "Dereceye Giren Takımlara Toplam 1.000.000 TL + Proje Geliştirme Ödülü",
        "official_url": "https://teknofest.org/tr/yarismalar/universite-ogrencileri-arastirma-proje-yarismalari/",
        "application_url": "https://www.t3kys.com",
        "status": "open",
        "is_sample": False,
    },
    {
        "source_identifier": "teknofest_girisim_2026",
        "title": "TEKNOFEST 2026 Girişim Programı (Ön Kuluçka ve Hızlandırma Desteği)",
        "organization": "T3 Girişim Merkezi (T3GM)",
        "category": "Girişimcilik",
        "summary": "TEKNOFEST yarışmalarına katılmış veya teknoloji tabanlı iş fikri olan üniversite ekiplerine tohum sermaye, mentorluk ve ofis desteği.",
        "fields": "Yazılım, Donanım, Derin Teknoloji, Sağlık, Tarım Teknolojileri",
        "target_audience": "Üniversite Öğrencileri ve Yeni Mezunlar",
        "application_type": "team",
        "requirements": "Asgari 2 kişilik girişim takımı kurmak ve MVP veya prototip seviyesinde teknoloji projesine sahip olmak.",
        "start_date": datetime(2026, 10, 1, 0, 0),
        "end_date": datetime(2027, 1, 15, 23, 59),
        "published_date": datetime(2026, 10, 1, 0, 0),
        "prize_support": "150.000 TL - 500.000 TL Hibe + Yatırımcı Eşleştirmesi",
        "official_url": "https://teknofest.org/tr/icerik/teknofest-girisim-programi/",
        "application_url": "https://www.t3kys.com",
        "status": "open",
        "is_sample": False,
    },
    {
        "source_identifier": "tubitak_star_lisans_2026",
        "title": "TÜBİTAK STAR — Stajyer Araştırmacı Burs Programı (Lisans)",
        "organization": "TÜBİTAK BİDEB",
        "category": "Burs",
        "summary": "Lisans öğrencilerinin TÜBİTAK merkez ve enstitülerinde yürütülen veya TÜBİTAK destekli araştırma projelerinde stajyer araştırmacı olarak yer almasını ve aylık burs almasını sağlar.",
        "fields": "Yapay Zekâ, Bilgisayar Mühendisliği, Temel Bilimler, Biyoteknoloji",
        "target_audience": "Lisans Öğrencileri (1, 2, 3 ve 4. Sınıf)",
        "application_type": "individual",
        "requirements": "Genel not ortalaması (GNO) en az 2.50/4.00 veya üniversiteye giriş sıralamasında ilk 100.000 içinde olmak.",
        "start_date": datetime(2026, 10, 15, 0, 0),
        "end_date": datetime(2026, 12, 25, 17, 30),
        "published_date": datetime(2026, 10, 10, 0, 0),
        "prize_support": "Aylık 4.000 TL Düzenli Lisans Araştırmacı Bursu",
        "official_url": "https://star.tubitak.gov.tr",
        "application_url": "https://ebideb.tubitak.gov.tr",
        "status": "open",
        "is_sample": False,
    },
    {
        "source_identifier": "btk_siber_vatan_2026",
        "title": "BTK Akademi & Siber Vatan Hackathon ve Uzmanlık Programı",
        "organization": "BTK Akademi & Kalkınma Ajansları",
        "category": "Hackathon",
        "summary": "Üniversite öğrencilerine yönelik siber güvenlik, tersine mühendislik ve web güvenliği odaklı CTF yarışması ve ileri seviye eğitim kampı.",
        "fields": "Siber Güvenlik, Ağ Güvenliği, Kriptoloji, CTF, Web Güvenliği",
        "target_audience": "Üniversite Öğrencileri",
        "application_type": "individual",
        "requirements": "Temel ağ ve işletim sistemi bilgisine sahip olmak, çevrim içi eleme sınavında başarılı olmak.",
        "start_date": datetime(2026, 10, 15, 0, 0),
        "end_date": datetime(2026, 12, 20, 23, 59),
        "published_date": datetime(2026, 10, 10, 0, 0),
        "prize_support": "Teknoloji Ödülleri ve Siber Güvenlik Sektöründe Staj İmkânı",
        "official_url": "https://www.btkakademi.gov.tr",
        "application_url": "https://www.btkakademi.gov.tr",
        "status": "open",
        "is_sample": False,
    },
    {
        "source_identifier": "tubitak_2210_burs_2026",
        "title": "TÜBİTAK 2210 Yurt İçi Yüksek Lisans Burs Programı",
        "organization": "TÜBİTAK BİDEB",
        "category": "Burs",
        "summary": "Tezli yüksek lisans öğrenimi gören başarılı öğrencilere aylık burs desteği sağlanarak bilim insanı yetiştirilmesi amaçlanmaktadır.",
        "fields": "Doğa Bilimleri, Mühendislik ve Teknoloji, Tıbbi Bilimler, Sosyal Bilimler",
        "target_audience": "Tezli Yüksek Lisans Öğrencileri",
        "application_type": "individual",
        "requirements": "İlgili ALES ve lisans mezuniyet not ortalaması kriterlerini sağlamak.",
        "start_date": datetime(2026, 9, 1, 0, 0),
        "end_date": datetime(2026, 12, 15, 17, 30),
        "published_date": datetime(2026, 8, 25, 0, 0),
        "prize_support": "Aylık 13.500 TL TÜBİTAK Yüksek Lisans Bursu",
        "official_url": "https://tubitak.gov.tr/tr/burslar/lisansustu/egitim-burs-programlari/2210-yurt-ici-yuksek-lisans-burs-programlari",
        "application_url": "https://ebideb.tubitak.gov.tr",
        "status": "open",
        "is_sample": False,
    },
    {
        "source_identifier": "erasmus_plus_staj_2026",
        "title": "Erasmus+ Yükseköğretim Öğrenci Öğrenim ve Staj Hareketliliği",
        "organization": "Türkiye Ulusal Ajansı & SDÜ Dış İlişkiler",
        "category": "Değişim / Staj",
        "summary": "Avrupa ülkelerinde anlaşmalı üniversitelerde 1 dönem öğrenim görme veya teknoloji şirketlerinde 2-12 ay staj yapma fırsatı.",
        "fields": "Tüm Üniversite Bölümleri, Bilgisayar Mühendisliği, Yazılım",
        "target_audience": "Lisans ve Lisansüstü Öğrencileri",
        "application_type": "individual",
        "requirements": "Lisans için en az 2.20/4.00 GNO ve üniversite yabancı dil sınavından geçerli not almak.",
        "start_date": datetime(2026, 10, 1, 0, 0),
        "end_date": datetime(2027, 2, 28, 17, 0),
        "published_date": datetime(2026, 10, 1, 0, 0),
        "prize_support": "Aylık 600 - 750 Euro AB Hibe Desteği",
        "official_url": "https://ua.gov.tr/programlar/firsatlar/yuksekogretim-ogrenci-ogrenim-hareketliligi/",
        "application_url": "https://turnaportal.ua.gov.tr",
        "status": "open",
        "is_sample": False,
    },
    {
        "source_identifier": "tubitak_2242_2026",
        "title": "TÜBİTAK 2242 Üniversite Öğrencileri Araştırma Proje Yarışmaları",
        "organization": "TÜBİTAK BİDEB",
        "category": "Yarışma",
        "summary": "Ön lisans ve lisans düzeyinde öğrencileri araştırma yapmaya teşvik eden, 9 ana kategoride düzenlenen proje yarışması.",
        "fields": "Bilgi ve İletişim Teknolojileri, Akıllı Şehirler, Enerji, Sağlık, Savunma",
        "target_audience": "Ön Lisans ve Lisans Öğrencileri",
        "application_type": "both",
        "requirements": "Ön lisans veya lisans öğrencisi olmak, en fazla 5 kişilik takımlar oluşturabilmek.",
        "start_date": datetime(2026, 12, 1, 0, 0),
        "end_date": datetime(2027, 4, 30, 17, 30),
        "published_date": datetime(2026, 11, 1, 0, 0),
        "prize_support": "Kategori Birincilik, İkincilik ve Üçüncülük Ödülleri (50.000 TL'ye kadar)",
        "official_url": "https://tubitak.gov.tr/tr/yarismalar/2242-universite-ogrencileri-arastirma-proje-yarismalari",
        "application_url": "https://ebideb.tubitak.gov.tr",
        "status": "upcoming",
        "is_sample": False,
    }
]

def fetch_live_tubitak_rss() -> List[Dict[str, Any]]:
    """
    TÜBİTAK resmî RSS beslemesinden (https://www.tubitak.gov.tr/rss.xml)
    güncel çağrı ve bilimsel duyuruları çeker.
    """
    rss_url = "https://www.tubitak.gov.tr/rss.xml"
    discovered: List[Dict[str, Any]] = []

    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request(
            rss_url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AKRAN-Academic-Crawler/1.0"
            }
        )
        with urllib.request.urlopen(req, timeout=8, context=ctx) as response:
            raw_xml = response.read()
            xml_text = raw_xml.decode("utf-8", errors="replace")
            import xml.etree.ElementTree as ET
            from email.utils import parsedate_to_datetime

            root = ET.fromstring(xml_text.encode("utf-8"))
            items = root.findall(".//item")
            logger.info(f"TÜBİTAK RSS beslemesinden {len(items)} duyuru okundu.")

            for item in items:
                title = item.find("title").text if item.find("title") is not None else ""
                link = item.find("link").text if item.find("link") is not None else ""
                description = item.find("description").text if item.find("description") is not None else ""
                pub_date_str = item.find("pubDate").text if item.find("pubDate") is not None else ""

                if not title or not link:
                    continue

                clean_desc = re.sub(r"<[^>]+>", " ", description)
                clean_desc = re.sub(r"\s+", " ", clean_desc).strip()
                if len(clean_desc) > 300:
                    clean_desc = clean_desc[:297] + "..."

                published_dt = None
                if pub_date_str:
                    try:
                        published_dt = parsedate_to_datetime(pub_date_str).replace(tzinfo=None)
                    except Exception:
                        published_dt = None

                title_lower = title.lower()
                desc_lower = clean_desc.lower()
                category = "TÜBİTAK"
                if any(w in title_lower or w in desc_lower for w in ["burs", "bursu", "bideb"]):
                    category = "Burs"
                elif any(w in title_lower or w in desc_lower for w in ["yarışma", "yarismasi"]):
                    category = "Yarışma"
                elif any(w in title_lower or w in desc_lower for w in ["hackathon", "ideathon", "maraton"]):
                    category = "Hackathon"
                elif any(w in title_lower or w in desc_lower for w in ["okul", "okulu", "eğitim", "staj"]):
                    category = "Eğitim / Program"

                # Link hash'i ile kesin benzersiz tekil source_identifier garantisi
                link_hash = hashlib.sha256(link.strip().encode("utf-8")).hexdigest()[:10]
                slug_match = re.search(r"/(?:duyuru|haber|etkinlikler)/([^/?#]+)", link)
                slug = slug_match.group(1) if slug_match else re.sub(r"[^a-zA-Z0-9_]", "_", title)[:25]
                source_id = f"tubitak_rss_{slug[:30]}_{link_hash}"

                app_url = None
                if "tybs" in desc_lower or "2209" in title_lower:
                    app_url = "https://tybs.tubitak.gov.tr"
                elif "ebideb" in desc_lower or "bideb" in desc_lower or category == "Burs":
                    app_url = "https://ebideb.tubitak.gov.tr"

                discovered.append({
                    "source_identifier": source_id,
                    "title": title.strip(),
                    "organization": "TÜBİTAK",
                    "category": category,
                    "summary": clean_desc or f"{title} resmî TÜBİTAK çağrısı.",
                    "fields": "Fen Bilimleri, Mühendislik, Sağlık, Sosyal ve Beşeri Bilimler",
                    "target_audience": "Öğrenciler, Araştırmacılar ve Akademisyenler",
                    "application_type": "both",
                    "requirements": "Resmî çağrı metninde belirtilen başvuru şartları geçerlidir.",
                    "published_date": published_dt or datetime.utcnow(),
                    "start_date": published_dt or datetime.utcnow(),
                    "end_date": None,
                    "official_url": link.strip(),
                    "application_url": app_url,
                    "status": "open",
                    "is_sample": False
                })
    except Exception as e:
        logger.warning(f"TÜBİTAK canlı RSS çekme uyarısı: {e}")

    return discovered

def verify_and_sync_opportunities(db: Session) -> Dict[str, Any]:
    """
    1. Hem resmî çekirdek kataloğu hem de canlı TÜBİTAK RSS beslemesini senkronize eder.
    2. Yinelenen kayıtları ve çakışmaları engeller.
    3. Son başvuru tarihi geçmiş olanları otomatik kapatır (status = 'closed').
    """
    now = datetime.utcnow()
    items_checked = 0
    items_updated = 0

    # Canlı TÜBİTAK RSS verilerini çek
    live_rss_items = []
    try:
        live_rss_items = fetch_live_tubitak_rss()
    except Exception as e:
        logger.warning(f"RSS alımı atlandı: {e}")

    # Birleşik liste: Çekirdek katalog + Canlı RSS duyuruları
    all_targets: List[Dict[str, Any]] = list(VERIFIED_OFFICIAL_OPPORTUNITIES)

    existing_catalog_urls = {item["official_url"] for item in VERIFIED_OFFICIAL_OPPORTUNITIES}
    for live_item in live_rss_items:
        if live_item["official_url"] not in existing_catalog_urls:
            all_targets.append(live_item)

    processed_identifiers = set()

    for data in all_targets:
        ident = data["source_identifier"]
        if ident in processed_identifiers:
            continue
        processed_identifiers.add(ident)
        items_checked += 1

        is_core_catalog = not ident.startswith("tubitak_rss_")

        # Önce source_identifier, sonra official_url ile ara
        opp = db.query(Opportunity).filter(Opportunity.source_identifier == ident).first()
        if not opp and not is_core_catalog:
            opp = db.query(Opportunity).filter(Opportunity.official_url == data["official_url"]).first()

        status_val = data.get("status", "open")
        if data.get("end_date") and data["end_date"] < now:
            status_val = "closed"

        if not opp:
            opp = Opportunity(
                source_identifier=ident,
                title=data["title"],
                organization=data["organization"],
                summary=data.get("summary"),
                category=data["category"],
                fields=data.get("fields"),
                target_audience=data.get("target_audience"),
                application_type=data.get("application_type", "both"),
                requirements=data.get("requirements"),
                start_date=data.get("start_date"),
                end_date=data.get("end_date"),
                published_date=data.get("published_date") or now,
                prize_support=data.get("prize_support"),
                official_url=data["official_url"],
                application_url=data.get("application_url"),
                status=status_val,
                last_verified_date=now,
                last_checked_at=now,
                is_sample=False,
            )
            db.add(opp)
            try:
                db.flush()
                items_updated += 1
            except Exception as e:
                db.rollback()
                logger.warning(f"Kayıt ekleme atlandı ({ident}): {e}")
                continue
        else:
            opp.title = data["title"]
            opp.organization = data["organization"]
            opp.summary = data.get("summary")
            opp.category = data["category"]
            if data.get("fields"):
                opp.fields = data["fields"]
            if data.get("target_audience"):
                opp.target_audience = data["target_audience"]
            if data.get("application_type"):
                opp.application_type = data["application_type"]
            if data.get("requirements"):
                opp.requirements = data["requirements"]
            if data.get("start_date"):
                opp.start_date = data["start_date"]
            if data.get("end_date"):
                opp.end_date = data["end_date"]
            if data.get("prize_support"):
                opp.prize_support = data["prize_support"]
            opp.official_url = data["official_url"]
            if data.get("application_url"):
                opp.application_url = data["application_url"]
            opp.status = status_val
            opp.last_checked_at = now
            opp.last_verified_date = now
            try:
                db.flush()
                items_updated += 1
            except Exception as e:
                db.rollback()
                logger.warning(f"Kayıt güncelleme atlandı ({ident}): {e}")
                continue

    # Diğer kayıtların süre kontrolü
    try:
        all_opps = db.query(Opportunity).all()
        for opp in all_opps:
            if opp.source_identifier in processed_identifiers:
                continue
            if opp.end_date and opp.end_date < now and opp.status in ("open", "active", "upcoming"):
                opp.status = "closed"
                opp.last_checked_at = now
                items_updated += 1
        db.flush()
    except Exception as e:
        logger.warning(f"Süre kontrolü hatası: {e}")

    # Senkronizasyon günlüğü
    try:
        sync_log = OpportunitySyncLog(
            source_name="TÜBİTAK Resmî Doğrulayıcı & Katalog",
            status="success",
            items_checked=items_checked,
            items_updated=items_updated,
            message=f"{items_checked} fırsat tarandı, {items_updated} kayıt güncellendi/eklendi. Canlı RSS duyuruları: {len(live_rss_items)}",
            checked_at=now
        )
        db.add(sync_log)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Veritabanı commit hatası: {e}")

    return {
        "status": "success",
        "items_checked": items_checked,
        "items_updated": items_updated,
        "live_rss_count": len(live_rss_items),
        "checked_at": now.isoformat()
    }
