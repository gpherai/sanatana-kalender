from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import goals, practices, sessions, stats

app = FastAPI(
    title="Sadhana Tracker API",
    version="0.1.0",
    description="Mantra japa tracking API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(practices.router)
app.include_router(sessions.router)
app.include_router(stats.router)
app.include_router(goals.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
