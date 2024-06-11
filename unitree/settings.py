from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql:///unitree"


settings = Settings()
