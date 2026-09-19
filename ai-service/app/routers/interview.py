from fastapi import APIRouter
from app.schemas import InterviewRequest, InterviewResponse, ExtractRequest, ExtractedEntities
from app.services.clinical_engine import generate_adaptive_question, extract_clinical_entities

router = APIRouter(prefix="/ai", tags=["AI Clinical Interview"])

@router.post("/interview", response_model=InterviewResponse)
def handle_interview(req: InterviewRequest):
    prev_dicts = [{"sender": m.sender, "text": m.text} for m in req.previousMessages]
    return generate_adaptive_question(
        chief_complaint=req.chiefComplaint,
        patient_name=req.patientName or "Patient",
        previous_messages=prev_dicts,
        current_answer=req.currentAnswer,
        language=req.language or 'English'
    )

@router.post("/next-question", response_model=InterviewResponse)
def get_next_question(req: InterviewRequest):
    return handle_interview(req)

@router.post("/extract", response_model=ExtractedEntities)
def extract_entities_from_text(req: ExtractRequest):
    return extract_clinical_entities(req.text)
