import sys, os

pdf_path = r"D:\Desktop\VibeCoding\三位一体辅助系统\.三位一体数据采集表.ref\jxnh_tmp.pdf"
out_path = r"D:\Desktop\VibeCoding\三位一体辅助系统\.三位一体数据采集表.ref\jxnh_text.txt"

text = ""
try:
    from pypdf import PdfReader
    r = PdfReader(pdf_path)
    for p in r.pages:
        text += p.extract_text() + "\n"
    text = "[pypdf]\n" + text
except Exception as e1:
    try:
        from PyPDF2 import PdfReader
        r = PdfReader(pdf_path)
        for p in r.pages:
            text += p.extract_text() + "\n"
        text = "[PyPDF2]\n" + text
    except Exception as e2:
        try:
            import pdfplumber
            with pdfplumber.open(pdf_path) as pdf:
                for p in pdf.pages:
                    text += (p.extract_text() or "") + "\n"
            text = "[pdfplumber]\n" + text
        except Exception as e3:
            text = f"ALL_FAILED: {e1}\n{e2}\n{e3}"

with open(out_path, "w", encoding="utf-8") as f:
    f.write(text)
print("CHARS:", len(text))
