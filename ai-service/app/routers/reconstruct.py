from fastapi import APIRouter
from app.schemas import ReconstructRequest, ReconstructResponse
from app.services.clinical_engine import reconstruct_clinical_case

router = APIRouter(prefix="/ai", tags=["Clinical Case Reconstruction"])

@router.post("/reconstruct", response_model=ReconstructResponse)
def handle_reconstruct(req: ReconstructRequest):
    return reconstruct_clinical_case(
        consultation_id=req.consultationId,
        patient_id=req.patientId,
        patient_name=req.patientName,
        age=req.age,
        gender=req.gender,
        chief_complaint=req.chiefComplaint,
        intake_vitals=req.intakeVitals or {},
        interview_history=req.interviewHistory,
        ocr_documents=req.ocrDocuments,
        past_history=req.pastHistory or []
    )
