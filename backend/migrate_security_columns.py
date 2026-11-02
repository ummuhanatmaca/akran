import os
import shutil
from sqlalchemy import text
from app.core.database import engine

def migrate():
    print("Veritabanı sütunları kontrol ediliyor...")
    with engine.connect() as conn:
        cols = [row[1] for row in conn.execute(text("PRAGMA table_info(study_materials)")).fetchall()]
        print("Mevcut sütunlar:", cols)
        if "sha256_hash" not in cols:
            conn.execute(text("ALTER TABLE study_materials ADD COLUMN sha256_hash VARCHAR(64)"))
            print("-> sha256_hash eklendi")
        if "scan_status" not in cols:
            conn.execute(text("ALTER TABLE study_materials ADD COLUMN scan_status VARCHAR(30) DEFAULT 'clean' NOT NULL"))
            print("-> scan_status eklendi")
        if "security_note" not in cols:
            conn.execute(text("ALTER TABLE study_materials ADD COLUMN security_note VARCHAR(255)"))
            print("-> security_note eklendi")
        conn.commit()

    root_db = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "akran.db"))
    backend_db = os.path.abspath(os.path.join(os.path.dirname(__file__), "akran.db"))
    if os.path.exists(backend_db) and os.path.exists(root_db):
        shutil.copy2(backend_db, root_db)
    print("Güvenlik sütunları başarıyla güncellendi!")

if __name__ == "__main__":
    migrate()
