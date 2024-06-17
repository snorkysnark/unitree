from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class InsertTreeBody(BaseModel):
    before_id: Optional[int] = None
    root: NewNode


class NewNode(BaseModel):
    title: str
    data: Optional[dict]
    children: list[NewNode]
