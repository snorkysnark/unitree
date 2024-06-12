from contextlib import contextmanager
from typing import Optional, cast
from sqlalchemy import Row, func, text
from sqlalchemy.orm import Session
from psycopg2.extensions import connection as RawConnection, cursor as RawCursor

from . import models
from .schema import NewNode


@contextmanager
def _raw_cursor(db: Session):
    with cast(RawConnection, db.connection()._dbapi_connection).cursor() as cursor:
        yield cursor


def _rational_intermediate(
    cursor: RawCursor, left_key: str, right_key: Optional[str]
) -> str:
    cursor.callproc("rational_intermediate", (left_key, right_key))
    if row := cursor.fetchone():
        return row[0]

    raise RuntimeError(
        f"rational intermediate returned no value for ({left_key}, {right_key})"
    )


def _first(row: Optional[Row]):
    if row:
        return row[0]


def _insert_node(
    db: Session,
    node: NewNode,
    *,
    after: Optional[str] = None,
    before: Optional[str] = None,
    depth: int = 0,
):
    """Insert node and its children between the indices"""

    if not after:
        # If left bound not specified, try to set it to the largest key within the allowed range
        after = _first(
            db.execute(
                text(
                    """select greatest(
                        (select max(right_key) from tree where right_key < :before),
                        (select max(left_key) from tree where left_key < :before)
                    );"""
                ),
                {"before": before},
            ).one_or_none()
        )

    with _raw_cursor(db) as cursor:
        # If `after` is None at this point, this means the table is empty
        left_key = _rational_intermediate(cursor, after, before) if after else "1"

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


def insert_tree(db: Session, root: NewNode, before: Optional[str] = None):
    """Insert tree immediately before the given fraction"""

    _insert_node(db, root, before=before)
    db.commit()


def get_tree(db: Session):
    return db.query(models.Node).order_by(models.Node.left_key).all()
