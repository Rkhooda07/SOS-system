from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    database_url: str = "sqlite+aiosqlite:///./sos.db"
    cors_origins: list[str] = ["http://localhost:5173"]
    debug: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
