import os
import re
import uuid
from fastapi import UploadFile, HTTPException
from app.core.config import settings
from app.services.security_scanner import scan_file_security, SecurityScanError

MIME_TYPE_MAP = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}

def sanitize_filename(name: str) -> str:
    """Dosya adından dizin atlatma (path traversal) ve zararlı karakterleri temizler."""
    clean = os.path.basename(name)
    # Yalnızca alfanümerik, Türkçe karakterler, tire, alt çizgi ve nokta izin verilir
    clean = re.sub(r'[^\w\s\.\-çÇğĞıİöÖşŞüÜ]', '', clean).strip()
    return clean or "dosya"

def sanitize_and_save_file(file: UploadFile) -> dict:
    """
    Yüklenen dosyayı çok aşamalı güvenlik ve depolama sürecinden geçirir:
    1. İzin verilen uzantı kontrolü
    2. Dosya adı temizleme (Path Traversal koruması)
    3. Dosya boyutu sınırı (DoS & Zip bomb koruması)
    4. Derin Güvenlik Taraması (Magic Bytes, PE/Script/Macro tespiti, SHA-256)
    5. UUID tabanlı izole disk depolama
    """
    raw_name = file.filename or "dosya"
    filename = sanitize_filename(raw_name)
    _, ext = os.path.splitext(filename)
    ext = ext.lower()

    # 1. Uzantı kontrolü
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Geçersiz dosya uzantısı. Yalnızca şu formatlar desteklenir: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # 2. Uploads dizini hazırlığı
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # 3. İçerik okuma ve boyut kontrolü
    contents = file.file.read()
    file_size = len(contents)

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Boş dosya yüklenemez.")

    if file_size > settings.MAX_FILE_SIZE:
        max_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"Dosya boyutu çok büyük. Maksimum {max_mb:.0f}MB yüklenebilir."
        )

    # 4. Derin Güvenlik Taraması (İmza, Zararlı Kod & SHA-256)
    try:
        scan_result = scan_file_security(contents, filename, ext)
    except SecurityScanError as sse:
        raise HTTPException(
            status_code=400,
            detail=f"Güvenlik Uyarısı: {str(sse)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Dosya güvenlik denetimi sırasında hata oluştu: {str(e)}"
        )

    # 5. UUID tabanlı güvenli disk dosya adı oluşturma
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    destination_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    with open(destination_path, "wb") as f:
        f.write(contents)

    # Güvenilir MIME türü
    verified_mime = MIME_TYPE_MAP.get(ext, "application/octet-stream")

    return {
        "file_path": destination_path,
        "file_name": filename,
        "unique_filename": unique_filename,
        "file_size": file_size,
        "mime_type": verified_mime,
        "file_extension": ext,
        "sha256_hash": scan_result["sha256"],
        "scan_status": scan_result["scan_status"],
        "security_note": scan_result["security_note"]
    }
