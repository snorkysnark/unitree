from sqlalchemy import Column, Integer, String, JSON, TypeDecorator
from sqlalchemy.ext.compiler import compiles

from .database import Base


class Rational(TypeDecorator):
    impl = String
    cache_ok = True


@compiles(Rational, "postgresql")
def compile_rational(type_, compiler, **kw):
    return "rational"


class Node(Base):
    __tablename__ = "tree"

    id = Column(Integer, primary_key=True)
    left = Column(Rational, nullable=False, index=True)
    right = Column(Rational, nullable=False, index=True)
    title = Column(String)
    data = Column(JSON)
