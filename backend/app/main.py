from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app import config, models  # noqa: F401  (models import registers the tables)
from app.constants import RUNNING_STATUSES
from app.database import Base, SessionLocal, engine
from app.models import Project
from app.routes import projects
from app.security import require_access


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # creates the tables on first start

    # A restart (or a sleeping free-tier server) kills background runs. Mark those projects as
    # failed so they don't look "in progress" forever and block new runs.
    with SessionLocal() as db:
        for project in db.scalars(select(Project).where(Project.status.in_(RUNNING_STATUSES))):
            project.status = "failed"
            project.error = "The server restarted while this project was running. Please run it again."
        db.commit()
    yield


app = FastAPI(title="Multi-Agent AI Software Development Team", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(projects.router)


@app.get("/api/health")
def health():
    """Open to everyone: used by the hosting platform to check the server is alive."""
    return {
        "status": "ok",
        "groq_key_configured": bool(config.GROQ_API_KEY),
        "access_code_required": bool(config.ACCESS_CODE),
    }


@app.get("/api/auth/check", dependencies=[Depends(require_access)])
def auth_check():
    """The frontend calls this to find out whether the access code is correct."""
    return {"ok": True}
