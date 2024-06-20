from sqlalchemy import ForeignKey, Integer, String
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
    fraction = mapped_column(Rational, nullable=False, index=True, unique=True)
    start_id = mapped_column(Integer, ForeignKey("tree.id"), index=True, unique=True)
    depth = mapped_column(Integer, nullable=False)
    title = mapped_column(String)

    end = relationship("Node", back_populates="start", uselist=False)
    start = relationship("Node", back_populates="end", remote_side=[id])

    def get_range(self) -> tuple[str, str]:
        is_start = self.start_id is None

        if is_start:
            return self.fraction, self.end.fraction
        else:
            return self.start.fraction, self.fraction
