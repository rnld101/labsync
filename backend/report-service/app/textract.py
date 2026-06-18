"""Text extraction from uploaded documents.

- PDF  → pypdf (handles multi-page, digitally-generated reports; no Textract quota)
- Image (JPEG/PNG/TIFF) → Textract detect_document_text (OCR for scanned docs)
"""

import io

import boto3
import pypdf

from .config import settings

_textract = boto3.client("textract", region_name=settings.aws_region)
_s3 = boto3.client("s3", region_name=settings.aws_region)


def extract_text(bucket: str, key: str) -> str:
    if key.lower().endswith(".pdf"):
        obj = _s3.get_object(Bucket=bucket, Key=key)
        reader = pypdf.PdfReader(io.BytesIO(obj["Body"].read()))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n\n".join(p for p in pages if p.strip())
    else:
        resp = _textract.detect_document_text(Document={"S3Object": {"Bucket": bucket, "Name": key}})
        lines = [b["Text"] for b in resp.get("Blocks", []) if b.get("BlockType") == "LINE"]
        return "\n\n".join(lines)
