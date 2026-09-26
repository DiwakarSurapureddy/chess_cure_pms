from fastapi import FastAPI

app = FastAPI(
    title="Chess Cure API",
    description="Backend API for Chess Cure",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "message": "Chess Cure Backend is Running!"
    }


@app.get("/api/health")
def health_check():
    return {
        "success": True,
        "message": "Chess Cure API is healthy"
    }