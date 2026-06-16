.PHONY: dev backend frontend docker-up docker-down migrate lint test notebooks

dev: backend frontend

backend:
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

migrate:
	@echo "Run database/supabase/migrations/001_init.sql in Supabase SQL Editor"

seed:
	python scripts/seed_database.py

lint:
	cd backend && python -m compileall -q .
	cd frontend && npm run lint

test:
	cd backend && python -m pytest tests/ -q || true

notebooks:
	python models/notebooks/create_training_notebooks.py

data:
	python -u scripts/generate_synthetic_data.py

data-only:
	python -u scripts/generate_synthetic_data.py --datasets-only --skip-train

eval:
	python -u scripts/generate_synthetic_data.py --datasets-only --skip-train --skip-shared

install:
	pip install -r requirements.txt
	cd frontend && npm install
