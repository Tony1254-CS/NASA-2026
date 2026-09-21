# TRACE Server API

FastAPI application handling REST API endpoints, database connections (PostgreSQL + PostGIS via SQLAlchemy), and future scientific processing.

## Running Server Locally

```bash
uvicorn server.app.main:app --reload --port 8000
```

## Running Server Tests

```bash
pytest -c server/pytest.ini server/tests
```

## Health Check Endpoints

- Liveness: `GET /health`
- PostgreSQL & PostGIS Check: `GET /health/db`
