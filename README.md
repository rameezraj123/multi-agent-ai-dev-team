# Multi-Agent AI Software Development Team

Four AI agents (Project Manager, Developer, Tester, Code Reviewer) collaborate through a
LangGraph workflow to turn a plain-English requirement into a tested Python project.

Stack: Python, LangGraph, Groq, FastAPI, PostgreSQL, React (Vite).

## How it works
```
Project Manager -> Developer -> Tester --(tests pass)--> Code Reviewer
                       ^           |
                       +--(fail)---+   up to 3 fix attempts
```

## First-time setup
1. Run `setup.bat`, then fill in `backend/.env` (Groq key and database URL).
2. In `backend`, activate the venv and run `python -m app.doctor` to verify the setup.

## Run the app
Double-click `run_all.bat`, then open http://localhost:5173

Or run separately: `run_backend.bat` (API docs at http://localhost:8000/docs) and `run_frontend.bat`.

## Try the agents without the website
`cd backend`, activate the venv, then: `python -m app.cli "Build a command-line todo list manager"`
