import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.services.ocr_engine import process_document_ocr, parse_medical_document_text

router = APIRouter(prefix="/ocr", tags=["Medical Document OCR"])

@router.post("/process")
async def process_file_upload(
    file: Optional[UploadFile] = File(None),
    filePath: Optional[str] = Form(None),
    mimeType: Optional[str] = Form("application/pdf")
):
    target_path = filePath

    if file:
        upload_dir = os.path.join(os.getcwd(), "..", "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        dest_path = os.path.join(upload_dir, file.filename)
        with open(dest_path, "wb") as f:
            content = await file.read()
            f.write(content)
        target_path = dest_path
        mime_type = file.content_type or mimeType
    elif not filePath:
        raise HTTPException(status_code=400, detail="Either file upload or filePath must be provided.")
    else:
        mime_type = mimeType

    result = process_document_ocr(target_path, mime_type)
    return result

@router.post("/parse-text")
def parse_raw_text(payload: dict):
    text = payload.get("text", "")
    findings = parse_medical_document_text(text)
    return {
        "rawText": text,
        "structuredFindings": findings,
        "confidenceScore": 0.95,
        "engineUsed": "ClinicalTextParser"
    }
