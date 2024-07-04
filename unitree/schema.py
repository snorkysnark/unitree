from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class NodeIn(BaseModel):
    title: str
    children: list[NodeIn]


class NodeOut(BaseModel):
    id: int
    rank: str
    depth: int
    title: Optional[str]

    class Config:
        from_attributes = True
