from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "TRACE server"
    PROJECT_VERSION: str = "0.1.0"

    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # CORS Origins (configurable via environment variable)
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database URL
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/trace_db"

    # Supabase Credentials (SERVER ONLY)
    SUPABASE_URL: str = "https://your-project.supabase.co"
    SUPABASE_ANON_KEY: str = "your-supabase-anon-key"
    SUPABASE_SERVICE_ROLE_KEY: str = "your-supabase-service-role-key"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
