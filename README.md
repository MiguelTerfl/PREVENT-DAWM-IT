# PREVENT Dawn: AI-Driven Diabetes Prevention Research Platform

**PREVENT Dawn** is a digital health research platform designed to develop and validate next-generation behavioral interventions. It serves as a sandbox for exploring how multi-agent AI systems can support patients at risk of diabetes.

It is named **Dawn** to symbolize a new beginning and hope for patients.

## 🔬 Research & Vision
This platform is intended for researching:
*   **Novel Behavioral Interventions**: Testing scalable, AI-driven coaching based on Motivational Interviewing and the Transtheoretical Model.
*   **Specialized AI Agents**: Orchestrating a team of agents (Nutrition, Activity, Stress) that collaborate to deliver personalized care.
*   **Automated Clinical Validation**: Future capabilities will include an autonomous "Scientist Agent" to facilitate **Randomized Controlled Trials (RCTs)**, allowing the system to run, measure, and validate interventions in real-time.

## Key Features

### 1. Prismatic Dashboard
- **Wellness Strata Visualization**: A premium, "Prismatic" interface that visualizes health data through glassmorphism and subtle animations.
- **Diabetes Risk Strata**: An interactive risk speedometer providing real-time feedback on clinical biomarkers.
- **Wellness Insights**: Replaces clinical scoring with qualitative "Core Strengths" and "Growth Nodes" extracted from conversations.
- **Unified Health ID**: Securely connects users to their personalized clinical profile via a physician-issued access code.

### 2. Agentic Chat (Dawn)
- **Neural Coach Integration**: A conversational AI (Dawn) that performs agentic assessments of motivation, barriers, and facilitators.
- **Dynamic Personalization**: Dawn extracts qualitative insights (facilitators/barriers) during the conversation and updates the dashboard in real-time.
- **Motivational Interviewing**: Uses OARS (Open questions, Affirmations, Reflections, Summaries) to guide users through their health journey without rigid questionnaires.

### 3. Integrated Research Framework
- **Multi-Agent Orchestration**: A backend system that routes conversations between Intake, Motivation, Education, and Coaching agents.
- **Persistence Strata**: Full state management ensuring that conversation history and psychographic assessments persist across sessions.

### 4. Authentication & Privacy
- **Supabase Auth**: Email/password authentication with JWT validation. Dashboard, Chat, Settings, and Admin are protected routes — unauthenticated users are redirected to `/login`.
- **Privacy by Design**: We follow the 7 principles of Privacy by Design. Detailed information is available in [CONCEPT_005_PRIVACY_BY_DESIGN.md](docs/concepts/CONCEPT_005_PRIVACY_BY_DESIGN.md).
- **Pseudonymized Data**: `user_id` (Supabase Auth UUID) maps to `prevent_id` at the persistence layer; no PII crosses that boundary.

Detailed project requirements are documented in the [Product Requirements Document (PRD)](PRODUCT_REQUIREMENTS.md).

To contribute, please see our [CONTRIBUTING.md](CONTRIBUTING.md) guide.

## Tech Stack
- **Frontend**: React (Vite), TypeScript, Framer Motion (Animations), Tailwind CSS, Supabase Auth.
- **Backend**: Python FastAPI, DSPy (LLM Orchestration), Supabase (PostgreSQL), SQLite (local fallback).
- **LLM**: Gemini (Primary/Secondary/Tertiary failover via Google AI Studio) + OpenAI GPT-4o-mini (final fallback).
- **Database & Auth**: Supabase (PostgreSQL + JWT authentication).

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- A [Supabase](https://supabase.com) project (free tier works)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation & Setup

1.  **Clone the repo**:
    ```bash
    git clone <repository_url>
    cd prevent-dawn2
    ```

2.  **Configure Backend environment**:
    Create `backend/.env` (copy from `backend/.env.example`):
    ```
    GOOGLE_API_KEY=your_primary_gemini_key
    GOOGLE_API_KEY_2=your_secondary_gemini_key   # optional, for failover
    GOOGLE_API_KEY_3=your_tertiary_gemini_key    # optional, for failover
    OPENAI_API_KEY=your_openai_key               # optional, final fallback
    SUPABASE_URL=https://your-project-ref.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    SUPABASE_JWT_SECRET=your_jwt_secret_from_supabase_dashboard
    ```

3.  **Configure Frontend environment**:
    Create `frontend/.env` (copy from `frontend/.env.example`):
    ```
    VITE_SUPABASE_URL=https://your-project-ref.supabase.co
    VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
    ```

### Quick Start

#### Windows
Double-click `start_app.bat`. This will:
1.  Check for Node.js and Python.
2.  Set up a Python virtual environment and install dependencies.
3.  Launch both **Backend** and **Frontend** in separate windows.
4.  Open your browser and navigate to `http://localhost:5173` to access the application.

#### macOS / Linux
1.  Open Terminal.
2.  Make the scripts executable: `chmod +x start_app.sh stop_app.sh`
3.  Run the script: `./start_app.sh`
    - This performs the same setup steps as the Windows version and opens new Terminal windows for the services on macOS.


### Manual Installation

1.  **Setup Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev  # http://localhost:5173
    ```
2.  **Setup Backend** (run from the **repo root**, not from inside `backend/`):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    pip install -r backend/requirements.txt
    python -m uvicorn main:app --reload  # http://localhost:8000
    ```

    > **Important**: `uvicorn` must be run from the repo root because the backend is imported as a package (`from backend.orchestrator...`). Running it from inside `backend/` will cause import errors.

## Testing

Run integration tests to verify the system:

```powershell
# Install test dependencies
pip install pytest aiosqlite httpx

# Run all integration tests
python -m pytest tests/integration/test_api_v1.py -v
```

Tests cover:
- ✅ Health check & pseudonymized lookup (Privacy)
- ✅ Audit trail persistence (Research compliance)
- ✅ Agent state machine transitions
- ✅ LLM rate limit resilience
- ✅ Malformed response recovery

For detailed documentation on the testing architecture, mock patterns, and troubleshooting, see **[docs/TESTING.md](docs/TESTING.md)**.
    

## Development History
- **v1.0**: Initial Release with Readiness Assessment, Dashboard, and basic Chat.
- **v2.0 (Prismatic Layer)**:
    - Shifted to **Agentic Motivation Assessment** (Chat-based).
    - Introduced the **Prismatic UI** (Glassmorphism, Outfit/Inter typography).
    - Added **Wellness Insights** (Strengths/Growth Nodes) for natural motivation.
    - Implemented global bottom navigation and mobile optimizations.
- **v3.0 (Database & Auth Layer)**:
    - Integrated **Supabase** for production-grade PostgreSQL persistence (agent state, patient profiles, conversation history).
    - Added **Supabase Auth** (email/password) with JWT validation on the backend; all main routes are now protected.
    - LLM failover stack: Gemini Primary → Secondary → Tertiary → OpenAI GPT-4o-mini.
    - SQLite (`aiosqlite`) retained as a local development fallback when Supabase is unavailable.

## Contributing
We use the **Task Decoupled Planning (TDP)** methodology for all development. Please refer to [CONTRIBUTING.md](CONTRIBUTING.md) and the [TDP Protocol](docs/process/TDP_DEV_PROTOCOL.md) before submitting PRs.
