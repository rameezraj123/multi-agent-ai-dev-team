"""Run generated code: syntax check and pytest in a temp folder.

The generated code is untrusted, so it runs in a separate process with:
  * a scrubbed environment (no API keys or database passwords),
  * a timeout,
  * CPU, memory and file-size limits on Linux/macOS.
It can still use the network, so only expose the app to people you trust (see ACCESS_CODE).
"""
import os
import subprocess
import sys
import tempfile
from pathlib import Path

from app.utils.files import is_safe_path

MEMORY_LIMIT_KB = 1024 * 1024  # 1 GB
FILE_SIZE_LIMIT_BLOCKS = 20480  # about 10 MB


def write_project(root: Path, files: dict[str, str]) -> None:
    for rel, content in files.items():
        if not is_safe_path(rel):
            continue
        target = root / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")


def check_syntax(files: dict[str, str]) -> str:
    """Return a description of syntax errors, or '' when all .py files compile."""
    errors = []
    for rel, content in files.items():
        if rel.endswith(".py"):
            try:
                compile(content, rel, "exec")
            except SyntaxError as exc:
                errors.append(f"{rel}, line {exc.lineno}: {exc.msg}")
    return "\n".join(errors)


def clean_env(workdir: Path) -> dict[str, str]:
    """Only the variables Python needs. Secrets from the server never reach generated code."""
    env = {
        "PATH": os.environ.get("PATH", ""),
        "PYTHONPATH": str(workdir),
        "PYTHONDONTWRITEBYTECODE": "1",
        "HOME": str(workdir),
        "TMPDIR": str(workdir),
        "TEMP": str(workdir),
        "TMP": str(workdir),
    }
    for key in ("SYSTEMROOT", "COMSPEC", "PATHEXT", "LANG", "LC_ALL"):  # needed on Windows
        if key in os.environ:
            env[key] = os.environ[key]
    return env


def run_python_sandboxed(args: list[str], cwd: Path, timeout: int) -> subprocess.CompletedProcess:
    cmd = [sys.executable, *args]
    if os.name == "posix":
        script = (
            f"ulimit -v {MEMORY_LIMIT_KB}; ulimit -t {timeout + 5}; "
            f"ulimit -f {FILE_SIZE_LIMIT_BLOCKS}; exec \"$0\" \"$@\""
        )
        cmd = ["sh", "-c", script, *cmd]
    return subprocess.run(
        cmd,
        cwd=cwd,
        capture_output=True,
        text=True,
        timeout=timeout,
        stdin=subprocess.DEVNULL,
        env=clean_env(cwd),
    )


def run_pytest(files: dict[str, str], timeout: int) -> tuple[bool, str]:
    """Write files to a temp folder and run pytest there. Returns (passed, output)."""
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        write_project(root, files)
        try:
            result = run_python_sandboxed(
                ["-m", "pytest", "-q", "-x", "--tb=short", "-p", "no:cacheprovider"],
                root,
                timeout,
            )
        except subprocess.TimeoutExpired:
            return False, (
                f"Tests timed out after {timeout} seconds "
                "(possible infinite loop or code waiting for input)."
            )
        output = (result.stdout + "\n" + result.stderr).strip()
        return result.returncode == 0, output[-4000:]
