from alembic.config import Config as AlembicConfig
import alembic.command
from fastapi import Depends, FastAPI, Request
from sqlalchemy.orm import Session
from fastapi.templating import Jinja2Templates

from .schema import InsertTreeBody, UpdateNodeBody
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
templates = Jinja2Templates(directory="templates")


@app.post("/tree")
def insert_tree(body: InsertTreeBody, db: Session = Depends(get_db)):
    actions.insert_tree(db, root=body.data, before_id=body.insert_before)
    return {}


@app.delete("/node/{node_id}")
def delete_node(node_id: int, db: Session = Depends(get_db)):
    actions.delete_node(db, node_id)
    return {}


@app.put("/node/{node_id}")
def update_node(node_id: int, body: UpdateNodeBody, db: Session = Depends(get_db)):
    actions.move_node(db, node_id=node_id, move_before=body.move_before)
    return {}


@app.get("/")
def tree_view(request: Request, db: Session = Depends(get_db)):
    tree = actions.get_tree(db)
    return templates.TemplateResponse(
        request=request, name="tree.html", context={"tree": tree}
    )
