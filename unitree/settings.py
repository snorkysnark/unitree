from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///tree.sqlite"


settings = Settings()
