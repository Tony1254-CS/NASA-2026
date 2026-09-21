# TRACE — Temporal Radar Assessment & Cross-mission Evidence

Production-style monorepo foundation for **TRACE**.

---

## System Architecture

```
TRACE/
│
├── client/          # ONLY Frontend (Next.js / React / TypeScript)
└── server/          # ONLY Backend (Python / FastAPI)
```

### Component Responsibilities

#### CLIENT (`client/`)
- Frontend UI rendering
- Browser interaction logic
- API communication via environment-aware client (`lib/api.ts`)
- Future map, timeline, and investigation UI

#### SERVER (`server/`)
- FastAPI REST API endpoints
- Database access & PostGIS connection
- Future NASA / Earthdata access
- Future scientific processing & temporal radar change detection
- Future geospatial processing, challenge engine, and provenance tracing

---

## Environment Setup

Create environment files for client and server:

```bash
cp client/.env.example client/.env.local
cp server/.env.example server/.env
```

Environment variables:
- `NEXT_PUBLIC_API_URL`: Environment API base URL (default: `http://localhost:8000`).
- `DATABASE_URL`: Server PostgreSQL / PostGIS database connection string.

---

## How to Run

### 1. Run Frontend Client (`http://localhost:3000`)

```bash
pnpm install
pnpm --filter client dev
```

### 2. Run Backend Server (`http://localhost:8000`)

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

pip install -r server/requirements.txt
uvicorn server.app.main:app --reload --port 8000
```

### 3. Verification Endpoints

- **Service Health Probe**: `http://localhost:8000/health`
- **Database & PostGIS Probe**: `http://localhost:8000/health/db`
- **OpenAPI Documentation**: `http://localhost:8000/docs`
