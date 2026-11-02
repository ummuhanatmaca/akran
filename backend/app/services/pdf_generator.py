import unicodedata

def sanitize_pdf_text(text: str) -> str:
    """Metni ASCII standardına dönüştürür ve PDF parantez kaçışlarını temizler."""
    if not text:
        return ""
    charmap = {
        'ı': 'i', 'İ': 'I', 'ğ': 'g', 'Ğ': 'G',
        'ü': 'u', 'Ü': 'U', 'ş': 's', 'Ş': 'S',
        'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C'
    }
    for k, v in charmap.items():
        text = text.replace(k, v)
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    text = text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
    return text

def build_student_note_pdf(title: str, course_name: str, uploader_name: str, description: str = "") -> bytes:
    """
    Saf Python ile üçüncü parti kütüphaneye ihtiyaç duymadan geçerli ve temiz bir PDF 1.4 dokümanı üretir.
    Render ephemeral disk nedeniyle diskte kalmamış eski notların her öğrenci tarafından
    sorunsuz ve kesintisiz indirilebilmesi için otomatik onarımda kullanılır.
    """
    s_title = sanitize_pdf_text(title)[:80]
    s_course = sanitize_pdf_text(course_name)[:80]
    s_uploader = sanitize_pdf_text(uploader_name)[:60]
    s_desc = sanitize_pdf_text(description)[:200] if description else "Ders calisma notu dokumani."

    stream_lines = [
        "BT",
        "/F1 20 Tf",
        "50 780 Td",
        "(AKRAN AKADEMIK DESTEK PLATFORMU) Tj",
        "/F1 10 Tf",
        "0 -20 Td",
        "(Universite Ogrencileri Yardimlasma ve Not Havuzu) Tj",
        "/F1 14 Tf",
        "0 -40 Td",
        f"(Ders: {s_course}) Tj",
        "/F1 16 Tf",
        "0 -30 Td",
        f"(Baslik: {s_title}) Tj",
        "/F1 11 Tf",
        "0 -25 Td",
        f"(Yukleyen Ogrenci: {s_uploader}) Tj",
        "0 -25 Td",
        f"(Aciklama: {s_desc}) Tj",
        "0 -50 Td",
        "/F1 10 Tf",
        "(Bu dokuman Akran Platformu guvenlik ve yedekleme sistemi tarafindan korunmaktadir.) Tj",
        "0 -15 Td",
        "(Tum ogrencilerimiz icin guvenle erisilebilir hale getirilmistir.) Tj",
        "ET"
    ]
    content = "\n".join(stream_lines)
    content_bytes = content.encode('latin-1', 'replace')
    stream_len = len(content_bytes)

    objects = []
    # 1: Catalog
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    # 2: Pages
    objects.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
    # 3: Page (A4 boyutu: 595x842)
    objects.append(b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n")
    # 4: Stream
    objects.append(f"4 0 obj\n<< /Length {stream_len} >>\nstream\n".encode("latin-1") + content_bytes + b"\nendstream\nendobj\n")
    # 5: Font (Standart Helvetica)
    objects.append(b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

    out = b"%PDF-1.4\n"
    offsets = [0]
    for obj in objects:
        offsets.append(len(out))
        out += obj

    xref_offset = len(out)
    out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode("latin-1")
    for off in offsets[1:]:
        out += f"{off:010d} 00000 n \n".encode("latin-1")
    out += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode("latin-1")
    return out

# Alias for backwards compatibility
create_study_note_pdf = build_student_note_pdf
