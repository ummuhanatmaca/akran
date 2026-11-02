import os

def create_study_note_pdf(file_path: str, course_code: str, title: str, subtitle: str, sections: list):
    """
    Generates a valid, clean PDF 1.4 document containing study notes.
    sections is a list of tuples: (heading, [paragraphs...])
    """
    def sanitize(text: str) -> str:
        mapping = {
            'ı': 'i', 'İ': 'I', 'ğ': 'g', 'Ğ': 'G', 'ü': 'u', 'Ü': 'U',
            'ş': 's', 'Ş': 'S', 'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C',
            '’': "'", '‘': "'", '“': '"', '”': '"', '—': '-', '–': '-'
        }
        for k, v in mapping.items():
            text = text.replace(k, v)
        text = text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')
        return text

    stream_parts = [
        'BT',
        '/F1 18 Tf',
        '50 780 Td',
        f'({sanitize(course_code)} - {sanitize(title)}) Tj',
        '/F1 10 Tf',
        '0 -20 Td',
        f'(Suleyman Demirel Universitesi - Bilgisayar Muhendisligi Bolumu | {sanitize(subtitle)}) Tj',
        '/F1 9 Tf',
        '0 -15 Td',
        '(AKRAN Akademik Destek ve Bilgi Paylasim Platformu - Resmi Ders Notu Arsivi) Tj',
        '0 -25 Td'
    ]

    for heading, paragraphs in sections:
        stream_parts.extend([
            '/F1 12 Tf',
            '0 -14 Td',
            f'({sanitize(heading)}) Tj',
            '/F1 9 Tf',
            '0 -14 Td'
        ])
        for p in paragraphs:
            # Word wrap around 80 chars
            words = sanitize(p).split()
            current_line = []
            for w in words:
                current_line.append(w)
                if len(' '.join(current_line)) > 80:
                    stream_parts.extend([
                        f'({" ".join(current_line)}) Tj',
                        '0 -12 Td'
                    ])
                    current_line = []
            if current_line:
                stream_parts.extend([
                    f'({" ".join(current_line)}) Tj',
                    '0 -12 Td'
                ])
            stream_parts.append('0 -6 Td')

    stream_parts.append('ET')
    stream_data = '\n'.join(stream_parts).encode('latin-1', errors='replace')

    objs = [
        b'1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        b'2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        b'3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
        b'4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
        f'5 0 obj\n<< /Length {len(stream_data)} >>\nstream\n'.encode('ascii') + stream_data + b'\nendstream\nendobj\n'
    ]

    header = b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'
    positions = []
    current_pos = len(header)
    for obj in objs:
        positions.append(current_pos)
        current_pos += len(obj)

    xref_pos = current_pos
    xref = [f'xref\n0 {len(objs) + 1}\n0000000000 65535 f \n'.encode('ascii')]
    for pos in positions:
        xref.append(f'{pos:010d} 00000 n \n'.encode('ascii'))
    trailer = f'trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n'.encode('ascii')

    dir_name = os.path.dirname(file_path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
    with open(file_path, 'wb') as f:
        f.write(header + b''.join(objs) + b''.join(xref) + trailer)

    return os.path.getsize(file_path)
