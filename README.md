# Nxt-B-Step

## Team Details

- Team name: AgentForge
- Team Members: B.Moulika,B.Sravani, B.Keerthana
- Project: Intelligent Next Best Action Platform
- Hackathon submission date: 29 June 2026

## Project Overview

Nxt-B-Step is an agentic decision intelligence platform for business users working with staffing and background screening cases. The platform takes a customer interaction, retrieves relevant operational context, applies policy/playbook knowledge, identifies business risks, and generates ranked next-best-action recommendations with confidence, reasoning, and supporting evidence.

The submitted implementation focuses on a background screening scenario where teams need to decide how to respond to pending searches, discrepancies, onboarding blockers, and customer escalations. The same architecture can be reused for customer success, sales operations, support, compliance, and other decision-heavy workflows.

## Main Capabilities

- Paste or edit a customer interaction in the decision workspace.
- Run a planner-based workflow with specialized agents.
- Extract signals such as escalation, delay, discrepancy, missing information, and compliance-sensitive search types.
- Retrieve customer/order/search context from SQLite.
- Match relevant playbooks and policy guidance.
- Produce ranked next-best actions with confidence and evidence.
- Review recommendations through approve, edit, or reject actions.
- Store workflow and review events as decision memory.

## GitHub Repository

https://github.com/Moulika706/Nxt-B-Step

## Tech Stack

Backend:

- Python
- FastAPI
- SQLite
- MCP helper server pattern for database tools
- Optional Hugging Face API chat integration

Frontend:

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui-style components
- Lucide React icons

## Folder Structure

XLV/
├── backend/
│   ├── app.py              # FastAPI application
│   ├── decision_platform.py # Core agent orchestration logic
│   ├── server.py           # MCP database server
│   ├── requirements.txt    # Python dependencies
│   └── accurate.db         # SQLite database (auto-generated)
├── frontend/
│   ├── app/
│   │   ├── api/            # API route handlers
│   │   │   ├── decision/   # Decision workflow endpoints
│   │   │   └── chat/       # Chat endpoint
│   │   ├── page.tsx        # Main page
│   │   └── layout.tsx      # Root layout
│   ├── components/
│   │   ├── decision/       # Decision workspace component
│   │   └── ui/             # shadcn/ui components
│   ├── package.json        # Node dependencies
│   └── tailwind.config.ts  # Tailwind configuration
├── .gitignore
└── README.md

## Setup Instructions

### Prerequisites

- Python 3.10 or later
- Node.js 18 or later
- npm

### 1. Backend Setup

Open a terminal at the project root and run:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Seed the local SQLite operational data:

```bash
python seed_data.py
```

Start the FastAPI backend:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at:

```text
http://localhost:8000
```

### 2. Frontend Setup

Open a second terminal at the project root and run:

```bash
cd frontend
npm install
```

If the backend is running locally on port 8000, no extra configuration is required. To point the frontend at a different backend, set:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the Next.js development server:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

## How To Use

1. Start the backend.
2. Start the frontend.
3. Open `http://localhost:3000`.
4. Use the preloaded demo interaction or paste a new customer issue.
5. Select `Run Planner`.
6. Review the planner trace, business analysis, retrieved context, knowledge evidence, and recommendations.
7. Approve, edit, or reject recommendations to write human feedback into decision memory.

## Important Notes

- Dependency and environment folders such as `node_modules`, `.venv`, `.next`, and Python cache folders are excluded from `SourceCode.zip`.
- The main deterministic next-best-action workflow does not require a Hugging Face token.
- The optional chat path can use `HF_TOKEN` if a Hugging Face-hosted model is configured.
- The backend creates decision intelligence tables on startup and stores new workflow/review events in SQLite.
