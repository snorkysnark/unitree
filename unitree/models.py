from sqlalchemy import Column, Integer, String, JSON
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

    id = Column(Integer, primary_key=True)
    left_key = Column(Rational, nullable=False, index=True)
    right_key = Column(Rational, nullable=False, index=True)
    depth = Column(Integer, nullable=False)
    title = Column(String)
    data = Column(JSON)
