from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

is_sqlite = db_url.startswith("sqlite")
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def ensure_database_schema(eng):
    """Hem SQLite hem PostgreSQL için eksik sütunları güvenli şekilde ekler."""
    try:
        inspector = inspect(eng)
        table_names = inspector.get_table_names()
        dialect = eng.dialect.name

        with eng.connect() as conn:
            # 1. study_materials tablosu kontrolü
            if "study_materials" in table_names:
                mat_cols = {c["name"] for c in inspector.get_columns("study_materials")}
                if "sha256_hash" not in mat_cols:
                    conn.execute(text("ALTER TABLE study_materials ADD COLUMN sha256_hash VARCHAR(64)"))
                if "scan_status" not in mat_cols:
                    conn.execute(text("ALTER TABLE study_materials ADD COLUMN scan_status VARCHAR(30) DEFAULT 'clean' NOT NULL"))
                if "security_note" not in mat_cols:
                    conn.execute(text("ALTER TABLE study_materials ADD COLUMN security_note VARCHAR(255)"))
                if "file_data" not in mat_cols:
                    blob_type = "BYTEA" if dialect == "postgresql" else "BLOB"
                    conn.execute(text(f"ALTER TABLE study_materials ADD COLUMN file_data {blob_type}"))
                conn.commit()

                # Otomatik Onarım: Eğer eski kayıtlarda file_data boş ise geçerli PDF ile doldur
                try:
                    from app.services.pdf_generator import build_student_note_pdf
                    rows = conn.execute(text("SELECT id, title, description, file_name FROM study_materials WHERE file_data IS NULL")).fetchall()
                    for r in rows:
                        pdf_data = build_student_note_pdf(
                            title=r[1] or "Ders Notu",
                            course_name="Akran Akademik Destek",
                            uploader_name="Öğrenci",
                            description=r[2] or ""
                        )
                        conn.execute(
                            text("UPDATE study_materials SET file_data = :fdata, file_size = :fsize, mime_type = 'application/pdf' WHERE id = :mid"),
                            {"fdata": pdf_data, "fsize": len(pdf_data), "mid": r[0]}
                        )
                    if rows:
                        conn.commit()
                except Exception as b_err:
                    print(f"Auto-backfill notice: {b_err}")

            # 2. opportunities tablosu kontrolü
            if "opportunities" in table_names:
                opp_cols = {c["name"] for c in inspector.get_columns("opportunities")}
                cols_to_add = {
                    "source_identifier": "VARCHAR(255)",
                    "summary": "TEXT",
                    "fields": "VARCHAR(255)",
                    "target_audience": "VARCHAR(255)",
                    "application_type": "VARCHAR(50) DEFAULT 'both' NOT NULL",
                    "requirements": "TEXT",
                    "start_date": "TIMESTAMP",
                    "end_date": "TIMESTAMP",
                    "published_date": "TIMESTAMP",
                    "prize_support": "VARCHAR(255)",
                    "official_url": "VARCHAR(500) DEFAULT '' NOT NULL",
                    "application_url": "VARCHAR(500)",
                    "last_verified_date": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL",
                    "last_checked_at": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL",
                    "status": "VARCHAR(50) DEFAULT 'open' NOT NULL",
                    "is_sample": "BOOLEAN DEFAULT FALSE NOT NULL",
                }
                for col, col_def in cols_to_add.items():
                    if col not in opp_cols:
                        try:
                            conn.execute(text(f"ALTER TABLE opportunities ADD COLUMN {col} {col_def}"))
                            conn.commit()
                        except Exception as e:
                            conn.rollback()
    except Exception as e:
        print(f"Schema upgrade error: {e}")
