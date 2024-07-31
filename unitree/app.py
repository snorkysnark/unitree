from typing import Optional
from alembic.config import Config as AlembicConfig
import alembic.command
from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session
from fastapi_pagination import add_pagination, Page
from fastapi_pagination.ext.sqlalchemy import paginate

from .models import Node
from .schema import NodeIn, NodeOut
from .settings import settings
from .database import SessionLocal
from . import actions


def run_migrations(alembic_path: str, database_url: str):
    cfg = AlembicConfig()
    cfg.set_main_option("script_location", alembic_path)
    cfg.set_main_option("sqlalchemy.url", database_url)
    alembic.command.upgrade(cfg, "head")


run_migrations("alembic", settings.database_url)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI()
add_pagination(app)


@app.get("/api/tree", response_model=Page[NodeOut])
def get_tree(db: Session = Depends(get_db)):
    return paginate(db.query(Node).where(Node.start_id == None).order_by(Node.rank))


@app.get("/api/tree/count")
def get_count(db: Session = Depends(get_db)) -> int:
    return db.query(Node).where(Node.start_id == None).count()


@app.post("/api/tree")
def insert_tree(
    data: NodeIn, insert_before: Optional[int] = None, db: Session = Depends(get_db)
):
    actions.insert_tree(db, data, before_id=insert_before)
    return {}


@app.delete("/api/node/{node_id}")
def delete_node(node_id: int, db: Session = Depends(get_db)):
    actions.delete_node(db, node_id)
    return {}


@app.put("/api/node/{node_id}")
def update_node(
    node_id: int, move_before: Optional[int], db: Session = Depends(get_db)
):
    actions.move_node(db, node_id=node_id, move_before=move_before)
    return {}
