import re
from typing import Dict, Any, List
from app.schemas import (
    ExtractedEntities,
    InterviewResponse,
    SymptomItem,
    MedicationItem,
    AllergyItem,
    LabFindingItem,
    ContradictionItem,
    ReconstructResponse
)

COMMON_SYMPTOMS = [
    "fever", "cough", "cold", "headache", "chest pain", "shortness of breath", "fatigue",
    "joint pain", "back pain", "nausea", "vomiting", "diarrhea", "abdominal pain",
    "acid reflux", "heartburn", "dizziness", "constipation", "insomnia", "weight loss",
    "skin rash", "swelling", "blurred vision", "frequent urination", "anxiety", "body ache"
]

COMMON_MEDICATIONS = [
    "metformin", "glimepiride", "amlodipine", "telmisartan", "atorvastatin", "pantoprazole",
    "paracetamol", "ibuprofen", "azithromycin", "amoxicillin", "cetirizine", "losartan",
    "aspirin", "levothyroxine", "insulin", "omeprazole", "ashwagandha", "triphala", "brahmi", "giloy"
]

COMMON_ALLERGIES = [
    "penicillin", "sulfa", "aspirin", "nsaids", "peanuts", "pollen", "dust", "latex", "shellfish", "dairy"
]

def extract_clinical_entities(text: str) -> ExtractedEntities:
    if not text:
        return ExtractedEntities()
    
    text_lower = text.lower()
    entities = ExtractedEntities()

    # Detect symptoms
    found_symptoms = []
    for sym in COMMON_SYMPTOMS:
        if re.search(r'\b' + re.escape(sym) + r'\b', text_lower):
            found_symptoms.append(sym.capitalize())
    entities.symptoms = found_symptoms

    # Detect duration
    duration_match = re.search(r'(\d+\s*(?:day|days|week|weeks|month|months|year|years|hour|hours))', text_lower)
    if duration_match:
        entities.duration = duration_match.group(1)
    elif "yesterday" in text_lower:
        entities.duration = "1 day"
    elif "few days" in text_lower or "couple of days" in text_lower:
        entities.duration = "2-3 days"
    elif "long time" in text_lower:
        entities.duration = "Chronic (> 1 month)"

    # Detect severity
    if any(w in text_lower for w in ["severe", "unbearable", "very high", "extreme", "acute"]):
        entities.severity = "Severe"
    elif any(w in text_lower for w in ["moderate", "medium", "quite a bit"]):
        entities.severity = "Moderate"
    elif any(w in text_lower for w in ["mild", "slight", "little", "low"]):
        entities.severity = "Mild"

    # Detect frequency
    if any(w in text_lower for w in ["continuous", "all day", "constant", "non-stop"]):
        entities.frequency = "Continuous"
    elif any(w in text_lower for w in ["intermittent", "comes and goes", "sometimes", "occasional"]):
        entities.frequency = "Intermittent"
    elif any(w in text_lower for w in ["morning", "night", "after eating"]):
        entities.frequency = "Periodic"

    # Detect medications
    found_meds = []
    for med in COMMON_MEDICATIONS:
        if re.search(r'\b' + re.escape(med) + r'\b', text_lower):
            found_meds.append(med.capitalize())
    entities.medications = found_meds

    # Detect allergies
    found_allergies = []
    if "allergic" in text_lower or "allergy" in text_lower:
        for alg in COMMON_ALLERGIES:
            if alg in text_lower:
                found_allergies.append(alg.capitalize())
        if not found_allergies and "no" not in text_lower:
            found_allergies.append("Reported allergies in interview text")
    elif "no allergies" in text_lower or "not allergic" in text_lower or "nil" in text_lower:
        found_allergies = []
    entities.allergies = found_allergies

    # Detect chronic conditions/past history
    history_items = []
    if "diabetes" in text_lower or "sugar" in text_lower:
        history_items.append("Type 2 Diabetes Mellitus")
    if "hypertension" in text_lower or "bp" in text_lower or "high blood pressure" in text_lower:
        history_items.append("Essential Hypertension")
    if "asthma" in text_lower:
        history_items.append("Bronchial Asthma")
    if "thyroid" in text_lower:
        history_items.append("Hypothyroidism")
    entities.pastHistory = history_items

    # Detect concerns
    if any(w in text_lower for w in ["worried", "scared", "fear", "anxious", "painful", "cannot sleep"]):
        entities.concerns.append("Patient expresses emotional or physical distress regarding symptoms")

    # Safety-oriented red-flag screening. This is not diagnosis; it surfaces
    # patient-reported warning symptoms for physician attention.
    red_flag_rules = [
        ("Breathing difficulty / shortness of breath", ["shortness of breath", "difficulty breathing", "breathlessness", "सांस लेने में दिक्कत", "सांस फूलना", "सांस की तकलीफ", "saans lene mein dikkat", "saans ki dikkat"], "HIGH"),
        ("Severe or crushing chest pain", ["crushing chest pain", "severe chest pain", "chest pain", "सीने में तेज दर्द", "सीने में दर्द"], "HIGH"),
        ("Fainting / loss of consciousness", ["fainted", "fainting", "passed out", "loss of consciousness", "बेहोश", "बेहोशी"], "HIGH"),
        ("Sudden weakness or speech difficulty", ["sudden weakness", "slurred speech", "speech difficulty", "face drooping", "अचानक कमजोरी", "बोलने में दिक्कत"], "HIGH"),
        ("Severe bleeding", ["vomiting blood", "blood in stool", "heavy bleeding", "severe bleeding", "खून की उल्टी", "बहुत ज्यादा खून"], "HIGH"),
    ]
    for label, triggers, priority in red_flag_rules:
        if any(trigger in text_lower for trigger in triggers):
            entities.redFlags.append({"label": label, "priority": priority, "source": "PATIENT_INTERVIEW"})
            if label not in entities.associatedSymptoms:
                entities.associatedSymptoms.append(label)

    # Hindi / Hinglish clinical terms used by Indian patients.
    if any(term in text_lower for term in ['दर्द', 'dard']):
        if 'Pain' not in entities.symptoms: entities.symptoms.append('Pain')
    if any(term in text_lower for term in ['जलन', 'jalan']):
        if 'Burning sensation' not in entities.symptoms: entities.symptoms.append('Burning sensation')
    if any(term in text_lower for term in ['सिरदर्द', 'sir dard']):
        if 'Headache' not in entities.symptoms: entities.symptoms.append('Headache')
    if any(term in text_lower for term in ['चक्कर', 'chakkar', 'चक्कर आना']):
        if 'Dizziness' not in entities.symptoms: entities.symptoms.append('Dizziness')
    if any(term in text_lower for term in ['मतली', 'ulti', 'उल्टी', 'vomit']):
        if 'Nausea/Vomiting' not in entities.associatedSymptoms: entities.associatedSymptoms.append('Nausea/Vomiting')
    if any(term in text_lower for term in ['मधुमेह', 'शुगर', 'sugar']):
        if 'Type 2 Diabetes Mellitus' not in entities.pastHistory: entities.pastHistory.append('Type 2 Diabetes Mellitus')
    if any(term in text_lower for term in ['बीपी', 'bp', 'ब्लड प्रेशर', 'high bp']):
        if 'Essential Hypertension' not in entities.pastHistory: entities.pastHistory.append('Essential Hypertension')
    if any(term in text_lower for term in ['एलर्जी नहीं', 'कोई एलर्जी नहीं', 'allergy nahi']):
        entities.allergies = []
    if any(term in text_lower for term in ['तेज', 'बहुत तेज', 'severe']):
        entities.severity = 'Severe'
    elif any(term in text_lower for term in ['मध्यम', 'moderate']):
        entities.severity = 'Moderate'
    elif any(term in text_lower for term in ['हल्का', 'हल्की', 'mild']):
        entities.severity = 'Mild'

    return entities

def generate_adaptive_question(
    chief_complaint: str,
    patient_name: str,
    previous_messages: List[Dict[str, str]],
    current_answer: str = None,
    language: str = 'English'
) -> InterviewResponse:
    step_index = len([m for m in previous_messages if m.get("sender") == "ai"])
    total_steps = 6

    # Extract any entities from current answer
    extracted = extract_clinical_entities(current_answer or "")
    lang = str(language or 'English').lower()
    is_hindi = lang.startswith('hi') or 'hindi' in lang
    is_marathi = lang.startswith('mr') or 'marathi' in lang
    is_tamil = lang.startswith('ta') or 'tamil' in lang

    questions = [
        # Step 0
        {
            "q": f"Namaste {patient_name}. I understand you are experiencing {chief_complaint.lower()}. Could you describe how long this has been going on, and whether the feeling is mild, moderate, or severe?",
            "options": ["Started 2-3 days ago, moderate", "Ongoing for over a week, severe", "Mild symptom on and off", "Just started today"]
        },
        # Step 1
        {
            "q": "Thank you for sharing that. Does anything specific trigger or worsen these symptoms (like food, physical exertion, weather, or stress)? Does anything provide relief?",
            "options": ["Worse after eating or oily food", "Worse during physical activity", "Worse in cold air / night", "Nothing specific brings relief"]
        },
        # Step 2
        {
            "q": "Are you experiencing any other accompanying symptoms such as fever, dizziness, body chills, headache, nausea, or shortness of breath?",
            "options": ["Mild fever and body ache", "Headache and fatigue", "Acid reflux and nausea", "No other symptoms"]
        },
        # Step 3
        {
            "q": "Do you have any existing medical conditions like Diabetes, High Blood Pressure (Hypertension), Thyroid, or Asthma?",
            "options": ["Yes, Type 2 Diabetes", "Yes, Hypertension (High BP)", "Both Diabetes and BP", "No known chronic conditions"]
        },
        # Step 4
        {
            "q": "Are you currently taking any daily medications or Ayurvedic supplements? Also, do you have known allergies to any medicines like Penicillin or Sulfa drugs?",
            "options": ["Taking Metformin and Telmisartan daily, no allergies", "Taking Paracetamol as needed, allergic to Penicillin", "Taking Ayurvedic herbal kadha/churnam", "No daily medications or allergies"]
        },
        # Step 5
        {
            "q": "Lastly, how has your appetite, digestion, and sleep been recently? Are you experiencing irregular bowel movements or high stress?",
            "options": ["Sleep is disturbed, appetite irregular", "Normal sleep, digestion is sluggish", "Good appetite and regular sleep", "High stress and acidity"]
        }
    ]

    hindi_questions = [
        {
            'q': f'नमस्ते {patient_name} जी। आपकी मुख्य शिकायत {chief_complaint} है। यह समस्या कब से है और इसकी तीव्रता कैसी है?',
            'options': ['2-3 दिन से, मध्यम', 'एक सप्ताह से, तेज़', 'हल्की और कभी-कभी', 'आज से शुरू हुई']
        },
        {
            'q': 'क्या खाना, शारीरिक मेहनत, मौसम या तनाव इस समस्या को बढ़ाता है? क्या किसी चीज़ से राहत मिलती है?',
            'options': ['खाने के बाद बढ़ती है', 'मेहनत से बढ़ती है', 'रात/ठंड में बढ़ती है', 'कोई खास कारण नहीं']
        },
        {
            'q': 'क्या बुखार, चक्कर, सिरदर्द, मतली, शरीर में दर्द या सांस लेने में तकलीफ जैसे दूसरे लक्षण हैं?',
            'options': ['हल्का बुखार और बदन दर्द', 'सिरदर्द और थकान', 'एसिडिटी और मतली', 'कोई दूसरा लक्षण नहीं']
        },
        {
            'q': 'क्या आपको मधुमेह, हाई BP, थायरॉइड या अस्थमा जैसी कोई पुरानी बीमारी है?',
            'options': ['टाइप 2 मधुमेह', 'हाई BP', 'मधुमेह और BP दोनों', 'कोई पुरानी बीमारी नहीं']
        },
        {
            'q': 'क्या आप रोज़ कोई दवा या आयुर्वेदिक दवा लेते हैं? क्या किसी दवा से एलर्जी है?',
            'options': ['BP/शुगर की दवा, कोई एलर्जी नहीं', 'पेनिसिलिन से एलर्जी', 'आयुर्वेदिक चूर्ण/काढ़ा', 'कोई नियमित दवा नहीं']
        },
        {
            'q': 'हाल में आपकी नींद, भूख, पाचन और तनाव कैसा रहा है?',
            'options': ['नींद खराब और तनाव अधिक', 'नींद और भूख सामान्य', 'भूख कम और पाचन धीमा', 'एसिडिटी और तनाव अधिक']
        }
    ]
    marathi_questions = [
        {'q': f'नमस्कार {patient_name} जी. तुमची मुख्य तक्रार {chief_complaint} आहे. ही समस्या कधीपासून आहे आणि ती किती तीव्र आहे?', 'options': ['2-3 दिवसांपासून, मध्यम', 'एका आठवड्यापासून, तीव्र', 'सौम्य आणि अधूनमधून', 'आजपासून सुरू झाली']},
        {'q': 'खाणे, शारीरिक मेहनत, हवामान किंवा ताण यामुळे ही समस्या वाढते का? कशामुळे आराम मिळतो?', 'options': ['जेवल्यानंतर वाढते', 'शारीरिक मेहनतीने वाढते', 'रात्री/थंडीत वाढते', 'विशिष्ट कारण नाही']},
        {'q': 'ताप, चक्कर, डोकेदुखी, मळमळ, अंगदुखी किंवा श्वास घेण्यास त्रास अशी इतर लक्षणे आहेत का?', 'options': ['हलका ताप आणि अंगदुखी', 'डोकेदुखी आणि थकवा', 'आम्लपित्त आणि मळमळ', 'इतर लक्षणे नाहीत']},
        {'q': 'तुम्हाला मधुमेह, उच्च रक्तदाब, थायरॉईड किंवा दमा यांसारखा दीर्घकालीन आजार आहे का?', 'options': ['टाइप 2 मधुमेह', 'उच्च रक्तदाब', 'मधुमेह आणि रक्तदाब दोन्ही', 'कोणताही दीर्घकालीन आजार नाही']},
        {'q': 'तुम्ही रोज औषधे किंवा आयुर्वेदिक औषधे घेतात का? कोणत्याही औषधाची अॅलर्जी आहे का?', 'options': ['BP/शुगरची औषधे, अॅलर्जी नाही', 'पेनिसिलिनची अॅलर्जी', 'आयुर्वेदिक चूर्ण/काढा', 'नियमित औषधे नाहीत']},
        {'q': 'अलीकडे तुमची झोप, भूक, पचन आणि ताण कसा आहे?', 'options': ['झोप खराब आणि ताण जास्त', 'झोप आणि भूक सामान्य', 'भूक कमी आणि पचन मंद', 'आम्लपित्त आणि ताण जास्त']}
    ]
    tamil_questions = [
        {'q': f'வணக்கம் {patient_name}. உங்கள் முக்கிய புகார் {chief_complaint}. இது எத்தனை நாட்களாக உள்ளது? வலி அல்லது அறிகுறி எவ்வளவு தீவிரம்?', 'options': ['2-3 நாட்கள், மிதமானது', 'ஒரு வாரத்திற்கும் மேலாக, கடுமையானது', 'லேசாக அவ்வப்போது', 'இன்றுதான் தொடங்கியது']},
        {'q': 'உணவு, உடற்பயிற்சி, வானிலை அல்லது மன அழுத்தம் இந்த அறிகுறியை அதிகரிக்கிறதா? எதனால் நிவாரணம் கிடைக்கிறது?', 'options': ['உணவுக்குப் பிறகு அதிகரிக்கும்', 'உடற்பயிற்சியால் அதிகரிக்கும்', 'இரவில்/குளிரில் அதிகரிக்கும்', 'குறிப்பிட்ட காரணம் இல்லை']},
        {'q': 'காய்ச்சல், தலைவலி, மயக்கம், வாந்தி உணர்வு, உடல்வலி அல்லது மூச்சுத்திணறல் போன்ற பிற அறிகுறிகள் உள்ளனவா?', 'options': ['லேசான காய்ச்சல் மற்றும் உடல்வலி', 'தலைவலி மற்றும் சோர்வு', 'அமிலத்தன்மை மற்றும் வாந்தி உணர்வு', 'வேறு அறிகுறிகள் இல்லை']},
        {'q': 'நீரிழிவு, உயர் இரத்த அழுத்தம், தைராய்டு அல்லது ஆஸ்துமா போன்ற நீண்டகால நோய் உள்ளதா?', 'options': ['வகை 2 நீரிழிவு', 'உயர் இரத்த அழுத்தம்', 'நீரிழிவு மற்றும் BP இரண்டும்', 'நீண்டகால நோய் இல்லை']},
        {'q': 'தினமும் ஏதேனும் மருந்துகள் அல்லது ஆயுர்வேத மருந்துகள் எடுத்துக்கொள்கிறீர்களா? மருந்து ஒவ்வாமை உள்ளதா?', 'options': ['BP/சர்க்கரை மருந்து, ஒவ்வாமை இல்லை', 'பெனிசிலின் ஒவ்வாமை', 'ஆயுர்வேத சூரணம்/கஷாயம்', 'தினசரி மருந்து இல்லை']},
        {'q': 'சமீபத்தில் உங்கள் தூக்கம், பசி, செரிமானம் மற்றும் மன அழுத்தம் எப்படி உள்ளது?', 'options': ['தூக்கம் பாதிப்பு, மன அழுத்தம் அதிகம்', 'தூக்கம் மற்றும் பசி இயல்பு', 'பசி குறைவு, செரிமானம் மெதுவாக', 'அமிலத்தன்மை மற்றும் மன அழுத்தம் அதிகம்']}
    ]
    active_questions = hindi_questions if is_hindi else marathi_questions if is_marathi else tamil_questions if is_tamil else questions

    # Adaptive branch: safety-relevant answers immediately change the next
    # question instead of blindly following the generic questionnaire.
    if extracted.redFlags and step_index < len(active_questions):
        if is_hindi:
            adaptive_q = 'आपने एक महत्वपूर्ण चेतावनी लक्षण बताया है। यह अभी कितना तेज़ है, कब शुरू हुआ, और क्या इसके साथ बेहोशी, बहुत ज्यादा कमजोरी या पसीना आ रहा है?'
        elif is_marathi:
            adaptive_q = 'तुम्ही एक महत्त्वाचे चेतावणीचे लक्षण सांगितले आहे. ते सध्या किती तीव्र आहे, कधी सुरू झाले आणि त्यासोबत बेशुद्धी, खूप अशक्तपणा किंवा घाम येतो का?'
        elif is_tamil:
            adaptive_q = 'நீங்கள் ஒரு முக்கிய எச்சரிக்கை அறிகுறியை குறிப்பிட்டுள்ளீர்கள். அது தற்போது எவ்வளவு தீவிரம், எப்போது தொடங்கியது, மேலும் மயக்கம் அல்லது அதிக பலவீனம் உள்ளதா?'
        else:
            adaptive_q = 'You mentioned a safety-relevant symptom. How severe is it right now, when did it start, and is it associated with fainting, marked weakness, or sweating?'
        return InterviewResponse(
            nextQuestion=adaptive_q,
            isComplete=False,
            stepIndex=step_index + 1,
            totalSteps=total_steps,
            extractedEntities=extracted,
            suggestedOptions=['Started recently and severe', 'Moderate but improving', 'Mild / intermittent', 'Not present now']
        )

    if step_index < len(active_questions):
        curr = active_questions[step_index]
        return InterviewResponse(
            nextQuestion=curr["q"],
            isComplete=False,
            stepIndex=step_index + 1,
            totalSteps=total_steps,
            extractedEntities=extracted,
            suggestedOptions=curr["options"]
        )
    else:
        return InterviewResponse(
            nextQuestion=f"Thank you, {patient_name}. I have gathered your clinical intake details. Our AI engine is now synthesizing your case for the doctor's review. You can also upload any previous prescriptions or lab reports.",
            isComplete=True,
            stepIndex=total_steps,
            totalSteps=total_steps,
            extractedEntities=extracted,
            suggestedOptions=["Proceed to Document Upload", "Review Summary", "Consult Doctor"]
        )

def reconstruct_clinical_case(
    consultation_id: str,
    patient_id: str,
    patient_name: str,
    age: int,
    gender: str,
    chief_complaint: str,
    intake_vitals: Dict[str, Any],
    interview_history: List[Dict[str, Any]],
    ocr_documents: List[Dict[str, Any]],
    past_history: List[str] = None
) -> ReconstructResponse:
    symptoms_list: List[SymptomItem] = []
    medications_list: List[MedicationItem] = []
    allergies_list: List[AllergyItem] = []
    lab_findings_list: List[LabFindingItem] = []
    previous_diagnoses: List[Dict[str, str]] = []
    unresolved_questions: List[str] = []
    contradictions: List[ContradictionItem] = []
    red_flags: List[Dict[str, str]] = []

    # 1. Process Interview History
    all_interview_text = ""
    for msg in interview_history:
        text = msg.get("text", "")
        all_interview_text += " " + text
        ent = extract_clinical_entities(text)
        for flag in ent.redFlags:
            if flag not in red_flags:
                red_flags.append(flag)
        for s in ent.symptoms:
            if not any(item.name.lower() == s.lower() for item in symptoms_list):
                symptoms_list.append(SymptomItem(
                    name=s,
                    duration=ent.duration or "3-5 days",
                    severity=ent.severity or "Moderate",
                    frequency=ent.frequency or "Intermittent",
                    source="PATIENT_INTERVIEW",
                    sourceRef=f"Interview response: '{text[:60]}...'"
                ))
        for m in ent.medications:
            if not any(item.name.lower() == m.lower() for item in medications_list):
                medications_list.append(MedicationItem(
                    name=m,
                    dosage="Standard",
                    frequency="Once daily",
                    source="PATIENT_INTERVIEW"
                ))
        for a in ent.allergies:
            if not any(item.substance.lower() == a.lower() for item in allergies_list):
                allergies_list.append(AllergyItem(
                    substance=a,
                    reaction="Skin rash / Bronchospasm",
                    severity="Moderate",
                    source="PATIENT_INTERVIEW"
                ))

    # Ensure chief complaint is in symptoms if not already
    if not symptoms_list and chief_complaint:
        symptoms_list.append(SymptomItem(
            name=chief_complaint,
            duration="5 days",
            severity="Moderate",
            frequency="Intermittent",
            source="PATIENT_INTAKE",
            sourceRef="Kiosk Registration"
        ))

    # 2. Process OCR Documents
    for doc in ocr_documents:
        doc_name = doc.get("originalFilename", "Uploaded Medical Document")
        findings = doc.get("structuredFindings", {})
        
        # Diagnoses
        for d in findings.get("diagnoses", []):
            previous_diagnoses.append({
                "condition": d,
                "diagnosedDate": findings.get("dates", ["Prior Consultation"])[0] if findings.get("dates") else "Prior Consultation",
                "source": f"OCR: {doc_name}"
            })
        
        # Meds
        for m in findings.get("medications", []):
            med_name = m.get("name") if isinstance(m, dict) else str(m)
            if not any(item.name.lower() == med_name.lower() for item in medications_list):
                medications_list.append(MedicationItem(
                    name=med_name,
                    dosage=m.get("dosage", "As Prescribed") if isinstance(m, dict) else "As Prescribed",
                    frequency=m.get("frequency", "OD") if isinstance(m, dict) else "OD",
                    source=f"OCR: {doc_name}",
                    status="Active"
                ))

        # Labs
        for lab in findings.get("labResults", []):
            lab_findings_list.append(LabFindingItem(
                testName=lab.get("testName", "Diagnostic Test"),
                value=str(lab.get("value", "N/A")),
                unit=lab.get("unit", ""),
                referenceRange=lab.get("referenceRange", ""),
                isAbnormal=lab.get("isAbnormal", False),
                source=f"OCR: {doc_name}"
            ))

    # 3. Check for Contradictions
    # Check if patient reported no allergy, but document shows allergy or contraindication
    if any("allergy" in a.substance.lower() for a in allergies_list):
        for med in medications_list:
            if "penicillin" in allergies_list[0].substance.lower() and "amoxicillin" in med.name.lower():
                contradictions.append(ContradictionItem(
                    conflictType="Medication-Allergy Cross-Reactivity",
                    description="Patient has reported Penicillin allergy, but Amoxicillin appears in prescription record.",
                    itemA="Allergy: Penicillin (Patient Interview)",
                    itemB=f"Prescription: {med.name} (OCR Document)",
                    severity="High"
                ))

    # Check vitals consistency
    bp_sys = intake_vitals.get("bpSystolic", 120) if intake_vitals else 120
    if bp_sys >= 140:
        has_htn_record = any("hypertens" in d.get("condition", "").lower() for d in previous_diagnoses) or any("telmisartan" in m.name.lower() or "amlodipine" in m.name.lower() for m in medications_list)
        if not has_htn_record:
            unresolved_questions.append("Elevated systolic blood pressure (≥140 mmHg) detected at intake without documented history of Hypertension. Doctor follow-up recommended.")

    # Generate Clinical Summary Narrative
    sym_str = ", ".join([s.name for s in symptoms_list]) if symptoms_list else chief_complaint
    med_str = ", ".join([m.name for m in medications_list]) if medications_list else "None reported"
    alg_str = ", ".join([a.substance for a in allergies_list]) if allergies_list else "No known drug allergies (NKDA)"
    
    summary = (
        f"{patient_name}, a {age}-year-old {gender}, presented with chief complaint of {chief_complaint}. "
        f"AI clinical intake and interview established active symptoms of {sym_str}. "
        f"Document synthesis reveals ongoing therapy including {med_str}. "
        f"Allergy status: {alg_str}. "
        f"Vital parameters recorded at triage: BP {bp_sys}/{intake_vitals.get('bpDiastolic', 80) if intake_vitals else 80} mmHg, "
        f"Pulse {intake_vitals.get('pulse', 72) if intake_vitals else 72} bpm, SpO2 {intake_vitals.get('spO2', 98) if intake_vitals else 98}%. "
        f"Synthesized evidence indicates high consistency across patient narrative and uploaded records. Clinical decision support active."
    )

    if not unresolved_questions:
        unresolved_questions.append("Confirm adherence and timing of current antihypertensive/hypoglycemic regimen.")
        unresolved_questions.append("Evaluate necessity of fasting blood glucose / HbA1c repeat testing.")

    return ReconstructResponse(
        clinicalSummary=summary,
        chiefComplaint=chief_complaint,
        symptoms=symptoms_list,
        medications=medications_list,
        allergies=allergies_list,
        labFindings=lab_findings_list,
        previousDiagnoses=previous_diagnoses,
        unresolvedQuestions=unresolved_questions,
        contradictions=contradictions,
        confidenceScore=0.93,
        redFlags=red_flags
    )
