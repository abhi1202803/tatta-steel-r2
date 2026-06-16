"""Application configuration."""

from pathlib import Path

from pydantic_settings import BaseSettings

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
_PROJECT_ROOT = _BACKEND_ROOT.parent


class Settings(BaseSettings):
    # Supabase PostgreSQL (use Transaction pooler URI, port 6543)
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    database_url: str = "postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres"
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "maintenance_knowledge"
    openai_api_key: str = ""
    qwen_api_key: str = ""
    qwen_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    llm_primary: str = "qwen"
    llm_fallback: str = "gpt4o"
    kafka_bootstrap_servers: str = "localhost:9092"
    mqtt_broker: str = "localhost:1883"
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "maintenance123"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000"
    log_level: str = "INFO"
    model_artifacts_path: str = str(_BACKEND_ROOT / "artifacts")
    data_path: str = str(_PROJECT_ROOT / "data")
    datasets_path: str = str(_PROJECT_ROOT / "data" / "datasets")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = (str(_PROJECT_ROOT / ".env"), str(_BACKEND_ROOT / ".env"))
        extra = "ignore"


settings = Settings()
