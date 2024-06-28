from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class InsertTreeBody(BaseModel):
    insert_before: Optional[int] = None
    data: NodeIn


class UpdateNodeBody(BaseModel):
    move_before: Optional[int]


class NodeIn(BaseModel):
    title: str
    children: list[NodeIn]


class NodeOut(BaseModel):
    id: int
    rank: str
    start_id: Optional[int]
    depth: int
    title: Optional[str]

    class Config:
        from_attributes = True
