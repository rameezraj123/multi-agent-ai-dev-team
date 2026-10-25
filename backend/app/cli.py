"""Run the whole agent team from the terminal, without the API or database.

    python -m app.cli "Build a command-line todo list manager"

Generated files are saved to backend/output/<project-name>/
"""
import re
import sys
from pathlib import Path

from app.config import BASE_DIR
from app.utils.runner import write_project
from app.workflow.graph import workflow


def main() -> None:
    if len(sys.argv) < 2:
        print('Usage: python -m app.cli "describe the software you want"')
        return

    requirement = " ".join(sys.argv[1:])
    initial = {"requirement": requirement, "logs": [], "files": {}, "tests": {}, "iterations": 0}
    state = dict(initial)

    for step in workflow.stream(initial):
        for node, update in step.items():
            for key, value in update.items():
                if key == "logs":
                    state["logs"] = state["logs"] + value
                else:
                    state[key] = value
            message = update.get("logs", [{}])[-1].get("message", "")
            print(f"[done] {node}: {message}")

    slug = re.sub(r"[^a-z0-9]+", "-", requirement.lower()).strip("-")[:40] or "project"
    out = Path(BASE_DIR) / "output" / slug
    write_project(out, {**state.get("files", {}), **state.get("tests", {})})
    (out / "PLAN.md").write_text(state.get("plan", ""), encoding="utf-8")
    (out / "REVIEW.md").write_text(state.get("review", ""), encoding="utf-8")

    passes = state.get("iterations", 0)
    print("\nTests passed:", state.get("tests_passed", False))
    print("Developer passes:", passes, "(1 means the code passed without needing fixes)")
    print("Saved to:", out)


if __name__ == "__main__":
    main()
