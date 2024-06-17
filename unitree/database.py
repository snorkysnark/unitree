from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from .settings import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, bind=engine)
Base = declarative_base()
