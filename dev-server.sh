#/bin/bash

kitty poetry run uvicorn unitree.app:app --port 8000 --reload &
kitty -d frontend/ npm run dev &
exec docker run --rm --net=host -v ./nginx.conf:/etc/nginx/nginx.conf nginx
