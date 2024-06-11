from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class NewNode(BaseModel):
    title: str
    data: Optional[dict]
    children: list[NewNode]
