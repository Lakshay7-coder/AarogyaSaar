import { useEffect, useState } from 'react';

export const PATIENT_LANGUAGE_KEY = 'aarogya_patient_language';

export const patientTranslations = {
  English: {
    language: 'Language',
    selectLanguage: 'Select your language',
    english: 'English',
    hindi: 'Hindi',
    step: 'Step',
    patientJourney: 'Patient Journey',
    consent: 'Consent',
    interview: 'Interview',
    documents: 'Documents',
    completion: 'Completion',
    patientIntake: 'Patient Intake & Kiosk Triage',
    intakeDescription: 'Record demographic baseline, presenting chief complaints, and automated kiosk vitals.',
    patientDemographics: 'Patient Demographics',
    fullName: 'Full Name', age: 'Age', gender: 'Gender', phone: 'Phone Number',
    bloodGroup: 'Blood Group', chiefComplaint: 'Chief Complaint & Consultation Type',
    primaryComplaint: 'Primary Chief Complaint', complaintPlaceholder: 'Describe your main discomfort, pain location, or symptoms...',
    duration: 'Symptom Duration', consultationType: 'Consultation Type', priority: 'Priority',
    consentTitle: 'Patient Consent', required: 'Required',
    consentText: 'I understand that AarogyaSaar will record my responses in my selected language, use AI-assisted case-taking and extract information from documents I choose to upload. The generated information is a clinical support draft and must be reviewed by a qualified doctor.',
    consentCheck: 'I have read and consent to this AI-assisted case-taking workflow.',
    consentReady: 'Consent captured — ready to start interview',
    consentRequired: 'Consent is required before continuing',
    submitStart: 'Submit & Start AI Interview', submitting: 'Submitting Intake...',
    registered: 'Intake Successfully Registered!', registeredDesc: 'Patient and initial clinical encounter logged into the continuous pipeline.',
    proceedInterview: 'Proceed to Step 3: AI Voice Interview',
    patientId: 'Patient ID', caseId: 'Case / Encounter ID', patientName: 'Patient Name', abha: 'ABHA Address',
    voiceInterview: 'AI Voice & Adaptive Clinical Interview',
    interviewProgress: 'Interview Progress',
    multilingual: 'Multilingual AI Interview', languageActive: 'active',
    languageNote: 'Voice recognition and AI responses use the selected language.',
    safetyFlag: 'Potential Safety Flag Detected', safetyNote: 'Patient-reported warning signal. AarogyaSaar does not diagnose; physician review is required.',
    patient: 'Patient', voice: 'Voice', ai: 'AarogyaSaar AI',
    thinking: 'Preparing the next question...',
    suggestions: 'Suggestions',
    typeAnswer: 'Type your answer or use the microphone to speak...',
    sendAnswer: 'Send Answer',
    interviewComplete: 'Clinical Interview Complete',
    uploadDocuments: 'Step 4: Upload Documents',
    clinicalExtraction: 'Clinical information captured',
    symptoms: 'Symptoms captured', listening: 'Listening for symptom terms...',
    durationSeverity: 'Duration & Severity',
    medications: 'Medications Mentioned', noneLogged: 'None logged in dialogue yet',
    allergies: 'Allergies Reported', noAllergies: 'No drug allergies reported',
    skipNextDocuments: 'Skip / Next: Document Upload',
    documentsTitle: 'Medical Document Upload & OCR',
    documentsDescription: 'Upload a prescription, lab report, or other medical document for information extraction.',
    documentCategory: 'Document Category', prescription: 'Outpatient Prescription (Rx)', lab: 'Laboratory / Diagnostic Investigation', discharge: 'Discharge Summary', other: 'Other Clinical Document',
    chooseDocument: 'Choose PDF, PNG, or JPG Document', maxSize: 'Max size: 15MB • OCR extraction runs automatically on upload',
    uploadExtract: 'Upload & Extract', processing: 'Processing document...', realOcr: 'Real OCR Demo',
    uploadedRecords: 'Uploaded Records', noDocuments: 'No medical documents uploaded yet for this case.',
    ocrDone: 'OCR Complete', sourceDocument: 'Source Document', open: 'Open',
    ocrSourceNote: 'OCR is derived from this uploaded file.', structuredFindings: 'Structured OCR Findings',
    noOcr: 'No OCR findings to display yet.', uploadOcrHint: 'Upload a medical document to extract findings.',
    diagnoses: 'Document Diagnoses', noneDetected: 'None detected', prescriptionMeds: 'Prescription Medications (Rx)',
    investigations: 'Laboratory Investigations', abnormal: 'High / Abnormal', referenceRange: 'Reference Range',
    rawOcr: 'View Raw Extracted OCR Text',
    finishJourney: 'Complete Patient Journey', continueClinical: 'Continue to Clinical Case',
    journeyComplete: 'Your patient information is complete', journeyCompleteDesc: 'Your responses and selected documents are ready for the clinical team to review.',
    goClinical: 'Continue', errorStart: 'Please read and provide patient consent before starting the AI-assisted case-taking workflow.',
    uploadError: 'Upload & document processing failed', interviewError: 'Error sending answer: ',
    next: 'Next', back: 'Back', instructions: 'Please answer one question at a time. You can speak or type your answer.',
    requiredField: 'Required', genderMale: 'Male', genderFemale: 'Female', genderOther: 'Other',
    inPerson: 'In-Person Outpatient', tele: 'Teleconsultation', emergency: 'Emergency Triage', ayush: 'AYUSH Wellness Clinic',
    routine: 'Routine', urgent: 'Urgent', highRisk: 'High Risk', vitals: 'Automated Kiosk Vitals', bp: 'BP (Systolic / Diastolic)', pulse: 'Pulse', spO2: 'Oxygen (SpO₂)', temperature: 'Temperature',
    flow: 'Language → Consent → Interview → Documents → Completion', engine: 'Engine', confidence: 'Confidence', standard: 'Standard', chars: 'characters', severity: 'Severity', startVoice: 'Start Voice Input', stopListening: 'Stop listening', muteVoice: 'Mute AI voice', unmuteVoice: 'Unmute AI voice', listening: 'Listening...', voiceUnsupported: 'Voice input is not supported by this browser. Try Google Chrome or Edge.', micDenied: 'Microphone permission was denied. Allow microphone access and try again.', speechBlocked: 'Speech recognition is blocked by the browser.', noMic: 'No microphone was found. Check your microphone and try again.', noSpeech: 'No speech detected. Tap the microphone and speak clearly.', voiceNetwork: 'Browser speech recognition needs a network connection.', micRestart: 'Microphone is restarting. Please tap again.'
  },
  Hindi: {
    language: 'भाषा', selectLanguage: 'अपनी भाषा चुनें', english: 'अंग्रेज़ी', hindi: 'हिंदी',
    step: 'चरण', patientJourney: 'मरीज़ की प्रक्रिया', consent: 'सहमति', interview: 'बातचीत', documents: 'दस्तावेज़', completion: 'पूर्णता',
    patientIntake: 'मरीज़ की जानकारी और प्रारंभिक जाँच', intakeDescription: 'मरीज़ की मूल जानकारी, मुख्य परेशानी और जाँच से जुड़ी जानकारी दर्ज करें।',
    patientDemographics: 'मरीज़ की जानकारी', fullName: 'पूरा नाम', age: 'उम्र', gender: 'लिंग', phone: 'फ़ोन नंबर', bloodGroup: 'ब्लड ग्रुप',
    chiefComplaint: 'मुख्य परेशानी और परामर्श का प्रकार', primaryComplaint: 'मुख्य परेशानी', complaintPlaceholder: 'अपनी मुख्य परेशानी, दर्द की जगह या लक्षण बताएं...',
    duration: 'लक्षण कितने समय से हैं', consultationType: 'परामर्श का प्रकार', priority: 'प्राथमिकता',
    consentTitle: 'मरीज़ की सहमति', required: 'ज़रूरी',
    consentText: 'मैं समझता/समझती हूँ कि आरोग्यसार मेरी चुनी हुई भाषा में मेरे जवाब दर्ज करेगा, AI की सहायता से केस की जानकारी लेगा और मेरे द्वारा चुने गए दस्तावेज़ों से जानकारी निकालेगा। तैयार की गई जानकारी डॉक्टर की सहायता के लिए है और इसे योग्य डॉक्टर द्वारा जाँचा जाना ज़रूरी है।',
    consentCheck: 'मैंने जानकारी पढ़ ली है और AI की सहायता से केस की जानकारी लेने के लिए सहमत हूँ।',
    consentReady: 'सहमति दर्ज हो गई — अब बातचीत शुरू की जा सकती है', consentRequired: 'आगे बढ़ने के लिए सहमति ज़रूरी है',
    submitStart: 'जानकारी जमा करें और AI बातचीत शुरू करें', submitting: 'जानकारी जमा हो रही है...',
    registered: 'मरीज़ की जानकारी सफलतापूर्वक दर्ज हो गई!', registeredDesc: 'मरीज़ और शुरुआती परामर्श की जानकारी सुरक्षित प्रक्रिया में दर्ज हो गई है।',
    proceedInterview: 'चरण 3 पर जाएँ: AI बातचीत', patientId: 'मरीज़ आईडी', caseId: 'केस / परामर्श आईडी', patientName: 'मरीज़ का नाम', abha: 'ABHA पता',
    voiceInterview: 'AI आवाज़ और आसान मेडिकल बातचीत', interviewProgress: 'बातचीत की प्रगति', multilingual: 'बहुभाषी AI बातचीत', languageActive: 'सक्रिय',
    languageNote: 'आवाज़ पहचान और AI के जवाब चुनी गई भाषा में काम करते हैं।',
    safetyFlag: 'संभावित सावधानी का संकेत', safetyNote: 'यह मरीज़ द्वारा बताई गई जानकारी है। आरोग्यसार बीमारी का निदान नहीं करता; डॉक्टर की जाँच ज़रूरी है।',
    patient: 'मरीज़', voice: 'आवाज़', ai: 'आरोग्यसार AI', thinking: 'अगला सवाल तैयार हो रहा है...', suggestions: 'सुझाव',
    typeAnswer: 'अपना जवाब लिखें या माइक्रोफ़ोन से बोलें...', sendAnswer: 'जवाब भेजें',
    interviewComplete: 'मेडिकल बातचीत पूरी हो गई', uploadDocuments: 'चरण 4: दस्तावेज़ अपलोड करें', clinicalExtraction: 'ज़रूरी जानकारी दर्ज हो रही है',
    symptoms: 'लक्षण', listening: 'लक्षणों की जानकारी सुनी जा रही है...', durationSeverity: 'अवधि और परेशानी की तीव्रता',
    medications: 'बताई गई दवाएँ', noneLogged: 'अभी कोई दवा दर्ज नहीं हुई', allergies: 'एलर्जी की जानकारी', noAllergies: 'दवा की एलर्जी नहीं बताई गई',
    skipNextDocuments: 'छोड़ें / आगे: दस्तावेज़ अपलोड', documentsTitle: 'मेडिकल दस्तावेज़ अपलोड और OCR',
    documentsDescription: 'पर्ची, लैब रिपोर्ट या अन्य मेडिकल दस्तावेज़ अपलोड करें ताकि ज़रूरी जानकारी निकाली जा सके।', documentCategory: 'दस्तावेज़ का प्रकार',
    prescription: 'ओपीडी पर्ची (Rx)', lab: 'लैब / जाँच रिपोर्ट', discharge: 'डिस्चार्ज सारांश', other: 'अन्य मेडिकल दस्तावेज़',
    chooseDocument: 'PDF, PNG या JPG दस्तावेज़ चुनें', maxSize: 'अधिकतम 15MB • अपलोड के बाद OCR अपने आप चलेगा', uploadExtract: 'अपलोड करें और जानकारी निकालें',
    processing: 'दस्तावेज़ की जाँच हो रही है...', realOcr: 'OCR डेमो', uploadedRecords: 'अपलोड किए गए दस्तावेज़', noDocuments: 'इस केस के लिए अभी कोई मेडिकल दस्तावेज़ अपलोड नहीं हुआ है।',
    ocrDone: 'OCR पूरा', sourceDocument: 'मूल दस्तावेज़', open: 'खोलें', ocrSourceNote: 'OCR इसी अपलोड किए गए दस्तावेज़ से निकाला गया है।',
    structuredFindings: 'OCR से मिली जानकारी', noOcr: 'अभी OCR की जानकारी उपलब्ध नहीं है।', uploadOcrHint: 'मेडिकल दस्तावेज़ अपलोड करें ताकि जानकारी निकाली जा सके।',
    diagnoses: 'दस्तावेज़ में मिली बीमारी/निदान', noneDetected: 'कुछ नहीं मिला', prescriptionMeds: 'पर्ची में दी गई दवाएँ (Rx)', investigations: 'लैब जाँच',
    abnormal: 'ज़्यादा / असामान्य', referenceRange: 'सामान्य सीमा', rawOcr: 'निकाला गया OCR टेक्स्ट देखें',
    finishJourney: 'मरीज़ की प्रक्रिया पूरी करें', continueClinical: 'क्लिनिकल केस पर जाएँ', journeyComplete: 'मरीज़ की जानकारी पूरी हो गई',
    journeyCompleteDesc: 'आपके जवाब और चुने गए दस्तावेज़ अब मेडिकल टीम की जाँच के लिए तैयार हैं।', goClinical: 'आगे बढ़ें',
    errorStart: 'AI की सहायता से केस की जानकारी शुरू करने से पहले कृपया सहमति पढ़कर दें।', genderMale: 'पुरुष', genderFemale: 'महिला', genderOther: 'अन्य',
    inPerson: 'सामने से परामर्श', tele: 'टेलीपरामर्श', emergency: 'आपातकालीन प्रारंभिक जाँच', ayush: 'आयुष स्वास्थ्य क्लिनिक', routine: 'सामान्य', urgent: 'तुरंत', highRisk: 'अधिक जोखिम',
    vitals: 'कियोस्क पर दर्ज स्वास्थ्य जाँच', bp: 'ब्लड प्रेशर', pulse: 'नाड़ी', spO2: 'ऑक्सीजन (SpO₂)', temperature: 'तापमान', engine: 'इंजन', confidence: 'विश्वसनीयता', standard: 'सामान्य', chars: 'अक्षर', severity: 'तीव्रता', startVoice: 'आवाज़ से जवाब दें', stopListening: 'सुनना बंद करें', muteVoice: 'AI की आवाज़ बंद करें', unmuteVoice: 'AI की आवाज़ चालू करें', listening: 'सुना जा रहा है...', voiceUnsupported: 'इस ब्राउज़र में आवाज़ से इनपुट उपलब्ध नहीं है। Google Chrome या Edge इस्तेमाल करें।', micDenied: 'माइक्रोफ़ोन की अनुमति नहीं मिली। माइक्रोफ़ोन की अनुमति देकर फिर कोशिश करें।', speechBlocked: 'ब्राउज़र ने आवाज़ पहचानने की सुविधा रोक दी है।', noMic: 'माइक्रोफ़ोन नहीं मिला। माइक्रोफ़ोन जाँचकर फिर कोशिश करें।', noSpeech: 'आवाज़ सुनाई नहीं दी। माइक्रोफ़ोन दबाकर साफ़ बोलें।', voiceNetwork: 'ब्राउज़र की आवाज़ पहचानने के लिए इंटरनेट कनेक्शन चाहिए।', micRestart: 'माइक्रोफ़ोन फिर से शुरू हो रहा है। कृपया दोबारा दबाएँ।',
    flow: 'भाषा → सहमति → बातचीत → दस्तावेज़ → पूर्णता', uploadError: 'दस्तावेज़ अपलोड या जाँच में समस्या हुई।',
    interviewError: 'जवाब भेजने में समस्या: ', next: 'आगे', back: 'वापस', instructions: 'एक बार में एक सवाल का जवाब दें। आप बोलकर या लिखकर जवाब दे सकते हैं।', requiredField: 'ज़रूरी'
  }
};

export const getPatientLanguage = (fallback = 'English') => {
  const stored = localStorage.getItem(PATIENT_LANGUAGE_KEY);
  return stored || fallback;
};

export const savePatientLanguage = (language) => {
  localStorage.setItem(PATIENT_LANGUAGE_KEY, language);
  window.dispatchEvent(new CustomEvent('aarogya-language-change', { detail: language }));
};

export const usePatientLanguage = (fallback = 'English') => {
  const [language, setLanguage] = useState(() => getPatientLanguage(fallback));
  useEffect(() => {
    const update = (event) => setLanguage(event.detail || getPatientLanguage(fallback));
    window.addEventListener('aarogya-language-change', update);
    return () => window.removeEventListener('aarogya-language-change', update);
  }, [fallback]);
  return language;
};

export const t = (language, key) => (patientTranslations[language] || patientTranslations.English)[key] || patientTranslations.English[key] || key;
