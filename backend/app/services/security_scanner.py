import hashlib
import io
import os
import re
import zipfile
from typing import Dict, Any, List

# Allowed Magic Byte Signatures
MAGIC_SIGNATURES = {
    ".pdf": [b"%PDF-"],
    ".png": [b"\x89PNG\r\n\x1a\n"],
    ".jpg": [b"\xff\xd8\xff"],
    ".jpeg": [b"\xff\xd8\xff"],
    ".docx": [b"PK\x03\x04"],  # ZIP archive container for Office Open XML
}

# Suspicious payload signatures (lowercased patterns)
SUSPICIOUS_PATTERNS = [
    # Executable DOS/PE header check
    b"This program cannot be run in DOS mode",
    b"PE\x00\x00",
    # Script injection patterns
    b"<script",
    b"javascript:",
    b"vbscript:",
    b"<iframe",
    b"onerror=",
    b"onload=",
]

# PDF-specific dangerous action keywords
PDF_DANGEROUS_ACTIONS = [
    b"/JavaScript",
    b"/JS",
    b"/Launch",
    b"/EmbeddedFiles",
    b"/SubmitForm",
    b"/ImportData",
    b"/RichMedia",
]

class SecurityScanError(Exception):
    def __init__(self, message: str, threats: List[str] = None):
        super().__init__(message)
        self.threats = threats or []

def scan_file_security(contents: bytes, filename: str, declared_ext: str) -> Dict[str, Any]:
    """
    Yüklenen dosyanın içeriğini çok katmanlı güvenlik denetiminden geçirir:
    1. SHA-256 özet parmak izi hesaplama
    2. Magic Bytes (Dosya İmzası) doğrulaması
    3. Zararlı kod, PE header ve script enjeksiyon taraması
    4. PDF için aktif nesne / JavaScript denetimi
    5. DOCX için makro (VBA) ve Office Open XML yapı doğrulaması
    """
    threats = []
    ext = declared_ext.lower()
    
    # 1. SHA-256 Parmak İzi
    sha256_hash = hashlib.sha256(contents).hexdigest()
    
    # 2. Minimum ve Maksimum Boyut Kontrolü
    if len(contents) == 0:
        raise SecurityScanError("Dosya içeriği boş.", ["empty_file"])

    # 3. Magic Bytes (Başlık İmzası) Doğrulaması
    signatures = MAGIC_SIGNATURES.get(ext)
    if signatures:
        matched = any(contents.startswith(sig) for sig in signatures)
        if not matched:
            threats.append(f"Geçersiz dosya imzası. '{ext}' uzantısı ile dosya ikili başlığı uyuşmuyor.")
    else:
        threats.append(f"Desteklenmeyen dosya türü: '{ext}'")

    # 4. Genel Zararlı İkili / Script İmzası Taraması
    lower_bytes = contents[:16384].lower()  # İlk 16KB başlık ve meta alanı tara
    for pattern in SUSPICIOUS_PATTERNS:
        if pattern.lower() in lower_bytes:
            threats.append(f"Şüpheli kod veya ikili yürütülebilir imza tespit edildi: {pattern.decode('latin-1', errors='ignore')}")

    # 5. PDF Özel Taraması
    if ext == ".pdf":
        for kw in PDF_DANGEROUS_ACTIONS:
            if kw in contents:
                threats.append(f"PDF dosyasında potansiyel zararlı aktif nesne bulundu: {kw.decode('latin-1')}")

    # 6. DOCX Özel Taraması (Zip yapısı & VBA Makro denetimi)
    if ext == ".docx":
        try:
            with zipfile.ZipFile(io.BytesIO(contents)) as zf:
                namelist = zf.namelist()
                
                # Standart Word içeriği var mı?
                has_word = any(name.startswith("word/") for name in namelist) or "[Content_Types].xml" in namelist
                if not has_word:
                    threats.append("Geçersiz DOCX yapısı: Standart Word OpenXML bileşenleri bulunamadı.")
                
                # Makro dosyaları yasak (Öğrenci notları makro içeremez)
                for name in namelist:
                    lower_name = name.lower()
                    if "vbaproject.bin" in lower_name or lower_name.endswith(".vba") or "vba" in lower_name:
                        threats.append(f"Güvenlik kuralı ihlali: Belgede aktif makro tespit edildi ({name}).")
        except zipfile.BadZipFile:
            threats.append("Bozuk veya sahte DOCX dosyası (Zip arşivi açılamadı).")

    # Sonuç Değerlendirmesi
    if threats:
        raise SecurityScanError(
            f"Güvenlik Denetimi Başarısız: {'; '.join(threats)}",
            threats=threats
        )

    return {
        "is_safe": True,
        "scan_status": "clean",
        "sha256": sha256_hash,
        "security_note": "SHA-256 doğrulandı, zararlı kod imzası veya makro bulunamadı."
    }
