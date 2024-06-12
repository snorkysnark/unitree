from contextlib import contextmanager
from typing import Optional, cast
from sqlalchemy import Row, func, select, text, and_, not_
from sqlalchemy.orm import Session
from psycopg2.extensions import connection as RawConnection, cursor as RawCursor
from returns.maybe import Maybe

from . import models
from .schema import NewNode


@contextmanager
def _raw_cursor(db: Session):
    with cast(RawConnection, db.connection()._dbapi_connection).cursor() as cursor:
        yield cursor


def _rational_intermediate(
    cursor: RawCursor, left_key: Optional[str], right_key: Optional[str]
) -> str:
    # use 1 as the initial index in tables
    if not left_key and not right_key:
        return "1"

    cursor.callproc("rational_intermediate", (left_key, right_key))
    if row := cursor.fetchone():
        return row[0]

    raise RuntimeError(
        f"rational intermediate returned no value for ({left_key}, {right_key})"
    )


def _insert_node(
    db: Session,
    node: NewNode,
    *,
    depth: int,
    after: Optional[str] = None,
    before: Optional[str] = None,
):
    with _raw_cursor(db) as cursor:
        left_key = _rational_intermediate(cursor, after, before)

        next_key = left_key
        for child in node.children:
            next_key = _insert_node(
                db, child, after=next_key, before=before, depth=depth + 1
            )

        right_key = _rational_intermediate(cursor, next_key, before)

        db.add(
            models.Node(
                left_key=left_key,
                right_key=right_key,
                depth=depth,
                title=node.title,
                data=node.data,
            )
        )

        return right_key


def _rational_cmp(db: Session, a: str, b: str) -> int:
    return db.execute(
        text("SELECT rational_cmp(:a, :b)"), {"a": a, "b": b}
    ).scalar_one()


def insert_tree(
    db: Session,
    root: NewNode,
    *,
    after: str,
    before: str,
):
    # assert after < before
    if _rational_cmp(db, after, before) != -1:
        raise ValueError("'before' value must be smaller that 'after'")

    if (
        db.query(func.count())
        .select_from(models.Node)
        .where(and_(models.Node.left_key > after, models.Node.right_key < before))
        .scalar()
        != 0
    ):
        raise ValueError(f"Space between {before} and {after} already occupied")

    parent_depth = (
        db.query(models.Node.depth)
        .where(and_(models.Node.left_key <= after, models.Node.right_key >= before))
        .order_by(models.Node.left_key.desc())
        .limit(1)
        .scalar()
    )

    _insert_node(
        db,
        root,
        after=after,
        before=before,
        depth=(
            Maybe.from_optional(parent_depth).map(lambda depth: depth + 1).value_or(0)
        ),
    )
    db.commit()


def get_tree(db: Session):
    return db.query(models.Node).order_by(models.Node.left_key).all()
