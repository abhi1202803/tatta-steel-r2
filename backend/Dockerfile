# Deprecated: use deployment/docker/backend.Dockerfile from the project root context.

FROM python:3.11-slim



WORKDIR /app



RUN apt-get update && apt-get install -y --no-install-recommends \

    build-essential curl && rm -rf /var/lib/apt/lists/*



COPY requirements.txt ./backend/requirements.txt

RUN pip install --no-cache-dir -r backend/requirements.txt



COPY paths.py .

COPY backend/ ./backend/

COPY models/ ./models/

COPY scripts/ ./scripts/

COPY database/ ./database/

COPY data/datasets/ ./data/datasets/



ENV PYTHONPATH=/app:/app/backend



WORKDIR /app/backend

RUN mkdir -p artifacts



EXPOSE 8000



CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

