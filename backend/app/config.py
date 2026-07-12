from pydantic_settings import BaseSettings
from typing import List
from urllib.parse import unquote


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    gemini_api_key: str = ""
    xai_api_key: str = ""
    allowed_origins: str = "http://localhost:3000,http://localhost:5173"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @property
    def database_url_decoded(self) -> str:
        # Decode %%40 back to %40 for proper URL parsing
        return self.database_url.replace("%%40", "%40")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
