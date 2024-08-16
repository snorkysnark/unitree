import math
import random
from pathlib import Path
from typing import Literal
from alembic.config import Config as AlembicConfig
import alembic.command
from fastapi import Depends, FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy.sql import select, func

from .models import Node
from .schema import NodeIn, NodeOut
from .settings import settings
from .database import SessionLocal
from . import actions

project_path = Path(__file__).parent.parent
static_path = project_path.joinpath("static")


def run_migrations(alembic_path: str, database_url: str):
    cfg = AlembicConfig()
    cfg.set_main_option("script_location", alembic_path)
    cfg.set_main_option("sqlalchemy.url", database_url)
    alembic.command.upgrade(cfg, "head")


run_migrations(str(project_path.joinpath("alembic")), settings.database_url)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI()
app.mount("/static", StaticFiles(directory=static_path), name="static")


@app.get("/api/children/{node_id}", response_model=list[NodeOut])
def children_of(node_id: int | Literal["root"], db: Session = Depends(get_db)):
    if node_id != "root":
        parent = db.query(Node).where(Node.id == node_id).one()
        rank_start, rank_end = parent.get_range()

        target_depth = parent.depth + 1
        range_filter = [Node.rank > rank_start, Node.rank < rank_end]
    else:
        target_depth = 0
        range_filter = []

    return (
        db.query(Node)
        .where(Node.start_id == None, Node.depth == target_depth, *range_filter)
        .order_by(Node.rank)
    )


def _get_random_id(db: Session) -> int | None:
    total_count = db.execute(select(func.count()).select_from(Node)).scalar() or 0
    return db.execute(
        select(Node.id).offset(math.floor(random.random() * (total_count + 1))).limit(1)
    ).scalar()


@app.post("/api/tree")
def insert_tree(
    data: NodeIn,
    insert_before: int | Literal["random"] | None = None,
    db: Session = Depends(get_db),
):
    actions.insert_tree(
        db,
        data,
        before_id=_get_random_id(db) if insert_before == "random" else insert_before,
    )
    return {}


@app.get("/")
def index():
    return FileResponse(static_path.joinpath("index.html"))
