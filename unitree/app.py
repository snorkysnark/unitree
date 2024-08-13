from typing import Optional
from alembic.config import Config as AlembicConfig
import alembic.command
from fastapi import Depends, FastAPI
from pydantic import BaseModel, TypeAdapter
from sqlalchemy.orm import Session, aliased, joinedload
from sqlalchemy.sql import exists

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


class Page(BaseModel):
    data: list[NodeOut]
    before_cursor: Optional[str] = None
    after_cursor: Optional[str] = None


PageData = TypeAdapter(list[NodeOut])


@app.get("/api/tree", response_model=Page)
def get_tree(
    before_cursor: Optional[str] = None,
    after_cursor: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    if before_cursor and after_cursor:
        raise ValueError(
            "before_cursor and after_cursor parameters are mutually exclusive"
        )

    base_query = (
        db.query(Node).options(joinedload(Node.end)).where(Node.start_id == None)
    )

    if before_cursor:
        data = (
            base_query.where(Node.rank < before_cursor)
            .order_by(Node.rank.desc())
            .limit(limit)
            .all()
        )
        data.reverse()
    else:
        query = base_query
        if after_cursor:
            query = base_query.where(Node.rank > after_cursor)

        data = query.order_by(Node.rank.asc()).limit(limit).all()

    next_before_cursor: Optional[str] = None
    next_after_cursor: Optional[str] = None

    if len(data) > 0:
        next_before_cursor = data[0].rank
        next_after_cursor = data[-1].rank

        if not db.query(
            exists().where((Node.start_id == None) & (Node.rank < next_before_cursor))
        ).scalar():
            # Previous page does not exist
            next_before_cursor = None
        if not db.query(
            exists().where((Node.start_id == None) & (Node.rank > next_after_cursor))
        ).scalar():
            # Next page does not exist
            next_after_cursor = None

    return Page(
        data=PageData.validate_python(data),
        before_cursor=next_before_cursor,
        after_cursor=next_after_cursor,
    )


@app.get("/api/tree/count")
def get_count(db: Session = Depends(get_db)) -> int:
    return db.query(Node).where(Node.start_id == None).count()


@app.post("/api/tree")
def insert_tree(
    data: NodeIn, insert_before: Optional[int] = None, db: Session = Depends(get_db)
):
    actions.insert_tree(db, data, before_id=insert_before)
    return {}


# @app.delete("/api/node/{node_id}")
# def delete_node(node_id: int, db: Session = Depends(get_db)):
#     actions.delete_node(db, node_id)
#     return {}
#
#
# @app.put("/api/node/{node_id}")
# def update_node(
#     node_id: int, move_before: Optional[int], db: Session = Depends(get_db)
# ):
#     actions.move_node(db, node_id=node_id, move_before=move_before)
#     return {}
