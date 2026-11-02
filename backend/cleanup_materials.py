import os
import shutil
from app.core.database import SessionLocal
from app.models.material import StudyMaterial
from app.core.config import settings

def main():
    print("Mevcut ders notları temizleniyor...")
    db = SessionLocal()
    try:
        # 1. Veritabanındaki tüm ders notlarını sil
        count = db.query(StudyMaterial).count()
        db.query(StudyMaterial).delete()
        db.commit()
        print(f"Veritabanından {count} adet ders notu silindi.")
    except Exception as e:
        db.rollback()
        print(f"Hata: {e}")
    finally:
        db.close()

    # 2. Uploads klasöründeki dosyaları temizle
    if os.path.exists(settings.UPLOAD_DIR):
        for f in os.listdir(settings.UPLOAD_DIR):
            file_path = os.path.join(settings.UPLOAD_DIR, f)
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Dosya silinemedi {file_path}: {e}")
        print(f"'{settings.UPLOAD_DIR}' klasöründeki dosyalar temizlendi.")

    # 3. Kök dizindeki akran.db varsa eşitle
    root_db = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "akran.db"))
    backend_db = os.path.abspath(os.path.join(os.path.dirname(__file__), "akran.db"))
    if os.path.exists(backend_db) and os.path.exists(root_db):
        shutil.copy2(backend_db, root_db)
        print("Kök dizindeki akran.db eşitlendi.")

    # 4. seed.py dosyasını güncelle (örnek notlar otomatik tekrar eklenmesin)
    seed_file = os.path.join(os.path.dirname(__file__), "app", "db", "seed.py")
    if os.path.exists(seed_file):
        with open(seed_file, "r", encoding="utf-8") as f:
            code = f.read()

        start_marker = "# Örnek Ders Notları İçerik Verileri"
        end_marker = "def seed_database():"
        if start_marker in code and end_marker in code:
            p1 = code.find(start_marker)
            p2 = code.find(end_marker)
            code = code[:p1] + "# Ders Notlari (Kullanici Tarafindan Eklenecektir)\nSAMPLE_STUDY_MATERIALS = []\n\n" + code[p2:]

        loop_start = "# 6. Hazırlanan Gerçek Ders Notları"
        loop_end = 'print("Tum gercek ders notlari ve mufredat basariyla hazirlandi!")'
        if loop_start in code and loop_end in code:
            p1 = code.find(loop_start)
            p2 = code.find(loop_end)
            code = code[:p1] + '# 6. Ders Notlari (Kullanici Tarafından Eklenecektir)\n        print("Ders notlari alani temiz ve hazir.")\n        ' + code[p2:]

        with open(seed_file, "w", encoding="utf-8") as f:
            f.write(code)
        print("seed.py güncellendi, başlangıçta otomatik not ekleme devre dışı bırakıldı.")

if __name__ == "__main__":
    main()
