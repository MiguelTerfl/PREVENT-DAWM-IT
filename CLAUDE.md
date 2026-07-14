# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PREVENT Dawn** is a digital health research platform for diabetes prevention. It combines a multi-agent AI system (using Motivational Interviewing and the Transtheoretical Model) with a React frontend and Python FastAPI backend. It's research-grade: conversations are persisted for potential RCT validation.

## Commands

### Frontend (run from `frontend/`)
```bash
npm run dev        # Dev server on http://localhost:5173
npm run build      # Production build
npm run lint       # ESLint
```

### Backend (run from repo root, with venv activated)
```bash
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

python -m uvicorn main:app --reload  # Dev server on http://localhost:8000
```

### Tests (from repo root, venv activated)
```bash
python -m pytest tests/integration/test_api_v1.py -v
```

### Quick start (both services)
```bash
# Windows
start_app.bat
# macOS/Linux
./start_app.sh
```

## Environment Setup

Create `backend/.env` with:
```
GOOGLE_API_KEY=...         # Primary Gemini key
GOOGLE_API_KEY_2=...       # Secondary (failover)
GOOGLE_API_KEY_3=...       # Tertiary (failover)
OPENAI_API_KEY=...         # Final fallback
SUPABASE_URL=...
SUPABASE_KEY=...
```

The Vite dev server proxies `/api` to `http://127.0.0.1:8000`. The backend is imported as a package (`from backend.orchestrator...`), so `uvicorn` must be run from the **repo root**, not from inside `backend/`.

## Architecture

### Backend Multi-Agent System

The core is an **Orchestrator** (`backend/orchestrator/orchestrator.py`) that:
1. Receives every user message via `POST /api/chat`
2. Looks up or creates `AgentState` from Supabase persistence
3. Routes to the appropriate agent based on the current stage
4. Returns the agent's response and updates persisted state

**Four agents** (`backend/agents/`):
- `IntakeAgent` — captures user nickname, initial engagement
- `MotivationAgent` — Motivational Interviewing using OARS; extracts readiness/importance/confidence scores and barriers/facilitators
- `EducationAgent` — health education using Elicit-Provide-Elicit model
- `CoachingAgent` — SMART goal setting and habit formation

Each agent uses **DSPy signatures** (`backend/models/signatures.py`) to define structured LLM input/output, rather than raw prompt strings.

**LLM calls flow through the MCP server** (`backend/mcp_server/mcp_server.py`), which:
- Injects conversation history + patient profile into every call
- Implements a failover stack: Gemini Primary → Secondary → Tertiary → OpenAI
- Handles 429 rate limits with exponential backoff

**State machine** (`backend/models/state_machine.py`) enforces the 6-stage PREVENT Patient Journey:
`IDENTIFY → INFORM → EDUCATE_MOTIVATE → EXPLORE_COMMIT → ENGAGE → SUSTAIN`

**Persistence** (`backend/services/persistence.py`) uses Supabase (PostgreSQL) in production and falls back to SQLite (`aiosqlite`) locally. Key tables: `patients`, `profiles`, conversation records.

**Data models** (`backend/models/data_models.py`): `PatientProfile`, `AgentState`, `Message`, `OrchestratorRequest`, `OrchestratorResponse`.

### Frontend

React + Vite app in `frontend/src/`:
- `App.tsx` — route definitions (Splash, Onboarding, Dashboard, Chat, Settings, Admin)
- `pages/Chat.tsx` — main conversational UI; sends messages to `/api/chat` and updates dashboard insights in real time
- `api/client.ts` — Axios instance (base URL `/api`, proxied to backend)
- `components/` — `motivation/` for dashboard cards, `common/` for shared UI, `ui/` for shadcn primitives

The UI uses Framer Motion for animations and glassmorphism (Tailwind + custom CSS). User ID is persisted in `localStorage`.

## Development Workflow

We follow **Task Decoupled Planning (TDP)**:  
**Plan** (draft `implementation_plan.md`) → **Execute** → **Verify**

Branch naming: `feature/`, `fix/`, `docs/`, `chore/`. All merges to `main` require a PR.

## Privacy Rules

This is a digital health platform with strict Privacy by Design requirements:

- **Never design features that ingest real names, emails, or phone numbers from external health networks.** Use `PREVENT_ID` (a UUID) and user-provided nicknames only.
- **Data minimization**: only process clinical variables needed for the user's current stage.
- **Pseudonymity**: the system maps `user_id` (frontend) to `prevent_id` (UUID) at the persistence layer; no PII should flow beyond that boundary.
- All AI agents must disclose their nature as an AI assistant.
