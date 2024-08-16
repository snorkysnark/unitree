import typer
import uvicorn
import webbrowser
from multiprocessing import Process

from .app import app


def open_browser(port: int):
    webbrowser.open(f"http://localhost:{port}")


def serve(port: int = 8000):
    browser = Process(target=open_browser, args=(port,))
    browser.start()

    uvicorn.run(app, port=port)
    browser.join()


def main():
    typer.run(serve)


if __name__ == "__main__":
    main()
