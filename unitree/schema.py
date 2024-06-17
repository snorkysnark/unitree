from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class InsertTreeBody(BaseModel):
    insert_before: Optional[int] = None
    data: NewNode


class NewNode(BaseModel):
    title: str
    data: Optional[dict]
    children: list[NewNode]
