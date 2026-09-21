import sys
from pathlib import Path

# Ensure monorepo root is in sys.path so 'server.app...' package imports resolve correctly
_monorepo_root = Path(__file__).resolve().parent.parent.parent
if str(_monorepo_root) not in sys.path:
    sys.path.insert(0, str(_monorepo_root))

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from server.app.core.config import settings
from server.app.core.database import Base, engine, SessionLocal
from server.app.core.seed import seed_initial_cases
from server.app.api import health
from server.app.api.routes import cases, nasa


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist and seed initial cases on startup
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            seed_initial_cases(db)
        finally:
            db.close()
    except Exception as e:
        print(f"Startup initialization notice: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="TRACE API Server Initial Foundation",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import traceback

# Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred."},
    )

# Include Routers
app.include_router(health.router)
app.include_router(cases.router, prefix="/api")
app.include_router(nasa.router, prefix="/api")


@app.get("/", include_in_schema=False)
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "docs": "/docs",
        "health": "/health",
        "health_db": "/health/db",
    }
