from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routers import predictions, analytics, customers
from backend.core.database import engine
from backend.core import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ChurnSense API", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["Predictions"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["Customers"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": True}
