import io
import zipfile
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import config
from app.constants import RUNNING_STATUSES
from app.database import get_db
from app.models import Project
from app.schemas import ProjectCreate, ProjectDetail, ProjectSummary
from app.security import require_access
from app.workflow.runner import run_project_workflow

router = APIRouter(
    prefix="/api/projects",
    tags=["projects"],
    dependencies=[Depends(require_access)],
)


@router.post("", response_model=ProjectSummary, status_code=201)
def create_project(
    payload: ProjectCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    running = db.scalar(
        select(func.count()).select_from(Project).where(Project.status.in_(RUNNING_STATUSES))
    )
    if running >= config.MAX_CONCURRENT_RUNS:
        raise HTTPException(429, "The agents are busy with other projects. Try again in a minute.")

    since = datetime.now(timezone.utc) - timedelta(days=1)
    today = db.scalar(select(func.count()).select_from(Project).where(Project.created_at >= since))
    if today >= config.MAX_PROJECTS_PER_DAY:
        raise HTTPException(429, "Daily project limit reached. Please try again tomorrow.")

    project = Project(requirement=payload.requirement.strip(), status="queued", files={}, logs=[])
    db.add(project)
    db.commit()
    db.refresh(project)
    # The agents take a while, so they run in the background; the frontend polls for progress.
    background_tasks.add_task(run_project_workflow, project.id)
    return project


@router.get("", response_model=list[ProjectSummary])
def list_projects(db: Session = Depends(get_db)):
    return db.scalars(select(Project).order_by(Project.id.desc())).all()


@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{project_id}/download")
def download_project(project_id: int, db: Session = Depends(get_db)):
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for path, code in (project.files or {}).items():
            zf.writestr(path, code)
        if project.plan:
            zf.writestr("PLAN.md", project.plan)
        if project.review:
            zf.writestr("REVIEW.md", project.review)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=project-{project_id}.zip"},
    )
