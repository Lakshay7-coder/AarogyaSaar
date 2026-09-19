from fastapi import APIRouter
from app.schemas import CompletenessRequest, CompletenessResponse

router = APIRouter(prefix="/ai", tags=["Completeness Engine"])

@router.post("/completeness", response_model=CompletenessResponse)
def calculate_case_completeness(req: CompletenessRequest):
    scores = {}
    completed_fields = []
    missing_fields = []
    follow_ups = []

    p = req.patient or {}
    c = req.consultation or {}
    interviews = req.interviewHistory or []
    docs = req.documents or []
    ayush = req.ayushAssessment
    doc_ver = req.doctorVerification

    # 1. Demographics (10 pts)
    demo_score = 0
    if p.get("name") and p.get("age") and p.get("gender"):
        demo_score += 6
        completed_fields.append("Patient Demographics (Basic)")
    else:
        missing_fields.append("Patient Demographics")

    if p.get("phone") and (p.get("abhaId") or p.get("language")):
        demo_score += 4
        completed_fields.append("Contact & ABHA Identity")
    else:
        missing_fields.append("ABHA / Contact Details")
    scores["Demographics"] = demo_score

    # 2. Chief Complaint (10 pts)
    if c.get("chiefComplaint"):
        scores["Chief Complaint"] = 10
        completed_fields.append("Chief Complaint & Onset")
    else:
        scores["Chief Complaint"] = 0
        missing_fields.append("Chief Complaint")
        follow_ups.append("Please specify the primary symptom bringing you for consultation today.")

    # 3. Triage Vitals (10 pts)
    vitals = c.get("vitals", {})
    if vitals.get("bpSystolic") and vitals.get("pulse") and vitals.get("spO2"):
        scores["Vitals"] = 10
        completed_fields.append("Triage Vitals (BP, Pulse, SpO2)")
    else:
        scores["Vitals"] = 4
        missing_fields.append("Complete Vital Signs")
        follow_ups.append("Record resting blood pressure and pulse rate at the kiosk station.")

    # 4. Symptoms & History from Interview (15 pts)
    if len(interviews) >= 4:
        scores["Symptoms & Characteristics"] = 15
        completed_fields.append("Clinical Symptom Characterization (AI Interview)")
    elif len(interviews) >= 1:
        scores["Symptoms & Characteristics"] = 8
        missing_fields.append("Detailed Symptom Progression")
        follow_ups.append("Continue the AI clinical interview to clarify symptom triggers and timeline.")
    else:
        scores["Symptoms & Characteristics"] = 0
        missing_fields.append("Clinical Interview")
        follow_ups.append("Start interactive AI interview to log symptom nuances.")

    # 5. Medications & Allergies (15 pts)
    has_meds = False
    has_allergies = False
    for msg in interviews:
        txt = msg.get("text", "").lower()
        if any(w in txt for w in ["taking", "tablet", "tab", "metformin", "medicine", "medication"]):
            has_meds = True
        if any(w in txt for w in ["allergic", "allergy", "no allergy", "penicillin"]):
            has_allergies = True

    med_score = 0
    if has_meds:
        med_score += 8
        completed_fields.append("Current Medications")
    else:
        missing_fields.append("Current Medications")
        follow_ups.append("List all daily prescription medications and herbal supplements currently taken.")

    if has_allergies:
        med_score += 7
        completed_fields.append("Allergy Status (Documented / NKDA)")
    else:
        missing_fields.append("Allergy Profile")
        follow_ups.append("Confirm any known adverse reactions to Penicillin, Sulfa drugs, or foods.")
    scores["Medications & Allergies"] = med_score

    # 6. Medical Documents & OCR (15 pts)
    if len(docs) > 0:
        scores["Medical Records & OCR"] = 15
        completed_fields.append("Uploaded Records (OCR Extracted)")
    else:
        scores["Medical Records & OCR"] = 5
        missing_fields.append("Previous Medical Records / Prescriptions")
        follow_ups.append("Upload recent prescription slips, discharge summaries, or diagnostic tests.")

    # 7. AYUSH Holistic Assessment (15 pts)
    if ayush and (ayush.get("prakriti") or ayush.get("lifestyle")):
        scores["AYUSH Assessment"] = 15
        completed_fields.append("AYUSH Prakriti & Lifestyle Assessment")
    else:
        scores["AYUSH Assessment"] = 0
        missing_fields.append("AYUSH Holistic Assessment")
        follow_ups.append("Complete the 3-minute AYUSH assessment (Prakriti, Agni, sleep, and diet).")

    # 8. Doctor Verification (10 pts)
    if doc_ver or c.get("status") in ["verified", "finalized"]:
        scores["Doctor Verification"] = 10
        completed_fields.append("Doctor Clinical Verification & Finalization")
    elif c.get("status") == "under_review":
        scores["Doctor Verification"] = 5
        missing_fields.append("Doctor Final Sign-off")
        follow_ups.append("Attending physician must review AI synthesized findings.")
    else:
        scores["Doctor Verification"] = 0
        missing_fields.append("Doctor Verification")

    overall_pct = sum(scores.values())
    overall_pct = min(max(overall_pct, 0), 100)

    return CompletenessResponse(
        overallPercentage=overall_pct,
        scoreBreakdown=scores,
        completedFields=completed_fields,
        missingFields=missing_fields,
        recommendedFollowUpQuestions=follow_ups,
        isReadyForDoctorReview=(overall_pct >= 65)
    )
