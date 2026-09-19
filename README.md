# AarogyaSaar (SIH26047)
### AI-Powered Clinical Case Intake, Reconstruction, Evidence Provenance, AYUSH Assessment & ABDM/FHIR Interoperability Platform

## FINAL SIH BUILD — reliability freeze

This package is prepared as a demo-focused build: repeated Demo Case loads generate fresh
patient/consultation IDs, doctor finalization has a correct consultation-only validation,
browser voice recognition keeps a stable microphone session across React renders, and
patient-reported safety flags are surfaced as physician-review alerts (never as diagnosis).

### Fastest Windows start
1. Start MongoDB locally on `127.0.0.1:27017`, **or** use `docker compose up -d mongodb`.
2. Double-click `start-aarogyasaar.bat`. It creates `ai-service\.venv` automatically and
   installs dependencies only when they are missing.
3. Open `http://localhost:5173`.
4. Choose **Doctor → Continue as Doctor → Load SIH Demo Case**.
5. For voice, use Chrome/Edge, allow microphone access, choose Hindi, tap the microphone,
   speak a sentence, and wait for the transcript to be submitted automatically.

### Docker option
Run `docker compose up --build` from this folder. Then open `http://localhost:5173`.

> Voice input uses the browser Web Speech API. Browser permission and browser support still
> apply. The clinical AI/OCR services also contain deterministic local fallbacks so a missing
> external LLM key does not block the core prototype.

[![SIH26047](https://img.shields.io/badge/SIH-26047-emerald.svg)](https://sih.gov.in)
[![FHIR R4](https://img.shields.io/badge/HL7_FHIR-Release_4-blue.svg)](https://hl7.org/fhir/r4/)
[![ABDM Ready](https://img.shields.io/badge/ABDM-HIP_Sandbox_Ready-teal.svg)](https://abdm.gov.in)
[![Architecture](https://img.shields.io/badge/Architecture-Full--Stack_Connected-orange.svg)]()

AarogyaSaar is an end-to-end clinical case intake, multimodal synthesis, and interoperability platform engineered for primary health centers (PHCs), hospital outpatient kiosks, and integrated AYUSH wellness centers across India.

---

## 🌟 Key Highlights & Engineering Principles

- **One Continuous Patient Journey**: Every data entity (vitals, voice turns, prescription scans, OCR extractions, and AYUSH doshas) persists into MongoDB under a single traceable `Patient ID` and `Consultation ID`.
- **12 Connected Real Functional Screens**: Not mockups or isolated pages. Every button performs real database mutations and state transitions.
- **Multimodal Clinical Synthesis**: Merges kiosk intake + AI voice interview + OCR prescription scans + medical history into a unified clinical case dossier with contradiction detection.
- **Deterministic Local Fallback Mode**: The entire AI interview, NLP entity extraction, case reconstruction, and OCR engine operate autonomously even without external LLM API keys.
- **Clinical Decision Support**: All AI outputs are non-autonomous recommendations that require attending physician verification (`VERIFY`, `EDIT`, `REJECT`) before inclusion into official records.
- **HL7 FHIR R4 & ABDM HIP Document Bundle**: Generates standard JSON bundles featuring `Patient`, `Encounter`, `Condition`, `Observation`, `MedicationStatement`, `AllergyIntolerance`, `DiagnosticReport`, and `DocumentReference` resources conforming to NRCeS standards.

---

## 🏗️ Monorepo Architecture

```
AarogyaSaar/
├── frontend/                     # React + Vite + Tailwind CSS + Lucide Icons
│   ├── src/
│   │   ├── api/client.js         # Axios client with JWT interceptor
│   │   ├── context/              # AuthContext, CaseContext (state of continuous journey)
│   │   ├── components/           # Navbar, Sidebar, VoiceVisualizer, EvidenceBadge, CompletenessGauge
│   │   ├── pages/                # Screens 1 through 12
│   │   └── App.jsx
│   └── vite.config.js
│
├── backend/                      # Node.js + Express + Mongoose + Swagger
│   ├── src/
│   │   ├── models/               # 13 Mongoose schemas (User, Patient, Consultation, etc.)
│   │   ├── controllers/          # 13 REST controllers
│   │   ├── services/             # aiProxyService, ocrProxyService, fhirService, timelineService
│   │   ├── routes/               # Modular REST endpoints
│   │   └── server.js             # Express entry point on port 3000
│   └── tests/run-tests.js        # Automated 14-step integration test suite
│
├── ai-service/                   # Python FastAPI + OCR + Clinical NLP Engine
│   ├── app/
│   │   ├── routers/              # /ai/interview, /ai/reconstruct, /ai/completeness, /ai/ayush, /ocr/process
│   │   ├── services/             # clinical_engine.py, ocr_engine.py, ayush_engine.py
│   │   └── main.py               # FastAPI entry point on port 8000
│   └── requirements.txt
│
├── uploads/                      # Storage directory for medical prescriptions & lab reports
├── docker-compose.yml            # Multi-service container orchestration
├── .env.example                  # Environment configuration template
└── README.md
```

---

## 🔄 The 12-Screen Clinical Workflow

| Screen | Title | Description |
| :--- | :--- | :--- |
| **1** | **Authentication & Roles** | JWT Auth with 1-click demo logins for Doctor, Patient, and Admin. |
| **2** | **Patient Intake / Kiosk** | Patient demographics, presenting chief complaint, and automated kiosk vitals. Generates IDs. |
| **3** | **AI Voice Interview** | Web Speech API speech-to-text recognition, speech synthesis, adaptive questioning, and real-time clinical NLP extraction. |
| **4** | **Medical Document Upload & OCR** | PDF/Image upload, PyMuPDF OCR, structured diagnoses, medications, and lab results extraction. |
| **5** | **Clinical Case Reconstruction** | Synthesized narrative summary, symptoms, active medications, lab values, and conflict/contradiction detection. |
| **6** | **Evidence & Provenance** | Interactive graph tracing every finding back to its primary interview transcript turn or OCR document line. |
| **7** | **Completeness Engine** | Multi-category scoring (Demographics, Symptoms, Meds, Labs, AYUSH, Verification) with follow-up questions. |
| **8** | **Patient Timeline** | Interactive chronological event ledger tracking kiosk check-in, AI interview, document uploads, and doctor actions. |
| **9** | **AYUSH Assessment** | Prakriti (Vata/Pitta/Kapha), Vikriti, Agni (digestive fire), Dhatu, lifestyle, and classical Ayurvedic herbal regimens. |
| **10** | **Doctor Command Center** | Clinical triage queue showing active encounters, priority flags, completeness meters, and pending verification counts. |
| **11** | **Doctor Verification Workspace** | Doctor supervision workspace: `VERIFY`, `EDIT`, `REJECT`, or `ADD NOTE` per finding with full audit trail and case locking. |
| **12** | **FHIR / ABDM-Ready Record** | Standard HL7 FHIR R4 Bundle generator conforming to ABDM HIP specifications with Copy and Download options. |

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18+ (tested on v22)
- **Python**: 3.10+ (tested on Python 3.13)
- **MongoDB**: Local MongoDB running on `mongodb://127.0.0.1:27017` or Docker

---

### Step 1: Start MongoDB
Ensure MongoDB is running locally on port `27017`:
```powershell
Get-Service -Name *mongo*
```

---

### Step 2: Start the AI Microservice (Port 8000)
```powershell
cd AarogyaSaar/ai-service
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Swagger docs for AI service: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Step 3: Start the Backend API (Port 3000)
```powershell
cd AarogyaSaar/backend
npm install
npm start
```
- Backend Health Check: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- Interactive Swagger API Documentation: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

### Step 4: Start the React Frontend (Port 5173)
```powershell
cd AarogyaSaar/frontend
npm install
npm run dev
```
Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## ⚡ 1-Click SIH Evaluation & Demonstration Guide

To demonstrate the full 12-screen continuous journey within 2 minutes:

1. Open [http://localhost:5173/login](http://localhost:5173/login).
2. Click **"Doctor"** under the 1-Click Demo Logins to immediately log in as `Dr. Vikramaditya Sharma, MD`.
3. In the top navigation bar, click the glowing **"Load SIH Demo Case"** button.
   - This automatically seeds patient **Ramesh Kumar (52Y / Male)** with:
     - Chief Complaint: Type 2 Diabetes, uncontrolled FBS (168 mg/dL), nocturnal foot burning.
     - Completed 6-turn AI Voice Interview.
     - OCR-extracted Apollo Clinic prescription with Metformin, Telmisartan, and HbA1c (8.4%).
     - Multimodal synthesized clinical case dossier.
     - Linked evidence provenance items.
     - AYUSH Prakriti (Pitta-Vata) and Tikshnagni assessment with classical Nisha-Amalaki recommendations.
     - 7 chronological timeline milestones.
4. Click through the sidebar to explore:
   - **Screen 5 (Case Reconstruction)**: View synthesized summary and contradiction checks.
   - **Screen 6 (Evidence)**: Click "Inspect Source" on any finding to view the exact quotation or document snippet.
   - **Screen 7 (Completeness)**: View 85% completeness score and missing items.
   - **Screen 8 (Timeline)**: See chronological patient progression.
   - **Screen 9 (AYUSH)**: Inspect Prakriti dosha distribution and integrative herbal regimen.
   - **Screen 10 (Doctor Queue)**: View patient in outpatient triage list.
   - **Screen 11 (Doctor Verification)**: Verify or edit findings and click **"Finalize & Lock Case"** (triggers celebration confetti).
   - **Screen 12 (FHIR / ABDM)**: View, copy, or download the valid HL7 FHIR R4 Bundle.

---

## 🧪 Automated Testing

Run the end-to-end integration test suite:
```powershell
cd AarogyaSaar/backend
npm test
```
Validates all 12 screen endpoints, database persistence, and FHIR resource compliance.

---

## 🐳 Docker Deployment

To launch all four services (MongoDB, AI Microservice, Node Backend, React Frontend) via Docker Compose:
```bash
docker-compose up --build
```
Access the application at `http://localhost:5173`.

---

## ⚖️ Safety & Regulatory Disclaimers

1. **Clinical Decision Support (CDS)**: AarogyaSaar is designed solely to support qualified medical practitioners. Inferences generated by the AI service are decision-support suggestions and do not constitute autonomous medical diagnoses.
2. **ABDM Sandbox Status**: The interoperability endpoints generate standard-compliant HL7 FHIR R4 schemas and ABDM Milestone 2 payloads. Integration with the live ABDM Health Information Provider (HIP) network requires authorized client credentials from the National Health Authority (NHA).

## SIH Final Showcase Updates

The prototype now prioritizes the six SIH showcase goals:

1. Real multilingual patient interaction — English, Hindi, Marathi and Tamil question/voice paths, with Hindi clinical entity extraction.
2. Visible patient consent — consent is required before an AI-assisted consultation is created and is stored with an audit timeline event.
3. Stronger AYUSH case-taking — Dashavidha Pariksha fields are captured and physician-reviewable.
4. Real document OCR — uploaded image/PDF content is actually extracted; synthetic OCR fallback content has been removed. The demo includes an image-based prescription processed through Tesseract OCR.
5. Doctor 30-second clinical brief — the brief now surfaces the reconstructed AI summary, safety signals and evidence/source context.
6. Demo-ready flow — the seeded SIH patient is configured for a Hindi-language showcase journey.

### OCR demo
Use **Real OCR Demo** on the Document Upload screen. It uploads `frontend/public/demo-prescription.png` through the same `/api/documents/upload` endpoint used for user documents. The AI service uses Tesseract for image OCR and parses the extracted text into clinical entities.

### Important
This is a prototype for SIH demonstration, not a clinical diagnostic or treatment system. AI-generated information remains subject to qualified physician review.
