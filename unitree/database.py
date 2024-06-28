from sqlalchemy import create_engine
import sqlalchemy
import sqlite3
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event

from .settings import settings

engine = create_engine(settings.database_url)


def _sqlite_on_connect(dbapi_connection: sqlite3.Connection, connection_record):
    # disable pysqlite's emitting of the BEGIN statement entirely.
    # also stops it from emitting COMMIT before any DDL.
    dbapi_connection.isolation_level = None


def _sqlite_on_begin(conn: sqlalchemy.Connection):
    # emit our own BEGIN
    conn.exec_driver_sql("BEGIN")


# Fix transactions in SQLite
# See: https://docs.sqlalchemy.org/en/20/dialects/sqlite.html#serializable-isolation-savepoints-transactional-ddl
if engine.dialect.name == "sqlite":
    event.listens_for(engine, "connect")(_sqlite_on_connect)
    event.listens_for(engine, "begin")(_sqlite_on_begin)

SessionLocal = sessionmaker(autocommit=False, bind=engine)
Base = declarative_base()
