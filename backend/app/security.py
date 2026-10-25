"""Simple shared access code, so strangers can't spend your Groq quota."""
import hmac

from fastapi import Header, HTTPException

from app import config


def require_access(x_access_code: str | None = Header(default=None)) -> None:
    if not config.ACCESS_CODE:  # not configured: local development
        return
    supplied = (x_access_code or "").encode()
    if not hmac.compare_digest(supplied, config.ACCESS_CODE.encode()):
        raise HTTPException(status_code=401, detail="Invalid or missing access code")
