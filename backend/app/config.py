"""Settings loaded from backend/.env (or from the hosting platform's environment)."""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def normalize_db_url(url: str) -> str:
    """Hosting platforms hand out 'postgres://...' or 'postgresql://...'; SQLAlchemy needs a driver name."""
    url = url.strip()
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg2://" + url[len(prefix):]
    return url


GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
DATABASE_URL = normalize_db_url(os.getenv("DATABASE_URL", ""))
MAX_FIX_ATTEMPTS = int(os.getenv("MAX_FIX_ATTEMPTS", "3"))
TEST_TIMEOUT_SECONDS = int(os.getenv("TEST_TIMEOUT_SECONDS", "60"))

# --- protection for a public deployment ---
# If ACCESS_CODE is set, every API call must send it in the X-Access-Code header.
# Leave it empty for local development.
ACCESS_CODE = os.getenv("ACCESS_CODE", "")
MAX_CONCURRENT_RUNS = int(os.getenv("MAX_CONCURRENT_RUNS", "2"))
MAX_PROJECTS_PER_DAY = int(os.getenv("MAX_PROJECTS_PER_DAY", "20"))

CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    if origin.strip()
]
