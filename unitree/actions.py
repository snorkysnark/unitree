from contextlib import contextmanager
from typing import Optional, cast
from sqlalchemy import Row, func
from sqlalchemy.orm import Session
from psycopg2.extensions import connection as RawConnection, cursor as RawCursor

from .models import Node
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
):
    """Insert node and its children between the indices"""

    if not after:
        # If left bound not specified, try to set it to the biggest right_key within the allowed range
        after = _first(
            db.query(func.max(Node.right_key))
            .where(Node.right_key < before)
            .one_or_none()
        )

    with _raw_cursor(db) as cursor:
        # If `after` is None at this point, this means the table is empty
        left_key = _rational_intermediate(cursor, after, before) if after else "1"

        next_key = left_key
        for child in node.children:
            next_key = _insert_node(db, child, after=next_key, before=before)

        right_key = _rational_intermediate(cursor, next_key, before)

        db.add(
            Node(
                left_key=left_key, right_key=right_key, title=node.title, data=node.data
            )
        )

        return right_key


def insert_tree(db: Session, root: NewNode, before: Optional[str] = None):
    """Insert tree immediately before the given fraction"""

    _insert_node(db, root, before=before)
    db.commit()
