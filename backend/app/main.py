
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.translation import router as translation_router


app = FastAPI(
    title="RIMAY API",
    description="API de traducción Español - Quechua",
    version="0.1.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


app.include_router(translation_router)


@app.get("/")
def home():
    return {
        "project": "RIMAY",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "translation-api"
    }
