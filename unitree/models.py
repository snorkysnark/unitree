from sqlalchemy import Column, ForeignKey, Integer, String, JSON
from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy.types import UserDefinedType

from .database import Base


class Rational(UserDefinedType):
    cache_ok = True

    def get_col_spec(self):
        return "rational"

    def bind_processor(self, dialect):
        def process(value):
            return value

        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            return value

        return process


class Node(Base):
    __tablename__ = "tree"

    id = mapped_column(Integer, primary_key=True)
    fraction = mapped_column(Rational, nullable=False, index=True)
    start_id = mapped_column(Integer, ForeignKey("tree.id"), index=True)
    depth = mapped_column(Integer, nullable=False)
    title = mapped_column(String)
    data = mapped_column(JSON)

    end = relationship("Node", back_populates="start", uselist=False)
    start = relationship("Node", back_populates="end", remote_side=[id])
