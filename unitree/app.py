from alembic.config import Config as AlembicConfig
import alembic.command
from fastapi import Depends, FastAPI, Request
from sqlalchemy.orm import Session
from fastapi.templating import Jinja2Templates

from .schema import InsertTreeBody
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


@app.post("/insert")
def insert_tree(data: InsertTreeBody, db: Session = Depends(get_db)):
    actions.insert_tree(db, root=data.root, before_id=data.before_id)
    return {}


@app.get("/")
def tree_view(request: Request, db: Session = Depends(get_db)):
    tree = actions.get_tree(db)
    return templates.TemplateResponse(
        request=request, name="tree.html", context={"tree": tree}
    )
