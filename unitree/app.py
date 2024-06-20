from alembic.config import Config as AlembicConfig
import alembic.command
from fastapi import Depends, FastAPI, Request
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi.templating import Jinja2Templates
from fastapi_pagination import Page, add_pagination
from fastapi_pagination.ext.sqlalchemy import paginate

from .schema import InsertTreeBody, UpdateNodeBody
from .settings import settings
from .database import SessionLocal
from . import actions, models, schema


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
templates = Jinja2Templates(directory="templates")
add_pagination(app)


@app.get("/api/tree", response_model=Page[schema.Node])
def get_tree(db: Session = Depends(get_db)):
    return paginate(db, select(models.Node).order_by(models.Node.fraction))


@app.post("/api/tree")
def insert_tree(body: InsertTreeBody, db: Session = Depends(get_db)):
    actions.insert_trees(db, trees=body.data, before_id=body.insert_before)
    return {}


@app.delete("/api/node/{node_id}")
def delete_node(node_id: int, db: Session = Depends(get_db)):
    actions.delete_node(db, node_id)
    return {}


@app.put("/api/node/{node_id}")
def update_node(node_id: int, body: UpdateNodeBody, db: Session = Depends(get_db)):
    actions.move_node(db, node_id=node_id, move_before=body.move_before)
    return {}


@app.get("/")
def tree_view(request: Request, db: Session = Depends(get_db)):
    tree = actions.get_tree(db)
    return templates.TemplateResponse(
        request=request, name="tree.html", context={"tree": tree}
    )
