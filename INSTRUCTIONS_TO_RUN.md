# Instructions to Run

This guide provides step-by-step instructions to set up, configure, and run the **Industrial Agentic AI Maintenance Copilot** platform.

---

## Prerequisites
Ensure you have the following installed on your system:
* **Node.js**: Version 20.x or higher (with npm)
* **Python**: Version 3.11 or 3.12 (highly recommended, as version 3.13+ may lack precompiled wheels for PyTorch Geometric and other deep learning dependencies)
* **Operating System**: Windows, macOS, or Linux

---

## 1. Environment Variables and API Keys Setup
1. Locate the `.env.example` file in the root folder of the project.
2. Create a copy of it and name it `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open the `.env` file and configure the keys based on your requirements:

### LLM API Keys (Required for Copilot Chat)
These keys power the conversational AI Copilot (Layer 9 of the pipeline):
* `QWEN_API_KEY`: API key for Alibaba Cloud DashScope to use the Qwen 3 model (primary LLM).
* `OPENAI_API_KEY`: API key for OpenAI (fallback LLM, e.g., GPT-4o).
* `QWEN_BASE_URL`: Base API endpoint for Qwen (defaults to `https://dashscope.aliyuncs.com/compatible-mode/v1`).
* `LLM_PRIMARY`: Default LLM service (set to `qwen`).
* `LLM_FALLBACK`: Fallback LLM service (set to `gpt4o`).

### Database and Vector DB Configurations (Optional)
If left as placeholders, the application will run using mock/synthetic database engines for demonstration purposes:
* `SUPABASE_URL`: The API URL of your Supabase project (e.g., `https://your-project.supabase.co`).
* `SUPABASE_ANON_KEY`: The anonymous public key provided by Supabase.
* `SUPABASE_SERVICE_ROLE_KEY`: The secret service-role key for backend admin operations.
* `DATABASE_URL`: The direct PostgreSQL connection pooler URI to your Supabase DB.
* `QDRANT_URL`: The endpoint of your Qdrant Vector database instance (defaults to `http://localhost:6333`).
* `QDRANT_COLLECTION`: The collection name storing document embeddings (defaults to `maintenance_knowledge`).
* `NEO4J_URI`: The connection URI for the Neo4j Knowledge Graph (defaults to `bolt://localhost:7687`).
* `NEO4J_USER`: The username for Neo4j (defaults to `neo4j`).
* `NEO4J_PASSWORD`: The password configured for Neo4j (defaults to `maintenance123`).

### Streaming and Alerting Configs (Optional)
* `KAFKA_BOOTSTRAP_SERVERS`: The host address for Apache Kafka (defaults to `localhost:9092`).
* `MQTT_BROKER`: The host address for the MQTT Broker (defaults to `localhost:1883`).
* `SMTP_HOST`: Outgoing SMTP server address for email alerts.
* `SMTP_PORT`: Port for SMTP connection (defaults to `587`).
* `ALERT_EMAIL_FROM`: The sender email address for automated alerts.

---

## 2. Setting Up the Backend API (FastAPI)
1. Open a terminal and navigate to the project directory.
2. (Recommended) Create and activate a Python virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
   * **macOS/Linux**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
3. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
5. Start the FastAPI development server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
   * *Note: On its first startup, the backend checks for ML model weights. If missing, it will automatically initiate training loops using synthetic datasets for the Autoencoders, LSTMs, and TFT models to compile the required model weight files. This may take several minutes.*
   * **API Docs URL**: http://localhost:8000/docs
   * **API Health Check**: http://localhost:8000/health

---

## 3. Setting Up the Frontend (Next.js)
1. Open a new terminal window or tab and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install the Node.js packages:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Access the web interface at: **http://localhost:3000**

---

## 4. Seeding the Database and Evaluating Models (Optional)
If you have configured a live Supabase PostgreSQL connection in your `.env` file, run the following scripts in the project root directory:
* **Apply Database Schema Migrations**:
  ```bash
  python scripts/run_migrations.py
  ```
* **Seed the Database with Sample Assets, Logbooks, and Alerts**:
  ```bash
  python scripts/seed_database.py
  ```
* **Run ML Pipeline Benchmark Evaluations**:
  ```bash
  python scripts/evaluation.py
  ```
