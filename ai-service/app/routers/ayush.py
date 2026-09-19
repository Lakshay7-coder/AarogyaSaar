from fastapi import APIRouter
from app.schemas import AyushRequest, AyushResponse
from app.services.ayush_engine import evaluate_ayush_assessment

router = APIRouter(prefix="/ai", tags=["AYUSH Assessment Engine"])

@router.post("/ayush", response_model=AyushResponse)
def handle_ayush_assessment(req: AyushRequest):
    return evaluate_ayush_assessment(
        age=req.age,
        gender=req.gender,
        chief_complaint=req.chiefComplaint,
        symptoms=req.symptoms,
        sleep_pattern=req.sleepPattern or "Normal",
        diet_type=req.dietType or "Vegetarian",
        appetite=req.appetite or "Normal",
        bowel_habits=req.bowelHabits or "Regular",
        stress_level=req.stressLevel or "Moderate",
        physical_activity=req.physicalActivity or "Sedentary"
    )
