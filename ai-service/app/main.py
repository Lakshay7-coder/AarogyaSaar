from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import interview, reconstruct, completeness, ayush, ocr

app = FastAPI(
    title="AarogyaSaar AI & OCR Service",
    description="SIH26047 - Clinical Case Intake, Adaptive Interview, Entity Extraction, Reconstruction & AYUSH Engine",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(interview.router)
app.include_router(reconstruct.router)
app.include_router(completeness.router)
app.include_router(ayush.router)
app.include_router(ocr.router)

@app.get("/")
def root():
    return {
        "service": "AarogyaSaar AI & OCR Microservice",
        "status": "operational",
        "mode": "deterministic-clinical-ai",
        "endpoints": [
            "/ai/interview",
            "/ai/next-question",
            "/ai/extract",
            "/ai/reconstruct",
            "/ai/completeness",
            "/ai/ayush",
            "/ocr/process",
            "/docs"
        ]
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ai-ocr-service",
        "engine": "active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
