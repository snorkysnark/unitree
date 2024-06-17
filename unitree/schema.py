from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class InsertTreeBody(BaseModel):
    insert_before: Optional[int] = None
    data: NewNode


class UpdateNodeBody(BaseModel):
    move_before: Optional[int]


class NewNode(BaseModel):
    title: str
    data: Optional[dict]
    children: list[NewNode]


class Node(BaseModel):
    id: int
    fraction: str
    start_id: Optional[int]
    depth: int
    title: Optional[str]
    data: Optional[dict]

    class Config:
        from_attributes = True
