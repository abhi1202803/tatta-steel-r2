# Industrial Agentic AI Maintenance Copilot

Enterprise-scale Agentic AI platform for predictive maintenance, root cause analysis, maintenance optimization, spare-part forecasting, and autonomous maintenance planning for industrial equipment.

## Architecture

```
Sensor Data → Anomaly Detection → Failure Classification → RCA (GNN)
    → RUL Prediction → Risk Engine → Maintenance RL → Spare Forecasting
    → Knowledge RAG → Multi-Agent Orchestration → Industrial Copilot
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

### Run with Docker

```bash
cd industrial-agentic-maintenance-ai
docker compose up --build
```

Services:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090

### Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Or use Makefile targets: `make backend`, `make frontend`, `make docker-up`

### Supabase Setup (PostgreSQL – SQLAlchemy, no Prisma)

1. Create a project at [supabase.com](https://supabase.com)
2. Copy credentials to `.env` (see `.env.example`)
3. Run `database/supabase/migrations/001_init.sql` in the Supabase SQL Editor
4. SQLAlchemy models are in `backend/database/models.py`; connection in `backend/database/postgres.py`

See `database/supabase/README.md` for details.

### Train ML Models (Jupyter Notebooks)

Each model has a `model.ipynb` training notebook:

```bash
cd backend
jupyter notebook models/anomaly_detection/isolation_forest/model.ipynb
```

Or generate all notebooks:

```bash
python notebooks/create_training_notebooks.py
```

### Generate Synthetic Training Data (CLI)

```bash
cd backend
python -m scripts.generate_synthetic_data
```

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `frontend/src/` | Next.js App Router, views, hooks, store, components |
| `backend/main.py` | FastAPI application entrypoint |
| `backend/api/routes/` | chat, prediction, maintenance, reports, alerts, inventory, assets |
| `backend/database/` | Supabase PostgreSQL (SQLAlchemy models + postgres.py) |
| `backend/models/` | 9-layer ML pipeline |
| `backend/agents/` | Multi-agent orchestration |
| `backend/rag/` | BGE-M3 + Qdrant RAG |
| `data/` | Manuals, SOPs, sensor data, maintenance logs |
| `model_registry/` | Trained model artifacts |
| `notebooks/` | Training notebook index |
| `deployment/` | Docker, Kubernetes |
| `.github/workflows/` | CI/CD pipelines |
| `monitoring/` | Prometheus, Grafana |

## ML Pipeline Layers

1. **Anomaly Detection** – Isolation Forest, AutoEncoder, LSTM AutoEncoder
2. **Failure Classification** – XGBoost
3. **Root Cause Analysis** – Graph Neural Network
4. **RUL Prediction** – LSTM + Temporal Fusion Transformer
5. **Risk Engine** – CatBoost
6. **Maintenance Optimization** – PPO Reinforcement Learning
7. **Spare Forecasting** – Prophet
8. **Knowledge Intelligence** – BGE-M3 + Qdrant RAG
9. **Industrial Copilot** – Qwen 3 / GPT-4o LLM

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/pipeline/analyze` | Full 9-layer analysis pipeline |
| `POST /api/v1/anomaly/detect` | Layer 1 anomaly detection |
| `POST /api/v1/failure/predict` | Layer 2 failure classification |
| `POST /api/v1/rca/analyze` | Layer 3 root cause analysis |
| `POST /api/v1/rul/predict` | Layer 4 remaining useful life |
| `POST /api/v1/risk/assess` | Layer 5 risk assessment |
| `POST /api/v1/maintenance/optimize` | Layer 6 maintenance planning |
| `POST /api/v1/procurement/forecast` | Layer 7 spare forecasting |
| `POST /api/v1/knowledge/query` | Layer 8 RAG retrieval |
| `POST /api/v1/chat` | Layer 9 conversational copilot |
| `POST /api/v1/copilot/chat` | Copilot (backward-compatible alias) |
| `GET /api/v1/assets` | Asset/equipment registry (Supabase) |
| `GET /api/v1/inventory` | Spare parts inventory |
| `POST /api/v1/reports/generate` | Executive report generation |
| `GET /api/v1/dashboard/overview` | Executive dashboard data |
| `GET /api/v1/alerts` | Real-time alerts |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
OPENAI_API_KEY=          # GPT-4o fallback
QWEN_API_KEY=            # Primary LLM
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:PASSWORD@...pooler.supabase.com:6543/postgres
QDRANT_URL=http://localhost:6333
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

## License

Proprietary – Tata Steel Agentic AI Hackathon Round 2

```mermaid
flowchart TD

A[generate_synthetic_data.py]

A --> B[synthetic_data.py]

B --> C[industrial_dataset.py]

C --> D[Master Dataset]

D --> E1[Isolation Forest]
D --> E2[Autoencoder]
D --> E3[XGBoost]
D --> E4[GNN]
D --> E5[LSTM RUL]
D --> E6[CatBoost]
D --> E7[RL]
D --> E8[Prophet]

E1 --> F[evaluation.py]
E2 --> F
E3 --> F
E4 --> F
E5 --> F
E6 --> F
E7 --> F
E8 --> F

F --> G[metrics.json]
F --> H[evaluation_report.md]
```


```mermaid
flowchart TD

UserInput --> RouterAgent

RouterAgent --> FaultLogs
RouterAgent --> SensorData
RouterAgent --> Manuals
RouterAgent --> SOPs
RouterAgent --> MaintenanceLogs
RouterAgent --> SpareInventory
RouterAgent --> NaturalLanguageQuery

FaultLogs --> SupervisorAgent
SensorData --> SupervisorAgent
Manuals --> SupervisorAgent
SOPs --> SupervisorAgent
MaintenanceLogs --> SupervisorAgent
SpareInventory --> SupervisorAgent
NaturalLanguageQuery --> SupervisorAgent
```