from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class MessageItem(BaseModel):
    sender: str
    text: str

class InterviewRequest(BaseModel):
    consultationId: str
    patientName: Optional[str] = "Patient"
    chiefComplaint: str
    previousMessages: List[MessageItem] = []
    currentAnswer: Optional[str] = None
    language: Optional[str] = "en"

class ExtractedEntities(BaseModel):
    symptoms: List[str] = []
    duration: Optional[str] = None
    severity: Optional[str] = None
    frequency: Optional[str] = None
    associatedSymptoms: List[str] = []
    medications: List[str] = []
    allergies: List[str] = []
    pastHistory: List[str] = []
    familyHistory: List[str] = []
    lifestyle: Dict[str, Any] = {}
    concerns: List[str] = []
    redFlags: List[Dict[str, str]] = []

class InterviewResponse(BaseModel):
    nextQuestion: str
    isComplete: bool = False
    stepIndex: int = 0
    totalSteps: int = 6
    extractedEntities: ExtractedEntities
    suggestedOptions: List[str] = []

class ExtractRequest(BaseModel):
    text: str
    context: Optional[str] = "interview"

class ReconstructRequest(BaseModel):
    consultationId: str
    patientId: str
    patientName: str
    age: int
    gender: str
    chiefComplaint: str
    intakeVitals: Optional[Dict[str, Any]] = None
    interviewHistory: List[Dict[str, Any]] = []
    ocrDocuments: List[Dict[str, Any]] = []
    pastHistory: Optional[List[str]] = []

class SymptomItem(BaseModel):
    name: str
    duration: Optional[str] = None
    severity: Optional[str] = "Moderate"
    frequency: Optional[str] = None
    source: str
    sourceRef: Optional[str] = None

class MedicationItem(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    source: str
    status: str = "Active"

class AllergyItem(BaseModel):
    substance: str
    reaction: Optional[str] = None
    severity: Optional[str] = "Moderate"
    source: str

class LabFindingItem(BaseModel):
    testName: str
    value: str
    unit: Optional[str] = ""
    referenceRange: Optional[str] = ""
    isAbnormal: bool = False
    source: str

class ContradictionItem(BaseModel):
    conflictType: str
    description: str
    itemA: str
    itemB: str
    severity: str = "Medium"

class ReconstructResponse(BaseModel):
    clinicalSummary: str
    chiefComplaint: str
    symptoms: List[SymptomItem]
    medications: List[MedicationItem]
    allergies: List[AllergyItem]
    labFindings: List[LabFindingItem]
    previousDiagnoses: List[Dict[str, str]]
    unresolvedQuestions: List[str]
    contradictions: List[ContradictionItem]
    confidenceScore: float = 0.92
    redFlags: List[Dict[str, str]] = []

class CompletenessRequest(BaseModel):
    patient: Dict[str, Any]
    consultation: Dict[str, Any]
    interviewHistory: List[Dict[str, Any]] = []
    documents: List[Dict[str, Any]] = []
    ayushAssessment: Optional[Dict[str, Any]] = None
    doctorVerification: Optional[Dict[str, Any]] = None

class CompletenessResponse(BaseModel):
    overallPercentage: int
    scoreBreakdown: Dict[str, int]
    completedFields: List[str]
    missingFields: List[str]
    recommendedFollowUpQuestions: List[str]
    isReadyForDoctorReview: bool

class AyushRequest(BaseModel):
    age: int
    gender: str
    chiefComplaint: str
    symptoms: List[str] = []
    sleepPattern: Optional[str] = "Normal"
    dietType: Optional[str] = "Vegetarian"
    appetite: Optional[str] = "Normal"
    bowelHabits: Optional[str] = "Regular"
    stressLevel: Optional[str] = "Moderate"
    physicalActivity: Optional[str] = "Sedentary"

class AyushResponse(BaseModel):
    prakriti: Dict[str, Any]
    vikriti: Dict[str, Any]
    agni: Dict[str, Any]
    dhatu: List[str]
    herbalRecommendations: List[Dict[str, str]]
    dietaryAdvice: List[str]
    lifestyleModifications: List[str]
    contraindications: List[str]
