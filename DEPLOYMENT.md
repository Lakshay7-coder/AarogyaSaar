# AarogyaSaar — Production Deployment

## Service split
- Vercel: `frontend/` (React + Vite)
- Node hosting: `backend/` (Express + MongoDB)
- Python hosting: `ai-service/` (FastAPI + OCR)
- Database: MongoDB Atlas

## Vercel settings
Root Directory: `frontend`
Build Command: `npm run build`
Output Directory: `dist`
Environment variable: `VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api`

`frontend/vercel.json` handles React Router deep links.

## Backend environment
Set `NODE_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `AI_SERVICE_URL`, and `FRONTEND_URL`.

## AI service
Deploy `ai-service/` with its Dockerfile, or run:
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`
The included Dockerfile installs Tesseract.

## OCR production fix
The Node backend now uploads document bytes to the AI service. It no longer assumes the AI service can access the backend's local filesystem.

## Demo test
After deployment test login, SIH Demo Case, interview, voice, document upload/OCR, reconstruction, evidence, completeness, timeline, AYUSH, doctor verification, FHIR, refresh on deep routes, and Android Chrome.
Never expose secrets as `VITE_*`.
