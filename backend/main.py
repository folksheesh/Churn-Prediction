from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routers import predictions, analytics

app = FastAPI(title="ChurnSense API", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["Predictions"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": True}
