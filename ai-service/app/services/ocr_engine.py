import os
import re
import time
from typing import Dict, Any, List

def process_document_ocr(file_path: str, mime_type: str = "") -> Dict[str, Any]:
    start_time = time.time()
    raw_text = ""
    engine_used = ""

    if not os.path.exists(file_path):
        return {
            "rawText": "",
            "structuredFindings": {},
            "confidenceScore": 0.0,
            "engineUsed": "FileCheck",
            "processingTimeMs": 10,
            "error": "Document file not found on server."
        }

    file_ext = os.path.splitext(file_path)[1].lower()

    try:
        if file_ext == ".pdf" or "pdf" in mime_type.lower():
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            pages = []
            for page in reader.pages:
                txt = page.extract_text() or ""
                if txt.strip(): pages.append(txt)
            raw_text = "\n".join(pages).strip()
            engine_used = "PyPDF2/PyPDF-RealDocumentTextExtraction"

        elif file_ext in [".png", ".jpg", ".jpeg", ".webp"] or "image" in mime_type.lower():
            from PIL import Image
            import pytesseract
            img = Image.open(file_path)
            raw_text = pytesseract.image_to_string(img, lang="eng").strip()
            engine_used = f"TesseractOCR ({img.width}x{img.height})"

        else:
            return {
                "rawText": "", "structuredFindings": {}, "confidenceScore": 0.0,
                "engineUsed": "UnsupportedDocument",
                "processingTimeMs": int((time.time() - start_time) * 1000),
                "error": f"Unsupported document type: {file_ext}"
            }

        if not raw_text:
            return {
                "rawText": "", "structuredFindings": {}, "confidenceScore": 0.0,
                "engineUsed": engine_used or "OCR",
                "processingTimeMs": int((time.time() - start_time) * 1000),
                "error": "No text could be extracted from this document. For scanned images, install Tesseract OCR and retry."
            }

        structured = parse_medical_document_text(raw_text)
        elapsed_ms = int((time.time() - start_time) * 1000)
        return {
            "rawText": raw_text,
            "structuredFindings": structured,
            "confidenceScore": 0.96 if "PyPDF" in engine_used else 0.88,
            "engineUsed": engine_used,
            "processingTimeMs": max(elapsed_ms, 1),
            "documentPages": len(pages) if file_ext == ".pdf" else 1
        }
    except Exception as err:
        return {
            "rawText": "",
            "structuredFindings": {},
            "confidenceScore": 0.0,
            "engineUsed": engine_used or "OCR",
            "processingTimeMs": int((time.time() - start_time) * 1000),
            "error": f"Real OCR extraction failed: {str(err)}"
        }

def parse_medical_document_text(text: str) -> Dict[str, Any]:
    lines = text.split("\n")
    diagnoses: List[str] = []
    medications: List[Dict[str, str]] = []
    lab_results: List[Dict[str, Any]] = []
    doctor_notes: List[str] = []
    dates: List[str] = []
    vitals: Dict[str, str] = {}

    # Regex for dates
    date_matches = re.findall(r'(\d{1,2}[-/\.]\w{3,}[-/\.]\d{2,4}|\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})', text)
    dates = list(set(date_matches))

    # Diagnoses patterns
    diag_keywords = [
        "diabetes mellitus", "type 2 diabetes", "hypertension", "dyslipidemia",
        "asthma", "hypothyroidism", "bronchitis", "covid-19", "gastritis", "fatty liver"
    ]
    for dkw in diag_keywords:
        if dkw in text.lower():
            diagnoses.append(dkw.title())
    # Avoid overlapping matches such as both "diabetes mellitus" and
    # "type 2 diabetes" representing the same diagnosis.
    normalized = []
    for d in diagnoses:
        if not any(d.lower() in other.lower() and d.lower() != other.lower() for other in diagnoses):
            normalized.append(d)
    diagnoses = normalized
    # Canonicalize overlapping diabetes labels into one clinically readable item.
    low = {d.lower() for d in diagnoses}
    if 'type 2 diabetes' in low and 'diabetes mellitus' in low:
        diagnoses = [d for d in diagnoses if d.lower() != 'diabetes mellitus']
        diagnoses = ['Type 2 Diabetes Mellitus' if d.lower() == 'type 2 diabetes' else d for d in diagnoses]

    # Medications patterns (e.g. Tab. Metformin 500 mg, etc.)
    med_regex = re.compile(r'(?:Tab\.?|Cap\.?|Syp\.?|Inj\.?)?\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+\s*(?:mg|mcg|ml|g))\b(?:\s*-\s*([^\n]+))?', re.IGNORECASE)
    for line in lines:
        if re.search(r'\b(laboratory|lab|fasting blood sugar|hba1c|creatinine|cholesterol|glucose|pulse|bp:|spo2)\b', line, re.IGNORECASE):
            continue
        match = med_regex.search(line)
        if match:
            name = match.group(1).strip()
            dosage = match.group(2).strip()
            instruction = match.group(3).strip() if match.group(3) else "Once daily"
            low_line = line.lower()
            if 'twice daily' in low_line: instruction = 'Twice daily'
            elif 'once daily' in low_line: instruction = 'Once daily'
            elif 'morning' in low_line: instruction = 'Once daily in morning'
            elif 'bedtime' in low_line: instruction = 'Once daily at bedtime'
            if len(name) > 3 and name.lower() not in ["patient", "apollo", "clinic", "normal", "target"]:
                medications.append({
                    "name": name.title(),
                    "dosage": dosage,
                    "frequency": instruction,
                    "duration": "Ongoing"
                })

    # Lab Results extraction
    lab_patterns = [
        (r'Fasting Blood Sugar.*?(\d+)\s*(mg/dL)?', "Fasting Blood Sugar (FBS)", "mg/dL", "70 - 100", lambda v: float(v) > 110),
        (r'Postprandial Blood Sugar.*?(\d+)\s*(mg/dL)?', "Postprandial Blood Sugar (PPBS)", "mg/dL", "< 140", lambda v: float(v) > 140),
        (r'HbA1c.*?(\d+\.?\d*)\s*(%)?', "HbA1c", "%", "< 7.0", lambda v: float(v) > 7.0),
        (r'Serum Creatinine.*?(\d+\.?\d*)\s*(mg/dL)?', "Serum Creatinine", "mg/dL", "0.7 - 1.3", lambda v: float(v) > 1.3),
        (r'Total Cholesterol.*?(\d+)\s*(mg/dL)?', "Total Cholesterol", "mg/dL", "< 200", lambda v: float(v) > 200),
        (r'Serum Triglycerides.*?(\d+)\s*(mg/dL)?', "Serum Triglycerides", "mg/dL", "< 150", lambda v: float(v) > 150),
        (r'SGPT.*?(\d+)\s*(U/L)?', "SGPT / ALT", "U/L", "< 45", lambda v: float(v) > 45),
    ]

    for pat, test_name, unit, ref_range, check_abnormal in lab_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            val_str = m.group(1)
            try:
                is_abn = check_abnormal(val_str)
            except Exception:
                is_abn = False
            lab_results.append({
                "testName": test_name,
                "value": val_str,
                "unit": unit,
                "referenceRange": ref_range,
                "isAbnormal": is_abn
            })

    # Vitals extraction
    bp_match = re.search(r'\bBP\s*:?\s*(\d{2,3}/\d{2,3})', text, re.IGNORECASE)
    if bp_match:
        vitals["bp"] = bp_match.group(1)
    pulse_match = re.search(r'\bPulse\s*:?\s*(\d{2,3})', text, re.IGNORECASE)
    if pulse_match:
        vitals["pulse"] = pulse_match.group(1)
    spo2_match = re.search(r'\bSpO2\s*:?\s*(\d{2,3})', text, re.IGNORECASE)
    if spo2_match:
        vitals["spo2"] = spo2_match.group(1)

    # Doctor notes
    for line in lines:
        if any(w in line.lower() for w in ["diet advised", "walking", "avoid sugar", "follow up", "signed"]):
            cleaned = line.strip(" -*")
            if len(cleaned) > 10:
                doctor_notes.append(cleaned)

    return {
        "diagnoses": list(set(diagnoses)),
        "medications": medications,
        "labResults": lab_results,
        "vitals": vitals,
        "doctorNotes": doctor_notes[:5],
        "dates": dates[:3],
        "procedures": []
    }
