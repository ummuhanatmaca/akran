import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.opportunity import Opportunity, GuideArticle, OpportunitySyncLog
from app.services.opportunity_verifier import verify_and_sync_opportunities

client = TestClient(app)

def test_official_opportunities_verification_and_sync():
    """Verify that verify_and_sync_opportunities syncs official opportunities without errors."""
    db = SessionLocal()
    try:
        result = verify_and_sync_opportunities(db)
        assert result["status"] in ("success", "warning")
        assert result["items_checked"] >= 6
        
        # Check logs created
        log = db.query(OpportunitySyncLog).order_by(OpportunitySyncLog.checked_at.desc()).first()
        assert log is not None
        assert "fırsat kontrol edildi" in log.message
        
        # Verify 2209-A exists with official URL and application URL
        opp = db.query(Opportunity).filter(Opportunity.source_identifier == "tubitak_2209_a_2026").first()
        assert opp is not None
        assert "TÜBİTAK 2209-A" in opp.title
        assert "tubitak.gov.tr" in opp.official_url
        assert opp.application_url == "https://tybs.tubitak.gov.tr"
        assert opp.status in ("open", "active")
    finally:
        db.close()

def test_opportunities_sorting_and_filtering():
    """Test deadline_approaching, open_first, and category filtering."""
    # Test open_first
    res = client.get("/api/opportunities?sort_by=open_first")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    # First item should be open or upcoming
    assert data[0]["status"] in ("open", "upcoming")

    # Test category filter
    res_tubitak = client.get("/api/opportunities?category=TÜBİTAK")
    assert res_tubitak.status_code == 200
    for item in res_tubitak.json():
        assert item["category"] == "TÜBİTAK"

    # Test status filter
    res_closed = client.get("/api/opportunities?status_filter=closed")
    assert res_closed.status_code == 200
    for item in res_closed.json():
        assert item["status"] in ("closed", "expired")

def test_guide_articles_rich_content_and_categories():
    """Test that all 10 guide categories are accessible with target audience and checklists."""
    res = client.get("/api/opportunities/guides")
    assert res.status_code == 200
    guides = res.json()
    assert len(guides) >= 10

    categories = {g["category"] for g in guides}
    assert "Proje fikri geliştirme" in categories
    assert "Bilimsel araştırma ve literatür taraması" in categories
    assert "TÜBİTAK 2209-A / 2209-B başvuru süreci" in categories
    assert "TEKNOFEST ve öğrenci yarışmalarına hazırlık" in categories

    # Test detail by slug
    detail_res = client.get("/api/opportunities/guides/proje-fikri-gelistirme")
    assert detail_res.status_code == 200
    guide = detail_res.json()
    assert "1. Bu Rehber Neyi Anlatıyor?" in guide["content"]
    assert guide["checklist_items"] is not None
    assert guide["read_time_minutes"] > 0
