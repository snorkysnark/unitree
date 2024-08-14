from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import mapped_column, relationship

from .database import Base


class Node(Base):
    __tablename__ = "tree"

    id = mapped_column(Integer, primary_key=True)
    rank = mapped_column(String, nullable=False, index=True, unique=True)
    start_id = mapped_column(Integer, ForeignKey("tree.id"), index=True, unique=True)
    has_children = mapped_column(Boolean, nullable=False, default=False)
    depth = mapped_column(Integer, nullable=False)
    title = mapped_column(String)

    end = relationship("Node", back_populates="start", uselist=False)
    start = relationship("Node", back_populates="end", remote_side=[id])

    def get_range(self) -> tuple[str, str]:
        is_start = self.start_id is None

        if is_start:
            return self.rank, self.end.rank
        else:
            return self.start.rank, self.rank
