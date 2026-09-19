# AarogyaSaar – verification & fixes

This build was reviewed across the frontend, Node/Express backend, and FastAPI AI/OCR service.

## Fixes applied
1. Fixed the demo-doctor ID type mismatch in `DoctorVerification`: demo JWT IDs are strings, while the old schema required a MongoDB ObjectId.
2. Hardened doctor verification against missing/invalid `findingId` values.
3. Added `consultationId` to verification audit details and scoped audit-trail queries to the active consultation.
4. Fixed the Node → FastAPI OCR proxy: `filePath` and `mimeType` are now sent as form fields, matching the FastAPI endpoint. The old query-parameter call caused a 422 and forced the fallback.
5. Improved real OCR parsing for vitals (`BP`, `Pulse`, `SpO2`) when OCR text omits the colon.
6. Canonicalized overlapping diabetes diagnosis labels in OCR output.
7. Changed AI-service CORS to `allow_credentials=False` because wildcard origins cannot be used with credentialed CORS.
8. Added frontend protected routing so application screens redirect to `/login` when no valid session exists.
9. Kept the real bundled OCR demo using the same upload endpoint and real Tesseract pipeline.

## Verification performed
- Node backend source: syntax check passed.
- Python AI/OCR source: compile check passed.
- FastAPI app import + all expected AI/OCR routes: passed.
- Real Tesseract OCR smoke test on `frontend/public/demo-prescription.png`: passed.
- OCR smoke test correctly extracted BP 142/90, pulse 78, SpO2 98 and clinical findings.

## Important local prerequisite
The complete end-to-end MongoDB integration test requires MongoDB to be running on:
`mongodb://127.0.0.1:27017/aarogyasaar`

Then install dependencies:
- `cd ai-service && python -m pip install -r requirements.txt`
- `cd backend && npm install`
- `cd frontend && npm install`

Start:
- AI: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- Backend: `npm start`
- Frontend: `npm run dev`

The supplied launcher scripts can also start the three application services. MongoDB still needs to be available separately (or through Docker Compose).
