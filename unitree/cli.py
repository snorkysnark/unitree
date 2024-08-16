import typer
import uvicorn

from .app import app


def serve_cli(port: int = 8000):
    uvicorn.run(app, port=port)


def serve():
    typer.run(serve_cli)
